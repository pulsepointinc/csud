var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var q = require('q');
var jshint = require('gulp-jshint');
var karma = require('karma');
var del = require('del');

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
    return gulp.src('test/**/*.html').pipe(gulp.dest('dist/test/'))
            .pipe(gulp.src(['node_modules/mocha/**/*.*']))
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

