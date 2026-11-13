// Applies template.config.json to template.tpl and README.md.
//
//   npm run apply-config           write the changes
//   npm run apply-config -- --check  exit 1 if the files are out of date
//
// The display name and script URL appear in several places (the INFO block,
// the sandboxed code, the inject_script permission, the README). Change them
// in template.config.json only, then run this script. It reads the current
// values from template.tpl, so it keeps working after you export a new
// template.tpl from the GTM Template Editor.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ROOT, TEMPLATE_PATH, readTemplate, readConfig, parseSections,
  serializeSections, getSection, getInfo, getScriptUrl
} from './tpl.mjs';

const README_PATH = join(ROOT, 'README.md');

function replaceAll(text, from, to) {
  return from === to ? text : text.split(from).join(to);
}

export function applyConfig(templateText, readmeText, config) {
  const info = getInfo(templateText);
  const oldName = info.displayName;
  const oldUrl = getScriptUrl(templateText);

  info.displayName = config.displayName;
  info.brand = Object.assign({}, info.brand, { displayName: config.displayName });
  info.description = config.description;

  const sections = parseSections(templateText);
  const infoSection = getSection(sections, 'INFO');
  const json = infoSection.body.trim();
  // A function replacer inserts the JSON verbatim; a string replacer would
  // expand $& or $1 in a description.
  const infoJson = JSON.stringify(info, null, 2);
  infoSection.body = infoSection.body.replace(json, () => infoJson);

  // The script URL lives in the code and in the inject_script permission.
  sections.forEach((s) => {
    s.body = replaceAll(s.body, oldUrl, config.scriptUrl);
  });

  return {
    template: serializeSections(sections),
    readme: replaceAll(replaceAll(readmeText, oldName, config.displayName), oldUrl, config.scriptUrl)
  };
}

function main() {
  const check = process.argv.includes('--check');
  const templateText = readTemplate();
  const readmeText = readFileSync(README_PATH, 'utf8');
  const next = applyConfig(templateText, readmeText, readConfig());
  const changed = next.template !== templateText || next.readme !== readmeText;

  if (check) {
    if (changed) {
      console.error('template.tpl or README.md does not match template.config.json. Run: npm run apply-config');
      process.exit(1);
    }
    console.log('template.tpl and README.md match template.config.json.');
    return;
  }

  writeFileSync(TEMPLATE_PATH, next.template);
  writeFileSync(README_PATH, next.readme);
  console.log(changed ? 'Updated template.tpl and README.md.' : 'Already up to date.');
}

// Run only when executed directly, not when imported by the tests. Compare
// file URLs so paths with spaces or Windows paths still match.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
