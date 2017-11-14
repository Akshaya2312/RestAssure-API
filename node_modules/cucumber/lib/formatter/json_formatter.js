'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _2 = require('./');

var _3 = _interopRequireDefault(_2);

var _status = require('../status');

var _status2 = _interopRequireDefault(_status);

var _helpers = require('./helpers');

var _step_arguments = require('../step_arguments');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getStepLineToKeywordMap = _helpers.GherkinDocumentParser.getStepLineToKeywordMap,
    getScenarioLineToDescriptionMap = _helpers.GherkinDocumentParser.getScenarioLineToDescriptionMap;
var getScenarioDescription = _helpers.PickleParser.getScenarioDescription,
    getStepLineToPickledStepMap = _helpers.PickleParser.getStepLineToPickledStepMap,
    getStepKeyword = _helpers.PickleParser.getStepKeyword;

var JsonFormatter = function (_Formatter) {
  (0, _inherits3.default)(JsonFormatter, _Formatter);

  function JsonFormatter(options) {
    (0, _classCallCheck3.default)(this, JsonFormatter);

    var _this = (0, _possibleConstructorReturn3.default)(this, (JsonFormatter.__proto__ || Object.getPrototypeOf(JsonFormatter)).call(this, options));

    options.eventBroadcaster.on('test-run-finished', _this.onTestRunFinished.bind(_this));
    return _this;
  }

  (0, _createClass3.default)(JsonFormatter, [{
    key: 'convertNameToId',
    value: function convertNameToId(obj) {
      return obj.name.replace(/ /g, '-').toLowerCase();
    }
  }, {
    key: 'formatAttachments',
    value: function formatAttachments(attachments) {
      return attachments.map(function (attachment) {
        return {
          data: attachment.data,
          mime_type: attachment.mimeType
        };
      });
    }
  }, {
    key: 'formatDataTable',
    value: function formatDataTable(dataTable) {
      return {
        rows: dataTable.rows.map(function (row) {
          return { cells: _lodash2.default.map(row.cells, 'value') };
        })
      };
    }
  }, {
    key: 'formatDocString',
    value: function formatDocString(docString) {
      return {
        content: docString.content,
        line: docString.location.line
      };
    }
  }, {
    key: 'formatStepArguments',
    value: function formatStepArguments(stepArguments) {
      var iterator = (0, _step_arguments.buildStepArgumentIterator)({
        dataTable: this.formatDataTable.bind(this),
        docString: this.formatDocString.bind(this)
      });
      return _lodash2.default.map(stepArguments, iterator);
    }
  }, {
    key: 'onTestRunFinished',
    value: function onTestRunFinished() {
      var _this2 = this;

      var groupedTestCases = {};
      _lodash2.default.each(this.eventDataCollector.testCaseMap, function (testCase) {
        var uri = testCase.sourceLocation.uri;

        if (!groupedTestCases[uri]) {
          groupedTestCases[uri] = [];
        }
        groupedTestCases[uri].push(testCase);
      });
      var features = _lodash2.default.map(groupedTestCases, function (group, uri) {
        var gherkinDocument = _this2.eventDataCollector.gherkinDocumentMap[uri];
        var featureData = _this2.getFeatureData(gherkinDocument.feature, uri);
        var stepLineToKeywordMap = getStepLineToKeywordMap(gherkinDocument);
        var scenarioLineToDescriptionMap = getScenarioLineToDescriptionMap(gherkinDocument);
        featureData.elements = group.map(function (testCase) {
          var _eventDataCollector$g = _this2.eventDataCollector.getTestCaseData(testCase.sourceLocation),
              pickle = _eventDataCollector$g.pickle;

          var scenarioData = _this2.getScenarioData({
            featureId: featureData.id,
            pickle: pickle,
            scenarioLineToDescriptionMap: scenarioLineToDescriptionMap
          });
          var stepLineToPickledStepMap = getStepLineToPickledStepMap(pickle);
          var isBeforeHook = true;
          scenarioData.steps = testCase.steps.map(function (testStep) {
            isBeforeHook = isBeforeHook && !testStep.sourceLocation;
            return _this2.getStepData({
              isBeforeHook: isBeforeHook,
              stepLineToKeywordMap: stepLineToKeywordMap,
              stepLineToPickledStepMap: stepLineToPickledStepMap,
              testStep: testStep
            });
          });
          return scenarioData;
        });
        return featureData;
      });
      this.log(JSON.stringify(features, null, 2));
    }
  }, {
    key: 'getFeatureData',
    value: function getFeatureData(feature, uri) {
      return {
        description: feature.description,
        keyword: feature.keyword,
        name: feature.name,
        line: feature.location.line,
        id: this.convertNameToId(feature),
        tags: this.getTags(feature),
        uri: uri
      };
    }
  }, {
    key: 'getScenarioData',
    value: function getScenarioData(_ref) {
      var featureId = _ref.featureId,
          pickle = _ref.pickle,
          scenarioLineToDescriptionMap = _ref.scenarioLineToDescriptionMap;

      var description = getScenarioDescription({
        pickle: pickle,
        scenarioLineToDescriptionMap: scenarioLineToDescriptionMap
      });
      return {
        description: description,
        id: featureId + ';' + this.convertNameToId(pickle),
        keyword: 'Scenario',
        line: pickle.locations[0].line,
        name: pickle.name,
        tags: this.getTags(pickle),
        type: 'scenario'
      };
    }
  }, {
    key: 'getStepData',
    value: function getStepData(_ref2) {
      var isBeforeHook = _ref2.isBeforeHook,
          stepLineToKeywordMap = _ref2.stepLineToKeywordMap,
          stepLineToPickledStepMap = _ref2.stepLineToPickledStepMap,
          testStep = _ref2.testStep;

      var data = {};
      if (testStep.sourceLocation) {
        var line = testStep.sourceLocation.line;

        var pickleStep = stepLineToPickledStepMap[line];
        data.arguments = this.formatStepArguments(pickleStep.arguments);
        data.keyword = getStepKeyword({ pickleStep: pickleStep, stepLineToKeywordMap: stepLineToKeywordMap });
        data.line = line;
        data.name = pickleStep.text;
      } else {
        data.keyword = isBeforeHook ? 'Before' : 'After';
        data.hidden = true;
      }
      if (testStep.actionLocation) {
        data.match = { location: (0, _helpers.formatLocation)(testStep.actionLocation) };
      }
      if (testStep.result) {
        var _testStep$result = testStep.result,
            exception = _testStep$result.exception,
            status = _testStep$result.status;

        data.result = { status: status };
        if (testStep.result.duration) {
          data.result.duration = testStep.result.duration;
        }
        if (status === _status2.default.FAILED && exception) {
          data.result.error_message = exception.stack || exception;
        }
      }
      if (_lodash2.default.size(testStep.attachments) > 0) {
        data.embeddings = testStep.attachments;
      }
      return data;
    }
  }, {
    key: 'getTags',
    value: function getTags(obj) {
      return _lodash2.default.map(obj.tags, function (tagData) {
        return { name: tagData.name, line: tagData.location.line };
      });
    }
  }, {
    key: 'handleStepResult',
    value: function handleStepResult(stepResult) {
      var step = stepResult.step;
      var status = stepResult.status;

      var currentStep = {
        arguments: this.formatStepArguments(step.arguments),
        keyword: step.keyword,
        name: step.name,
        result: { status: status }
      };

      if (step.isBackground) {
        currentStep.isBackground = true;
      }

      if (step.constructor.name === 'Hook') {
        currentStep.hidden = true;
      } else {
        currentStep.line = step.line;
      }

      if (status === _status2.default.PASSED || status === _status2.default.FAILED) {
        currentStep.result.duration = stepResult.duration;
      }

      if (_lodash2.default.size(stepResult.attachments) > 0) {
        currentStep.embeddings = this.formatAttachments(stepResult.attachments);
      }

      if (status === _status2.default.FAILED && stepResult.failureException) {
        currentStep.result.error_message = stepResult.failureException.stack || stepResult.failureException;
      }

      if (stepResult.stepDefinition) {
        var location = stepResult.stepDefinition.uri + ':' + stepResult.stepDefinition.line;
        currentStep.match = { location: location };
      }

      this.currentScenario.steps.push(currentStep);
    }
  }]);
  return JsonFormatter;
}(_3.default);

