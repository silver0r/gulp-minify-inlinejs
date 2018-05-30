var through = require('through2');
var uglifyes = require('uglify-es');
var PluginError = require('plugin-error');
var PLUGIN_NAME = 'gulp-minify-inlinejs';

module.exports = function(opt) {
    opt = opt || {};
    
    function minify (file, encoding, callback) {
        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            return callback(new PluginError(PLUGIN_NAME, 'Stream doesn\'t supported'));
        }

        var that = this;
        var isMinify = false;
        var html = file.contents.toString('utf8');
        var reg = /(<script(?![^>]*?\b(type=['"]text\/template['"]|src=["']))[^>]*?>)([\s\S]*?)<\/script>/g;

        html = html.replace(reg, function(str, tagStart, attr, script) {
            try {
                var result = uglifyes.minify(script, opt);
                isMinify = true;

                if (!result || result.error) {
                    new PluginError({
                        plugin: PLUGIN_NAME,
                        message: 'uglify-es minify error.' + result.error
                    });

                    throw result.error;
                }

                return tagStart + result.code + '</script>';
            } catch (e) {
                callback(e);
            }
        });

        if (isMinify) {
            file.contents = new Buffer(html);
        }

        callback(null, file);
    }

    return through.obj(minify);
};