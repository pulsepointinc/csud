var Client = require('../../lib/transport/Transport.js').Client;
var expect = require('chai').expect;

describe('transport/Transport.js tests', function() {
    it('sends and receives simple messages', function(done){
        var client = mkClient(),
            startTime = new Date().getTime();
        client.sendMessage({
            url:'/base/test/transport/EchoServer.html',
            payload: 'Hello World'
        }, function(error, result){
            var runTime = new Date().getTime() - startTime;
            expect(result).to.equal('Hello World');
            /* expect things to be relatively quick */
            expect(runTime).to.be.below(10000);
            alert('hello world message parotted in '+runTime+'ms.');
            done();
        });
    });
    it('cleans up after itself', function(done){
        var startIframes = document.getElementsByTagName('iframe').length,
            client = mkClient();
        client.sendMessage({
            url:'/base/test/transport/EchoServer.html',
            payload: 'Hello World'
        }, function(error, result){
            expect(result).to.equal('Hello World');
            /* clean up the client! */
            client.close();
            expect(document.getElementsByTagName('iframe').length).to.equal(startIframes);
            done();
        });
    });
    it('sends and receives complex messages', function(done){
        var client = mkClient();
        var payload = {
            exid: 'test',
            exobj: {
                firstName: 'John',
                lastName: 'Tesh'
            },
            numKey: 2
        };
        client.sendMessage({
            url:'/base/test/transport/EchoServer.html',
            payload: payload
        }, function(error, result){
            expect(result).to.deep.equal(payload);
            done();
        });
    });
    it('does not create extra iframes', function(done){
        var client = mkClient(),
            iterations = 100,
            startIframes = document.getElementsByTagName('iframe').length,
            completedCalls = 0,
            handler = function(error, result){
                expect(result).to.equal('Hello World');
                completedCalls++;
                if(completedCalls === iterations){
                    var endIframes = document.getElementsByTagName('iframe').length;
                    expect(endIframes).to.equal(startIframes + 1);
                    done();
                }
            },
            sendMessage = function(){
                client.sendMessage({
                    url:'/base/test/transport/EchoServer.html',
                    payload: 'Hello World'
                }, handler);
            };
        for(var i = 0; i < iterations; i++ ){
            setTimeout(sendMessage,0);
        }
    });
    it('is pretty quick', function(done){
        var client = mkClient(),
            nTargets = 30,
            nMessagesPerTarget = 2,
            completedCalls = 0,
            startIframes = document.getElementsByTagName('iframe').length,
            startTime = new Date().getTime(),
            mkHandler = function(expectedResponse) {
                return function(error, result){
                    expect(error).to.equal(null);
                    expect(result).to.equal(expectedResponse);
                    completedCalls++;
                    if(completedCalls === nMessagesPerTarget * nTargets){
                        var runTime = new Date().getTime() - startTime,
                            mps = ((nTargets * nMessagesPerTarget) / runTime) * 1000,
                            endIframes = document.getElementsByTagName('iframe').length;
                        expect(endIframes).to.equal(startIframes + nTargets);
                        /* assert we can process > 100 messages per second */
                        expect(mps).to.be.above(1);
                        alert("Took " + runTime + "ms to send "+nMessagesPerTarget+" messages to "+nTargets+" targets");
                        done();
                    }
                };
            },
            sendMessage = function(t,m){
                var payload = 'test' + t + '-' + m;
                client.sendMessage({
                    url: '/base/test/transport/EchoServer.html?t='+t,
                    payload: payload,
                    timeout: 10000
                }, mkHandler(payload));
            };
        for(var t = 0; t < nTargets; t++){
            for(var m = 0; m < nMessagesPerTarget; m++){
                sendMessage(t,m);
            }
        }
    });
    it('fails on bad urls', function(done){
        var client = mkClient(),
            startTime = new Date().getTime();
        client.sendMessage({
            url: 'http://bad.name.local/test.html',
            payload: 'test',
            timeout: 50
        },function(error,result){
            expect(error).to.not.equal(null);
            done();
        });
    });

    var clients = [], mkClient = function(){
        var client = new Client();
        clients.push(client);
        return client;
    };
    afterEach(function(){
        for(var i = 0; i < clients.length; i++){
            clients[i].close();
        }
    });
});


