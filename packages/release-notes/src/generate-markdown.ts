import type { VersionType } from '@changesets/types';

export interface ReleaseChange {
  summary: string;
  commit?: string;
  pullRequest?: string;
  user?: string;
}

export interface ReleaseNotice {
  notice: string;
  change: ReleaseChange;
}

export interface ReleaseGroup {
  type: VersionType;
  packages: Array<{ name: string; changes: ReleaseChange[] }>;
}

export interface ReleasedPackage {
  name: string;
  version: string;
}

const titles: Record<VersionType, string> = {
  major: '⚠️ Potential Breaking Changes',
  minor: '✨ New Features & Improvements',
  patch: '🐛 Bug Fixes & Optimizations',
  none: '📎 Miscellaneous'
};

const typeOrder: VersionType[] = ['major', 'minor', 'patch', 'none'];

export function generateMarkdown(
  notices: ReleaseNotice[],
  groups: ReleaseGroup[],
  releasedPackages: ReleasedPackage[]
): string {
  const sections = typeOrder.flatMap((type) => {
    const packages = groups.find((group) => group.type === type)?.packages ?? [];
    const typeNotices = type === 'major' ? notices : [];
    if (packages.length === 0 && typeNotices.length === 0) return [];

    const packageLines = packages.flatMap(({ name, changes }) => [
      `- **${name}**`,
      ...changes.flatMap((change) =>
        formatChange(change)
          .split('\n')
          .map((line, index) => (index === 0 ? `  - ${line}` : `    ${line}`))
      )
    ]);

    const noticeLines = typeNotices.map(
      ({ notice, change }) => `**${formatChange(change, true)}**\n${notice}`
    );
    const content = [...noticeLines, packageLines.join('\n')].filter(Boolean).join('\n\n');

    return [`### ${titles[type]}\n\n${content}`];
  });

  if (releasedPackages.length > 0) {
    sections.push(
      `### 📦 Released Versions\n\n${releasedPackages
        .map(({ name, version }) => `- \`${name}@${version}\``)
        .join('\n')}`
    );
  }

  return sections.join('\n\n');
}

function formatChange(change: ReleaseChange, short = false): string {
  const references = [
    change.pullRequest ?? change.commit,
    !short && change.user ? `by @${change.user}` : undefined
  ].filter(Boolean);
  const [firstLine = '', ...remainingLines] = change.summary.split('\n');
  const title = short && remainingLines.length > 0 ? `${firstLine}...` : firstLine;
  const reference = references.length > 0 ? ` (${references.join(' ')})` : '';
  const additionalLines =
    !short && remainingLines.length > 0 ? `\n${remainingLines.join('\n')}` : '';

  return `${title}${reference}${additionalLines}`;
}
