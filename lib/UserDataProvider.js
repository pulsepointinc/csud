window.JSON = window.JSON || require('json3');
/**
 * A User Data Provider API that partners wishing to participate in CSUD can use to send user data.
 * In order to send back some user data, users should instantiate a new instance of this function
 * and use the #listen method to listen for user data requests, replying with a JSON object that 
 * contains a mandatory "id":{string} property and optional "ext":{object} property either through
 * a callback or by simply returning the object:
 *
 * <pre><code>
 *  new UserDataProvider().listen(function(request,callback){
 *      callback(null, {
 *          id: 'my-org-user-id',
 *          ext: {
 *              fcap: 0
 *          }
 *      });    
 *  });
 * </code></pre>
 *
 * or
 *
 * <pre><code>
 *  new UserDataProvider().listen(function(request,callback){
 *      return {
 *          id: 'my-org-user-id',
 *          ext: {
 *              fcap: 0
 *          }
 *      };    
 *  });
 * </code></pre>
 * 
 * The 'request' parameter is currently unused, but might contain relevant information in the
 * future.
 *
 * @constructor
 */
var UserDataProvider = function(){};
UserDataProvider.prototype = {
    /**
     * Check whether browser has window.postMessage support
     * @returns {Boolean} true if browser has window.postMessage support
     */
    hasPostMessage: function hasPostMessage(){
        return window.postMessage ? true: false;
    },
    /**
     * Parse and return an incoming request 
     * @returns {Object} incoming request; should always contain an "id" property
     */
    parseRequest: function parseRequest(){
        return JSON.parse(unescape(window.location.href.split("#")[1]));
    },
    /**
     * Listen for incoming user data requests and invoke the supplied handler function to process them.
     * The supplied handler will be invoked with two arguments:
     * <li>A request - currently unused</li>
     * <li>A callback function - a node-compliant callback function (function(error,result))
     * The handler is expected to either
     * <li>Immediately return user data</li>
     * <li>Eventually return user data by invoking the callback function</li>
     * The handler may also throw an error or report an error by calling the callback function with the
     * first argument representing the error (callback('my-error')).
     *
     * User data must be a JSON object that 
     * <li>contains a mandatory "id":{string} property</li>
     * <li>contains an optional "ext":{object} property</li>
     *
     * <pre><code>{id:'my-org-user-id'}</code></pre> and <pre><code>{id:'123',ext:{fcap:3}}</code></pre>
     * are examples of valid user data.
     *
     * Example usage:
     *
     * <pre><code>
     *  new UserDataProvider().listen(function(request,callback){
     *      callback(null, {
     *          id: 'my-org-user-id',
     *          ext: {
     *              fcap: 0
     *          }
     *      });    
     *  });
     * </code></pre>
     *
     * <pre><code>
     *  new UserDataProvider().listen(function(request,callback){
     *      return {
     *          id: 'my-org-user-id',
     *          ext: {
     *              fcap: 0
     *          }
     *      };    
     *  });
     * </code></pre>
     *
     * @callback handler function
     * @param {Object} request - currently unused
     * @param {function} a node-compliant callback handler (function(error,result))
     */
    listen: function listen(handler){
        try{
            /* parse request */
            var me = this,
                request = me.parseRequest(),
                /* make a user data callback*/
                userDataCallback = function (error, result){
                    try{
                        if(error){
                            if(error.message){
                                error = error.message;
                            }else{
                                error = 'General Error';
                            }
                        }
                        var payload = JSON.stringify({error:error,result:result,id:request.id});
                        if(me.hasPostMessage()){
                            window.parent.postMessage(payload,'*');
                        }else{
                            window.name = payload;
                            var udlHost = document.referrer.split('/')[2];
                            window.location.href = '//' + udlHost + '/favicon.ico';
                        }
                    }catch(e){
                        /* swallow */
                    }
                };
            /* call handler */
            var syncResult;
            try{
                syncResult = handler(request.payload,userDataCallback);
            }catch(e){
                userDataCallback(e);
                return;
            }
            if(syncResult !== undefined && syncResult !== null){
                userDataCallback(null,syncResult);
            }
        } catch (listenSetupError) {
            /* swallow */
        }
    }
};
module.exports = UserDataProvider;