# uat-gtm-template

The Google Tag Manager Community Template for the Universal Ad Tag. See
README.md for the template's fields, the config, and the tests.

## Releases

The Community Template Gallery publishes only the commits listed in `versions`
in `metadata.yaml`. Merging into `main` does not release anything by itself.

- **Label every PR that changes what GTM users get with `release`.** That means
  any change to `template.tpl`: fields, sandboxed code, permissions, tests, or
  INFO (name, brand, description, icon, categories). Changes to
  `template.config.json` or `assets/icon.png` count too, since
  `npm run apply-config` writes them into `template.tpl`.
  - New PR: `gh pr create --label release ...`
  - Existing PR: `gh pr edit <number> --add-label release`
- **Add a `## Release notes` section to the PR description.** Write one short
  paragraph for advertisers, who read it in GTM. Leave out issue keys, internal
  names, and internal links: advertisers may not know who we are. Without the
  section, the workflow uses the PR title minus a leading issue key.
- **Do not label** PRs that change only the README, `test/`, `scripts/`,
  `.github/`, `CLAUDE.md`, or `metadata.yaml`. The workflow fails when
  `template.tpl` is unchanged since the last release.
- **Do not edit `versions` in `metadata.yaml` by hand.** After a labeled PR
  merges, the Release to Gallery workflow adds the version through a
  `release/<sha>` PR.
- Changes to `r-tracker.js` live in the universal-ad-tag repo. Tags load it from
  `t.ad-reporting.net`, so they need no template release.

## Working in this repo

- `main` is protected. Every change goes through a PR, merged with a merge
  commit.
- Branch names: `working/rep-XXXX-<description>`.
- After editing `template.config.json`, run `npm run apply-config`.
- Run `npm test` before committing.
