module.exports = function(config) {
    /* firefox test runner */
    if(process.env.USER === 'eug'){
        process.env['FIREFOX_BIN'] = '/Users/eug/Applications/Firefox.app/Contents/MacOS/firefox-bin';
    }
    config.set({
        hostname: '10.0.0.108',
        browserNoActivityTimeout: 30000,
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
            'Remote-IE11': {
                base: 'WebdriverIO',
                config: {
                    host: 'hub.crossbrowsertesting.com',
                    port: 80,
                    desiredCapabilities: {
                        name : 'Karma',
                        build :  '1.0',
    
                        browser_api_name : 'IE11', 
                        os_api_name : 'Win7x64-Base', 
                        
                        screen_resolution : '1024x768',
                        record_video : "false",
                        record_network : "true",
                        record_snapshot :  "false",
                     
                        browserName : "internet explorer", // <---- this needs to be the browser type in lower case: firefox, internet explorer, chrome, opera, or safari
                        username : "exchangeteam@pulsepoint.com",
                        password : "u7aead78d5ccbec1"
                    }
                }
            }


        },
        reporters: ['mocha'],
        browsers: ['Remote-IE11']
        //browsers: ['Chrome','Firefox','Safari']
        //browsers: ['Chrome']
    });
};