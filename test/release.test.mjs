import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { addVersion, listVersions, releaseNotes } from '../scripts/add-release.mjs';
import { ROOT } from '../scripts/tpl.mjs';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const HEAD = 'homepage: "https://example.com"\n';

test('adds the first version to an empty list', () => {
  const yaml = addVersion(HEAD + 'versions: []\n', A, 'Initial release.');
  assert.equal(yaml, HEAD + 'versions:\n  - sha: ' + A + '\n    changeNotes: "Initial release."\n');
});

test('adds a new version to the top of an existing list', () => {
  const before = HEAD + 'versions:\n  - sha: ' + A + '\n    changeNotes: Initial release.\n';
  const yaml = addVersion(before, B, 'Second.');
  assert.deepEqual(listVersions(yaml), [B, A]);
  assert.ok(yaml.endsWith('  - sha: ' + A + '\n    changeNotes: Initial release.\n'));
});

test('rejects a SHA that is already listed, or not a full SHA', () => {
  const yaml = HEAD + 'versions:\n  - sha: ' + A + '\n';
  assert.throws(() => addVersion(yaml, A, 'Again.'), /already/);
  assert.throws(() => addVersion(yaml, 'abc123', 'Short.'), /full commit SHA/);
  assert.throws(() => addVersion(HEAD, B, 'No list.'), /no versions list/);
});

test('quotes notes so quotes, colons, and $ sequences stay as typed', () => {
  const notes = 'Fix "Purchase": costs $& and $1 # not a comment';
  const yaml = addVersion(HEAD + 'versions: []\n', A, notes);
  const line = yaml.split('\n').find((l) => l.includes('changeNotes'));
  assert.equal(JSON.parse(line.replace(/^\s*changeNotes: /, '')), notes);
});

test('notes come from the "## Release notes" section when there is one', () => {
  const body = '## Context\n\nInternal.\n\n## Release notes\n\nAdds the Lead event.\nFixes consent.\n\nMore detail.\n\n## Tests\n';
  assert.equal(releaseNotes('REP-1: Something', body), 'Adds the Lead event. Fixes consent.');
});

test('notes fall back to the PR title without the Linear key', () => {
  assert.equal(releaseNotes('REP-1086: Add the Lead event', '## Context\n\nx'), 'Add the Lead event');
  assert.equal(releaseNotes('Add the Lead event', null), 'Add the Lead event');
  assert.equal(releaseNotes('REP-1: Title', '## Release notes\n\n<!-- write here -->\n'), 'Title');
  assert.throws(() => releaseNotes('', ''), /No release notes/);
});

test('metadata.yaml lists only full SHAs', () => {
  const yaml = readFileSync(join(ROOT, 'metadata.yaml'), 'utf8');
  const shaLines = yaml.split('\n').filter((l) => /^\s*-\s*sha:/.test(l));
  assert.equal(listVersions(yaml).length, shaLines.length);
});
