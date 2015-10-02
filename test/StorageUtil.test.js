var StorageUtil = require('../lib/StorageUtil.js');
var assert = require('proclaim');
describe('StorageUtil.js tests',function(){
    describe('Cookie tests', function() {
        it('returns null for undefined cookies', function(){
            var cookieName = 'test-'+rnd();
            assert.isNull(StorageUtil.getCookie(cookieName));
        });
        it('sets and gets cookies', function(){
            var val = 'value-' + rnd();
            StorageUtil.setCookie('test',val,'1');
            assert.equal(StorageUtil.getCookie('test'),val);
        });
        it('clears cookies', function(){
            var val = 'value-' + rnd();
            StorageUtil.setCookie('test',val,'1');
            assert.equal(StorageUtil.getCookie('test'),val);
            StorageUtil.deleteCookie('test');
            assert.isNull(StorageUtil.getCookie('test'));
        });
        it('gets multiple cookies', function(){
            for(var i = 0; i < 10; i++){
                StorageUtil.setCookie(i,i+'-val',1);
            }
            var cookieMap = StorageUtil.getAllCookies();
            for(i = 0; i < 10; i++){
                assert.equal(i+'-val',StorageUtil.getCookie(i));
            }
        });
    });
    describe('Local-Storage tests', function() {
        // it('sets and gets items', function(done){
        //     var val = 'value-' + rnd();
        //     storage.setCacheItem('test',val).then(function(){
        //         return storage.getCacheItem('test');
        //     }).then(function(actual){
        //         expect(actual).to.equal(val);
        //         done();
        //     });
        // });
        // it('deletes items', function(done){
        //     storage.setCacheItem('test','test-val').then(function(){
        //         return storage.getCacheItem('test');
        //     }).then(function(value){
        //         expect(value).to.equal('test-val');
        //         return storage.deleteCacheItem('test');
        //     }).then(function(){
        //         return storage.getCacheItem('test');
        //     }).then(function(value){
        //         expect(value).to.equal(null);
        //         done();
        //     });
        // });
        // it('gets multiple keys', function(done){
        //     var keyPromises;
        //     /* clear storage */
        //     storage.clearCache().then(function(){
        //         /* generate a bunch of promises */
        //         keyPromises = mkPromises(10, function(key){
        //             return storage.setCacheItem(key,'test');
        //         });
        //         return Promise.all(keyPromises.promises);
        //     }).then(function(){
        //         return storage.getCacheKeys();
        //     }).then(function(keys){
        //         expect(keys).to.have.length(keyPromises.keys.length);
        //         expect(keys).to.have.members(keyPromises.keys);
        //         done();
        //     });
        // });
        // it('gets multiple items', function(done){
        //     /* clear storage */
        //     storage.clearCache().then(function(){
        //         /* generate a bunch of promises */
        //         keyPromises = mkPromises(10, function(key){
        //             return storage.setCacheItem(key,'test');
        //         });
        //         return Promise.all(keyPromises.promises);
        //     }).then(function(){
        //         return storage.getCacheItems();
        //     }).then(function(cache){
        //         for(var idx in keyPromises.keys){
        //             var key = keyPromises.keys[idx];
        //             expect(cache).to.have.property(key,'test');
        //         }
        //         done();
        //     });
        // });
    });
    var rnd = function() {
        return Math.floor(Math.random()*1000);
    };
});