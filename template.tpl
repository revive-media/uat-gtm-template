___TERMS_OF_SERVICE___

By creating or modifying this file you agree to Google Tag Manager's Community
Template Gallery Developer Terms of Service available at
https://developers.google.com/tag-manager/gallery-tos (or such other URL as
Google may provide), as modified from time to time.


___INFO___

{
  "type": "TAG",
  "id": "cvt_temp_public_id",
  "version": 1,
  "securityGroups": [],
  "displayName": "Revive Universal Ad Tag",
  "categories": [
    "ADVERTISING",
    "CONVERSIONS"
  ],
  "brand": {
    "id": "brand_dummy",
    "displayName": "Revive Universal Ad Tag"
  },
  "description": "Send conversion and page view events to your ad platforms with one tag. Enter your Universal Ad Tag ID, pick an event, and the tag handles loading.",
  "containerContexts": [
    "WEB"
  ]
}


___TEMPLATE_PARAMETERS___

[
  {
    "type": "TEXT",
    "name": "advertiserId",
    "displayName": "Universal Ad Tag ID",
    "simpleValueType": true,
    "valueValidators": [
      {
        "type": "NON_EMPTY"
      }
    ],
    "help": "The Universal Ad Tag ID you received during onboarding. Use the same ID in every tag on the page."
  },
  {
    "type": "SELECT",
    "name": "eventName",
    "displayName": "Event Name",
    "macrosInSelect": false,
    "selectItems": [
      {
        "value": "AddToCart",
        "displayValue": "Add to Cart"
      },
      {
        "value": "Application",
        "displayValue": "Application"
      },
      {
        "value": "Checkout",
        "displayValue": "Checkout"
      },
      {
        "value": "Contact",
        "displayValue": "Contact"
      },
      {
        "value": "Lead",
        "displayValue": "Lead"
      },
      {
        "value": "PageView",
        "displayValue": "Page View"
      },
      {
        "value": "Purchase",
        "displayValue": "Purchase"
      },
      {
        "value": "Search",
        "displayValue": "Search"
      },
      {
        "value": "SignUp",
        "displayValue": "Sign Up"
      },
      {
        "value": "Subscribe",
        "displayValue": "Subscribe"
      },
      {
        "value": "__custom__",
        "displayValue": "Custom"
      }
    ],
    "simpleValueType": true,
    "valueValidators": [
      {
        "type": "NON_EMPTY"
      }
    ],
    "help": "The event this tag sends. Page views are not sent automatically: create a separate tag with Page View selected, or tick \"Also send a Page View\"."
  },
  {
    "type": "TEXT",
    "name": "customEventName",
    "displayName": "Custom Event Name",
    "simpleValueType": true,
    "enablingConditions": [
      {
        "paramName": "eventName",
        "paramValue": "__custom__",
        "type": "EQUALS"
      }
    ],
    "valueValidators": [
      {
        "type": "NON_EMPTY"
      },
      {
        "type": "STRING_LENGTH",
        "args": [
          1,
          256
        ]
      }
    ],
    "help": "Up to 256 characters. Do not use \"||\" or any of these characters: ! @ # $ % ^ & * + = ( ) { } [ ] < > ? \\ / ~ ;"
  },
  {
    "type": "CHECKBOX",
    "name": "firePageView",
    "checkboxText": "Also send a Page View",
    "simpleValueType": true,
    "defaultValue": false,
    "enablingConditions": [
      {
        "paramName": "eventName",
        "paramValue": "PageView",
        "type": "NOT_EQUALS"
      }
    ],
    "help": "Sends a Page View before this event, at most once per page load. Leave this off if you already have a Page View tag."
  },
  {
    "type": "CHECKBOX",
    "name": "useGtmConsent",
    "checkboxText": "Pass consent from Google Tag Manager",
    "simpleValueType": true,
    "defaultValue": false,
    "help": "Reads the consent your consent banner (CMP) sets in Google Tag Manager (ad_storage, ad_user_data, ad_personalization, analytics_storage) and passes it on before each event. Updates when the visitor changes their choice. A consent type your CMP does not set counts as granted. Leave this off if your site calls rtag('setConsent') itself."
  },
  {
    "type": "GROUP",
    "name": "eventParameters",
    "displayName": "Event Parameters",
    "groupStyle": "ZIPPY_OPEN",
    "help": "Optional details sent with the event. Leave a field empty to skip it. Purchase events are always sent as a sales transaction.",
    "subParams": [
      {
        "type": "TEXT",
        "name": "value",
        "displayName": "Value",
        "simpleValueType": true,
        "help": "The conversion value, such as order revenue. For example: 25.99 or a variable like {{DLV - ecommerce.value}}."
      },
      {
        "type": "TEXT",
        "name": "currencyCode",
        "displayName": "Currency Code",
        "simpleValueType": true,
        "help": "The three-letter currency code for Value, such as USD."
      },
      {
        "type": "TEXT",
        "name": "unitsSold",
        "displayName": "Units Sold",
        "simpleValueType": true,
        "help": "The number of items in the conversion."
      },
      {
        "type": "SIMPLE_TABLE",
        "name": "customParameters",
        "displayName": "Custom Parameters",
        "simpleTableColumns": [
          {
            "defaultValue": "",
            "displayName": "Name",
            "name": "name",
            "type": "TEXT",
            "isUnique": true
          },
          {
            "defaultValue": "",
            "displayName": "Value",
            "name": "value",
            "type": "TEXT"
          }
        ],
        "newRowButtonText": "Add parameter",
        "help": "Any other details, such as orderId. Names follow the same rules as Custom Event Name. Rows with an empty name or value are skipped. Google receives only Value, Currency Code, and Units Sold; Amazon receives every parameter."
      }
    ]
  },
  {
    "type": "GROUP",
    "name": "advancedSettings",
    "displayName": "Advanced Settings",
    "groupStyle": "ZIPPY_CLOSED",
    "subParams": [
      {
        "type": "CHECKBOX",
        "name": "debug",
        "checkboxText": "Enable debug logging in the browser console",
        "simpleValueType": true,
        "defaultValue": false
      }
    ]
  }
]


