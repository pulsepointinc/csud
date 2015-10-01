var JSON3 = require("json3");
var UserDataProvider = function(){};
UserDataProvider.prototype = {
    hasPostMessage: function hasPostMessage(){
        return window.postMessage ? true: false;
    },
    parseRequest: function parseRequest(){
        return JSON3.parse(window.location.href.split("#")[1]);
    },
    listen: function listen(handler){
        try{
            /* parse request */
            var me = this,
                request = me.parseRequest(),
                /* make a user data callback*/
                userDataCallback = function (error, result){
                    try{
                        var payload = JSON3.stringify({error:error,result:result,id:request.id});
                        if(me.hasPostMessage()){
                            window.parent.postMessage(payload,'*');
                        }else{
                            window.name = payload;
                            //window.location.href = request.redirectPage;
                            window.location.href = 'about:blank';
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
                userDataCallback(e.message);
                return;
            }
            if(syncResult !== undefined && syncResult !== null){
                userDataCallback(null,syncResult);
            }
        } catch (e) {
            /* swallow */
        }
    }
};
module.exports = UserDataProvider;