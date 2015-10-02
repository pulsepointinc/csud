var StorageUtil = {
    getAllCookies: function getAllCookies(){
        var cookies = {};
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            var cParts = c.split("=");
            cookies[cParts[0]] = cParts.slice(1).join("=");
        }
        return cookies;
    },
    getCookie: function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    },
    setCookie: function setCookie(name,value,days) {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            expires = "; expires="+date.toGMTString();
        }
        document.cookie = name+"="+value+expires+"; path=/";
    },
    deleteCookie: function deleteCookie(name){
        StorageUtil.setCookie(name, '', -1);
    },
    /* cache operations */
    getCacheItem: function getCacheItem(key){
        return localStorage.getItem(key);
    },
    setCacheItem: function setCacheItem(key, value){
        var oldValue = localStorage.getItem(key);
        if(value === undefined || value === null){
            localStorage.removeItem(key);
        }else{
            localStorage.setItem(key,value);
        }
        return oldValue;
    },
    deleteCacheItem: function deleteCacheItem(key){
        return this.setCacheItem(key,null);
    },
    clearCache: function clearCache(){
        return localStorage.clear();
    },
    getCacheSize: function getCacheSize(){
        return localStorage.length;
    },
    getCacheKeys: function getCacheKeys(){
        var keys = [];
        for(var kIndex = 0; kIndex < localStorage.length; kIndex++){
            keys.push(localStorage.key(kIndex));
        }
        return keys;
    },
    getCacheItems: function getCacheItems(){
        var ret = {};
        var keys = this.getCacheKeys();
        for(var idx in keys){
            var key = keys[idx];
            ret[key] = localStorage.getItem(key);
        }
        return ret;
    }
};
module.exports = StorageUtil;