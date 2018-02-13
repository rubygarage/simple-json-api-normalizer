import isObject from 'lodash/isObject'
import isArray from 'lodash/isArray'
import reduce from 'lodash/reduce'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'

const camelizeString = function (str) {
  return str.replace(/-(.)/g, (match, group) => group.toUpperCase())
}

const entityNormalizers = {}

const camelizeKeys = function (object) {
  const camelizeObject = {}
  Object.keys(object).forEach((key) => (
    camelizeObject[camelizeString(key)] = object[key]
  ))
  return camelizeObject
}

const normalizeEntity = function(entity) {
  const normalized = {
    id: entity.id,
    type: entity.type,
  }

  Object.keys(entity.attributes || []).forEach((key) => {
    normalized[key] = entity.attributes[key]
  })

  Object.keys(entity.relationships || []).forEach((key) => {
    const value = entity.relationships[key]
    if (isArray(value.data)) {
      normalized[key] = value.data.map((item) => item.id)
    } else if (isObject(value.data)) {
      normalized[key] = value.data.id
    }
  })

  const entityNormalizer = entityNormalizers[entity.type]

  return entityNormalizer ?
    entityNormalizer(normalized) :
    normalized
}

const normalizeResponse = function({ data, included }) {
  const dataList = []
    .concat((isArray(data) ? data : [data]).map(normalizeEntity))
    .concat((included || []).map(normalizeEntity))

  const grouped = groupBy(dataList, (value) => value.type)
  const entities = {}
  const results = {}

  map(grouped, (values, key) => {
    results[key] = []
    entities[key] = reduce(values, (result, value) => {
      const formatResult = result
      formatResult[value.id] = camelizeKeys(value)
      results[key].push(value.id)
      return formatResult
    }, {})
  })

  return { results, entities }
}

export const normalize = function(obj) {
  if (!isObject(obj)) {
    throw new Error('Simple JSON API normalizer accepts only an object.')
  }

  return normalizeResponse(obj)
}
