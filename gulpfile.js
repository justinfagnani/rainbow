/* eslint-env node */
/* eslint no-var: false */

var gulp = require('gulp');
var KarmaServer = require('karma').Server;
var argv = require('yargs').argv;
var eslint = require('gulp-eslint');
var runSequence = require('run-sequence');
var git = require('gulp-git');
var bump = require('gulp-bump');
var semver = require('semver');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var version = require('./package.json').version;


gulp.task('update-package-version', function() {
    gulp.src('./package.json')
        .pipe(bump({version: argv.version}))
        .pipe(gulp.dest('./'));
});

gulp.task('update-version', function() {
    var message = 'Update version to ' + argv.version;
    gulp.src(['./package.json'])
        .pipe(git.add())
        .pipe(git.commit(message))
        .on('data', function(err) {
            git.tag(argv.version, message);
        });
});

gulp.task('test', function(done) {
    new KarmaServer({
        configFile: __dirname + '/karma.conf.js',
        singleRun: !argv.watch ? true : false,
        browsers: argv.browsers ? argv.browsers.split(',') : ['PhantomJS']
    }, done).start();
});

gulp.task('lint', function() {
    // TODO(justinfagnani): lint the .ts files
    return gulp.src('lib/*.js')
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('release', function(callback) {
    var type = argv.type || 'fix';
    var map = {
        breaking: 'major',
        feature: 'minor',
        fix: 'patch'
    };

    var newVersion = semver.inc(version, map[type]);
    argv.release = true;
    argv.version = newVersion;

    runSequence('lint', 'test', 'update-package-version', 'update-version', callback);
});

gulp.task('sass', function() {
    return gulp.src('./themes/sass/*.sass')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer({browsers: ['last 2 versions']}))
        .pipe(gulp.dest('./themes/css'));
});

gulp.task('watch', function() {
    gulp.watch('themes/sass/*.sass', ['sass']);
});
