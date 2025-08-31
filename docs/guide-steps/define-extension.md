# Define your Chrome Extension

You'll need a `manifest.json` file that follows Chrome's [manifest format](https://developer.chrome.com/docs/extensions/reference/manifest).

Your manifest will define:

* A [`background`](https://developer.chrome.com/docs/extensions/reference/manifest/background) service worker
  * This component handles external messages and does the work needed to compute responses
* An [`externally_connectable`](https://developer.chrome.com/docs/extensions/reference/manifest/externally-connectable) property
  * This allows the `ScryHub` extension to talk to your extension
  * You should allowlist the extension id for `ScryHub` which you can find on the main README of the extension
* A [`host_permissions`](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions) declaration
  * This should have the hosts for the site you are providing information for, your extension will try to get data from this host

Your manifest would look something like this:

```json
{
    "manifest_version": 3,
    "name": "ScryHub LGS Library Sample",
    "version": "0.1.0",
    "description": "Provides LGS lookups to ScryHub.",
    "host_permissions": [
        "https://*.examplelgs.com/*"
    ],
    "background": {
        "service_worker": "background.js"
    },
    "externally_connectable": {
        "ids": [
            "edmpemfmkcgplhmgbnhchnfmmfaefdli"
        ]
    }
}
```