___SANDBOXED_JS_FOR_WEB_TEMPLATE___

const addConsentListener = require('addConsentListener');
const callInWindow = require('callInWindow');
const copyFromWindow = require('copyFromWindow');
const createArgumentsQueue = require('createArgumentsQueue');
const getType = require('getType');
const injectScript = require('injectScript');
const isConsentGranted = require('isConsentGranted');
const logToConsole = require('logToConsole');
const makeString = require('makeString');
const templateStorage = require('templateStorage');

const SCRIPT_URL = 'https://t.ad-reporting.net/r-tracker.js';
const CUSTOM_EVENT = '__custom__';
const PAGEVIEW_EVENT = 'PageView';
const PURCHASE_EVENT = 'Purchase';
// Parameters that have their own field (or are set automatically), so a
// Custom Parameters row cannot override them.
const BUILT_IN_PARAMS = ['value', 'currencyCode', 'unitsSold', 'isPurchase'];
const MAX_EVENT_NAME_LENGTH = 256;
// Mirrors the library's validator (src/tracker/validator/validator.js).
const FORBIDDEN_CHARS = '!@#$%^&*+=(){}[]<>?\\/~;';
// GTM consent type -> rtag('setConsent') key.
const CONSENT_KEYS = {
  ad_storage: 'adStorage',
  ad_user_data: 'adUserData',
  ad_personalization: 'adPersonalization',
  analytics_storage: 'analyticsStorage'
};
const CONSENT_TYPES = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'];

const log = (message) => {
  logToConsole('[rtag-gtm] ' + message);
};

const fail = (message) => {
  log(message);
  data.gtmOnFailure();
};

