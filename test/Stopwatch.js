var Stopwatch = function(){};
Stopwatch.prototype = {
    time: function(){
        return new Date().getTime();
    },
    start: function(){
        this.startTime = this.time();
        return this;
    },
    elapsed: function(){
        return this.time() - this.startTime;
    }
};
module.exports = Stopwatch;