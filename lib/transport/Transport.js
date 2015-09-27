var Target = function Target(url){
    this.queue = [];
    this.init(url);
};
Target.prototype = {
    init: function init(url){
        var me = this, iframe = document.createElement('iframe');
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.display = 'none';
        iframe.onload = function () {
            me.contentWindow = iframe.contentWindow || iframe;
            while(me.queue.length > 0){
                me.send(me.queue.shift());
            }
        };
        iframe.src = url;
        document.body.appendChild(iframe);
        me.iframe = iframe;
    },
    send: function send(message){
        if(this.contentWindow){
            this.contentWindow.postMessage(message,'*');
        }else{
            this.queue.push(message);
        }
    },
    close: function close(){
        if(this.iframe){
            try{
                this.iframe.parentNode.removeChild(this.iframe);
            }catch(ignore){

            }
        }
    }
};
var Client = function Client(){
    this.id = 0;
    this.responseHandlers = {};
    this.targets = {};
    this.init();
    Client.instanceCount = Client.instanceCount+1;
};
Client.instanceCount = 0;
Client.prototype = {
    init: function init(){
        var me = this;
        window.addEventListener('message', function(event) {
            try{
                var message = JSON.parse(event.data),
                    responseHandler = me.responseHandlers[message.id];

                // /*UGHHH>> HACK */
                // if(message.action === 'loaded'){
                //     //alert("hahaha - "+message.url + ' - ' + me.targets[message.url]);
                //     me.targets[message.url].iframe.onload();
                //     //alert("hahaha");
                // }
                if(responseHandler){
                    delete me.responseHandlers[message.id];
                    responseHandler(message.error,message.response);
                }
            } catch(e) {
                /* ignore */
            }
        });
    },
    getTarget: function getTarget(url){
        var target = this.targets[url];
        if(!target){
            target = new Target(url);
            this.targets[url] = target;
        }
        return target;
    },
    sendMessage: function sendMessage(message,responseHandler) {
        var me = this, id = Client.instanceCount + '-' + me.id++;
        me.responseHandlers[id] = responseHandler;
        if(message.timeout){
            setTimeout(function(){
                delete me.responseHandlers[id];
                responseHandler(new Error('Timed out after '+message.timeout+'ms'));
            },message.timeout);
        }
        this.getTarget(message.url).send(JSON.stringify({
            id: id,
            payload: message.payload
        }));
    },
    close: function close(){
        for(var url in this.targets){
            this.targets[url].close();
        }
    }
};
var Server = function(){};
Server.prototype = {
    listen: function listen(handler){
        window.addEventListener('message', function(event) {
            var message = JSON.parse(event.data);
            handler(message.payload, function(error, response){
                /* TODO: consider using window.parent instead ? */
                event.source.postMessage(JSON.stringify({
                    id: message.id,
                    error: error,
                    response: response
                }),'*');
            });
        });
    }
};
module.exports = {
    Client: Client,
    Server: Server
};
