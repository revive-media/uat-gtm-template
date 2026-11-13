import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPage } from './gtm-sandbox.mjs';

const ID = 'adv123';
const INIT = ['init', { advertiserId: ID, autoPageview: false, debug: false }];

const pageviews = (page) => page.libraryCalls.filter((c) => c[0] === 'pageview');

test('one tag: initializes, sends the event, loads the script, no page view', () => {
  const page = createPage();
  assert.equal(page.fireTag({ advertiserId: ID, eventName: 'AddToCart' }), 'success');
  assert.deepEqual(page.libraryCalls, [INIT, ['track', 'AddToCart']]);
  assert.deepEqual(page.injectedUrls, ['https://t.ad-reporting.net/r-tracker.js']);
});

test('every standard event is sent by its dropdown value', () => {
  for (const name of ['AddToCart', 'Application', 'Checkout', 'Contact', 'Lead', 'Purchase', 'Search', 'SignUp', 'Subscribe']) {
    const page = createPage();
    assert.equal(page.fireTag({ advertiserId: ID, eventName: name }), 'success');
    const expected = name === 'Purchase' ? ['track', name, { isPurchase: true }] : ['track', name];
    assert.deepEqual(page.libraryCalls.at(-1), expected, name);
    assert.equal(pageviews(page).length, 0, name);
  }
});

test('several tags on one page: the script loads once and init runs once', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'PageView' });
  page.fireTag({ advertiserId: ID, eventName: 'AddToCart' });
  page.fireTag({ advertiserId: ID, eventName: 'Purchase' });
  assert.equal(page.injectedUrls.length, 1);
  assert.equal(page.libraryCalls.filter((c) => c[0] === 'init').length, 1);
  assert.deepEqual(page.libraryCalls.slice(1), [
    ['pageview'],
    ['track', 'AddToCart'],
    ['track', 'Purchase', { isPurchase: true }]
  ]);
});

test('Page View tag sends rtag("pageview"), not track("PageView")', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'PageView', firePageView: true });
  assert.deepEqual(page.libraryCalls, [INIT, ['pageview']]);
});

test('Page View tag sends again when it fires again (single-page app route change)', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'PageView' });
  page.fireTag({ advertiserId: ID, eventName: 'PageView' });
  assert.equal(pageviews(page).length, 2);
});

test('checkbox: sends one page view before the event, once per page', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Lead', firePageView: true });
  page.fireTag({ advertiserId: ID, eventName: 'AddToCart', firePageView: true });
  assert.deepEqual(page.libraryCalls, [
    INIT,
    ['pageview'],
    ['track', 'Lead'],
    ['track', 'AddToCart']
  ]);
});

test('checkbox: no extra page view when a Page View tag already sent one', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'PageView' });
  page.fireTag({ advertiserId: ID, eventName: 'Lead', firePageView: true });
  assert.equal(pageviews(page).length, 1);
});

test('custom event: sends the trimmed custom name', () => {
  const page = createPage();
  const result = page.fireTag({ advertiserId: ID, eventName: '__custom__', customEventName: '  Quote Request ' });
  assert.equal(result, 'success');
  assert.deepEqual(page.libraryCalls.at(-1), ['track', 'Quote Request']);
});

test('custom event: a single "|" is allowed', () => {
  const page = createPage();
  assert.equal(page.fireTag({ advertiserId: ID, eventName: '__custom__', customEventName: 'a|b' }), 'success');
});

test('custom event: invalid names fail without loading or sending anything', () => {
  const bad = ['', '   ', 'a||b', 'x'.repeat(257), ...'!@#$%^&*+=(){}[]<>?\\/~;'.split('').map((c) => 'Lead' + c)];
  for (const name of bad) {
    const page = createPage();
    const result = page.fireTag({ advertiserId: ID, eventName: '__custom__', customEventName: name });
    assert.equal(result, 'failure', JSON.stringify(name));
    assert.deepEqual(page.libraryCalls, [], JSON.stringify(name));
    assert.deepEqual(page.injectedUrls, [], JSON.stringify(name));
    assert.match(page.logs.join('\n'), /invalid/, JSON.stringify(name));
  }
});

test('custom event: exactly 256 characters is allowed', () => {
  const page = createPage();
  assert.equal(page.fireTag({ advertiserId: ID, eventName: '__custom__', customEventName: 'x'.repeat(256) }), 'success');
});

test('missing Universal Ad Tag ID fails', () => {
  const page = createPage();
  assert.equal(page.fireTag({ advertiserId: '  ', eventName: 'Lead' }), 'failure');
  assert.deepEqual(page.injectedUrls, []);
  assert.match(page.logs.join('\n'), /Universal Ad Tag ID is required/);
});

