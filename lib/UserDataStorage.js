// var Server = require('./Transport.js').Server;
// var UserDataStorage = function UserDataStorage(userDataProvider){
//     this.server = new Server();
//     this.server.listen(function(message, callback){
//         if(message.action === 'getUserData'){
//             var userData = userDataProvider.getUserData(callback);
//             if(userData !== undefined){
//                 callback(null, userData);
//             }
//         }
//     });
// };
// UserDataStorage.prototype = {
//     init: {
//         var me = this;
//         this.server.listen(function(message, callback){
//             var userData = me.userDataProvider.getUserData(callback);
//             if(userData !== undefined){
//                 callback(null, userData);
//             }
//         });
//     },
//     getCookie: function getCookie(name) {
//         var nameEQ = name + "=";
//         var ca = document.cookie.split(';');
//         for(var i=0;i < ca.length;i++) {
//             var c = ca[i];
//             while (c.charAt(0)==' ') c = c.substring(1,c.length);
//             if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
//         }
//         return null;
//     },
//     setCookie: function setCookie(name,value,days) {
//         var expires = '';
//         if (days) {
//             var date = new Date();
//             date.setTime(date.getTime()+(days*24*60*60*1000));
//             expires = "; expires="+date.toGMTString();
//         }
//         document.cookie = name+"="+value+expires+"; path=/";
//     }
// };
// module.exports = UserDataStorage;