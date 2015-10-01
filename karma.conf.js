var PackageJSON = require('./package.json');
var testId = Math.ceil(Math.ceil(new Date().getTime() + Math.random() * 100000) % 10000);
module.exports = function(config) {
    var makeCBTConfig = function(caps){
        var ret = {
            base: 'WebdriverIO',
            config: {
                host: 'hub.crossbrowsertesting.com',
                port: 80,
                desiredCapabilities: {
                    name : PackageJSON.name + ' Karma Tests',
                    build :  PackageJSON.version + ' - [' + testId + ']',
                    screen_resolution : '1024x768',
                    record_video : "false",
                    record_network : "false",
                    record_snapshot :  "false",
                    username : "exchangeteam@pulsepoint.com",
                    password : "u7aead78d5ccbec1"
                }
            }
        };
        for(var cap in caps){
            ret.config.desiredCapabilities[cap] = caps[cap];
        }
        return ret;
    }
    /* firefox test runner */
    if(process.env.USER === 'eug'){
        process.env['FIREFOX_BIN'] = '/Users/eug/Applications/Firefox.app/Contents/MacOS/firefox-bin';
    }
    config.set({
        hostname: '10.0.0.108',
        captureTimeout: 120000,
        browserNoActivityTimeout: 120000,
        frameworks: [
            /* mocha unit test framework */
            'mocha',
            /* browserify browserification framework */
            'browserify'
        ],
        files: [
            {
                pattern: 'test/**/*.test.js',
                served: true,
                included: true,
            },
            {
                pattern: 'test/**/*.html',
                served: true,
                included: false,
            },
            {
                pattern: 'lib/**/*.js',
                served: true,
                included: true,
            },
            {
                pattern: 'dist/**/*.*',
                served: true,
                included: false,
            }
        ],
        preprocessors: {
            /* apply browserify to all tests and lib files */
            'test/**/*.js': [ 'browserify' ],
            'lib/**/*.js' : [ 'browserify' ],
        },
        customLaunchers: {
            'CBT-FF5': makeCBTConfig({
                browserName: 'firefox',
                browser_api_name: 'FF5',
                os_api_name : 'WinXPSP3'
            }),
            'CBT-Chrome44': makeCBTConfig({
                browserName: 'chrome',
                browser_api_name: 'Chrome44',
                os_api_name : 'WinXPSP3'
            }),
            'CBT-IE11': makeCBTConfig({
                browserName: 'internet explorer',
                browser_api_name: 'IE11',
                os_api_name : 'Win7x64-Base'
            }),
            'CBT-IE10': makeCBTConfig({
                browserName : "internet explorer",
                browser_api_name : 'IE10', 
                os_api_name : 'Win7x64-C2'
            }),
            'CBT-IE9': makeCBTConfig({
                browserName : "internet explorer",
                browser_api_name : 'IE9', 
                os_api_name : 'WinVista-C2'
           })
        },
        reporters: ['mocha'],
        //browsers: ['Remote-IE11']
        //browsers: ['Chrome','Firefox','Safari']
        //browsers: ['Chrome']
        browsers: ['CBT-IE9','CBT-IE10','CBT-IE11'] //'CBT-Chrome44','CBT-FF5']
    });
};