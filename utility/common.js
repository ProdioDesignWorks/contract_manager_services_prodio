
const HttpErrors = require('http-errors');
const request = require('request');
const {
    findReplace,
    unique,
    isValidObject,
    isValid,
    flattenArray,
    clean,
    isArray,
    isObject,
    print,
    isNull,
    convertObjectIdToString
} = require('./helper');
const {
    ESIGN_APIS,
    ESIGN_TERMS,
    config
} = require('../config/constants');

const eSignGenieAPISHandler = require('./apis_handler');

exports.HttpErrors = HttpErrors;
exports.request = request
exports.findReplace =findReplace;
exports.unique = unique;
exports.isValidObject =isValidObject;
exports.isValid = isValid;
exports.flattenArray = flattenArray;
exports.clean = clean;
exports.isArray = isArray;
exports.isObject = isObject;
exports.print = print;
exports.isNull = isNull;

exports.ESIGN_APIS = ESIGN_APIS;
exports.ESIGN_TERMS = ESIGN_TERMS;
exports.config = config;

exports.eSignGenieAPISHandler = eSignGenieAPISHandler;
exports.convertObjectIdToString = convertObjectIdToString;


