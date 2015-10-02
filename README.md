# csud #

A device-side visitor matching library meant to improve AdTech visitor matching.

This library works by including a document provided by a partner cookie domain for each match partner in ad markup before triggering an auction.  The included document allows the DSP to generate user data from cookies, localStorage, and any other available information available at request time.  The user data is then passed directly to the DSP as part of an RTB bid request.  In effect, this allows DSPs access to user browsers through RTB requests.

## Alternatives to iframes ##
Several alternative visitor matching schemes (like Criteo's RTUS) use JSONP instead of the iframe-per-partner approach taken by VM2 to implement similar functionality.  Like partner iframes used by VM@, JSONP can be cached on user browsers, reducing the amount of network requests necessary to obtain user data.  Unlike partner iframes though,

* JSONP can't be used to read cookies from the domain the JSONP javascript is served from.  This means a 100% client-side solution isn't possible.  A webserver is required to process requests, read/write cookies, and create JSONP responses.
* JSONP is less secure in that it gives partners (DSPs) the ability to execute arbitrary javascript directly within the calling document (in some cases, a publisher page) at match time.