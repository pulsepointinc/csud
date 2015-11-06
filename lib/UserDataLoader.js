window.JSON = window.JSON || require('json3');
/**
 * A User Data Loader API that can load user data from any provider using the {@link UserDataProvider.js}
 * API to expose user data.
 * 
 * This function has a prototype that exposes two methods for loading user data:
 * <li>loadUserData(request) - get user data from a single provider</li>
 * <li>loadAllUserData(request) - get user data from a collection of providers in parallel</li>
 *
 * Example usage:
 * <pre><code>
 *  var udl =new UserDataLoader().loadUserData({
 *      url: 'http://bidder.com/csud/userDataProvider.html',
 *      timeout: 75,
 *      responseHandler: function(error, result){
 *          if(error){
 *              throw new Error('Could not get user data from bidder:' + error);
 *          }
 *          var bidderUserId = result.id;
 *          ...
 *      }     
 *  });
 * </code></pre>
 *
 * <pre><code>
 *  var udl = new UserDataLoader().loadAllUserData({
 *      timeout: 100,
 *      partners: {
 *          'dbm': { url: '//dbm.com/csud/userDataProvider.html' },
 *          'iponweb': { url: '//bidswitch.com/csud/udp.html'}
 *      },   
 *      responseHandler: function(error, results){
 *          if(error){
 *              throw new Error('Could not get user data from any partners:' + error);
 *          }
 *          if(!results['dbm'].error){
 *              var dbmUserData = results['dbm'].result,
 *                  dbmUserId = dbmUserData.id;
 *              ...
 *          }
 *          ...
 *      }     
 *  });
 * </code></pre>
 *
 * @constructor
 */
var UserDataLoader = function UserDataLoader(){
    /* initialize a collection of iframes used for user data requests at any moment in time */
    this.iframes = {};
    /* initialize any relevant listensers */
    this.init();
};
/**
 * A global counter used for generating message identifiers
 */
