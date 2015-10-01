var JSON3 = require("json3");
var UserDataLoader = function UserDataLoader(){
    this.iframes = {};
    this.init();
};
UserDataLoader.counter = 0;
UserDataLoader.prototype = {
    handleResponse: function handleResponse(payload){
        var iframe = this.iframes[payload.id];
        iframe.handleResponse(payload.error,payload.result);
        delete this.iframes[payload.id];
        iframe.parentNode.removeChild(iframe);
    },
    init: function init(){
        var me = this;
        if(me.hasPostMessage()){
            window.addEventListener('message', function(event) {
                me.handleResponse(JSON3.parse(event.data));
            });
        }
    },
    hasPostMessage: function hasPostMessage(){
        return window.postMessage ? true: false;
    },
    loadUserData: function loadUserData(request){
        var me = this,
            id = UserDataLoader.counter++,
            message = JSON3.stringify({
                id: id,
                payload: request.payload
            }),
            iframe = document.createElement('iframe');
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.display = 'none';
        iframe.handleResponse = request.responseHandler;
        this.iframes[id] = iframe;
        if(request.timeout){
            setTimeout(function(){
                me.handleResponse({error:'timeout',id:id});
            },request.timeout);
        }
        iframe.src = request.url + '#' + message;
        if(!this.hasPostMessage()){
            var onload = function () {
                if(iframe.contentWindow.name){
                    me.handleResponse(JSON3.parse(iframe.contentWindow.name));
                }
            };
            iframe.onload = onload;
            if(iframe.attachEvent){
                iframe.attachEvent('onload',onload);
            }
        }
        /* TODO - failfast on error ?*/
        document.body.appendChild(iframe);
    }
};
module.exports = UserDataLoader;
