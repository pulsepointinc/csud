var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var q = require('q');
var fs = require('fs');
var jshint = require('gulp-jshint');
var karma = require('karma');
var runSequence = require('run-sequence');
var del = require('del');

/** 
 * Application 'gulp' build file
 */
var config = {
    paths: {
        src: 'lib',
        staticFiles: 'static/**/*.*',
        watchGlobs: ['lib/**/*.*','static/**/*.*','test/**/*.*'],
        dist: 'dist'
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
    del([config.paths.dist], callback);
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
    new karma.Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, function(exitCode){
        if(exitCode !== 0){
            done("Karma tests failed");
        }else{
            done();
        }
    }).start();
 });

/**
 * Make a distribution package (from lib/ into dist/)
 */
gulp.task('dist',['lint','dist:copy-static-files'],function(callback) {
    var browserifyJobs = [
        // {
        //     /* storage.js / storage.html file */
        //     entries: ['./lib/UserStorage.js'],
        //     output: 'userStorage.js',
        //     injectInto: 'static/storage.html',
        //     replacing: '${userStorage.js}',
        //     opts: {
        //         standalone: 'UserStorage'
        //     }
        // },
        // {
        //     /* meat and potatoes application */
        //     entries: ['./lib/UserStorageClient.js'],
        //     output: 'userStorageClient.js',
        //     opts:{
        //         standalone: 'UserStorageClient'
        //     }
        // },
        /* test stuff */
        {
            entries: ['./lib/transport/Transport.js'],
            output: 'test/transport.js',
            opts: {
                standalone: 'Transport'
            }
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
            browserify(job.entries,job.opts).bundle()
                .pipe(source(job.output))
                .pipe(buffer())
                .pipe(uglify())
                .pipe(gulp.dest(config.paths.dist))
                .on('end', resolve).on('error', reject);
        });
    })).then(function(results){
        /* subsitute javascript into static html files as necessary */
        browserifyJobs.map(function(job){
            if(job.injectInto){
                var injectIntoParts = job.injectInto.split('/');
                var destFile = injectIntoParts[injectIntoParts.length-1];
                fs.writeFileSync('dist/' + destFile, fs.readFileSync(job.injectInto,'utf-8').replace(job.replacing,fs.readFileSync('dist/' + job.output, 'utf-8')), 'utf-8');
            }
        });
        callback(null,true);
    }).catch(function(error){
        callback(error);
    });
});

gulp.task('dist:copy-static-files', function(){
    return gulp.src(config.paths.staticFiles)
        .pipe(gulp.dest(config.paths.dist));
});

/**
 * Start karma, watch all files and re-run tests as necessary
 */
gulp.task('develop', ['test'], function (done) {
    config.paths.watchGlobs.map(function(glob){
        /* karma + browserify watch functionality is broken - browserify watches stuff on its own outside of karmas knowledge */
        /* this means we can't run karma in the background and must instead resort to launching single-runs every time something changes */
        gulp.watch(glob, ['test']);
    });
});




