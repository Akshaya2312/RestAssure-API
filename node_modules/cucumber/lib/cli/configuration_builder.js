'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _argv_parser = require('./argv_parser');

var _argv_parser2 = _interopRequireDefault(_argv_parser);

var _fs = require('mz/fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _path_expander = require('./path_expander');

var _path_expander2 = _interopRequireDefault(_path_expander);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ConfigurationBuilder = function () {
  (0, _createClass3.default)(ConfigurationBuilder, null, [{
    key: 'build',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(function* (options) {
        var builder = new ConfigurationBuilder(options);
        return yield builder.build();
      });

      function build(_x) {
        return _ref.apply(this, arguments);
      }

      return build;
    }()
  }]);

  function ConfigurationBuilder(_ref2) {
    var argv = _ref2.argv,
        cwd = _ref2.cwd;
    (0, _classCallCheck3.default)(this, ConfigurationBuilder);

    this.cwd = cwd;
    this.pathExpander = new _path_expander2.default(cwd);

    var parsedArgv = _argv_parser2.default.parse(argv);
    this.args = parsedArgv.args;
    this.options = parsedArgv.options;
  }

  (0, _createClass3.default)(ConfigurationBuilder, [{
    key: 'build',
    value: function () {
      var _ref3 = (0, _bluebird.coroutine)(function* () {
        var listI18nKeywordsFor = this.options.i18nKeywords;
        var listI18nLanguages = !!this.options.i18nLanguages;
        var unexpandedFeaturePaths = yield this.getUnexpandedFeaturePaths();
        var featurePaths = [];
        var supportCodePaths = [];
        if (!listI18nKeywordsFor && !listI18nLanguages) {
          featurePaths = yield this.expandFeaturePaths(unexpandedFeaturePaths);
          var featureDirectoryPaths = this.getFeatureDirectoryPaths(featurePaths);
          var unexpandedSupportCodePaths = this.options.require.length > 0 ? this.options.require : featureDirectoryPaths;
          supportCodePaths = yield this.expandSupportCodePaths(unexpandedSupportCodePaths);
        }
        return {
          featureDefaultLanguage: this.options.language,
          featurePaths: featurePaths,
          formats: this.getFormats(),
          formatOptions: this.getFormatOptions(),
          listI18nKeywordsFor: listI18nKeywordsFor,
          listI18nLanguages: listI18nLanguages,
          profiles: this.options.profile,
          pickleFilterOptions: {
            featurePaths: unexpandedFeaturePaths,
            names: this.options.name,
            tagExpression: this.options.tags
          },
          runtimeOptions: {
            dryRun: !!this.options.dryRun,
            failFast: !!this.options.failFast,
            filterStacktraces: !this.options.backtrace,
            strict: !!this.options.strict,
            worldParameters: this.options.worldParameters
          },
          supportCodePaths: supportCodePaths
        };
      });

      function build() {
        return _ref3.apply(this, arguments);
      }

      return build;
    }()
  }, {
    key: 'expandFeaturePaths',
    value: function () {
      var _ref4 = (0, _bluebird.coroutine)(function* (featurePaths) {
        featurePaths = featurePaths.map(function (p) {
          return p.replace(/(:\d+)*$/g, '');
        }); // Strip line numbers
        return yield this.pathExpander.expandPathsWithExtensions(featurePaths, ['feature']);
      });

      function expandFeaturePaths(_x2) {
        return _ref4.apply(this, arguments);
      }

      return expandFeaturePaths;
    }()
  }, {
    key: 'getFeatureDirectoryPaths',
    value: function getFeatureDirectoryPaths(featurePaths) {
      var _this = this;

      var featureDirs = featurePaths.map(function (featurePath) {
        var featureDir = _path2.default.dirname(featurePath);
        var childDir = void 0;
        var parentDir = featureDir;
        while (childDir !== parentDir) {
          childDir = parentDir;
          parentDir = _path2.default.dirname(childDir);
          if (_path2.default.basename(parentDir) === 'features') {
            featureDir = parentDir;
            break;
          }
        }
        return _path2.default.relative(_this.cwd, featureDir);
      });
      return _lodash2.default.uniq(featureDirs);
    }
  }, {
    key: 'getFormatOptions',
    value: function getFormatOptions() {
      var formatOptions = _lodash2.default.clone(this.options.formatOptions);
      formatOptions.cwd = this.cwd;
      _lodash2.default.defaults(formatOptions, { colorsEnabled: true });
      return formatOptions;
    }
  }, {
    key: 'getFormats',
    value: function getFormats() {
      var mapping = { '': 'progress' };
      this.options.format.forEach(function (format) {
        var type = format;
        var outputTo = '';
        var parts = format.split(/([^A-Z]):([^\\])/);

        if (parts.length > 1) {
          type = parts.slice(0, 2).join('');
          outputTo = parts.slice(2).join('');
        }

        mapping[outputTo] = type;
      });
      return _lodash2.default.map(mapping, function (type, outputTo) {
        return { outputTo: outputTo, type: type };
      });
    }
  }, {
    key: 'getUnexpandedFeaturePaths',
    value: function () {
      var _ref5 = (0, _bluebird.coroutine)(function* () {
        var _this2 = this;

        if (this.args.length > 0) {
          var nestedFeaturePaths = yield _bluebird2.default.map(this.args, function () {
            var _ref6 = (0, _bluebird.coroutine)(function* (arg) {
              var filename = _path2.default.basename(arg);
              if (filename[0] === '@') {
                var filePath = _path2.default.join(_this2.cwd, arg);
                var content = yield _fs2.default.readFile(filePath, 'utf8');
                return _lodash2.default.chain(content).split('\n').map(_lodash2.default.trim).compact().value();
              } else {
                return arg;
              }
            });

            return function (_x3) {
              return _ref6.apply(this, arguments);
            };
          }());
          var featurePaths = _lodash2.default.flatten(nestedFeaturePaths);
          if (featurePaths.length > 0) {
            return featurePaths;
          }
        }
        return ['features'];
      });

      function getUnexpandedFeaturePaths() {
        return _ref5.apply(this, arguments);
      }

      return getUnexpandedFeaturePaths;
    }()
  }, {
    key: 'expandSupportCodePaths',
    value: function () {
      var _ref7 = (0, _bluebird.coroutine)(function* (supportCodePaths) {
        var extensions = ['js'];
        this.options.compiler.forEach(function (compiler) {
          var parts = compiler.split(':');
          extensions.push(parts[0]);
          require(parts[1]);
        });
        return yield this.pathExpander.expandPathsWithExtensions(supportCodePaths, extensions);
      });

      function expandSupportCodePaths(_x4) {
        return _ref7.apply(this, arguments);
      }

      return expandSupportCodePaths;
    }()
  }]);
  return ConfigurationBuilder;
}();

