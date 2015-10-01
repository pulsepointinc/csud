var UserDataLoader = require('../lib/UserDataLoader.js');
var Stopwatch = require('./Stopwatch.js');
var expect = require('chai').expect;

describe('UserDataLoader.js tests', function() {
    // var loader;
    // var loadUserDataTest = function(done){
    //     var providers = {}, nProviders = 20;
    //     for(var i = 0; i < nProviders; i++){
    //         providers[i] = { url: '/base/test/StaticUserData.html' };
    //     }
    //     var startTime = new Date().getTime();
    //     loader.load({
    //         timeout: 1000,
    //         providers: providers,
    //         handler: function(results){
    //             var runTime = new Date().getTime() - startTime;
    //             alert(results);
    //             for(var i = 0; i < nProviders; i++){
    //                 expect(results[i].result).to.deep.equal({
    //                     id: '12345',
    //                     ext: {
    //                         fcap: 0
    //                     }
    //                 });
    //             }
    //             alert("Processed messages in " + runTime + "ms");
    //             done();
    //         }
    //     });
    // };
    // it('loads user data', loadUserDataTest);
    
    // before(function(){
    //     loader = new UserDataLoader();
    // });
    // after(function(){
    //     loader.close();
    // });
    it('loads user data', function(done){
        var stopwatch = new Stopwatch().start();
        var udl = new UserDataLoader();
        udl.loadUserData({
            url: '/base/test/StaticUserData.html',
            payload: 'hello-world',
            responseHandler: function(error, response){
                alert(stopwatch.elapsed());
                expect(response).to.equal('hello-world');
                done();
            }
        });
    });
});


