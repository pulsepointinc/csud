var Target = function Target(url, message){
    this.queue = [];
    if(message){
        this.queue.push(message);
    }
    this.init(url);
};
Target.prototype = {
    init: function init(url){
        var me = this, iframe = document.createElement('iframe');
        /* check if we should pre-send a message */
        if(me.queue.length > 0){
            iframe.src = url + '#' + me.queue.shift();
        }else{
            iframe.src = url;
        }
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.display = 'none';
        iframe.onload = function () {
            me.contentWindow = iframe.contentWindow || iframe;
            while(me.queue.length > 0){
                me.send(me.queue.shift());
            }
        };
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
        if(this.iframe && this.iframe.parentNode){
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
        me.eventListener = function(event) {
            try{
                var message = JSON.parse(event.data),
                    responseHandler = me.responseHandlers[message.id];
                if(responseHandler){
                    delete me.responseHandlers[message.id];
                    responseHandler(message.error,message.response);
                }
            } catch(e) {
                /* ignore */
            }
        };
        window.addEventListener('message', me.eventListener);
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
        var encodedMessage = JSON.stringify({id: id, payload: message.payload});
        var target = this.targets[message.url];
        if(!target){
            target = new Target(message.url);
            target.send(encodedMessage);
            this.targets[message.url] = target;
        }else{
            target.send(encodedMessage);
        }
    },
    close: function close(){
        for(var url in this.targets){
            this.targets[url].close();
        }
        window.removeEventListener('message',this.eventListener);
    }
};
var Server = function(){};
Server.prototype = {
    reply: function reply(message, error, response){
        window.parent.postMessage(JSON.stringify({
            id: message.id,
            error: error,
            response: response
        }),'*');
    },
    listen: function listen(handler){
        var me = this, 
            /* try to parse out a 'SYN' message sent along during the creation of the iframe */
            ownLocation = window.location.href,
            hashIndex = ownLocation.indexOf('#'),
            synMessage = hashIndex > -1 ? JSON.parse(ownLocation.substring(hashIndex+1)) : undefined;
        if(synMessage !== undefined){
            handler(synMessage.payload, function(error, response){
                me.reply(synMessage, error, response);
            });
        }
        window.addEventListener('message', function(event) {
            var message = JSON.parse(event.data);
            handler(message.payload, function(error, response){
                me.reply(message, error, response);
            });
        });
    }
};
module.exports = {
    Client: Client,
    Server: Server
};
