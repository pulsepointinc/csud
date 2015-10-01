var UserDataLoader = require('../lib/UserDataLoader.js');
var assert = require('proclaim');

describe('UserDataLoader.js tests', function() {
    describe('#loadUserData',function(){
        it('loads user data using async callbacks', function(done){
            var ud = {'id':'1',ext:{fcap:0}};
            udl.loadUserData({
                url: htmlRoot + 'CallbackUDP.html',
                payload: ud,
                responseHandler: function(error, response){
                    assert.deepEqual(response,ud);
                    done();
                }
            });
        });
        it('loads user data using SLOW async callbacks', function(done){
            var ud = {'id':'3',ext:{fcap:3}};
            udl.loadUserData({
                url: htmlRoot + 'SlowCallbackUDP.html',
                payload: ud,
                responseHandler: function(error, response){
                    assert.deepEqual(response,ud);
                    done();
                }
            });
        });
        it('loads user data using sync returns', function(done){
            var ud = {'id':'2',ext:{fcap:1}};
            udl.loadUserData({
                url: htmlRoot + 'SyncUDP.html',
                payload: ud,
                responseHandler: function(error, response){
                    assert.deepEqual(response,ud);
                    done();
                }
            });
        });
        it('supprots broken UserDataProviders', function(done){
            var ud = {'id':'4',ext:{fcap:4}};
            udl.loadUserData({
                url: htmlRoot + 'BrokenUDP.html',
                payload: ud,
                responseHandler: function(error, response){
                    assert.isUndefined(response);
                    assert.equal(error,'I broken');
                    done();
                }
            });
        });
        it('supprots "gracefully" broken UserDataProviders', function(done){
            var ud = {'id':'4',ext:{fcap:4}};
            udl.loadUserData({
                url: htmlRoot + 'GracefullyBrokenUDP.html',
                payload: ud,
                responseHandler: function(error, response){
                    assert.isUndefined(response);
                    assert.equal(error,'I broken');
                    done();
                }
            });
        });
        it('times out on unresponsive UserDataProviders', function(done){
            var ud = {'id':'5',ext:{fcap:5}};
            udl.loadUserData({
                url: htmlRoot + 'UnresponsiveUDP.html',
                payload: ud,
                timeout: 1000,
                responseHandler: function(error, response){
                    assert.isUndefined(response);
                    assert.equal(error,'timeout');
                    done();
                }
            });
        });
    });
    describe("#misc", function(){
        it('does not explode on spurious window events', function(done){
            var interval = setInterval(function(){
                if(window.postMessage){
                    window.postMessage('{id:asfdadsfgarbage');
                }
            },0);
            try{
                udl.loadUserData({
                    url: htmlRoot + 'SyncUDP.html',
                    payload: 'test',
                    responseHandler: function(error, response){
                        clearInterval(interval);
                        assert.equal(response,'test');
                        done();
                    }
                });
            }catch(e){
                /* ignore */
            }finally{
                clearInterval(interval);
            }
        });
    });
    describe('#loadAllUserData', function(){
        /* force showing slow badges in reporters */
        this.slow(1);
        it('loads user data from assorted broken and valid user data providers', function(done){
            udl.loadAllUserData({
                timeout: 1500,
                partners: {
                    'callback-udp': {
                        url: htmlRoot + 'CallbackUDP.html',
                        payload: 'callback-udp'
                    },
                    'slow-callback-udp': {
                        url: htmlRoot + 'SlowCallbackUDP.html',
                        payload: 'slow-callback-udp'
                    },
                    'sync-udp': {
                        url: htmlRoot + 'SyncUDP.html',
                        payload: 'sync-udp'
                    },
                    'broken-udp': {
                        url: htmlRoot + 'BrokenUDP.html'
                    },
                    'gracefully-broken-udp': {
                        url: htmlRoot + 'GracefullyBrokenUDP.html'
                    },
                    'unresponsive-udp': {
                        url: htmlRoot + 'UnresponsiveUDP.html',
                        timeout: 150
                    }
                },
                responseHandler: function(error, results){
                    assert.isUndefined(error);
                    
                    assert.isUndefined(results['callback-udp'].error);
                    assert.equal(results['callback-udp'].result,'callback-udp');
                    
                    assert.isUndefined(results['slow-callback-udp'].error);
                    assert.equal(results['slow-callback-udp'].result,'slow-callback-udp');

                    assert.isUndefined(results['sync-udp'].error);
                    assert.equal(results['sync-udp'].result,'sync-udp');

                    
                    assert.equal(results['broken-udp'].error,'I broken');
                    assert.isUndefined(results['broken-udp'].result);

                    assert.equal(results['gracefully-broken-udp'].error,'I broken');
                    assert.isUndefined(results['gracefully-broken-udp'].result);

                    assert.equal(results['unresponsive-udp'].error,'timeout');
                    assert.isUndefined(results['unresponsive-udp'].result);
                    
                    done();
                }
            });
        });

        it('loads user data from working user data providers', function(done){
            udl.loadAllUserData({
                timeout: 1500,
                partners: {
                    'callback-udp': {
                        url: htmlRoot + 'CallbackUDP.html',
                        payload: 'w-callback-udp'
                    },
                    'slow-callback-udp': {
                        url: htmlRoot + 'SlowCallbackUDP.html',
                        payload: 'w-slow-callback-udp',
                        /* time this guy out QUICKLY */
                        timeout: 10
                    },
                    'sync-udp': {
                        url: htmlRoot + 'SyncUDP.html',
                        payload: 'w-sync-udp'
                    }
                },
                responseHandler: function(error, results){
                    assert.isUndefined(error);
                    
                    assert.isUndefined(results['callback-udp'].error);
                    assert.equal(results['callback-udp'].result,'w-callback-udp');
                    
                    /* do not make any asserts on slow-callback-udp because some browsers seem to fail to set this timeout */
                    /*
                    assert.equal(results['slow-callback-udp'].error,'timeout');
                    assert.isUndefined(results['slow-callback-udp'].result);
                    */
                    
                    assert.isUndefined(results['sync-udp'].error);
                    assert.equal(results['sync-udp'].result,'w-sync-udp');
                    
                    done();
                }
            });
        });
    });

    

    var htmlRoot = window.htmlRoot || '/base/dist/test/html/', startIframeCount, udl, 
        iframeCount = function() {
            return document.getElementsByTagName('iframe').length;
        };
    beforeEach(function(){
        udl = new UserDataLoader();
        startIframeCount = iframeCount();
    });
    afterEach(function(){
        udl.close();
    });
});