UserDataLoader.counter = 0;
UserDataLoader.prototype = {
    /**
     * Handle a user data response payload by
     * <li>invoking the requested response handler</li>
     * <li>clearing any set timeouts for request</li>
     * <li>removing iframe related to request from iframes object</li>
     * <li>removing iframe related to request from the DOM</li>
     *
     * @param {Object} payload object - must contain an "id" property and either a "result" or "error"
     */
    handleResponse: function handleResponse(payload){
        if(payload && payload.id){
            var iframe = this.iframes[payload.id];
            if(iframe){
                try{
                    iframe.handleResponse(payload.error,payload.result);
                }catch(clientHandlerExecutionError){
                    /*ignore*/
                }
                try{
                    clearTimeout(iframe.timeoutFn);
                }catch(timeoutClearError){
                    /* ignore */
                }
                delete this.iframes[payload.id];
                this.removeDomElement(iframe);
            }
        }
    },
    /**
     * Initialize any relevant event listeners
     */
    init: function init(){
        var me = this;
        if(me.hasPostMessage()){
            me.windowEventListener = function(event) {
                try{
                    me.handleResponse(JSON.parse(event.data));
                }catch(handlerError){
                    /*ignore*/
                }
            };
            if(window.addEventListener){
                window.addEventListener('message', me.windowEventListener);
            }else{
                window.attachEvent('onmessage', me.windowEventListener);
            }
        }
    },
    /**
     * Check whether browser has window.postMessage support
     * @returns {Boolean} true if browser has window.postMessage support
     */
    hasPostMessage: function hasPostMessage(){
        return window.postMessage ? true: false;
    },
    /**
     * Load user data from a single csud partner.  Expects a request object that contains the following
     * properties:
     * <li>url {string}
     *      - mandatory URL of html page running {@link UserDataProvider.js}</li>
     * <li>responseHandler {function}
     *      - mandatory node-compatible response handler function (function(error,result)); results
     *        are Objects containing a mandatory "id":{string} property</li>
     * <li>timeout {number}
     *      - optional timeout in milliseconds; timeouts will result in 'timeout' errors</li>
     * <li>payload {object}
     *      - optional payload to send along with a user data request</li>
     *
     * Example usage:
     * <pre><code>
     *  var udl = new UserDataLoader().loadUserData({
     *      url: 'http://bidder.com/csud/userDataProvider.html',
     *      timeout: 75,
     *      responseHandler: function(error, result){
     *          if(error){
     *              throw new Error('Could not get user data from bidder:' + error);
     *          }
     *          var bidderUserId = result.id;
     *          ...
     *      }     
     *  });
     * </code></pre> 
     *
     * Example responseHandler result:
     * <pre><code>
     * {
     *   id: 'mandatory-user-id',
     *   ext: {
     *      opt: 'optional extra data'
     *   }
     * }
     * </code></pre>
     *
     * @param {object} request - a request containing url,responseHandler,timeout, and payload properties
     * @return {function} this
     */
    loadUserData: function loadUserData(request){
        var me = this,
            id = ++UserDataLoader.counter,
            message = escape(JSON.stringify({
                id: id,
                payload: request.payload
            })),
            iframe = document.createElement('iframe');
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.display = 'none';
        iframe.handleResponse = request.responseHandler;
        this.iframes[id] = iframe;
        if(request.timeout){
            iframe.timeoutFn = setTimeout(function(){
                me.handleResponse({error:'timeout',id:id});
            },request.timeout);
        }
        iframe.src = request.url + '#' + message;
        if(!this.hasPostMessage()){
            var onload = function () {
                try{
                    if(iframe.contentWindow.name){
                        me.handleResponse(JSON.parse(iframe.contentWindow.name));
                    }
                }catch(couldNotAccessWindowName){
                    /* ignore */
                    iframe.onload = onload;
                }
            };
            var onerror = function () {
                /* ignore */ 
                /* TODO: consider failfast */
            };
            iframe.onload = onload;
            iframe.onerror = onerror;
            if(iframe.attachEvent){
                iframe.attachEvent('onload',onload);
                iframe.attachEvent('onerror',onerror);
            }
        }
        document.body.appendChild(iframe);
        return this;
    },
    /**
     * Load user data from a multiple csud partners.  Expects a request object that contains the following
     * properties:
     * <li>timeout {number}
     *      - mandatory timeout in milliseconds; timeouts will result in 'timeout' errors</li>
     * <li>partners {object}
     *      - mandatory object containing partner objects with url {string}, optional timeout {number},
     *        optional payload {object} properties (e.g. {url:'http://...',timeout:130,payload:{}})
     *        timeouts specified by-partner take priority over global timeout for all requests.
     * <li>responseHandler {function}
     *      - mandatory node-compatible response handler function (function(error,result)); results
     *        is an object with a 'partnerResponses' property which is an object with keys representing partner 
     *        names from the partners object and values containing either "result" Object properties 
     *        or "error" strings</li>
     *
     * Example usage:
     * <pre><code>
     *  var udl = new UserDataLoader().loadAllUserData({
     *      timeout: 100,
     *      partners: {
     *          'dbm': { url: '//dbm.com/csud/userDataProvider.html' },
     *          'iponweb': { url: '//bidswitch.com/csud/udp.html'}
     *      },   
     *      responseHandler: function(error, results){
     *          if(error){
     *              throw new Error('Could not get user data from any partners:' + error);
     *          }
     *          var totalResponseTime = results.rtime,
     *              partnerResponses = results.partnerResponses;
     *
     *          if(!partnerResponses['dbm'].error){
     *              var dbmUserData = partnerResponses['dbm'].result,
     *                  dbmUserId = dbmUserData.id;
     *              ...
     *          }
     *          ...
     *      }     
     *  });
     * </code></pre>
     * 
     * Example responseHandler results:
     * <pre><code>
     * {
     *   partnerResponses: {
     *     'test-dsp': {
     *       result: {
     *         id: 'test-dsp-user-id',
     *         ext: {}
     *       },
     *       rtime: 14
     *     },
     *     'another-partner': {
     *       error: 'timeout',
     *       rtime: 25
     *     }
     *   },
     *   rtime: 26
     * }
     * </code></pre> 
     *
     * @param {object} request - a request containing timeout,responseHandler, and partner properties
     * @return {function} this
     */
    loadAllUserData: function loadAllUserData(request){
        var results = {},
            requestStartMs = new Date().getTime(),
            outstandingRequests = 1,
            completionHandler = function(){
                if(--outstandingRequests === 0){
                    /* all requests completed */
                    request.responseHandler(undefined,{
                        rtime: new Date().getTime() - requestStartMs,
                        partnerResponses: results
                    });
                }
            },
            createHandler = function(partnerId){
                return function(error,result){
                    var partnerResult = {};
                    if(error){
                        partnerResult.error = error;
                    }
                    if(result){
                        partnerResult.result = result;
                    }
                    partnerResult.rtime = new Date().getTime() - requestStartMs;
                    results[partnerId] = partnerResult;
                    completionHandler();
                };
            };
        for(var partnerId in request.partners){
            var partnerConfig = request.partners[partnerId];
            outstandingRequests++;
            this.loadUserData({
                url: partnerConfig.url,
                timeout: partnerConfig.timeout || request.timeout,
                payload: partnerConfig.payload,
                responseHandler: createHandler(partnerId)
            });
        }
        completionHandler();
    },
    /**
     * Close this UserDataLoader, cleaning up any iframes and event listeners created during
     * the UseerDataLoader's lifetime
     */
    close: function close(){
        if(this.windowEventListener){
            if(window.removeEventListener){
                window.removeEventListener('message', this.windowEventListener);
            }else{
                window.detachEvent('message', this.windowEventListener);
            }
        }
        for(var id in this.iframes){
            var iframe = this.iframes[id];
            delete this.iframes[id];
            this.removeDomElement(iframe);
        }
    },
    /**
     * Remove a DOM element from the document
     */
    removeDomElement: function removeDomElement(domElement){
        try{
            if(domElement && domElement.parentNode){
                domElement.parentNode.removeChild(domElement);
            }
        }catch(domRemovalError){
            /* ignore */
        }
    }
};
module.exports = UserDataLoader;
