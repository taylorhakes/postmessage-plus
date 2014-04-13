module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		uglify: {
			dist: {
				files: {
					'PMPlus.min.js': ['PMPlus.js']
				}
			}
		},
		karma: {
			unit: {
				configFile: 'karma.conf.js',
				singleRun: true,
				autoWatch: false
			}
		},
		jshint: {
			// define the files to lint
			files: ['Gruntfile.js', 'PMPlus.js', 'test/*.js']
		}
	});

	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('test', ['jshint', 'karma']);
	grunt.registerTask('build', ['jshint', 'karma', 'uglify']);

};