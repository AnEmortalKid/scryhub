# Extension Guide

Steps for making your own extension.

Your extension (`LGSLibrary`) is a separate Chrome Extension that ScryHub talks to via core-extension messaging.

You must support the following message types:

* `scryhub.library.protocolCheck` - return what version of the `protocol` you support
* `scryhub.library.listStores` - return all stores you can get info for
* `scryhub.library.lookupCard` - given a store and card search, return a product result

At a high level, here's the steps we will take:

1. [Define your chrome extension](./define-extension.md)
1. [Implement the Check Protocol message handling](./check-protocol-msg.md)
1. [Implement the List Stores message handling](./list-stores-msg.md)
1. [Implement the Lookup card message handling](./lookup-card-msg.md)
1. [Hooking up our extension to `ScryHub`](./connect-to-scryhub.md)
