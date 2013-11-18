/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // Task configuration.
    uglify: {
	      dist: {
		  files: {
		      'dist/nw.js': 'js/nw.js',
		      'dist/content_script.js': 'js/content_script.js',
		      'dist/background.js': 'js/background.js',
		      'dist/common.js': 'js/common.js',
		      'dist/options.js': 'js/options.js'
		  }
	      }
    },
    watch: {
	      files: ['js/*.js'],
	      tasks:['uglify']
    },
    clean: {
	      files: ['dist/*.js', '*~' ]
    },
    compress: {
	      zip: {
		  files: {
		      'WebColorPicker.zip': [ '*.html', 'dist/*.js', 'manifest.json', '*.png' ]
		  }
	      }
    }
      
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');

  // Default task.
  grunt.registerTask('default', ['uglify', 'watch']);

};