exports.default = JsonFormatter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mb3JtYXR0ZXIvanNvbl9mb3JtYXR0ZXIuanMiXSwibmFtZXMiOlsiZ2V0U3RlcExpbmVUb0tleXdvcmRNYXAiLCJnZXRTY2VuYXJpb0xpbmVUb0Rlc2NyaXB0aW9uTWFwIiwiZ2V0U2NlbmFyaW9EZXNjcmlwdGlvbiIsImdldFN0ZXBMaW5lVG9QaWNrbGVkU3RlcE1hcCIsImdldFN0ZXBLZXl3b3JkIiwiSnNvbkZvcm1hdHRlciIsIm9wdGlvbnMiLCJldmVudEJyb2FkY2FzdGVyIiwib24iLCJvblRlc3RSdW5GaW5pc2hlZCIsIm9iaiIsIm5hbWUiLCJyZXBsYWNlIiwidG9Mb3dlckNhc2UiLCJhdHRhY2htZW50cyIsIm1hcCIsImF0dGFjaG1lbnQiLCJkYXRhIiwibWltZV90eXBlIiwibWltZVR5cGUiLCJkYXRhVGFibGUiLCJyb3dzIiwiY2VsbHMiLCJyb3ciLCJkb2NTdHJpbmciLCJjb250ZW50IiwibGluZSIsImxvY2F0aW9uIiwic3RlcEFyZ3VtZW50cyIsIml0ZXJhdG9yIiwiZm9ybWF0RGF0YVRhYmxlIiwiYmluZCIsImZvcm1hdERvY1N0cmluZyIsImdyb3VwZWRUZXN0Q2FzZXMiLCJlYWNoIiwiZXZlbnREYXRhQ29sbGVjdG9yIiwidGVzdENhc2VNYXAiLCJ1cmkiLCJ0ZXN0Q2FzZSIsInNvdXJjZUxvY2F0aW9uIiwicHVzaCIsImZlYXR1cmVzIiwiZ3JvdXAiLCJnaGVya2luRG9jdW1lbnQiLCJnaGVya2luRG9jdW1lbnRNYXAiLCJmZWF0dXJlRGF0YSIsImdldEZlYXR1cmVEYXRhIiwiZmVhdHVyZSIsInN0ZXBMaW5lVG9LZXl3b3JkTWFwIiwic2NlbmFyaW9MaW5lVG9EZXNjcmlwdGlvbk1hcCIsImVsZW1lbnRzIiwiZ2V0VGVzdENhc2VEYXRhIiwicGlja2xlIiwic2NlbmFyaW9EYXRhIiwiZ2V0U2NlbmFyaW9EYXRhIiwiZmVhdHVyZUlkIiwiaWQiLCJzdGVwTGluZVRvUGlja2xlZFN0ZXBNYXAiLCJpc0JlZm9yZUhvb2siLCJzdGVwcyIsInRlc3RTdGVwIiwiZ2V0U3RlcERhdGEiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwiZGVzY3JpcHRpb24iLCJrZXl3b3JkIiwiY29udmVydE5hbWVUb0lkIiwidGFncyIsImdldFRhZ3MiLCJsb2NhdGlvbnMiLCJ0eXBlIiwicGlja2xlU3RlcCIsImFyZ3VtZW50cyIsImZvcm1hdFN0ZXBBcmd1bWVudHMiLCJ0ZXh0IiwiaGlkZGVuIiwiYWN0aW9uTG9jYXRpb24iLCJtYXRjaCIsInJlc3VsdCIsImV4Y2VwdGlvbiIsInN0YXR1cyIsImR1cmF0aW9uIiwiRkFJTEVEIiwiZXJyb3JfbWVzc2FnZSIsInN0YWNrIiwic2l6ZSIsImVtYmVkZGluZ3MiLCJ0YWdEYXRhIiwic3RlcFJlc3VsdCIsInN0ZXAiLCJjdXJyZW50U3RlcCIsImlzQmFja2dyb3VuZCIsImNvbnN0cnVjdG9yIiwiUEFTU0VEIiwiZm9ybWF0QXR0YWNobWVudHMiLCJmYWlsdXJlRXhjZXB0aW9uIiwic3RlcERlZmluaXRpb24iLCJjdXJyZW50U2NlbmFyaW8iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztJQUdFQSx1QixrQ0FBQUEsdUI7SUFDQUMsK0Isa0NBQUFBLCtCO0lBSUFDLHNCLHlCQUFBQSxzQjtJQUNBQywyQix5QkFBQUEsMkI7SUFDQUMsYyx5QkFBQUEsYzs7SUFHbUJDLGE7OztBQUNuQix5QkFBWUMsT0FBWixFQUFxQjtBQUFBOztBQUFBLDRJQUNiQSxPQURhOztBQUVuQkEsWUFBUUMsZ0JBQVIsQ0FBeUJDLEVBQXpCLENBQTRCLG1CQUE1QixFQUFtRCxNQUFLQyxpQkFBeEQ7QUFGbUI7QUFHcEI7Ozs7b0NBRWVDLEcsRUFBSztBQUNuQixhQUFPQSxJQUFJQyxJQUFKLENBQVNDLE9BQVQsQ0FBaUIsSUFBakIsRUFBdUIsR0FBdkIsRUFBNEJDLFdBQTVCLEVBQVA7QUFDRDs7O3NDQUVpQkMsVyxFQUFhO0FBQzdC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ckMsRUFBd0M7QUFDdEM2RSxvQkFBWUosVUFBWixHQUF5QixLQUFLUSxpQkFBTCxDQUF1Qk4sV0FBVzNFLFdBQWxDLENBQXpCO0FBQ0Q7O0FBRUQsVUFBSW1FLFdBQVcsaUJBQU9FLE1BQWxCLElBQTRCTSxXQUFXTyxnQkFBM0MsRUFBNkQ7QUFDM0RMLG9CQUFZWixNQUFaLENBQW1CSyxhQUFuQixHQUNFSyxXQUFXTyxnQkFBWCxDQUE0QlgsS0FBNUIsSUFBcUNJLFdBQVdPLGdCQURsRDtBQUVEOztBQUVELFVBQUlQLFdBQVdRLGNBQWYsRUFBK0I7QUFDN0IsWUFBTXRFLFdBQ0o4RCxXQUFXUSxjQUFYLENBQTBCNUQsR0FBMUIsR0FBZ0MsR0FBaEMsR0FBc0NvRCxXQUFXUSxjQUFYLENBQTBCdkUsSUFEbEU7QUFFQWlFLG9CQUFZYixLQUFaLEdBQW9CLEVBQUVuRCxrQkFBRixFQUFwQjtBQUNEOztBQUVELFdBQUt1RSxlQUFMLENBQXFCdkMsS0FBckIsQ0FBMkJuQixJQUEzQixDQUFnQ21ELFdBQWhDO0FBQ0Q7Ozs7O2tCQXJNa0J0RixhIiwiZmlsZSI6Impzb25fZm9ybWF0dGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IEZvcm1hdHRlciBmcm9tICcuLydcbmltcG9ydCBTdGF0dXMgZnJvbSAnLi4vc3RhdHVzJ1xuaW1wb3J0IHsgZm9ybWF0TG9jYXRpb24sIEdoZXJraW5Eb2N1bWVudFBhcnNlciwgUGlja2xlUGFyc2VyIH0gZnJvbSAnLi9oZWxwZXJzJ1xuaW1wb3J0IHsgYnVpbGRTdGVwQXJndW1lbnRJdGVyYXRvciB9IGZyb20gJy4uL3N0ZXBfYXJndW1lbnRzJ1xuXG5jb25zdCB7XG4gIGdldFN0ZXBMaW5lVG9LZXl3b3JkTWFwLFxuICBnZXRTY2VuYXJpb0xpbmVUb0Rlc2NyaXB0aW9uTWFwXG59ID0gR2hlcmtpbkRvY3VtZW50UGFyc2VyXG5cbmNvbnN0IHtcbiAgZ2V0U2NlbmFyaW9EZXNjcmlwdGlvbixcbiAgZ2V0U3RlcExpbmVUb1BpY2tsZWRTdGVwTWFwLFxuICBnZXRTdGVwS2V5d29yZFxufSA9IFBpY2tsZVBhcnNlclxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBKc29uRm9ybWF0dGVyIGV4dGVuZHMgRm9ybWF0dGVyIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHN1cGVyKG9wdGlvbnMpXG4gICAgb3B0aW9ucy5ldmVudEJyb2FkY2FzdGVyLm9uKCd0ZXN0LXJ1bi1maW5pc2hlZCcsIDo6dGhpcy5vblRlc3RSdW5GaW5pc2hlZClcbiAgfVxuXG4gIGNvbnZlcnROYW1lVG9JZChvYmopIHtcbiAgICByZXR1cm4gb2JqLm5hbWUucmVwbGFjZSgvIC9nLCAnLScpLnRvTG93ZXJDYXNlKClcbiAgfVxuXG4gIGZvcm1hdEF0dGFjaG1lbnRzKGF0dGFjaG1lbnRzKSB7XG4gICAgcmV0dXJuIGF0dGFjaG1lbnRzLm1hcChmdW5jdGlvbihhdHRhY2htZW50KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBkYXRhOiBhdHRhY2htZW50LmRhdGEsXG4gICAgICAgIG1pbWVfdHlwZTogYXR0YWNobWVudC5taW1lVHlwZVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmb3JtYXREYXRhVGFibGUoZGF0YVRhYmxlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJvd3M6IGRhdGFUYWJsZS5yb3dzLm1hcChyb3cgPT4ge1xuICAgICAgICByZXR1cm4geyBjZWxsczogXy5tYXAocm93LmNlbGxzLCAndmFsdWUnKSB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZvcm1hdERvY1N0cmluZyhkb2NTdHJpbmcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudDogZG9jU3RyaW5nLmNvbnRlbnQsXG4gICAgICBsaW5lOiBkb2NTdHJpbmcubG9jYXRpb24ubGluZVxuICAgIH1cbiAgfVxuXG4gIGZvcm1hdFN0ZXBBcmd1bWVudHMoc3RlcEFyZ3VtZW50cykge1xuICAgIGNvbnN0IGl0ZXJhdG9yID0gYnVpbGRTdGVwQXJndW1lbnRJdGVyYXRvcih7XG4gICAgICBkYXRhVGFibGU6IHRoaXMuZm9ybWF0RGF0YVRhYmxlLmJpbmQodGhpcyksXG4gICAgICBkb2NTdHJpbmc6IHRoaXMuZm9ybWF0RG9jU3RyaW5nLmJpbmQodGhpcylcbiAgICB9KVxuICAgIHJldHVybiBfLm1hcChzdGVwQXJndW1lbnRzLCBpdGVyYXRvcilcbiAgfVxuXG4gIG9uVGVzdFJ1bkZpbmlzaGVkKCkge1xuICAgIGNvbnN0IGdyb3VwZWRUZXN0Q2FzZXMgPSB7fVxuICAgIF8uZWFjaCh0aGlzLmV2ZW50RGF0YUNvbGxlY3Rvci50ZXN0Q2FzZU1hcCwgdGVzdENhc2UgPT4ge1xuICAgICAgY29uc3QgeyBzb3VyY2VMb2NhdGlvbjogeyB1cmkgfSB9ID0gdGVzdENhc2VcbiAgICAgIGlmICghZ3JvdXBlZFRlc3RDYXNlc1t1cmldKSB7XG4gICAgICAgIGdyb3VwZWRUZXN0Q2FzZXNbdXJpXSA9IFtdXG4gICAgICB9XG4gICAgICBncm91cGVkVGVzdENhc2VzW3VyaV0ucHVzaCh0ZXN0Q2FzZSlcbiAgICB9KVxuICAgIGNvbnN0IGZlYXR1cmVzID0gXy5tYXAoZ3JvdXBlZFRlc3RDYXNlcywgKGdyb3VwLCB1cmkpID0+IHtcbiAgICAgIGNvbnN0IGdoZXJraW5Eb2N1bWVudCA9IHRoaXMuZXZlbnREYXRhQ29sbGVjdG9yLmdoZXJraW5Eb2N1bWVudE1hcFt1cmldXG4gICAgICBjb25zdCBmZWF0dXJlRGF0YSA9IHRoaXMuZ2V0RmVhdHVyZURhdGEoZ2hlcmtpbkRvY3VtZW50LmZlYXR1cmUsIHVyaSlcbiAgICAgIGNvbnN0IHN0ZXBMaW5lVG9LZXl3b3JkTWFwID0gZ2V0U3RlcExpbmVUb0tleXdvcmRNYXAoZ2hlcmtpbkRvY3VtZW50KVxuICAgICAgY29uc3Qgc2NlbmFyaW9MaW5lVG9EZXNjcmlwdGlvbk1hcCA9IGdldFNjZW5hcmlvTGluZVRvRGVzY3JpcHRpb25NYXAoXG4gICAgICAgIGdoZXJraW5Eb2N1bWVudFxuICAgICAgKVxuICAgICAgZmVhdHVyZURhdGEuZWxlbWVudHMgPSBncm91cC5tYXAodGVzdENhc2UgPT4ge1xuICAgICAgICBjb25zdCB7IHBpY2tsZSB9ID0gdGhpcy5ldmVudERhdGFDb2xsZWN0b3IuZ2V0VGVzdENhc2VEYXRhKFxuICAgICAgICAgIHRlc3RDYXNlLnNvdXJjZUxvY2F0aW9uXG4gICAgICAgIClcbiAgICAgICAgY29uc3Qgc2NlbmFyaW9EYXRhID0gdGhpcy5nZXRTY2VuYXJpb0RhdGEoe1xuICAgICAgICAgIGZlYXR1cmVJZDogZmVhdHVyZURhdGEuaWQsXG4gICAgICAgICAgcGlja2xlLFxuICAgICAgICAgIHNjZW5hcmlvTGluZVRvRGVzY3JpcHRpb25NYXBcbiAgICAgICAgfSlcbiAgICAgICAgY29uc3Qgc3RlcExpbmVUb1BpY2tsZWRTdGVwTWFwID0gZ2V0U3RlcExpbmVUb1BpY2tsZWRTdGVwTWFwKHBpY2tsZSlcbiAgICAgICAgbGV0IGlzQmVmb3JlSG9vayA9IHRydWVcbiAgICAgICAgc2NlbmFyaW9EYXRhLnN0ZXBzID0gdGVzdENhc2Uuc3RlcHMubWFwKHRlc3RTdGVwID0+IHtcbiAgICAgICAgICBpc0JlZm9yZUhvb2sgPSBpc0JlZm9yZUhvb2sgJiYgIXRlc3RTdGVwLnNvdXJjZUxvY2F0aW9uXG4gICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RlcERhdGEoe1xuICAgICAgICAgICAgaXNCZWZvcmVIb29rLFxuICAgICAgICAgICAgc3RlcExpbmVUb0tleXdvcmRNYXAsXG4gICAgICAgICAgICBzdGVwTGluZVRvUGlja2xlZFN0ZXBNYXAsXG4gICAgICAgICAgICB0ZXN0U3RlcFxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiBzY2VuYXJpb0RhdGFcbiAgICAgIH0pXG4gICAgICByZXR1cm4gZmVhdHVyZURhdGFcbiAgICB9KVxuICAgIHRoaXMubG9nKEpTT04uc3RyaW5naWZ5KGZlYXR1cmVzLCBudWxsLCAyKSlcbiAgfVxuXG4gIGdldEZlYXR1cmVEYXRhKGZlYXR1cmUsIHVyaSkge1xuICAgIHJldHVybiB7XG4gICAgICBkZXNjcmlwdGlvbjogZmVhdHVyZS5kZXNjcmlwdGlvbixcbiAgICAgIGtleXdvcmQ6IGZlYXR1cmUua2V5d29yZCxcbiAgICAgIG5hbWU6IGZlYXR1cmUubmFtZSxcbiAgICAgIGxpbmU6IGZlYXR1cmUubG9jYXRpb24ubGluZSxcbiAgICAgIGlkOiB0aGlzLmNvbnZlcnROYW1lVG9JZChmZWF0dXJlKSxcbiAgICAgIHRhZ3M6IHRoaXMuZ2V0VGFncyhmZWF0dXJlKSxcbiAgICAgIHVyaVxuICAgIH1cbiAgfVxuXG4gIGdldFNjZW5hcmlvRGF0YSh7IGZlYXR1cmVJZCwgcGlja2xlLCBzY2VuYXJpb0xpbmVUb0Rlc2NyaXB0aW9uTWFwIH0pIHtcbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IGdldFNjZW5hcmlvRGVzY3JpcHRpb24oe1xuICAgICAgcGlja2xlLFxuICAgICAgc2NlbmFyaW9MaW5lVG9EZXNjcmlwdGlvbk1hcFxuICAgIH0pXG4gICAgcmV0dXJuIHtcbiAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgaWQ6IGZlYXR1cmVJZCArICc7JyArIHRoaXMuY29udmVydE5hbWVUb0lkKHBpY2tsZSksXG4gICAgICBrZXl3b3JkOiAnU2NlbmFyaW8nLFxuICAgICAgbGluZTogcGlja2xlLmxvY2F0aW9uc1swXS5saW5lLFxuICAgICAgbmFtZTogcGlja2xlLm5hbWUsXG4gICAgICB0YWdzOiB0aGlzLmdldFRhZ3MocGlja2xlKSxcbiAgICAgIHR5cGU6ICdzY2VuYXJpbydcbiAgICB9XG4gIH1cblxuICBnZXRTdGVwRGF0YSh7XG4gICAgaXNCZWZvcmVIb29rLFxuICAgIHN0ZXBMaW5lVG9LZXl3b3JkTWFwLFxuICAgIHN0ZXBMaW5lVG9QaWNrbGVkU3RlcE1hcCxcbiAgICB0ZXN0U3RlcFxuICB9KSB7XG4gICAgY29uc3QgZGF0YSA9IHt9XG4gICAgaWYgKHRlc3RTdGVwLnNvdXJjZUxvY2F0aW9uKSB7XG4gICAgICBjb25zdCB7IGxpbmUgfSA9IHRlc3RTdGVwLnNvdXJjZUxvY2F0aW9uXG4gICAgICBjb25zdCBwaWNrbGVTdGVwID0gc3RlcExpbmVUb1BpY2tsZWRTdGVwTWFwW2xpbmVdXG4gICAgICBkYXRhLmFyZ3VtZW50cyA9IHRoaXMuZm9ybWF0U3RlcEFyZ3VtZW50cyhwaWNrbGVTdGVwLmFyZ3VtZW50cylcbiAgICAgIGRhdGEua2V5d29yZCA9IGdldFN0ZXBLZXl3b3JkKHsgcGlja2xlU3RlcCwgc3RlcExpbmVUb0tleXdvcmRNYXAgfSlcbiAgICAgIGRhdGEubGluZSA9IGxpbmVcbiAgICAgIGRhdGEubmFtZSA9IHBpY2tsZVN0ZXAudGV4dFxuICAgIH0gZWxzZSB7XG4gICAgICBkYXRhLmtleXdvcmQgPSBpc0JlZm9yZUhvb2sgPyAnQmVmb3JlJyA6ICdBZnRlcidcbiAgICAgIGRhdGEuaGlkZGVuID0gdHJ1ZVxuICAgIH1cbiAgICBpZiAodGVzdFN0ZXAuYWN0aW9uTG9jYXRpb24pIHtcbiAgICAgIGRhdGEubWF0Y2ggPSB7IGxvY2F0aW9uOiBmb3JtYXRMb2NhdGlvbih0ZXN0U3RlcC5hY3Rpb25Mb2NhdGlvbikgfVxuICAgIH1cbiAgICBpZiAodGVzdFN0ZXAucmVzdWx0KSB7XG4gICAgICBjb25zdCB7IHJlc3VsdDogeyBleGNlcHRpb24sIHN0YXR1cyB9IH0gPSB0ZXN0U3RlcFxuICAgICAgZGF0YS5yZXN1bHQgPSB7IHN0YXR1cyB9XG4gICAgICBpZiAodGVzdFN0ZXAucmVzdWx0LmR1cmF0aW9uKSB7XG4gICAgICAgIGRhdGEucmVzdWx0LmR1cmF0aW9uID0gdGVzdFN0ZXAucmVzdWx0LmR1cmF0aW9uXG4gICAgICB9XG4gICAgICBpZiAoc3RhdHVzID09PSBTdGF0dXMuRkFJTEVEICYmIGV4Y2VwdGlvbikge1xuICAgICAgICBkYXRhLnJlc3VsdC5lcnJvcl9tZXNzYWdlID0gZXhjZXB0aW9uLnN0YWNrIHx8IGV4Y2VwdGlvblxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoXy5zaXplKHRlc3RTdGVwLmF0dGFjaG1lbnRzKSA+IDApIHtcbiAgICAgIGRhdGEuZW1iZWRkaW5ncyA9IHRlc3RTdGVwLmF0dGFjaG1lbnRzXG4gICAgfVxuICAgIHJldHVybiBkYXRhXG4gIH1cblxuICBnZXRUYWdzKG9iaikge1xuICAgIHJldHVybiBfLm1hcChvYmoudGFncywgdGFnRGF0YSA9PiB7XG4gICAgICByZXR1cm4geyBuYW1lOiB0YWdEYXRhLm5hbWUsIGxpbmU6IHRhZ0RhdGEubG9jYXRpb24ubGluZSB9XG4gICAgfSlcbiAgfVxuXG4gIGhhbmRsZVN0ZXBSZXN1bHQoc3RlcFJlc3VsdCkge1xuICAgIGNvbnN0IHN0ZXAgPSBzdGVwUmVzdWx0LnN0ZXBcbiAgICBjb25zdCBzdGF0dXMgPSBzdGVwUmVzdWx0LnN0YXR1c1xuXG4gICAgY29uc3QgY3VycmVudFN0ZXAgPSB7XG4gICAgICBhcmd1bWVudHM6IHRoaXMuZm9ybWF0U3RlcEFyZ3VtZW50cyhzdGVwLmFyZ3VtZW50cyksXG4gICAgICBrZXl3b3JkOiBzdGVwLmtleXdvcmQsXG4gICAgICBuYW1lOiBzdGVwLm5hbWUsXG4gICAgICByZXN1bHQ6IHsgc3RhdHVzIH1cbiAgICB9XG5cbiAgICBpZiAoc3RlcC5pc0JhY2tncm91bmQpIHtcbiAgICAgIGN1cnJlbnRTdGVwLmlzQmFja2dyb3VuZCA9IHRydWVcbiAgICB9XG5cbiAgICBpZiAoc3RlcC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnSG9vaycpIHtcbiAgICAgIGN1cnJlbnRTdGVwLmhpZGRlbiA9IHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgY3VycmVudFN0ZXAubGluZSA9IHN0ZXAubGluZVxuICAgIH1cblxuICAgIGlmIChzdGF0dXMgPT09IFN0YXR1cy5QQVNTRUQgfHwgc3RhdHVzID09PSBTdGF0dXMuRkFJTEVEKSB7XG4gICAgICBjdXJyZW50U3RlcC5yZXN1bHQuZHVyYXRpb24gPSBzdGVwUmVzdWx0LmR1cmF0aW9uXG4gICAgfVxuXG4gICAgaWYgKF8uc2l6ZShzdGVwUmVzdWx0LmF0dGFjaG1lbnRzKSA+IDApIHtcbiAgICAgIGN1cnJlbnRTdGVwLmVtYmVkZGluZ3MgPSB0aGlzLmZvcm1hdEF0dGFjaG1lbnRzKHN0ZXBSZXN1bHQuYXR0YWNobWVudHMpXG4gICAgfVxuXG4gICAgaWYgKHN0YXR1cyA9PT0gU3RhdHVzLkZBSUxFRCAmJiBzdGVwUmVzdWx0LmZhaWx1cmVFeGNlcHRpb24pIHtcbiAgICAgIGN1cnJlbnRTdGVwLnJlc3VsdC5lcnJvcl9tZXNzYWdlID1cbiAgICAgICAgc3RlcFJlc3VsdC5mYWlsdXJlRXhjZXB0aW9uLnN0YWNrIHx8IHN0ZXBSZXN1bHQuZmFpbHVyZUV4Y2VwdGlvblxuICAgIH1cblxuICAgIGlmIChzdGVwUmVzdWx0LnN0ZXBEZWZpbml0aW9uKSB7XG4gICAgICBjb25zdCBsb2NhdGlvbiA9XG4gICAgICAgIHN0ZXBSZXN1bHQuc3RlcERlZmluaXRpb24udXJpICsgJzonICsgc3RlcFJlc3VsdC5zdGVwRGVmaW5pdGlvbi5saW5lXG4gICAgICBjdXJyZW50U3RlcC5tYXRjaCA9IHsgbG9jYXRpb24gfVxuICAgIH1cblxuICAgIHRoaXMuY3VycmVudFNjZW5hcmlvLnN0ZXBzLnB1c2goY3VycmVudFN0ZXApXG4gIH1cbn1cbiJdfQ==