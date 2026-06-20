import { describe, expect, it } from 'vitest';
import { generateMarkdown } from '../src/generate-markdown.js';

describe('generateMarkdown', () => {
  it('renders grouped changes and released versions', () => {
    expect(
      generateMarkdown(
        [],
        [
          {
            type: 'minor',
            packages: [
              {
                name: '@astrix/sdk',
                changes: [
                  {
                    summary: 'Added retry support',
                    pullRequest: '[#42](https://github.com/astrix-ts/astrix-ts/pull/42)',
                    user: 'octocat'
                  }
                ]
              }
            ]
          }
        ],
        [{ name: '@astrix/sdk', version: '0.2.0' }]
      )
    ).toBe(`### ✨ New Features & Improvements

- **@astrix/sdk**
  - Added retry support ([#42](https://github.com/astrix-ts/astrix-ts/pull/42) by @octocat)

### 📦 Released Versions

- \`@astrix/sdk@0.2.0\``);
  });

  it('renders notices under potential breaking changes', () => {
    const change = {
      summary: 'Changed the retry defaults\nUpdated the backoff behavior',
      commit: '[abc1234](https://github.com/prdsjawe/astrix/commit/abc1234)',
      user: 'octocat'
    };

    expect(
      generateMarkdown(
        [{ notice: 'Existing clients should review their retry configuration.', change }],
        [{ type: 'patch', packages: [{ name: '@astrix/sdk', changes: [change] }] }],
        []
      )
    ).toBe(`### ⚠️ Potential Breaking Changes

**Changed the retry defaults... ([abc1234](https://github.com/prdsjawe/astrix/commit/abc1234))**
Existing clients should review their retry configuration.

### 🐛 Bug Fixes & Optimizations

- **@astrix/sdk**
  - Changed the retry defaults ([abc1234](https://github.com/prdsjawe/astrix/commit/abc1234) by @octocat)
    Updated the backoff behavior`);
  });

  it('returns an empty string when there are no changes or released packages', () => {
    expect(generateMarkdown([], [], [])).toBe('');
  });
});