test('consent first: keeps a stub the site created and the setConsent it buffered', () => {
  const page = createPage();
  // The site's consent code, with the stub line from the docs.
  const win = page.window;
  win.rtag = win.rtag || function () { (win.rtag.q = win.rtag.q || []).push(arguments); };
  win.rtag('setConsent', { adStorage: 'granted' });

  page.fireTag({ advertiserId: ID, eventName: 'Lead' });
  assert.deepEqual(page.libraryCalls, [
    ['setConsent', { adStorage: 'granted' }],
    INIT,
    ['track', 'Lead']
  ]);
});

test('consent after: setConsent called after the tag still reaches the library', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Lead' });
  page.window.rtag('setConsent', { adStorage: 'denied' });
  assert.deepEqual(page.libraryCalls.at(-1), ['setConsent', { adStorage: 'denied' }]);
});

test('library already on the page (base code): no second script, calls go straight to it', () => {
  const page = createPage({ libraryAlreadyLoaded: true });
  page.libraryCalls.length = 0; // ignore the base code's own auto page view
  assert.equal(page.fireTag({ advertiserId: ID, eventName: 'Lead' }), 'success');
  assert.deepEqual(page.injectedUrls, []);
  assert.deepEqual(page.libraryCalls, [INIT, ['track', 'Lead']]);
});

test('a different ID on a later tag logs a warning and does not re-initialize', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Lead' });
  page.fireTag({ advertiserId: 'other', eventName: 'Purchase' });
  assert.equal(page.libraryCalls.filter((c) => c[0] === 'init').length, 1);
  assert.match(page.logs.join('\n'), /Only one Universal Ad Tag ID/);
});

test('debug checkbox is passed to init', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Lead', debug: true });
  assert.equal(page.libraryCalls[0][1].debug, true);
});

test('script load failure fails the tag', () => {
  const page = createPage({ scriptLoads: false });
  assert.equal(page.fireTag({ advertiserId: ID, eventName: 'Lead' }), 'failure');
  assert.match(page.logs.join('\n'), /Could not load/);
});

const consentCalls = (page) => page.libraryCalls.filter((c) => c[0] === 'setConsent');

test('GTM consent off (default): the tag does not touch consent', () => {
  const page = createPage({ consent: { ad_storage: 'denied' } });
  page.fireTag({ advertiserId: ID, eventName: 'Lead' });
  assert.deepEqual(consentCalls(page), []);
  assert.equal(page.consentListeners.length, 0);
});

test('GTM consent on: passes the GTM consent state before the event', () => {
  const page = createPage({
    consent: { ad_storage: 'denied', ad_user_data: 'granted', ad_personalization: 'denied', analytics_storage: 'granted' }
  });
  page.fireTag({ advertiserId: ID, eventName: 'Lead', useGtmConsent: true });
  assert.deepEqual(page.libraryCalls, [
    INIT,
    ['setConsent', { adStorage: 'denied', adUserData: 'granted', adPersonalization: 'denied', analyticsStorage: 'granted' }],
    ['track', 'Lead']
  ]);
});

test('GTM consent on: an unset consent type counts as granted, as in GTM', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Lead', useGtmConsent: true });
  assert.deepEqual(consentCalls(page), [
    ['setConsent', { adStorage: 'granted', adUserData: 'granted', adPersonalization: 'granted', analyticsStorage: 'granted' }]
  ]);
});

test('GTM consent on: consent is sent before the page view from the checkbox', () => {
  const page = createPage({ consent: { ad_storage: 'denied' } });
  page.fireTag({ advertiserId: ID, eventName: 'Lead', useGtmConsent: true, firePageView: true });
  assert.deepEqual(page.libraryCalls.map((c) => c[0]), ['init', 'setConsent', 'pageview', 'track']);
});

test('GTM consent on: a later change is passed to the library', () => {
  const page = createPage({ consent: { ad_storage: 'denied', ad_user_data: 'denied' } });
  page.fireTag({ advertiserId: ID, eventName: 'Lead', useGtmConsent: true });
  page.updateConsent('ad_storage', 'granted');
  page.updateConsent('ad_user_data', 'granted');
  page.updateConsent('ad_storage', 'denied');
  assert.deepEqual(consentCalls(page).slice(1), [
    ['setConsent', { adStorage: 'granted' }],
    ['setConsent', { adUserData: 'granted' }],
    ['setConsent', { adStorage: 'denied' }]
  ]);
});

