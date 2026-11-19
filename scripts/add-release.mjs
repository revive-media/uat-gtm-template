// Adds a release to the top of `versions` in metadata.yaml.
//
//   PR_TITLE=... PR_BODY=... node scripts/add-release.mjs <commit-sha>
//
// .github/workflows/release.yml runs this when a pull request with the
// `release` label is merged into main. The change notes come from the PR's
// "## Release notes" section, or from its title without the Linear key.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './tpl.mjs';

const METADATA_PATH = join(ROOT, 'metadata.yaml');
const SHA = /^[0-9a-f]{40}$/;

// The first paragraph under "## Release notes", or the title without a
// leading Linear key such as "REP-1086: ". Users see these notes in GTM.
export function releaseNotes(title, body) {
  const lines = (body || '').replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+release notes\s*$/i.test(line.trim()));
  if (start !== -1) {
    const paragraph = [];
    for (const line of lines.slice(start + 1)) {
      if (/^#{1,6}\s/.test(line.trim())) break;
      if (!line.trim()) {
        if (paragraph.length) break;
        continue;
      }
      paragraph.push(line.trim());
    }
    if (paragraph.length) return paragraph.join(' ');
  }
  const notes = (title || '').replace(/^[A-Z][A-Z0-9]*-\d+\s*:\s*/, '').trim();
  if (!notes) throw new Error('No release notes: the PR has no title or "## Release notes" section');
  return notes;
}

export function listVersions(yaml) {
  return [...yaml.matchAll(/^\s*-\s*sha:\s*([0-9a-f]{40})\s*$/gm)].map((m) => m[1]);
}

export function addVersion(yaml, sha, notes) {
  if (!SHA.test(sha)) throw new Error('Not a full commit SHA: ' + sha);
  if (listVersions(yaml).includes(sha)) throw new Error(sha + ' is already in metadata.yaml');

  // A JSON string is a valid YAML double-quoted string, so any notes are safe.
  const entry = '  - sha: ' + sha + '\n    changeNotes: ' + JSON.stringify(notes);
  if (/^versions:[ \t]*\[\][ \t]*$/m.test(yaml)) {
    return yaml.replace(/^versions:[ \t]*\[\][ \t]*$/m, () => 'versions:\n' + entry);
  }
  if (/^versions:[ \t]*$/m.test(yaml)) {
    return yaml.replace(/^versions:[ \t]*$/m, () => 'versions:\n' + entry);
  }
  throw new Error('metadata.yaml has no versions list');
}

// git diff exits 1 when the files differ.
function templateChanged(from, to) {
  try {
    execFileSync('git', ['diff', '--quiet', from, to, '--', 'template.tpl'], { cwd: ROOT });
    return false;
  } catch (error) {
    if (error.status === 1) return true;
    throw error;
  }
}

function main() {
  const sha = process.argv[2] || '';
  const yaml = readFileSync(METADATA_PATH, 'utf8');
  const latest = listVersions(yaml)[0];
  if (SHA.test(sha) && latest && !templateChanged(latest, sha)) {
    throw new Error('template.tpl at ' + sha + ' is the same as the latest release ' + latest);
  }
  const notes = releaseNotes(process.env.PR_TITLE, process.env.PR_BODY);
  writeFileSync(METADATA_PATH, addVersion(yaml, sha, notes));
  console.log('Added ' + sha + ' to metadata.yaml: ' + notes);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
