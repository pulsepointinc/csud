var gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    q = require('q'),
    jshint = require('gulp-jshint'),
    karma = require('karma'),
    del = require('del'),
    Tunnel = require('node-cbt').Tunnel,
    KarmaConfigGenerator = require('node-cbt').KarmaConfigGenerator,
    minimist = require('minimist'),
    cliArgs = minimist(process.argv.slice(2));

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
 * JSHint sources
 */
gulp.task('lint', function() {
    return gulp.src(['./lib/**/*.js','./test/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

/**
 * Run tests
 */
gulp.task('test', ['dist'], function(done) {
    var karmaOptions = {
            configFile: __dirname + '/karma.conf.js',
            singleRun: true,
        },
        runKarma = function(finishCallback){
            new karma.Server(karmaOptions, function(exitCode){
                    if(finishCallback){
                        finishCallback(exitCode);
                    }
                    if(exitCode !== 0){
                        done("Karma tests failed");
                    }else{
                        done();
                    }
            }).start();
        };
    if(cliArgs["cbt"] === true){
        if(!process.env.CBT_USERNAME || !process.env.CBT_API_KEY){
            throw new Error('CBT_USERNAME or CBT_API_KEY environment variables not set; see README.md');
        }
        new Tunnel({apiKey: process.env.CBT_API_KEY}).runTunnel().then(function(tunnelProc){
            new KarmaConfigGenerator({
                userName: process.env.CBT_USERNAME,
                apiKey: process.env.CBT_API_KEY,
                projectName: require('./package.json').name,
                projectVersion: require('./package.json').version,
                testId: Math.ceil(Math.ceil(new Date().getTime() + Math.random() * 100000) % 10000),
            }).updateKarmaConfig(karmaOptions);
            karmaOptions.browsers = ['chrome-45-win-7-x64','ie-10-win-8','chrome-mob-38-android-galaxy-tab-2-4.1'];
            runKarma(function(){
                tunnelProc.kill();
            });
        }).catch(function(error){
            done(error);
        });
    }else{
        runKarma();
    }
});

/**
 * Make a distribution package (from lib/ into dist/)
 */
gulp.task('dist',['lint','dist:package-tests'],function(callback) {
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

gulp.task('dist:package-tests', function(){
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

