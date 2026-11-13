import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyConfig } from '../scripts/apply-config.mjs';
import {
  ROOT, readTemplate, readConfig, parseSections, serializeSections, getInfo, getScriptUrl
} from '../scripts/tpl.mjs';

const README = readFileSync(join(ROOT, 'README.md'), 'utf8');

test('template.tpl round-trips through the section parser unchanged', () => {
  const text = readTemplate();
  assert.equal(serializeSections(parseSections(text)), text);
});

test('template.tpl and README.md match template.config.json', () => {
  const text = readTemplate();
  const next = applyConfig(text, README, readConfig());
  assert.equal(next.template, text, 'run: npm run apply-config');
  assert.equal(next.readme, README, 'run: npm run apply-config');
});

test('renaming updates the name and brand, and the script URL in code and permissions', () => {
  const text = readTemplate();
  const next = applyConfig(text, README, {
    displayName: 'Acme Ad Tag',
    description: 'New description.',
    scriptUrl: 'https://cdn.example.com/r-tracker.js'
  });
  const info = getInfo(next.template);
  assert.equal(info.displayName, 'Acme Ad Tag');
  assert.equal(info.brand.displayName, 'Acme Ad Tag');
  assert.equal(info.description, 'New description.');
  assert.equal(getScriptUrl(next.template), 'https://cdn.example.com/r-tracker.js');
  assert.ok(!next.template.includes('t.ad-reporting.net'), 'old URL left in template.tpl');
  assert.ok(!next.template.includes(readConfig().displayName), 'old name left in template.tpl');
  assert.ok(next.readme.includes('Acme Ad Tag'));
});

test('INFO lists one to three Gallery categories', () => {
  const info = getInfo(readTemplate());
  assert.ok(Array.isArray(info.categories) && info.categories.length >= 1 && info.categories.length <= 3);
});

test('renaming keeps $ sequences in the description literal', () => {
  const description = 'Costs $& and $1 and $$ stay as typed.';
  const next = applyConfig(readTemplate(), README, Object.assign({}, readConfig(), { description }));
  assert.equal(getInfo(next.template).description, description);
});
