// var Client = require('./Transport.js').Client;
// var UserStorageClient = function UserStorageClient(config){
//     this.config = config;
//     /* immediately add sockets */
//     this.userDataPromises = [];
//     for(var partnerId in config.userDataProviders){
//         this.userDataPromises.push(
//             this.makeUserDataPromise(partnerId, config.userDataProviders[partnerId]));
//     }
// };
// UserStorageClient.prototype = {
//     queryUserData: function queryUserData(partnerId, url, callback) {

//     }
//     makeUserDataPromise: function makeUserDataPromise(partnerId, url){
//         return new Promise(function(resolve,reject){
//             alert(url);
//             var socket = new easyXDM.Socket({
//                 remote: url,
//                 onMessage: function(message, origin){
//                     /* validate response */
//                     if(message.id !== undefined && message.id !== null){
//                         var userData = {
//                             partnerId: partnerId,
//                             userId: message.id
//                         };
//                         if(typeof(message.ext) === "object"){
//                             userData.ext = message.ext;
//                         }
//                         resolve(userData);
//                     } else {
//                         reject(new Error(
//                             'Partner ' + partnerId +
//                             ' replied with an invalid user data format (' + 
//                             message + ')'));
//                     }
//                 },
//                 onReady: function() {
//                     socket.postMessage('getUserData');
//                 }
//             });
//         });
//     },
//     getUserData: function getUserData(){
//         return this.anyWithin(this.userDataPromises,this.config.timeout).then(function(results){
//             var ret = {};
//             for(var i = 0; i < results.length; i++){
//                 var result = results[i];
//                 ret[result.partnerId] =  result;
//             }
//             return ret;
//         });
//     },
//     anyWithin: function anyWithin(promiseArray, timeoutMs){
//         return Promise.all(this.map(promiseArray, function(promise){
//             return new Promise(function(resolve,reject){
//                 /* set a timeout */
//                 setTimeout(function(){
//                     resolve({
//                         error: new Error('timed out after '+timeoutMs+'ms')
//                     });
//                 },timeoutMs);
//                 /* wait on promise */
//                 promise.then(function(result){
//                     resolve({
//                         result: result
//                     });
//                 }).catch(function(error){
//                     resolve({
//                         error: error
//                     });
//                 });
//             });
//         }));
//     },
//     map: function map(arr, mapFunc) {
//         var ret = [];
//         for(var i = 0; i < arr.length; i++){
//             var e = arr[i];
//             var mappedResult = mapFunc(arr[i]);
//             ret.push(mappedResult);
//         }
//         return ret;
//     },
// };
// module.exports = UserStorageClient;