exports.default = ConfigurationBuilder;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jbGkvY29uZmlndXJhdGlvbl9idWlsZGVyLmpzIl0sIm5hbWVzIjpbIkNvbmZpZ3VyYXRpb25CdWlsZGVyIiwib3B0aW9ucyIsImJ1aWxkZXIiLCJidWlsZCIsImFyZ3YiLCJjd2QiLCJwYXRoRXhwYW5kZXIiLCJwYXJzZWRBcmd2IiwicGFyc2UiLCJhcmdzIiwibGlzdEkxOG5LZXl3b3Jkc0ZvciIsImkxOG5LZXl3b3JkcyIsImxpc3RJMThuTGFuZ3VhZ2VzIiwiaTE4bkxhbmd1YWdlcyIsInVuZXhwYW5kZWRGZWF0dXJlUGF0aHMiLCJnZXRVbmV4cGFuZGVkRmVhdHVyZVBhdGhzIiwiZmVhdHVyZVBhdGhzIiwic3VwcG9ydENvZGVQYXRocyIsImV4cGFuZEZlYXR1cmVQYXRocyIsImZlYXR1cmVEaXJlY3RvcnlQYXRocyIsImdldEZlYXR1cmVEaXJlY3RvcnlQYXRocyIsInVuZXhwYW5kZWRTdXBwb3J0Q29kZVBhdGhzIiwicmVxdWlyZSIsImxlbmd0aCIsImV4cGFuZFN1cHBvcnRDb2RlUGF0aHMiLCJmZWF0dXJlRGVmYXVsdExhbmd1YWdlIiwibGFuZ3VhZ2UiLCJmb3JtYXRzIiwiZ2V0Rm9ybWF0cyIsImZvcm1hdE9wdGlvbnMiLCJnZXRGb3JtYXRPcHRpb25zIiwicHJvZmlsZXMiLCJwcm9maWxlIiwicGlja2xlRmlsdGVyT3B0aW9ucyIsIm5hbWVzIiwibmFtZSIsInRhZ0V4cHJlc3Npb24iLCJ0YWdzIiwicnVudGltZU9wdGlvbnMiLCJkcnlSdW4iLCJmYWlsRmFzdCIsImZpbHRlclN0YWNrdHJhY2VzIiwiYmFja3RyYWNlIiwic3RyaWN0Iiwid29ybGRQYXJhbWV0ZXJzIiwibWFwIiwicCIsInJlcGxhY2UiLCJleHBhbmRQYXRoc1dpdGhFeHRlbnNpb25zIiwiZmVhdHVyZURpcnMiLCJmZWF0dXJlRGlyIiwiZGlybmFtZSIsImZlYXR1cmVQYXRoIiwiY2hpbGREaXIiLCJwYXJlbnREaXIiLCJiYXNlbmFtZSIsInJlbGF0aXZlIiwidW5pcSIsImNsb25lIiwiZGVmYXVsdHMiLCJjb2xvcnNFbmFibGVkIiwibWFwcGluZyIsImZvcm1hdCIsImZvckVhY2giLCJ0eXBlIiwib3V0cHV0VG8iLCJwYXJ0cyIsInNwbGl0Iiwic2xpY2UiLCJqb2luIiwibmVzdGVkRmVhdHVyZVBhdGhzIiwiYXJnIiwiZmlsZW5hbWUiLCJmaWxlUGF0aCIsImNvbnRlbnQiLCJyZWFkRmlsZSIsImNoYWluIiwidHJpbSIsImNvbXBhY3QiLCJ2YWx1ZSIsImZsYXR0ZW4iLCJleHRlbnNpb25zIiwiY29tcGlsZXIiLCJwdXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7SUFHcUJBLG9COzs7O3FEQUNBQyxPLEVBQVM7QUFDMUIsWUFBTUMsVUFBVSxJQUFJRixvQkFBSixDQUF5QkMsT0FBekIsQ0FBaEI7QUFDQSxlQUFPLE1BQU1DLFFBQVFDLEtBQVIsRUFBYjtBQUNELE87Ozs7Ozs7Ozs7QUFFRCx1Q0FBMkI7QUFBQSxRQUFiQyxJQUFhLFNBQWJBLElBQWE7QUFBQSxRQUFQQyxHQUFPLFNBQVBBLEdBQU87QUFBQTs7QUFDekIsU0FBS0EsR0FBTCxHQUFXQSxHQUFYO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQiw0QkFBaUJELEdBQWpCLENBQXBCOztBQUVBLFFBQU1FLGFBQWEsc0JBQVdDLEtBQVgsQ0FBaUJKLElBQWpCLENBQW5CO0FBQ0EsU0FBS0ssSUFBTCxHQUFZRixXQUFXRSxJQUF2QjtBQUNBLFNBQUtSLE9BQUwsR0FBZU0sV0FBV04sT0FBMUI7QUFDRDs7Ozs7d0RBRWE7QUFDWixZQUFNUyxzQkFBc0IsS0FBS1QsT0FBTCxDQUFhVSxZQUF6QztBQUNBLFlBQU1DLG9CQUFvQixDQUFDLENBQUMsS0FBS1gsT0FBTCxDQUFhWSxhQUF6QztBQUNBLFlBQU1DLHlCQUF5QixNQUFNLEtBQUtDLHlCQUFMLEVBQXJDO0FBQ0EsWUFBSUMsZUFBZSxFQUFuQjtBQUNBLFlBQUlDLG1CQUFtQixFQUF2QjtBQUNBLFlBQUksQ0FBQ1AsbUJBQUQsSUFBd0IsQ0FBQ0UsaUJBQTdCLEVBQWdEO0FBQzlDSSx5QkFBZSxNQUFNLEtBQUtFLGtCQUFMLENBQXdCSixzQkFBeEIsQ0FBckI7QUFDQSxjQUFNSyx3QkFBd0IsS0FBS0Msd0JBQUwsQ0FBOEJKLFlBQTlCLENBQTlCO0FBQ0EsY0FBTUssNkJBQ0osS0FBS3BCLE9BQUwsQ0FBYXFCLE9BQWIsQ0FBcUJDLE1BQXJCLEdBQThCLENBQTlCLEdBQ0ksS0FBS3RCLE9BQUwsQ0FBYXFCLE9BRGpCLEdBRUlILHFCQUhOO0FBSUFGLDZCQUFtQixNQUFNLEtBQUtPLHNCQUFMLENBQ3ZCSCwwQkFEdUIsQ0FBekI7QUFHRDtBQUNELGVBQU87QUFDTEksa0NBQXdCLEtBQUt4QixPQUFMLENBQWF5QixRQURoQztBQUVMVixvQ0FGSztBQUdMVyxtQkFBUyxLQUFLQyxVQUFMLEVBSEo7QUFJTEMseUJBQWUsS0FBS0MsZ0JBQUwsRUFKVjtBQUtMcEIsa0RBTEs7QUFNTEUsOENBTks7QUFPTG1CLG9CQUFVLEtBQUs5QixPQUFMLENBQWErQixPQVBsQjtBQVFMQywrQkFBcUI7QUFDbkJqQiwwQkFBY0Ysc0JBREs7QUFFbkJvQixtQkFBTyxLQUFLakMsT0FBTCxDQUFha0MsSUFGRDtBQUduQkMsMkJBQWUsS0FBS25DLE9BQUwsQ0FBYW9DO0FBSFQsV0FSaEI7QUFhTEMsMEJBQWdCO0FBQ2RDLG9CQUFRLENBQUMsQ0FBQyxLQUFLdEMsT0FBTCxDQUFhc0MsTUFEVDtBQUVkQyxzQkFBVSxDQUFDLENBQUMsS0FBS3ZDLE9BQUwsQ0FBYXVDLFFBRlg7QUFHZEMsK0JBQW1CLENBQUMsS0FBS3hDLE9BQUwsQ0FBYXlDLFNBSG5CO0FBSWRDLG9CQUFRLENBQUMsQ0FBQyxLQUFLMUMsT0FBTCxDQUFhMEMsTUFKVDtBQUtkQyw2QkFBaUIsS0FBSzNDLE9BQUwsQ0FBYTJDO0FBTGhCLFdBYlg7QUFvQkwzQjtBQXBCSyxTQUFQO0FBc0JELE87Ozs7Ozs7Ozs7O3NEQUV3QkQsWSxFQUFjO0FBQ3JDQSx1QkFBZUEsYUFBYTZCLEdBQWIsQ0FBaUI7QUFBQSxpQkFBS0MsRUFBRUMsT0FBRixDQUFVLFdBQVYsRUFBdUIsRUFBdkIsQ0FBTDtBQUFBLFNBQWpCLENBQWYsQ0FEcUMsQ0FDNEI7QUFDakUsZUFBTyxNQUFNLEtBQUt6QyxZQUFMLENBQWtCMEMseUJBQWxCLENBQTRDaEMsWUFBNUMsRUFBMEQsQ0FDckUsU0FEcUUsQ0FBMUQsQ0FBYjtBQUdELE87Ozs7Ozs7Ozs7NkNBRXdCQSxZLEVBQWM7QUFBQTs7QUFDckMsVUFBTWlDLGNBQWNqQyxhQUFhNkIsR0FBYixDQUFpQix1QkFBZTtBQUNsRCxZQUFJSyxhQUFhLGVBQUtDLE9BQUwsQ0FBYUMsV0FBYixDQUFqQjtBQUNBLFlBQUlDLGlCQUFKO0FBQ0EsWUFBSUMsWUFBWUosVUFBaEI7QUFDQSxlQUFPRyxhQUFhQyxTQUFwQixFQUErQjtBQUM3QkQscUJBQVdDLFNBQVg7QUFDQUEsc0JBQVksZUFBS0gsT0FBTCxDQUFhRSxRQUFiLENBQVo7QUFDQSxjQUFJLGVBQUtFLFFBQUwsQ0FBY0QsU0FBZCxNQUE2QixVQUFqQyxFQUE2QztBQUMzQ0oseUJBQWFJLFNBQWI7QUFDQTtBQUNEO0FBQ0Y7QUFDRCxlQUFPLGVBQUtFLFFBQUwsQ0FBYyxNQUFLbkQsR0FBbkIsRUFBd0I2QyxVQUF4QixDQUFQO0FBQ0QsT0FibUIsQ0FBcEI7QUFjQSxhQUFPLGlCQUFFTyxJQUFGLENBQU9SLFdBQVAsQ0FBUDtBQUNEOzs7dUNBRWtCO0FBQ2pCLFVBQU1wQixnQkFBZ0IsaUJBQUU2QixLQUFGLENBQVEsS0FBS3pELE9BQUwsQ0FBYTRCLGFBQXJCLENBQXRCO0FBQ0FBLG9CQUFjeEIsR0FBZCxHQUFvQixLQUFLQSxHQUF6QjtBQUNBLHVCQUFFc0QsUUFBRixDQUFXOUIsYUFBWCxFQUEwQixFQUFFK0IsZUFBZSxJQUFqQixFQUExQjtBQUNBLGFBQU8vQixhQUFQO0FBQ0Q7OztpQ0FFWTtBQUNYLFVBQU1nQyxVQUFVLEVBQUUsSUFBSSxVQUFOLEVBQWhCO0FBQ0EsV0FBSzVELE9BQUwsQ0FBYTZELE1BQWIsQ0FBb0JDLE9BQXBCLENBQTRCLFVBQVNELE1BQVQsRUFBaUI7QUFDM0MsWUFBSUUsT0FBT0YsTUFBWDtBQUNBLFlBQUlHLFdBQVcsRUFBZjtBQUNBLFlBQU1DLFFBQVFKLE9BQU9LLEtBQVAsQ0FBYSxrQkFBYixDQUFkOztBQUVBLFlBQUlELE1BQU0zQyxNQUFOLEdBQWUsQ0FBbkIsRUFBc0I7QUFDcEJ5QyxpQkFBT0UsTUFBTUUsS0FBTixDQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCQyxJQUFsQixDQUF1QixFQUF2QixDQUFQO0FBQ0FKLHFCQUFXQyxNQUFNRSxLQUFOLENBQVksQ0FBWixFQUFlQyxJQUFmLENBQW9CLEVBQXBCLENBQVg7QUFDRDs7QUFFRFIsZ0JBQVFJLFFBQVIsSUFBb0JELElBQXBCO0FBQ0QsT0FYRDtBQVlBLGFBQU8saUJBQUVuQixHQUFGLENBQU1nQixPQUFOLEVBQWUsVUFBU0csSUFBVCxFQUFlQyxRQUFmLEVBQXlCO0FBQzdDLGVBQU8sRUFBRUEsa0JBQUYsRUFBWUQsVUFBWixFQUFQO0FBQ0QsT0FGTSxDQUFQO0FBR0Q7Ozs7d0RBRWlDO0FBQUE7O0FBQ2hDLFlBQUksS0FBS3ZELElBQUwsQ0FBVWMsTUFBVixHQUFtQixDQUF2QixFQUEwQjtBQUN4QixjQUFNK0MscUJBQXFCLE1BQU0sbUJBQVF6QixHQUFSLENBQVksS0FBS3BDLElBQWpCO0FBQUEsaURBQXVCLFdBQU04RCxHQUFOLEVBQWE7QUFDbkUsa0JBQU1DLFdBQVcsZUFBS2pCLFFBQUwsQ0FBY2dCLEdBQWQsQ0FBakI7QUFDQSxrQkFBSUMsU0FBUyxDQUFULE1BQWdCLEdBQXBCLEVBQXlCO0FBQ3ZCLG9CQUFNQyxXQUFXLGVBQUtKLElBQUwsQ0FBVSxPQUFLaEUsR0FBZixFQUFvQmtFLEdBQXBCLENBQWpCO0FBQ0Esb0JBQU1HLFVBQVUsTUFBTSxhQUFHQyxRQUFILENBQVlGLFFBQVosRUFBc0IsTUFBdEIsQ0FBdEI7QUFDQSx1QkFBTyxpQkFBRUcsS0FBRixDQUFRRixPQUFSLEVBQ0pQLEtBREksQ0FDRSxJQURGLEVBRUp0QixHQUZJLENBRUEsaUJBQUVnQyxJQUZGLEVBR0pDLE9BSEksR0FJSkMsS0FKSSxFQUFQO0FBS0QsZUFSRCxNQVFPO0FBQ0wsdUJBQU9SLEdBQVA7QUFDRDtBQUNGLGFBYmdDOztBQUFBO0FBQUE7QUFBQTtBQUFBLGNBQWpDO0FBY0EsY0FBTXZELGVBQWUsaUJBQUVnRSxPQUFGLENBQVVWLGtCQUFWLENBQXJCO0FBQ0EsY0FBSXRELGFBQWFPLE1BQWIsR0FBc0IsQ0FBMUIsRUFBNkI7QUFDM0IsbUJBQU9QLFlBQVA7QUFDRDtBQUNGO0FBQ0QsZUFBTyxDQUFDLFVBQUQsQ0FBUDtBQUNELE87Ozs7Ozs7Ozs7O3NEQUU0QkMsZ0IsRUFBa0I7QUFDN0MsWUFBTWdFLGFBQWEsQ0FBQyxJQUFELENBQW5CO0FBQ0EsYUFBS2hGLE9BQUwsQ0FBYWlGLFFBQWIsQ0FBc0JuQixPQUF0QixDQUE4QixvQkFBWTtBQUN4QyxjQUFNRyxRQUFRZ0IsU0FBU2YsS0FBVCxDQUFlLEdBQWYsQ0FBZDtBQUNBYyxxQkFBV0UsSUFBWCxDQUFnQmpCLE1BQU0sQ0FBTixDQUFoQjtBQUNBNUMsa0JBQVE0QyxNQUFNLENBQU4sQ0FBUjtBQUNELFNBSkQ7QUFLQSxlQUFPLE1BQU0sS0FBSzVELFlBQUwsQ0FBa0IwQyx5QkFBbEIsQ0FDWC9CLGdCQURXLEVBRVhnRSxVQUZXLENBQWI7QUFJRCxPOzs7Ozs7Ozs7Ozs7a0JBOUlrQmpGLG9CIiwiZmlsZSI6ImNvbmZpZ3VyYXRpb25fYnVpbGRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCdcbmltcG9ydCBBcmd2UGFyc2VyIGZyb20gJy4vYXJndl9wYXJzZXInXG5pbXBvcnQgZnMgZnJvbSAnbXovZnMnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IFBhdGhFeHBhbmRlciBmcm9tICcuL3BhdGhfZXhwYW5kZXInXG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uZmlndXJhdGlvbkJ1aWxkZXIge1xuICBzdGF0aWMgYXN5bmMgYnVpbGQob3B0aW9ucykge1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQ29uZmlndXJhdGlvbkJ1aWxkZXIob3B0aW9ucylcbiAgICByZXR1cm4gYXdhaXQgYnVpbGRlci5idWlsZCgpXG4gIH1cblxuICBjb25zdHJ1Y3Rvcih7IGFyZ3YsIGN3ZCB9KSB7XG4gICAgdGhpcy5jd2QgPSBjd2RcbiAgICB0aGlzLnBhdGhFeHBhbmRlciA9IG5ldyBQYXRoRXhwYW5kZXIoY3dkKVxuXG4gICAgY29uc3QgcGFyc2VkQXJndiA9IEFyZ3ZQYXJzZXIucGFyc2UoYXJndilcbiAgICB0aGlzLmFyZ3MgPSBwYXJzZWRBcmd2LmFyZ3NcbiAgICB0aGlzLm9wdGlvbnMgPSBwYXJzZWRBcmd2Lm9wdGlvbnNcbiAgfVxuXG4gIGFzeW5jIGJ1aWxkKCkge1xuICAgIGNvbnN0IGxpc3RJMThuS2V5d29yZHNGb3IgPSB0aGlzLm9wdGlvbnMuaTE4bktleXdvcmRzXG4gICAgY29uc3QgbGlzdEkxOG5MYW5ndWFnZXMgPSAhIXRoaXMub3B0aW9ucy5pMThuTGFuZ3VhZ2VzXG4gICAgY29uc3QgdW5leHBhbmRlZEZlYXR1cmVQYXRocyA9IGF3YWl0IHRoaXMuZ2V0VW5leHBhbmRlZEZlYXR1cmVQYXRocygpXG4gICAgbGV0IGZlYXR1cmVQYXRocyA9IFtdXG4gICAgbGV0IHN1cHBvcnRDb2RlUGF0aHMgPSBbXVxuICAgIGlmICghbGlzdEkxOG5LZXl3b3Jkc0ZvciAmJiAhbGlzdEkxOG5MYW5ndWFnZXMpIHtcbiAgICAgIGZlYXR1cmVQYXRocyA9IGF3YWl0IHRoaXMuZXhwYW5kRmVhdHVyZVBhdGhzKHVuZXhwYW5kZWRGZWF0dXJlUGF0aHMpXG4gICAgICBjb25zdCBmZWF0dXJlRGlyZWN0b3J5UGF0aHMgPSB0aGlzLmdldEZlYXR1cmVEaXJlY3RvcnlQYXRocyhmZWF0dXJlUGF0aHMpXG4gICAgICBjb25zdCB1bmV4cGFuZGVkU3VwcG9ydENvZGVQYXRocyA9XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZXF1aXJlLmxlbmd0aCA+IDBcbiAgICAgICAgICA/IHRoaXMub3B0aW9ucy5yZXF1aXJlXG4gICAgICAgICAgOiBmZWF0dXJlRGlyZWN0b3J5UGF0aHNcbiAgICAgIHN1cHBvcnRDb2RlUGF0aHMgPSBhd2FpdCB0aGlzLmV4cGFuZFN1cHBvcnRDb2RlUGF0aHMoXG4gICAgICAgIHVuZXhwYW5kZWRTdXBwb3J0Q29kZVBhdGhzXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBmZWF0dXJlRGVmYXVsdExhbmd1YWdlOiB0aGlzLm9wdGlvbnMubGFuZ3VhZ2UsXG4gICAgICBmZWF0dXJlUGF0aHMsXG4gICAgICBmb3JtYXRzOiB0aGlzLmdldEZvcm1hdHMoKSxcbiAgICAgIGZvcm1hdE9wdGlvbnM6IHRoaXMuZ2V0Rm9ybWF0T3B0aW9ucygpLFxuICAgICAgbGlzdEkxOG5LZXl3b3Jkc0ZvcixcbiAgICAgIGxpc3RJMThuTGFuZ3VhZ2VzLFxuICAgICAgcHJvZmlsZXM6IHRoaXMub3B0aW9ucy5wcm9maWxlLFxuICAgICAgcGlja2xlRmlsdGVyT3B0aW9uczoge1xuICAgICAgICBmZWF0dXJlUGF0aHM6IHVuZXhwYW5kZWRGZWF0dXJlUGF0aHMsXG4gICAgICAgIG5hbWVzOiB0aGlzLm9wdGlvbnMubmFtZSxcbiAgICAgICAgdGFnRXhwcmVzc2lvbjogdGhpcy5vcHRpb25zLnRhZ3NcbiAgICAgIH0sXG4gICAgICBydW50aW1lT3B0aW9uczoge1xuICAgICAgICBkcnlSdW46ICEhdGhpcy5vcHRpb25zLmRyeVJ1bixcbiAgICAgICAgZmFpbEZhc3Q6ICEhdGhpcy5vcHRpb25zLmZhaWxGYXN0LFxuICAgICAgICBmaWx0ZXJTdGFja3RyYWNlczogIXRoaXMub3B0aW9ucy5iYWNrdHJhY2UsXG4gICAgICAgIHN0cmljdDogISF0aGlzLm9wdGlvbnMuc3RyaWN0LFxuICAgICAgICB3b3JsZFBhcmFtZXRlcnM6IHRoaXMub3B0aW9ucy53b3JsZFBhcmFtZXRlcnNcbiAgICAgIH0sXG4gICAgICBzdXBwb3J0Q29kZVBhdGhzXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZXhwYW5kRmVhdHVyZVBhdGhzKGZlYXR1cmVQYXRocykge1xuICAgIGZlYXR1cmVQYXRocyA9IGZlYXR1cmVQYXRocy5tYXAocCA9PiBwLnJlcGxhY2UoLyg6XFxkKykqJC9nLCAnJykpIC8vIFN0cmlwIGxpbmUgbnVtYmVyc1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnBhdGhFeHBhbmRlci5leHBhbmRQYXRoc1dpdGhFeHRlbnNpb25zKGZlYXR1cmVQYXRocywgW1xuICAgICAgJ2ZlYXR1cmUnXG4gICAgXSlcbiAgfVxuXG4gIGdldEZlYXR1cmVEaXJlY3RvcnlQYXRocyhmZWF0dXJlUGF0aHMpIHtcbiAgICBjb25zdCBmZWF0dXJlRGlycyA9IGZlYXR1cmVQYXRocy5tYXAoZmVhdHVyZVBhdGggPT4ge1xuICAgICAgbGV0IGZlYXR1cmVEaXIgPSBwYXRoLmRpcm5hbWUoZmVhdHVyZVBhdGgpXG4gICAgICBsZXQgY2hpbGREaXJcbiAgICAgIGxldCBwYXJlbnREaXIgPSBmZWF0dXJlRGlyXG4gICAgICB3aGlsZSAoY2hpbGREaXIgIT09IHBhcmVudERpcikge1xuICAgICAgICBjaGlsZERpciA9IHBhcmVudERpclxuICAgICAgICBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoY2hpbGREaXIpXG4gICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKHBhcmVudERpcikgPT09ICdmZWF0dXJlcycpIHtcbiAgICAgICAgICBmZWF0dXJlRGlyID0gcGFyZW50RGlyXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHBhdGgucmVsYXRpdmUodGhpcy5jd2QsIGZlYXR1cmVEaXIpXG4gICAgfSlcbiAgICByZXR1cm4gXy51bmlxKGZlYXR1cmVEaXJzKVxuICB9XG5cbiAgZ2V0Rm9ybWF0T3B0aW9ucygpIHtcbiAgICBjb25zdCBmb3JtYXRPcHRpb25zID0gXy5jbG9uZSh0aGlzLm9wdGlvbnMuZm9ybWF0T3B0aW9ucylcbiAgICBmb3JtYXRPcHRpb25zLmN3ZCA9IHRoaXMuY3dkXG4gICAgXy5kZWZhdWx0cyhmb3JtYXRPcHRpb25zLCB7IGNvbG9yc0VuYWJsZWQ6IHRydWUgfSlcbiAgICByZXR1cm4gZm9ybWF0T3B0aW9uc1xuICB9XG5cbiAgZ2V0Rm9ybWF0cygpIHtcbiAgICBjb25zdCBtYXBwaW5nID0geyAnJzogJ3Byb2dyZXNzJyB9XG4gICAgdGhpcy5vcHRpb25zLmZvcm1hdC5mb3JFYWNoKGZ1bmN0aW9uKGZvcm1hdCkge1xuICAgICAgbGV0IHR5cGUgPSBmb3JtYXRcbiAgICAgIGxldCBvdXRwdXRUbyA9ICcnXG4gICAgICBjb25zdCBwYXJ0cyA9IGZvcm1hdC5zcGxpdCgvKFteQS1aXSk6KFteXFxcXF0pLylcblxuICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdHlwZSA9IHBhcnRzLnNsaWNlKDAsIDIpLmpvaW4oJycpXG4gICAgICAgIG91dHB1dFRvID0gcGFydHMuc2xpY2UoMikuam9pbignJylcbiAgICAgIH1cblxuICAgICAgbWFwcGluZ1tvdXRwdXRUb10gPSB0eXBlXG4gICAgfSlcbiAgICByZXR1cm4gXy5tYXAobWFwcGluZywgZnVuY3Rpb24odHlwZSwgb3V0cHV0VG8pIHtcbiAgICAgIHJldHVybiB7IG91dHB1dFRvLCB0eXBlIH1cbiAgICB9KVxuICB9XG5cbiAgYXN5bmMgZ2V0VW5leHBhbmRlZEZlYXR1cmVQYXRocygpIHtcbiAgICBpZiAodGhpcy5hcmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IG5lc3RlZEZlYXR1cmVQYXRocyA9IGF3YWl0IFByb21pc2UubWFwKHRoaXMuYXJncywgYXN5bmMgYXJnID0+IHtcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBwYXRoLmJhc2VuYW1lKGFyZylcbiAgICAgICAgaWYgKGZpbGVuYW1lWzBdID09PSAnQCcpIHtcbiAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLmN3ZCwgYXJnKVxuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnKVxuICAgICAgICAgIHJldHVybiBfLmNoYWluKGNvbnRlbnQpXG4gICAgICAgICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAgICAgICAubWFwKF8udHJpbSlcbiAgICAgICAgICAgIC5jb21wYWN0KClcbiAgICAgICAgICAgIC52YWx1ZSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGFyZ1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgY29uc3QgZmVhdHVyZVBhdGhzID0gXy5mbGF0dGVuKG5lc3RlZEZlYXR1cmVQYXRocylcbiAgICAgIGlmIChmZWF0dXJlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gZmVhdHVyZVBhdGhzXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBbJ2ZlYXR1cmVzJ11cbiAgfVxuXG4gIGFzeW5jIGV4cGFuZFN1cHBvcnRDb2RlUGF0aHMoc3VwcG9ydENvZGVQYXRocykge1xuICAgIGNvbnN0IGV4dGVuc2lvbnMgPSBbJ2pzJ11cbiAgICB0aGlzLm9wdGlvbnMuY29tcGlsZXIuZm9yRWFjaChjb21waWxlciA9PiB7XG4gICAgICBjb25zdCBwYXJ0cyA9IGNvbXBpbGVyLnNwbGl0KCc6JylcbiAgICAgIGV4dGVuc2lvbnMucHVzaChwYXJ0c1swXSlcbiAgICAgIHJlcXVpcmUocGFydHNbMV0pXG4gICAgfSlcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXRoRXhwYW5kZXIuZXhwYW5kUGF0aHNXaXRoRXh0ZW5zaW9ucyhcbiAgICAgIHN1cHBvcnRDb2RlUGF0aHMsXG4gICAgICBleHRlbnNpb25zXG4gICAgKVxuICB9XG59XG4iXX0=