var gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    q = require('q'),
    jshint = require('gulp-jshint'),
    karma = require('karma'),
    del = require('del'),
    cbtkarma = require('node-cbt').KarmaUtil,
    minimist = require('minimist'),
    cliArgs = minimist(process.argv.slice(2)),
    release = require('node-release'),
    runSequence = require('run-sequence'),
    packageJson = require('./package.json'),
    exec = require('child_process').exec;

var config = {
    remote: {
        host: 'pp-web-content',
        path: '/mnt/Production/Data/AdExchange/websites/static.contextweb.com/csud/'
    }
};

/**
 * Default task of 
 * - build everything
 * - run tests
 */
gulp.task('default', ['develop']);

/**
 * Clean everything
 */
gulp.task('clean', function(callback) {
    del(['dist'], callback);
});

/**
 * Log build information
 */
gulp.task('info', [], function () {
    console.log('Version: ' + packageJson.version);
});


/**
 * JSHint sources
 */
gulp.task('lint', function() {
    return gulp.src(['./lib/**/*.js','./test/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

/**
 * Perform a release (see https://github.com/pulsepointinc/node-release)
 */
gulp.task('release', function(callback){
    release.perform({
        projectPath: __dirname,
        buildPromise: function(releaseData) {
            packageJson.version = releaseData.releaseVersion;
            return q.Promise(function(resolve,reject) {
                runSequence(
                    'clean',
                    'test',
                    function(error,results) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    }
                );
            });
        },
        postReleasePromise: function(releaseData){
            packageJson.version = releaseData.releaseVersion;
            return q.Promise(function(resolve,reject) {
                runSequence(
                    'scp-deploy',
                    function (error, results) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    }
                );
            });
        }
    }).then(function(result){
        console.log("Released "+result.releaseVersion);
        console.log("Dev version is now "+result.devVersion);
        callback();
    }).catch(function(error){
        callback(error);
    });
});

/**
 * Create remote folder
 */
gulp.task('scp-prepare', [], function(callback) {
    exec('ssh ' + config.remote.host + ' mkdir -p ' + config.remote.path + packageJson.version,
        function (err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            callback(err);
        }
    )
});

/**
 * Copy files to remote folder
 */
gulp.task('scp-deploy', ['dist', 'scp-prepare'], function(callback) {
    exec('rsync -avzr --delete dist/*.js '
        + config.remote.host + ':' + config.remote.path + packageJson.version,
        function (err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            callback(err);
        }
    )
});

/**
 * Run tests
 */
gulp.task('test', ['dist'], function(done) {
    var karmaOptions = {
        configFile: __dirname + '/karma.conf.js',
        singleRun: true,
        cbtUserName: process.env.CBT_USERNAME,
        cbtApiKey: process.env.CBT_API_KEY
    };
    if(cliArgs['cbt']){
        karmaOptions.cbt = true;
        karmaOptions.browsers = ['ie-10-win-8'];
    }
    cbtkarma.runKarma(karmaOptions).then(function(){
        done();
    }).catch(function(exitCode){
        done(new Error('Karma server exited with code: ' + exitCode));
    });
});

/**
 * Make a distribution package (from lib/ into dist/)
 */
gulp.task('dist', ['info', 'clean', 'lint', 'dist:package-tests'], function(callback) {
    var browserifyJobs = [
        {
            entries: ['./lib/UserDataProvider.js'],
            output: 'userDataProvider.js',
            opts: {
                standalone: 'UserDataProvider'
            }
        },
        {
            entries: ['./lib/UserDataLoader.js'],
            output: 'userDataLoader.js',
            opts: {
                standalone: 'UserDataLoader'
            }
        },
        /* package mocha tests to run outside of Karam for things like IE6 testing */
        {
            entries: ['./test/UserDataLoader.test.js'],
            output: 'test/userDataLoader.test.js'
        }
    ];
    /* start off by copying stuff into destination */
    /* run all jobs in parallel */
    q.all(browserifyJobs.map(function(job){
        return q.Promise(function(resolve,reject){
            /*
                This does not correspond to the below apparantly
                browserify().add(job.entries,job.opts).bundle()
            */
            browserify(job.entries,job.opts)
                .plugin('bundle-collapser/plugin',{})
                .bundle()
                .pipe(source(job.output))
                .pipe(buffer())
                .pipe(uglify())
                .pipe(gulp.dest('dist'))
                .on('end', resolve).on('error', reject);
        });
    })).then(function(results){
        callback(null,true);
    }).catch(function(error){
        callback(error);
    });
});

gulp.task('dist:package-tests', ['clean'], function(){
    /* copy test html files and mocha-test html doc into dist/test directory to be able to run mocha tests without karma */
    return gulp.src(['test/**/*.html','node_modules/mocha/**/*.js','node_modules/mocha/**/*.css'])
        .pipe(gulp.dest('dist/test/'));
});

/**
 * Start karma, watch all files and re-run tests as necessary
 */
gulp.task('develop', ['test'], function (done) {
    ['lib/**/*.*','static/**/*.*','test/**/*.*'].map(function(glob){
        /* karma + browserify watch functionality is broken - browserify watches stuff on its own outside of karmas knowledge */
        /* this means we can't run karma in the background and must instead resort to launching single-runs every time something changes */
        gulp.watch(glob, ['test']);
    });
});

