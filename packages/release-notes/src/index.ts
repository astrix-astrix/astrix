import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getInfo } from '@changesets/get-github-info';
import type {
  ChangelogFunctions,
  GetDependencyReleaseLine,
  GetReleaseLine,
  NewChangesetWithCommit
} from '@changesets/types';
import {
  generateMarkdown,
  type ReleasedPackage,
  type ReleaseChange,
  type ReleaseGroup,
  type ReleaseNotice
} from './generate-markdown.js';

type StoredChangeset = Omit<NewChangesetWithCommit, 'id'> & { notice?: string };

const changesets = new Map<string, StoredChangeset>();
let generated = false;

const getReleaseLine: GetReleaseLine = async ({ id, ...changeset }) => {
  if (!changesets.has(id)) {
    const notice = changeset.summary.match(/::: notice\n+([\s\S]*?)(?<!\n)\n+:::/m)?.[1];
    const summary = changeset.summary.replace(/::: notice\n[\s\S]*?\n+:::/m, '').trim();
    changesets.set(id, { ...changeset, summary, notice });
  }

  return '';
};

const getDependencyReleaseLine: GetDependencyReleaseLine = async () => '';
const changelogFunctions: ChangelogFunctions = { getReleaseLine, getDependencyReleaseLine };

process.on('beforeExit', async () => {
  if (generated) return;
  generated = true;
  await printReleaseNotes();
});

async function printReleaseNotes(): Promise<void> {
  const repository = resolveRepository();
  const { groups, notices } = await groupChanges(repository);
  const changelogs = await collectReleasedPackages();
  const releasedPackages = changelogs.map(({ name, version }) => ({ name, version }));
  const markdown = generateMarkdown(notices, groups, releasedPackages);

  if (!markdown) {
    console.warn('WARN: No release notes were generated');
    return;
  }

  await Promise.all(
    changelogs.map(({ path, contents, version }) =>
      writeFile(path, replaceLatestEntry(contents, version, markdown))
    )
  );

  const divider = '==============================================================';
  console.log(`${divider}\nAstrix release notes\n${divider}\n${markdown}\n${divider}`);
}

async function groupChanges(repository: string | undefined): Promise<{
  groups: ReleaseGroup[];
  notices: ReleaseNotice[];
}> {
  const groups = new Map<ReleaseGroup['type'], Map<string, ReleaseChange[]>>();
  const notices: ReleaseNotice[] = [];

  for (const { summary, notice, commit, releases } of changesets.values()) {
    const github = repository && commit ? await getGithubInfo(repository, commit) : undefined;
    const change: ReleaseChange = {
      summary,
      commit:
        github?.links.commit ??
        (repository && commit
          ? `[${commit.slice(0, 7)}](https://github.com/${repository}/commit/${commit})`
          : undefined),
      pullRequest: github?.links.pull ?? undefined,
      user: github?.user ?? undefined
    };

    if (notice) notices.push({ notice, change });

    for (const { name, type } of releases) {
      const packages = groups.get(type) ?? new Map<string, ReleaseChange[]>();
      packages.set(name, [...(packages.get(name) ?? []), change]);
      groups.set(type, packages);
    }
  }

  return {
    groups: Array.from(groups, ([type, packages]) => ({
      type,
      packages: Array.from(packages, ([name, packageChanges]) => ({
        name,
        changes: packageChanges
      }))
    })),
    notices
  };
}

async function getGithubInfo(repository: string, commit: string) {
  try {
    return await getInfo({ repo: repository, commit });
  } catch {
    return undefined;
  }
}

interface ReleasedChangelog extends ReleasedPackage {
  path: string;
  contents: string;
}

async function collectReleasedPackages(): Promise<ReleasedChangelog[]> {
  const rootPackage = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf8')) as {
    workspaces?: string[];
  };
  const released: ReleasedChangelog[] = [];

  for (const workspace of rootPackage.workspaces ?? []) {
    if (workspace.includes('*')) continue;

    const directory = join(process.cwd(), workspace);
    const changelog = join(directory, 'CHANGELOG.md');

    try {
      const contents = await readFile(changelog, 'utf8');

      const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8')) as {
        name?: string;
        version?: string;
        private?: boolean;
      };

      if (!manifest.private && manifest.name && manifest.version) {
        released.push({
          name: manifest.name,
          version: manifest.version,
          path: changelog,
          contents
        });
      }
    } catch {
      continue;
    }
  }

  return released.sort((left, right) => left.name.localeCompare(right.name));
}

function replaceLatestEntry(contents: string, version: string, markdown: string): string {
  const heading = `## ${version}`;
  const headingIndex = contents.indexOf(heading);

  if (headingIndex === -1) {
    throw new Error(`Could not find changelog entry for version ${version}`);
  }

  const bodyIndex = headingIndex + heading.length;
  const nextHeadingIndex = contents.indexOf('\n## ', bodyIndex);
  const prefix = contents.slice(0, bodyIndex).trimEnd();
  const suffix = nextHeadingIndex === -1 ? '' : contents.slice(nextHeadingIndex).trim();

  return `${prefix}\n\n${markdown}${suffix ? `\n\n${suffix}` : ''}\n`;
}

function resolveRepository(): string | undefined {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;

  try {
    const remote = execFileSync('git', ['config', '--get', 'remote.origin.url'], {
      encoding: 'utf8'
    }).trim();
    return remote.match(/github\.com[/:]([^/]+\/[^/.]+)(?:\.git)?$/)?.[1];
  } catch {
    return undefined;
  }
}

export { generateMarkdown } from './generate-markdown.js';
export default changelogFunctions;
