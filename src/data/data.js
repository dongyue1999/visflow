/**
 * @fileoverview VisFlow data object, and data definitions.
 * The original data in table format is immutable within the system.
 */

'use strict';

/**
 * @typedef {{
 *   dimensions: !Array<string>,
 *   dimensionTypes: !Array<visflow.ValueType>,
 *   dimensionDuplicate: !Array<boolean>,
 *   values: !Array<!Array<string|number>>,
 *   type: string,
 *   hash: string
 * }}
 */
visflow.TabularData;

/** @const */
visflow.data = {};

/**
 * Counter to set process based dataIds.
 * @type {number}
 */
visflow.data.counter = 0;

/**
 * Dimension index of item table index.
 * @const {number}
 */
visflow.data.INDEX_DIM = -1;

/** @const {string} */
visflow.data.INDEX_TEXT = '[index]';

/**
 * Data references by their hashes. When same datasets are loaded, the same
 * data object is re-used to save memory.
 * @type {!Object<!visflow.Data>}
 */
visflow.data.hashToData = {};

/**
 * Raw data references by the hashed values of their loading info, i.e. name,
 * file and isServerData. It is considered not possible to duplicate if all
 * these three entries match.
 * @type {!Object<!visflow.TabularData>}
 */
visflow.data.infoHashToRawData = {};

/**
 * Returns a hash of data loading info, including name, file and isServer.
 * If the hash value matches, the data should be the same.
 * @param {!{
 *   name: string,
 *   file: string,
 *   isServerData: boolean
 * }} dataInfo
 * @return {string}
 */
visflow.data.infoHash = function(dataInfo) {
  return CryptoJS.SHA256([
    dataInfo.name,
    dataInfo.file,
    dataInfo.isServerData
  ].join(',')).toString();
};

/**
 * Checks for duplicate data.
 * @param {!{
 *   name: string,
 *   file: string,
 *   isServerData: boolean
 * }} dataInfo
 * @return {visflow.TabularData} null if no duplicate,
 *     and the duplicate data otherwise.
 */
visflow.data.duplicateData = function(dataInfo) {
  var infoHash = visflow.data.infoHash(dataInfo);
  if (infoHash in visflow.data.infoHashToRawData) {
    return visflow.data.infoHashToRawData[infoHash];
  }
  return null;
};

/**
 * Registers the raw data.
 * @param {!{
 *   name: string,
 *   file: string,
 *   isServerData: boolean
 * }} dataInfo
 * @param {!visflow.TabularData} data
 */
visflow.data.registerRawData = function(dataInfo, data) {
  var infoHash = visflow.data.infoHash(dataInfo);
  visflow.data.infoHashToRawData[infoHash] = data;
};

/**
 * Registers the flow data.
 * @param {!visflow.Data} data
 */
visflow.data.registerData = function(data) {
  if (data == null || data.type === '') {
    visflow.error('attempt register null/empty data');
    return;
  }
  if (!(data.hash in visflow.data.hashToData)) {
    visflow.data.hashToData[data.hash] = data;
    data.dataId = ++visflow.data.counter;
  } else {
    data.dataId = visflow.data.hashToData[data.hash].dataId;
  }
};


/**
 * @param {visflow.TabularData} data
 * @constructor
 */
visflow.Data = function(data) {
  if (data == null) {
    _(this).extend({  // empty data object
      dimensions: [],
      dimensionTypes: [],
      dimensionDuplicate: [],
      values: [],
      dataId: 0,
      type: ''
    });
    return;
  }

  if (data.type === 'constants') {
    visflow.error('reserved type "constants" used for data');
    return;
  }

  [
    'type',
    'dimensions',
    'dimensionTypes',
    'dimensionDuplicate',
    'hash'
  ].forEach(function(key) {
    if (data[key] == null) {
      visflow.error(key, 'not found in data');
    }
  });

  /**
   * Type of data. It will be a hash value of the data's dimensions and
   * dimension types.
   * @type {string}
   */
  this.type = data.type;
  /**
   * Name of the data.
   * @type {string}
   */
  this.name = data.name;
  /**
   * File information, usually the file name.
   * If the data is from online sources, then the value is 'online'.
   * @type {string}
   */
  this.file = data.file;
  /**
   * List of dimensions.
   * @type {!Array<string>}
   */
  this.dimensions = data.dimensions;
  /**
   * Dimension types: int, float, string.
   * @type {!Array<string>}
   */
  this.dimensionTypes = data.dimensionTypes;
  /**
   * Whether the dimension contains duplicate values.
   * @type {!Array<boolean>}
   */
  this.dimensionDuplicate = data.dimensionDuplicate;
  /**
   * Hash id of the data, computed from all values inside the data.
   * @type {string}
   */
  this.hash = data.hash;
  /**
   * Data attribute values.
   * @type {!Array<!Array<number|string>>}
   */
  this.values = data.values;
};

/**
 * Checks if the data is empty data.
 * @return {boolean}
 */
visflow.Data.prototype.isEmpty = function() {
  return this.type === '';
};

/**
 * Checks if the given data matches itself.
 * @param {!visflow.Data} data
 * @return {boolean}
 */
visflow.Data.prototype.matchDataFormat = function(data) {
  if (this.type === '' || data.type === '') {
    // Empty data is compatible with anything.
    return true;
  }
  return this.type == data.type;
};