test('GTM consent on: listeners are added once per page, however many tags fire', () => {
  const page = createPage({ consent: { ad_storage: 'denied' } });
  page.fireTag({ advertiserId: ID, eventName: 'PageView', useGtmConsent: true });
  page.fireTag({ advertiserId: ID, eventName: 'Lead', useGtmConsent: true });
  assert.equal(page.consentListeners.length, 4);
  page.updateConsent('ad_storage', 'granted');
  assert.deepEqual(consentCalls(page).at(-1), ['setConsent', { adStorage: 'granted' }]);
  assert.equal(consentCalls(page).filter((c) => c[1].adStorage === 'granted' && Object.keys(c[1]).length === 1).length, 1);
});

test('GTM consent on: each tag re-sends the current state', () => {
  const page = createPage({ consent: { ad_storage: 'denied' } });
  page.fireTag({ advertiserId: ID, eventName: 'PageView', useGtmConsent: true });
  page.fireTag({ advertiserId: ID, eventName: 'Lead', useGtmConsent: true });
  assert.equal(consentCalls(page).length, 2);
});

const lastTrack = (page) => page.libraryCalls.filter((c) => c[0] === 'track').at(-1);

test('parameters: Purchase sets isPurchase automatically', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Purchase' });
  assert.deepEqual(lastTrack(page), ['track', 'Purchase', { isPurchase: true }]);
});

test('parameters: a custom event named Purchase also sets isPurchase', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: '__custom__', customEventName: 'Purchase' });
  assert.deepEqual(lastTrack(page), ['track', 'Purchase', { isPurchase: true }]);
});

test('parameters: other events do not set isPurchase', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Checkout', value: '10' });
  assert.deepEqual(lastTrack(page), ['track', 'Checkout', { value: '10' }]);
});

test('parameters: value, currency code, and units sold are sent, keeping numbers as numbers', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Purchase', value: 25.99, currencyCode: ' USD ', unitsSold: 2 });
  assert.deepEqual(lastTrack(page), ['track', 'Purchase', {
    isPurchase: true, value: 25.99, currencyCode: 'USD', unitsSold: 2
  }]);
});

test('parameters: empty fields are left out, and no payload is sent when nothing is set', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Lead', value: '', currencyCode: undefined, unitsSold: null, customParameters: [] });
  assert.deepEqual(lastTrack(page), ['track', 'Lead']);
});

test('parameters: zero is a real value, not an empty field', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Lead', value: 0 });
  assert.deepEqual(lastTrack(page), ['track', 'Lead', { value: 0 }]);
});

test('parameters: custom parameters are sent by name', () => {
  const page = createPage();
  page.fireTag({
    advertiserId: ID,
    eventName: 'Purchase',
    value: '25.99',
    customParameters: [{ name: 'orderId', value: 'ABC123' }, { name: ' coupon ', value: 'SPRING' }]
  });
  assert.deepEqual(lastTrack(page), ['track', 'Purchase', {
    isPurchase: true, value: '25.99', orderId: 'ABC123', coupon: 'SPRING'
  }]);
});

test('parameters: custom rows with an empty name or value are skipped', () => {
  const page = createPage();
  page.fireTag({
    advertiserId: ID,
    eventName: 'Lead',
    customParameters: [{ name: '', value: 'x' }, { name: 'formId', value: '' }, { name: 'source', value: 'footer' }]
  });
  assert.deepEqual(lastTrack(page), ['track', 'Lead', { source: 'footer' }]);
});

test('parameters: custom rows cannot override the built-in fields or isPurchase', () => {
  const page = createPage();
  page.fireTag({
    advertiserId: ID,
    eventName: 'Lead',
    value: '5',
    customParameters: [{ name: 'value', value: '999' }, { name: 'isPurchase', value: 'true' }, { name: 'unitsSold', value: '3' }]
  });
  assert.deepEqual(lastTrack(page), ['track', 'Lead', { value: '5' }]);
  assert.match(page.logs.join('\n'), /"value" is a built-in field/);
  assert.match(page.logs.join('\n'), /"isPurchase" is a built-in field/);
});

test('parameters: a custom name with a forbidden character is skipped with a warning', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Lead', customParameters: [{ name: 'order#', value: '1' }] });
  assert.deepEqual(lastTrack(page), ['track', 'Lead']);
  assert.match(page.logs.join('\n'), /Parameter "order#" was skipped/);
});

test('parameters: a Page View tag passes its parameters to the page view', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'PageView', customParameters: [{ name: 'path', value: '/pricing' }] });
  assert.deepEqual(page.libraryCalls.at(-1), ['pageview', { path: '/pricing' }]);
});

test('parameters: the checkbox page view does not get the event parameters', () => {
  const page = createPage();
  page.fireTag({ advertiserId: ID, eventName: 'Purchase', firePageView: true, value: '10' });
  assert.deepEqual(page.libraryCalls.slice(1), [['pageview'], ['track', 'Purchase', { isPurchase: true, value: '10' }]]);
});
