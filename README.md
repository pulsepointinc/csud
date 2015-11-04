# csud #

A device-side visitor matching library meant to improve AdTech visitor matching.

## Overview ##
This library works by including a document provided by a partner cookie domain for each match partner in ad markup before triggering an auction.  The included document allows the DSP to generate user data from cookies, localStorage, and any other available information available at request time.  The user data is then passed directly to the DSP as part of an RTB bid request.  In effect, this allows DSPs access to user browsers through RTB requests.

![Workflow](http://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgQ1NVRCByZWFsdGltZSB3b3JrZmxvdwoKQnJvd3Nlci0-UHVibGlzaGVyOiBHRVQgQ29udGVudAphY3RpdmF0ZSAAFwkKACEJLT4ANwc6ACcIIHdpdGggU1NQIGFkIG1hcmt1cApkZQAxE2xvb3AgRm9yIEVhY2ggRFNQIGluIGF1Y3Rpb24gKGluIHBhcmFsbGVsKQogAIEaCURTUDogR2V0IFVzZXIgRGF0YSBQcm92aWRlcgogAIEgCURTUAogbm90ZSBvdmVyADYILACBNwosRFNQCgA-BWRhdGEgcAA8ByBjb2RlIGlzIAoqIGV4ZWN1dGVkIG9uIHRoAE8FIGRvbWFpbgoqIHNob3VsZCBiZSBjYWNoZWQgaW5kZWZpbmV0bHkAKQhiAIJRBgoqIHRoaXMgcmVxdWVzdAAzCG9ubHkgaGFwcGVuIG9uY2UgcGVyIHVzZXIKIGVuZACBOAUKIERTUACCVgsAgWESIChqcykgCiAAglULRFNQCmVuZACDSwpTAIItBUVUIEFkAINAClNTUACCVCxTU1AAgnQHT3BlblJUQiBiaWQAgUkJAINsBXUAgkUICgCCbgpEU1AsU1NQCgAiE3MgY29udGFpbgAuC2dlbmVyYXRlZCBieQCCeAdpbmcAg1YUAIMhBgCCWQ4Agi0JAIN5DQCCPQUAgX4FAIEvCwCFBAwAgigIAIFeBQCFQwlBZCBNAIU1Bg&s=qsd)

This project aims for the following goals:

* **Real Time user data synchronization**
    * Unlike traditional visitor matching, csud should be able to provide user data in-band with ad-serving.
* **Ease of use**
    * csud should be easy to set up - from a DSP's perspective, all that should be needed is to place a single html file on a web server on the DSP's cookie domain
* **Performance**
    * unlike traditional or alternative visitor matching schemes, csud aims to use browser cache to cache code used by DSPs to read/generate user identifier information.  This should reduce redirect-heavy visitor matching traffic to a single-request-per-user-per-year
* **Security**
    * code executed by DSPs in order to provide user data should run in a sandbox and not allow unwanted access to publisher documents.
    * code executed by DSPs should provide only that user data to an SSP which the DSP finds relevant.
* **Scalability**
    * Organizations should own their own user data; since csud does not require SSPs to store visitor identifiers in SSP-domain cookies, DSPs can use practically any amount of user storage (cookie, localStorage space, or offline space) for user data.

This project is set up as a node ```module``` and can either be imported directly into a project built with node *or* simply added to any HTML document via a ```<script>``` tag.

## API ##

There are two components to this library - an SSP component that loads user data from user data providers, and a DSP component that listens for and replies to user data requests.

### SSP ###

The SSP API that loads user data from any number of user data providers is implemented via [UserDataLoader.js](lib/UserDataLoader.js).

#### Usage ####
[UserDataLoader.js](lib/UserDataLoader.js) is a javascript function that needs to be instantiated before it is used:
```
var udl = new UserDataLoader();
```

There are two functions for obtaining user data from a DSP partner at a differnt domain:

##### UserDataLoader.loadUserData(request) #####
This function loads user data from a single user data provider.  This function accepts a single argument called ```request``` that should have the following properties:
* **url** {string}
    * mandatory URL of html page running {@link UserDataProvider.js}
* **responseHandler** {function}
    * mandatory node-compatible response handler function (function(error,result)); results are Objects containing a mandatory "id":{string} property
* **timeout** {number}
    * optional timeout in milliseconds; timeouts will result in 'timeout' errors
* **payload** {object}
    * optional payload to send along with a user data request

Example usage:
```
var udl = new UserDataLoader().loadUserData({
   url: 'http://bidder.com/csud/userDataProvider.html',
   timeout: 75,
   responseHandler: function(error, result){
       if(error){
           throw new Error('Could not get user data from bidder:' + error);
       }
       var bidderUserId = result.id;
       ...
   }     
});
```

##### UserDataLoader.loadAllUserData(request) #####
This function loads user data from multiple user data providers.  This function accepts a single argument called ```request``` that should contain the following properties:

* **timeout** {number}
    * mandatory timeout in milliseconds; timeouts will result in 'timeout' errors</li>
* **partners** {object}
    * mandatory object containing partner objects with the following properties:
        * **url** {string} 
        * **timeout** {number}
            * optional partner-specific timeout in milliseconds that overrides global timeout
* **responseHandler**
    * mandatory node-compatible response handler function (function(error,result)); results is an object with keys representing partner names from the partners object and values containing either "result" Object properties or "error" strings

Example usage:
```
var udl = new UserDataLoader().loadAllUserData({
   timeout: 100,
   partners: {
       'dsp-a': { url: '//dsp-a.com/csud/userDataProvider.html' },
       'dsp-b': { url: '//dsp-b.com/csud/udp.html'}
   },   
   responseHandler: function(error, results){
       if(error){
           throw new Error('Could not get user data from any partners:' + error);
       }
       if(!results['dsp-a'].error){
           var dspAuserData = results['dsp-a'].result,
               dspAuserId = dspAuserData.id;
           ...
       }
       ...
   }     
});
```

#### Using as part of a node project ####
This is the preferred method of importing UserDataLoader into a project.  csum uses npm for dependency management; place the below into package.json to import the project:
```
...
"dependencies": {
    "csud": "git+ssh://git@github.com:pulsepointinc/csud.git#1.0.5"
  }
...
```
alternatively, run:
```
npm install git+ssh://git@github.com:pulsepointinc/csud.git#1.0.5
```
require ```UserDataLoader``` inside of your node project using:
```
var UserDataLoader = require('csud').UserDataLoader;
```

#### Importing directly #####
http://csud.contextweb.com/csud/1.0.3/userDataLoader.js can be loaded directly inside a script tag; this will place [UserDataLoader.js](lib/UserDataLoader.js) into the global scope as ```UserDataLoader```.  Direct script includes are potentially slower and harder to test than purpose-built distributions; consider building a browserify/requirejs/amd bundle instead!

Example User Data Loader implementation using direct script include:
```
<html>
    <head>
        <script src="http://csud.contextweb.com/csud/1.0.3/userDataLoader.js"></script>
        <script>
            var udl = new UserDataLoader();
            udl.loadAllUserData({
                timeout: 250,
                partners: {
                    'dsp-a': {
                        url: 'http://pixel.dsp-a.com/csud/user-data-provider.html'
                    }
                },
                responseHandler: function(error, results){
                    var dspAuserId = results['dsp-a'].result.id;
                    ...
                }
            });
        </script>
    </head>
    <body>
    </body>
</html>
```

### DSP ###

The DSP API that 'listens' for user data requests and replies with user data is implemented via [UserDataProvider.js](lib/UserDataProvider.js).

#### Usage ####

[UserDataProvider.js](lib/UserDataProvider.js) is a javascript function that needs to be instantiated before it is used:
```
var udp = new UserDataProvider();
```

There is a single ```UserDataProvider.listen(requestHandler)``` function that is used for registering a user data request handler.

The supplied handler will be invoked with two arguments:
* A request - currently unused
* A callback function - a node-compliant callback function (function(error,result))

The handler is expected to either
* Immediately return user data
* Eventually return user data by invoking the callback function

The handler may also throw an error or report an error by calling the callback function with the first argument representing the error (```callback('my-error')```).
     
Returned user data must be a JSON object that 
* contains a mandatory "id":{string} property
* contains an optional "ext":{object} property
     
```{id:'my-org-user-id'}``` and ```{id:'123',ext:{fcap:3}}``` are examples of valid user data.

Example usage:

```
new UserDataProvider().listen(function(request,callback){
    callback(null, {
       id: 'my-org-user-id',
       ext: {
           fcap: 0
       }
    });    
});
```
or

```
new UserDataProvider().listen(function(request,callback){
   return {
       id: 'my-org-user-id',
       ext: {
           fcap: 0
       }
   };    
});
```

Since this code is to execute inside a document on a DSP domain, user data can be obtained directly from cookies, local storage, or generated by a server.

See [csud-dsp-getintent](https://github.com/pulsepointinc/csud-dsp-getinent) for an example UserDataProvider implementation.

#### Using as part of a node project ####
This is the preferred method of building UserDataProvider implementations.  csum uses npm for dependency management; place the below into package.json to import the project:
```
...
"dependencies": {
    "csud": "git+ssh://git@github.com:pulsepointinc/csud.git#1.0.5"
  }
...
```
alternatively, run:
```
npm install git+ssh://git@github.com:pulsepointinc/csud.git#1.0.5
```
require ```UserDataProvider``` inside of your node project using:
```
var UserDataProvider = require('csud').UserDataProvider;
```

#### Importing directly #####

http://csud.contextweb.com/csud/1.0.3/userDataProvider.js can be loaded directly inside a script tag; this will place [UserDataProvider.js](lib/UserDataProvider.js) into the global scope as ```UserDataProvider```.  Direct script includes are potentially slower and harder to test than purpose-built distributions; consider building a browserify/requirejs/amd bundle instead!

Example User Data Loader implementation using direct script include:
```
<html>
    <head>
        <script src="http://csud.contextweb.com/csud/1.0.3/userDataProvider.js"></script>
        <script>
            new UserDataProvider().listen(function(message,callback){
                return ...;
            });
        </script>
    </head>
    <body>
    </body>
</html>

```
The ```...``` placeholder in the example above can be replaced with javascript code to obtain and return a user id.  See the DSP API notes above for more detailed instructions.

Note that http://csud.contextweb.com/csud/1.0.3/userDataProvider.js bundles a JSONv3 polyfill; users should *not* rely on this bundle providing a JSON polyfill since support can be removed in future releases.

#### Recommendations ####
The html file containing the UserDataProvider distribution package needs to be loaded as fast as possible; since there are no server side dependencies it should also be heavily cached.  To this end,it:
* *must* be placed on the cookie domain used for browser cookies set by the DSP
* should be placed behind a CDN for global distribution
* should be placed on a server which will return appropriate P3P headers (e.g. ```CP="NOI DSP COR NID CURa DEVa PSAa OUR BUS COM NAV INT"```)
* should be configured for maximum caching and minimal or no re-validation:
    * Both ```Cache-Control``` (with max-age) and ```Expires``` headers should be set
    * To minimize/turn-off re-validation, *no* ```Last-Modified``` or ```ETag``` header should beset

An example ```apache``` configuration (one may place this in ```.htaccess```) for a backend server to do the above:
```
#Enable and set Expires header
ExpiresActive On
ExpiresDefault "access plus 12 hours"
#Overwrite Cache-Control header
Header set Cache-Control "max-age=43200"
#Remote Etag and Last-Modified headers
Header unset Etag
Header unset Last-Modified
#Set P3P header
Header set P3P 'CP="NOI DSP COR NID CURa DEVa PSAa OUR BUS COM NAV INT"'
```

## Building and Testing ##
csud is distributed as a node module and can be built and tested locally using npm.  This package uses
* [NPM](https://www.npmjs.com/) for dependency management
* [Gulp](http://gulpjs.com/) for build configuration
* [Browserify](http://browserify.org/), [Uglify](https://github.com/mishoo/UglifyJS) for generating bundles
* [Mocha](https://mochajs.org/) for testing
* [Proclaim](https://github.com/rowanmanning/proclaim) for asserts
* [Karma](http://karma-runner.github.io/0.13/index.html) for TDD/execution tests
* [jshint](http://jshint.com/) for static analysis

### Pre-Requisites ###
* Node + NPM 

### Bootstrapping ###
``` npm install ```

### Testing ###
``` npm run test ```

### Building packages ###
``` npm run dist ```

### Releasing ###
``` npm run release ```

### Static testing ###
The 'dist' task creates a 'test' directory under ```dist/``` which contains a file called ```mocha-tests.html```.  This file can be loaded in any browser to run mocha tests.  Static testing is employed by this project because Karma runners for older browsers such as IE6 are either unavailable or do not work via sebdriver server farms such as [CrossbrowserTesting](http://crossbrowsertesting.com/) or [SauceLabs](https://saucelabs.com/).

### Testing via CrossBrowserTesting.com ###
On top of static testing, Karma can run tests via CrossBrowserTesting.com.  To do so, 

* Select desired browsers/devices by editing [gulpfile.js](gulpfile.js)
* Update environment variables
    * ```CBT_USERNAME``` - CBT username
    * ```CBT_API_KEY``` - CBT API key
* Run ``` npm run test -- --cbt ```

## Browser Compatibility ##
This library should be compatible with all modern desktop and mobile browsers including IE6.  See [here](http://app.crossbrowsertesting.com/public/ia308be7f44bd4a2/screenshots/z8a2b96d946934b66949) for per-browser test results.

## Technical notes ##

### Implementation details ###
This package prefers to use the well-supported HTML5 [window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API to communicate between the ```UserDataLoader``` and ```UserDataProvider```s.  To reduce latency, the first message (representing a user data request) is sent by ```UserDataLoader```s by encoding the message in the URL of the HTML document enclosing a ```UserDataProvider``` implementation.  

*All* messages are always JSON encoded.  For compatibility reasons, ```window.postMessage``` payload data is encoded into a String (not all browsers support passing object payload data).

In order to support older browsers, the http://csud.contextweb.com/csud/1.0.3/userDataProvider.js and http://csud.contextweb.com/csud/1.0.3/userDataLoader.js distribution packages bundle [JSON3](https://bestiejs.github.io/json3/).  Users should *not* rely on this polyfill though since it may be removed from the distribution bundles in fugure releases.

At the moment, user data request payloads are empty - user data request messages simply serve to represent a single request for user data.  In the future, the API allows the SSP to communicate its own user data as part of the user data request.  One example of such user data might be pre-auction information the SSP wants to share with a DSP such as SSP user identifiers, user demographic information, and user frequency habits.  This type of information is typically available as part of server-server RTB requests, but can potentially be used to short-circuit auctions in the future.

### Alternatives to iframes ###
Several alternative visitor matching schemes (like Criteo's RTUS) use JSONP instead of the iframe-per-partner approach taken by VM2 to implement similar functionality.  Like partner iframes used by VM@, JSONP can be cached on user browsers, reducing the amount of network requests necessary to obtain user data.  Unlike partner iframes though,

* JSONP can't be used to read cookies from the domain the JSONP javascript is served from.  This means a 100% client-side solution isn't possible.  A webserver is required to process requests, read/write cookies, and create JSONP responses.
* JSONP is less secure in that it gives partners (DSPs) the ability to execute arbitrary javascript directly within the calling document (in some cases, a publisher page) at match time.

## Comparison to traditional visitor matching ##
See http://docs.pulse.corp/display/~ERachitskiy/Better+visitor+matching for a higher level discussion of CSUD.