// A small stand-in for the GTM sandbox, so the template's code can run in Node.
//
// It fakes the GTM APIs the template uses and a page `window`. When the
// template injects r-tracker.js, `loadLibrary` mimics the real bootstrap in
// universal-ad-tag (src/tracker/index.js + bootstrap.js): it replaces the
// stub, replays the queue, and fires the automatic page view unless the first
// queued init set autoPageview: false. Every call the library receives is
// recorded in page.libraryCalls.
//
// This checks the template's logic. It does not replace testing in GTM
// Preview, where the real APIs and the real library run.

import { getSandboxedCode, readTemplate } from '../scripts/tpl.mjs';

const CODE = getSandboxedCode(readTemplate());

function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function resolve(win, path) {
  return path.split('.').reduce((obj, key) => (obj == null ? undefined : obj[key]), win);
}

function parentAndKey(win, path) {
  const parts = path.split('.');
  const key = parts.pop();
  const parent = parts.length ? resolve(win, parts.join('.')) : win;
  if (parent == null) throw new Error('Path does not exist: ' + path);
  return { parent, key };
}

// Mirrors bootstrap.js: the first queued init decides autoPageview, and a
// queued page view suppresses the automatic one.
function shouldAutoFirePageview(pending) {
  for (const call of pending) {
    if (call[0] === 'pageview' || (call[0] === 'track' && call[1] === 'pageview')) return false;
  }
  const init = pending.find((call) => call[0] === 'init');
  return !(init && init[1] && init[1].autoPageview === false);
}

// `consent` is GTM's consent state, e.g. { ad_storage: 'denied' }. A type left
// out is unset, which GTM treats as granted.
export function createPage({ libraryAlreadyLoaded = false, scriptLoads = true, consent = {} } = {}) {
  const win = {};
  const consentState = Object.assign({}, consent);
  const consentListeners = [];
  const page = {
    window: win,
    storage: new Map(),
    logs: [],
    injectedUrls: [],
    libraryCalls: [],
    consentListeners,
    loadLibrary,
    // Simulates the CMP updating GTM consent. Like GTM, listeners run only on
    // a real change, and an unset type moving to granted is not a change.
    updateConsent(type, value) {
      const before = isGranted(type);
      consentState[type] = value;
      if (before === isGranted(type)) return;
      consentListeners.filter((l) => l.type === type).forEach((l) => l.fn(type, isGranted(type)));
    }
  };

  function isGranted(type) {
    return consentState[type] === undefined || consentState[type] === 'granted';
  }

  // Installs the real rtag the way r-tracker.js does on load.
  function loadLibrary() {
    if (win.rtag && typeof win.rtag.track === 'function') return; // duplicate load guard
    const pending = win.rtag && win.rtag.q ? win.rtag.q.map((args) => Array.from(args)) : [];
    const rtag = function (...args) { page.libraryCalls.push(args); };
    rtag.track = (name, payload) => rtag('track', name, payload);
    win.rtag = rtag;
    pending.forEach((args) => rtag(...args));
    if (shouldAutoFirePageview(pending)) {
      page.libraryCalls.push(['pageview', '(auto)']);
    }
  }

  if (libraryAlreadyLoaded) loadLibrary();

  const loadedTokens = new Set();

  const apis = {
    addConsentListener(type, fn) {
      consentListeners.push({ type, fn });
    },
    isConsentGranted(type) {
      return isGranted(type);
    },
    callInWindow(path, ...args) {
      const fn = resolve(win, path);
      if (typeof fn !== 'function') throw new Error('callInWindow: not a function: ' + path);
      return fn(...args);
    },
    copyFromWindow(path) {
      return resolve(win, path);
    },
    createArgumentsQueue(fnKey, arrayKey) {
      const fnTarget = parentAndKey(win, fnKey);
      if (fnTarget.parent[fnTarget.key] === undefined) {
        fnTarget.parent[fnTarget.key] = function () {
          resolve(win, arrayKey).push(arguments);
        };
      }
      const arrTarget = parentAndKey(win, arrayKey);
      if (arrTarget.parent[arrTarget.key] === undefined) {
        arrTarget.parent[arrTarget.key] = [];
      }
      return fnTarget.parent[fnTarget.key];
    },
    getType,
    injectScript(url, onSuccess, onFailure, cacheToken) {
      if (!scriptLoads) {
        onFailure();
        return;
      }
      // With a cacheToken, GTM adds the script element only once.
      if (!cacheToken || !loadedTokens.has(cacheToken)) {
        if (cacheToken) loadedTokens.add(cacheToken);
        page.injectedUrls.push(url);
        loadLibrary();
      }
      onSuccess();
    },
    logToConsole(...args) {
      page.logs.push(args.join(' '));
    },
    makeString(value) {
      return String(value);
    },
    templateStorage: {
      getItem: (key) => (page.storage.has(key) ? page.storage.get(key) : null),
      setItem: (key, value) => { page.storage.set(key, value); },
      removeItem: (key) => { page.storage.delete(key); },
      clear: () => { page.storage.clear(); }
    }
  };

  function require(name) {
    if (!(name in apis)) throw new Error('Template requires an API the sandbox does not fake: ' + name);
    return apis[name];
  }

  // Fires one tag instance with the given field values. Returns 'success',
  // 'failure', or 'pending' (neither callback was called).
  page.fireTag = function fireTag(fields) {
    let result = 'pending';
    const data = Object.assign({}, fields, {
      gtmOnSuccess: () => { result = 'success'; },
      gtmOnFailure: () => { result = 'failure'; }
    });
    new Function('require', 'data', CODE)(require, data);
    return result;
  };

  return page;
}
