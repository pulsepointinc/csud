module.exports = function(config) {
    config.set({
        hostname: 'localhost',
        /* bump timeouts a bit for CBT test runners */
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
        reporters: ['mocha'],
        browsers: ['Chrome']
    });
};