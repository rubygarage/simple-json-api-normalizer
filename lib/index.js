'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.normalize = undefined;

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _reduce = require('lodash/reduce');

var _reduce2 = _interopRequireDefault(_reduce);

var _groupBy = require('lodash/groupBy');

var _groupBy2 = _interopRequireDefault(_groupBy);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var camelizeString = function camelizeString(str) {
  return str.replace(/-(.)/g, function (match, group) {
    return group.toUpperCase();
  });
};

var entityNormalizers = {};

var camelizeKeys = function camelizeKeys(object) {
  var camelizeObject = {};
  Object.keys(object).forEach(function (key) {
    return camelizeObject[camelizeString(key)] = object[key];
  });
  return camelizeObject;
};

var normalizeEntity = function normalizeEntity(entity) {
  var normalized = {
    id: entity.id,
    type: entity.type
  };

  Object.keys(entity.attributes || []).forEach(function (key) {
    normalized[key] = entity.attributes[key];
  });

  Object.keys(entity.relationships || []).forEach(function (key) {
    var value = entity.relationships[key];
    if ((0, _isArray2.default)(value.data)) {
      normalized[key] = value.data.map(function (item) {
        return item.id;
      });
    } else if ((0, _isObject2.default)(value.data)) {
      normalized[key] = value.data.id;
    }
  });

  var entityNormalizer = entityNormalizers[entity.type];

  return entityNormalizer ? entityNormalizer(normalized) : normalized;
};

var normalizeResponse = function normalizeResponse(_ref) {
  var data = _ref.data,
      included = _ref.included;

  var dataList = [].concat(((0, _isArray2.default)(data) ? data : [data]).map(normalizeEntity)).concat((included || []).map(normalizeEntity));

  var grouped = (0, _groupBy2.default)(dataList, function (value) {
    return value.type;
  });
  var entities = {};
  var results = {};

  (0, _map2.default)(grouped, function (values, key) {
    results[key] = [];
    entities[key] = (0, _reduce2.default)(values, function (result, value) {
      var formatResult = result;
      formatResult[value.id] = camelizeKeys(value);
      results[key].push(value.id);
      return formatResult;
    }, {});
  });

  return { results: results, entities: entities };
};

var normalize = exports.normalize = function normalize(obj) {
  if (!(0, _isObject2.default)(obj)) {
    throw new Error('Simple JSON API normalizer accepts only an object.');
  }

  return normalizeResponse(obj);
};