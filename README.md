# Revive Universal Ad Tag for Google Tag Manager

A Google Tag Manager tag template for the Revive Universal Ad Tag. Enter your
Universal Ad Tag ID, pick an event, and the tag loads the library and sends the
event. You do not need any Custom HTML tags.

## Set up

1. In Google Tag Manager, go to **Tags > New > Tag Configuration** and pick
   **Revive Universal Ad Tag** from the Community Template Gallery.
2. Fill in the fields below and choose a trigger.
3. Repeat for each event you want to send. Every tag uses the same Universal Ad
   Tag ID.

| Field | What to enter |
| --- | --- |
| Universal Ad Tag ID | The ID you received during onboarding. |
| Event Name | The event this tag sends: Add to Cart, Application, Checkout, Contact, Lead, Page View, Purchase, Search, Sign Up, Subscribe, or Custom. |
| Custom Event Name | Shown when Event Name is Custom. Up to 256 characters. Do not use `\|\|` or any of `! @ # $ % ^ & * + = ( ) { } [ ] < > ? \ / ~ ;`. |
| Also send a Page View | Sends a Page View before this event, at most once per page load. Leave it off if you already have a Page View tag. |
| Pass consent from Google Tag Manager | Passes the consent your consent banner sets in GTM. See [Consent](#consent). |
| Event Parameters > Value | Optional. The conversion value, such as order revenue. |
| Event Parameters > Currency Code | Optional. The three-letter currency code for Value, such as `USD`. |
| Event Parameters > Units Sold | Optional. The number of items in the conversion. |
| Event Parameters > Custom Parameters | Optional. Any other details, such as `orderId`. Names follow the Custom Event Name rules. |
| Advanced Settings > Enable debug logging | Logs what the tag does to the browser console. Use it while testing. |

### Event parameters

Every field accepts a GTM variable, such as `{{DLV - ecommerce.value}}` from
the dataLayer. Leave a field empty to skip it.

- **Purchase** events are always sent as a sales transaction. You do not need to
  set anything for this.
- **Google** receives only Value, Currency Code, and Units Sold. **Amazon**
  receives every parameter, including Custom Parameters.
- A Custom Parameters row cannot use the names `value`, `currencyCode`,
  `unitsSold`, or `isPurchase`. Use the fields above instead.

### Page views

The tag does **not** send a page view on its own. To track page views, create a
tag with **Event Name: Page View** and the **All Pages** trigger. For a
single-page app, also fire it on a **History Change** trigger.

Alternatively, tick **Also send a Page View** on another tag. It sends at most
one page view per page load, so do not combine it with a Page View tag.

### Several tags on one page

You can fire as many tags as you need. The library loads once per page, and the
first tag initializes it.

### Consent

Choose one of these. Do not use both, or they overwrite each other.

**Option 1: Pass consent from Google Tag Manager.** Use this when your consent
banner (CMP) is set up in GTM with Consent Mode. Tick **Pass consent from Google
Tag Manager** on every tag. Before each event, the tag reads `ad_storage`,
`ad_user_data`, `ad_personalization`, and `analytics_storage` from GTM and passes
them on. It also passes along any change the visitor makes later.

A consent type your CMP does not set counts as **granted**, the same as for
other tags in GTM. If you need visitors to start as denied, set a denied default
in your CMP.

**Option 2: Pass consent from your site.** Leave the checkbox off and call
`rtag('setConsent', ...)` from your site or consent banner. Keep the first line:
it lets the call run even before the first tag fires.

```js
window.rtag = window.rtag || function () { (rtag.q = rtag.q || []).push(arguments); };
rtag('setConsent', {
  adStorage: 'granted',          // or 'denied'
  adUserData: 'granted',
  adPersonalization: 'granted',
  analyticsStorage: 'granted'
});
```

Call it again whenever the visitor changes their choice.

If you use neither option, every visitor is treated as denied.

### Content Security Policy

If your site sends a Content-Security-Policy header, allow these hosts in
`script-src`:

```
https://t.ad-reporting.net https://www.googletagmanager.com https://c.amazon-adsystem.com
```

---

## Development

### Files

| File | Purpose |
| --- | --- |
| `template.tpl` | The template, in GTM's export format. Gallery requires it at the root. |
| `template.config.json` | The display name, description, and script URL. Change them here only. |
| `metadata.yaml` | Gallery metadata: homepage, documentation, and released versions. |
| `scripts/apply-config.mjs` | Writes `template.config.json` into `template.tpl` and this README. |
| `test/` | Runs the template code in Node against a fake GTM sandbox. |

### Rename the template or change the script URL

Edit `template.config.json`, then run:

```bash
npm run apply-config
```

It updates the name, brand, and description in `template.tpl`, the script URL in
the code and the `inject_script` permission, and the name in this README.

### Test

```bash
npm test
```

The tests run the template's sandboxed code against fake GTM APIs and a stand-in
for the library's bootstrap. They also check that `template.tpl` matches
`template.config.json`. They do not replace testing in GTM:

1. In GTM, go to **Templates > Tag Templates > New**, open the menu, and choose
   **Import**. Select `template.tpl`.
2. Open the **Tests** tab and click **Run Tests**.
3. Create tags from the template and check them in **Preview** mode and in the
   browser's network panel.
4. If you change the template in the editor, export it and replace
   `template.tpl`, then run `npm test`.

### Release to the Community Template Gallery

1. In the Template Editor's **Info** tab, tick **Agree to the Community Template
   Gallery Terms of Service**, then export to `template.tpl`.
2. Commit `template.tpl` to `main`.
3. Add that commit's SHA to the top of `versions` in `metadata.yaml` and commit.
4. First release only: submit the repository URL at
   [tagmanager.google.com/gallery](https://tagmanager.google.com/gallery).
   Later versions appear in the Gallery within two to three days.
