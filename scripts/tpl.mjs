// Helpers for reading and writing a GTM template (.tpl) file.
//
// A .tpl file is a list of sections, each starting with a header line such as
// ___INFO___. We keep every section's body byte-for-byte so a round trip
// through these helpers only changes what the caller changes.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TEMPLATE_PATH = join(ROOT, 'template.tpl');
export const CONFIG_PATH = join(ROOT, 'template.config.json');

const HEADER = /^___([A-Z_]+)___$/gm;

// Returns [{ name, body }] in file order. `body` is everything between this
// header line and the next one.
export function parseSections(text) {
  const headers = [...text.matchAll(HEADER)];
  return headers.map((m, i) => {
    const start = m.index + m[0].length;
    const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
    return { name: m[1], body: text.slice(start, end) };
  });
}

export function serializeSections(sections) {
  return sections.map((s) => '___' + s.name + '___' + s.body).join('');
}

export function getSection(sections, name) {
  const section = sections.find((s) => s.name === name);
  if (!section) throw new Error('template.tpl has no ___' + name + '___ section');
  return section;
}

export function readTemplate() {
  return readFileSync(TEMPLATE_PATH, 'utf8');
}

export function readConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

// The sandboxed JS that GTM runs for the tag.
export function getSandboxedCode(text) {
  return getSection(parseSections(text), 'SANDBOXED_JS_FOR_WEB_TEMPLATE').body;
}

export function getInfo(text) {
  return JSON.parse(getSection(parseSections(text), 'INFO').body);
}

export function getScriptUrl(text) {
  const match = getSandboxedCode(text).match(/const SCRIPT_URL = '([^']+)';/);
  if (!match) throw new Error('Could not find SCRIPT_URL in the sandboxed code');
  return match[1];
}