// Checks an event or parameter name. Returns null when it is valid, otherwise
// the reason it is not.
const validateName = (name) => {
  if (!name) return 'it is empty';
  if (name.length > MAX_EVENT_NAME_LENGTH) return 'it is longer than 256 characters';
  if (name.indexOf('||') !== -1) return 'it contains "||"';
  for (let i = 0; i < name.length; i++) {
    if (FORBIDDEN_CHARS.indexOf(name.charAt(i)) !== -1) {
      return 'it contains "' + name.charAt(i) + '"';
    }
  }
  return null;
};

// Returns the value to send, or undefined when the field is empty. Numbers and
// booleans from variables keep their type; 0 and false are real values.
const cleanValue = (raw) => {
  const type = getType(raw);
  if (type === 'number' || type === 'boolean') return raw;
  if (type === 'undefined' || type === 'null') return undefined;
  const text = makeString(raw).trim();
  return text === '' ? undefined : text;
};

// The event's payload, or undefined when it has no parameters.
const buildPayload = (name) => {
  const payload = {};
  let hasParams = false;
  const add = (key, raw) => {
    const value = cleanValue(raw);
    if (value === undefined) return;
    payload[key] = value;
    hasParams = true;
  };

  // Routes Google's conversion to the sales group, counted per transaction.
  if (name === PURCHASE_EVENT) add('isPurchase', true);
  add('value', data.value);
  add('currencyCode', data.currencyCode);
  add('unitsSold', data.unitsSold);

  (data.customParameters || []).forEach((row) => {
    const key = makeString(row.name || '').trim();
    if (!key) return;
    if (BUILT_IN_PARAMS.indexOf(key) !== -1) {
      log('Parameter "' + key + '" was skipped: "' + key + '" is a built-in field. Use its own field instead.');
      return;
    }
    const invalid = validateName(key);
    if (invalid) {
      log('Parameter "' + key + '" was skipped because ' + invalid + '.');
      return;
    }
    add(key, row.value);
  });

  return hasParams ? payload : undefined;
};

const advertiserId = makeString(data.advertiserId || '').trim();
const eventName = data.eventName === CUSTOM_EVENT
  ? makeString(data.customEventName || '').trim()
  : makeString(data.eventName || '');

if (!advertiserId) {
  fail('Universal Ad Tag ID is required.');
  return;
}

const invalidReason = validateName(eventName);
if (invalidReason) {
  fail('Event name "' + eventName + '" is invalid because ' + invalidReason + '.');
  return;
}

// 1. Command queue. Reuse an existing rtag (a stub the site defined for its
// consent code, or the loaded library) so calls it already buffered keep
// their order. Otherwise create the same stub the base code uses.
if (getType(copyFromWindow('rtag')) !== 'function') {
  createArgumentsQueue('rtag', 'rtag.q');
}

// 2. Initialize once per page. autoPageview: false because page views are
// their own tag (or the "Also send a Page View" option) in this template.
if (!templateStorage.getItem('initialized')) {
  templateStorage.setItem('initialized', true);
  templateStorage.setItem('advertiserId', advertiserId);
  callInWindow('rtag', 'init', {
    advertiserId: advertiserId,
    autoPageview: false,
    debug: data.debug === true
  });
} else if (templateStorage.getItem('advertiserId') !== advertiserId) {
  log('Only one Universal Ad Tag ID is supported per page. Sending "' + eventName +
    '" to ' + templateStorage.getItem('advertiserId') + ', not ' + advertiserId + '.');
}

// 3. Consent (optional). Pass GTM's current consent state before the event,
// on every tag so it is never stale, and listen for changes once per page.
// GTM treats an unset consent type as granted.
if (data.useGtmConsent === true) {
  const consent = {};
  CONSENT_TYPES.forEach((type) => {
    consent[CONSENT_KEYS[type]] = isConsentGranted(type) ? 'granted' : 'denied';
  });
  callInWindow('rtag', 'setConsent', consent);

  if (!templateStorage.getItem('consentListening')) {
    templateStorage.setItem('consentListening', true);
    CONSENT_TYPES.forEach((type) => {
      addConsentListener(type, (consentType, granted) => {
        const update = {};
        update[CONSENT_KEYS[consentType]] = granted ? 'granted' : 'denied';
        callInWindow('rtag', 'setConsent', update);
      });
    });
  }
}

// 4. Send the event. A Page View tag always sends (it may fire again on a
// single-page app route change). The checkbox sends one only when no page
// view has been sent on this page yet. The payload argument is left off when
// there are no parameters.
const payload = buildPayload(eventName);
if (eventName === PAGEVIEW_EVENT) {
  templateStorage.setItem('pageviewSent', true);
  if (payload) {
    callInWindow('rtag', 'pageview', payload);
  } else {
    callInWindow('rtag', 'pageview');
  }
} else {
  if (data.firePageView === true && !templateStorage.getItem('pageviewSent')) {
    templateStorage.setItem('pageviewSent', true);
    callInWindow('rtag', 'pageview');
  }
  if (payload) {
    callInWindow('rtag', 'track', eventName, payload);
  } else {
    callInWindow('rtag', 'track', eventName);
  }
}

// 5. Load the library once. If it is already on the page, the calls above
// went straight to it.
if (getType(copyFromWindow('rtag.track')) === 'function') {
  data.gtmOnSuccess();
} else {
  injectScript(SCRIPT_URL, data.gtmOnSuccess, () => {
    fail('Could not load ' + SCRIPT_URL + '.');
  }, SCRIPT_URL);
}


___WEB_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "logging",
        "versionId": "1"
      },
      "param": [
        {
          "key": "environments",
          "value": {
            "type": 1,
            "string": "debug"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "inject_script",
        "versionId": "1"
      },
      "param": [
        {
          "key": "urls",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 1,
                "string": "https://t.ad-reporting.net/r-tracker.js"
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_globals",
        "versionId": "1"
      },
      "param": [
        {
          "key": "keys",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "rtag"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "rtag.q"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "rtag.track"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_consent",
        "versionId": "1"
      },
      "param": [
        {
          "key": "consentTypes",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "ad_storage"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "ad_user_data"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "ad_personalization"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "analytics_storage"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_template_storage",
        "versionId": "1"
      },
      "param": []
    },
    "isRequired": true
  }
]


___TESTS___

scenarios:
- name: Sends the selected event, initializes once, and loads the script
  code: |-
    runCode({advertiserId: 'adv123', eventName: 'AddToCart', firePageView: false});

    assertApi('callInWindow').wasCalledWith('rtag', 'init', {advertiserId: 'adv123', autoPageview: false, debug: false});
    assertApi('callInWindow').wasCalledWith('rtag', 'track', 'AddToCart');
    assertApi('callInWindow').wasNotCalledWith('rtag', 'pageview');
    assertApi('injectScript').wasCalled();
    assertApi('gtmOnSuccess').wasCalled();
- name: Page View event sends a page view and no track call
  code: |-
    runCode({advertiserId: 'adv123', eventName: 'PageView'});

    assertApi('callInWindow').wasCalledWith('rtag', 'pageview');
    assertApi('callInWindow').wasNotCalledWith('rtag', 'track', 'PageView');
    assertApi('gtmOnSuccess').wasCalled();
- name: Checkbox sends a page view before the event
  code: |-
    runCode({advertiserId: 'adv123', eventName: 'Lead', firePageView: true});

    assertApi('callInWindow').wasCalledWith('rtag', 'pageview');
    assertApi('callInWindow').wasCalledWith('rtag', 'track', 'Lead');
- name: Checkbox does not send a second page view on the same page
  code: |-
    let pageviews = 0;
    mock('callInWindow', function(path, command) {
      if (command === 'pageview') pageviews++;
    });

    runCode({advertiserId: 'adv123', eventName: 'Lead', firePageView: true});
    runCode({advertiserId: 'adv123', eventName: 'AddToCart', firePageView: true});

    assertThat(pageviews).isEqualTo(1);
- name: Two tags on one page initialize once
  code: |-
    let inits = 0;
    mock('callInWindow', function(path, command) {
      if (command === 'init') inits++;
    });

    runCode({advertiserId: 'adv123', eventName: 'PageView'});
    runCode({advertiserId: 'adv123', eventName: 'Lead'});

    assertThat(inits).isEqualTo(1);
- name: Custom event sends the custom name
  code: |-
    runCode({advertiserId: 'adv123', eventName: '__custom__', customEventName: 'Quote Request'});

    assertApi('callInWindow').wasCalledWith('rtag', 'track', 'Quote Request');
    assertApi('gtmOnSuccess').wasCalled();
- name: Custom event with a forbidden character fails
  code: |-
    runCode({advertiserId: 'adv123', eventName: '__custom__', customEventName: 'Lead (form)'});

    assertApi('callInWindow').wasNotCalled();
    assertApi('injectScript').wasNotCalled();
    assertApi('gtmOnFailure').wasCalled();
- name: Missing Universal Ad Tag ID fails
  code: |-
    runCode({advertiserId: '', eventName: 'Lead'});

    assertApi('gtmOnFailure').wasCalled();
    assertApi('injectScript').wasNotCalled();
- name: Skips the script when the library is already loaded
  code: |-
    mock('copyFromWindow', function(key) {
      return function() {};
    });

    runCode({advertiserId: 'adv123', eventName: 'Lead'});

    assertApi('createArgumentsQueue').wasNotCalled();
    assertApi('injectScript').wasNotCalled();
    assertApi('gtmOnSuccess').wasCalled();
- name: Script load failure fails the tag
  code: |-
    mock('injectScript', function(url, onSuccess, onFailure) {
      onFailure();
    });

    runCode({advertiserId: 'adv123', eventName: 'Lead'});

    assertApi('gtmOnFailure').wasCalled();
    assertApi('gtmOnSuccess').wasNotCalled();
- name: Purchase sends isPurchase and parameters
  code: |-
    runCode({
      advertiserId: 'adv123',
      eventName: 'Purchase',
      value: '25.99',
      currencyCode: 'USD',
      unitsSold: '',
      customParameters: [{name: 'orderId', value: 'ABC123'}]
    });

    assertApi('callInWindow').wasCalledWith('rtag', 'track', 'Purchase', {isPurchase: true, value: '25.99', currencyCode: 'USD', orderId: 'ABC123'});
- name: Consent off does not read or pass consent
  code: |-
    runCode({advertiserId: 'adv123', eventName: 'Lead'});

    assertApi('isConsentGranted').wasNotCalled();
    assertApi('addConsentListener').wasNotCalled();
    assertApi('callInWindow').wasNotCalledWith('rtag', 'setConsent', {adStorage: 'denied', adUserData: 'granted', adPersonalization: 'granted', analyticsStorage: 'granted'});
- name: Consent on passes GTM consent and listens for changes
  code: |-
    mock('isConsentGranted', function(type) {
      return type !== 'ad_storage';
    });

    runCode({advertiserId: 'adv123', eventName: 'Lead', useGtmConsent: true});

    assertApi('callInWindow').wasCalledWith('rtag', 'setConsent', {adStorage: 'denied', adUserData: 'granted', adPersonalization: 'granted', analyticsStorage: 'granted'});
    assertApi('addConsentListener').wasCalled();
    assertApi('callInWindow').wasCalledWith('rtag', 'track', 'Lead');
setup: |-
  // GTM keeps templateStorage between tests, so give each test a fresh one.
  // It still persists across runCode calls within a test, like one page.
  const store = {};
  mockObject('templateStorage', {
    getItem: function(key) { return store[key]; },
    setItem: function(key, value) { store[key] = value; },
    removeItem: function(key) { store[key] = undefined; },
    clear: function() {}
  });
  mock('callInWindow', function() {});
  mock('addConsentListener', function() {});
  mock('createArgumentsQueue', function() {});
  mock('copyFromWindow', function() {
    return undefined;
  });
  mock('injectScript', function(url, onSuccess) {
    onSuccess();
  });


___NOTES___

Generated for REP-1086. Edit the display name, description, and script URL in
template.config.json, then run `npm run apply-config`.
