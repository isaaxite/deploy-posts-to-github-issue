import { isDataObject, isNonEmptyString, isNullOrUndefined, isStringArray } from "./index.js";

export class IsuboError extends Error {
  constructor(message, metadata) {
    super(message);
    this.name = 'IsuboError';
    this.warning = '';
    let lastMetadata = null;
    if (!isNullOrUndefined(metadata)) {
      if (!isDataObject(metadata)) {
        this.warning = new DataObjectError('metadata').message;
      } else {
        lastMetadata = metadata;
      }
    }
    this.metadata = lastMetadata;
    Error.captureStackTrace(this, IsuboError);
  }
}

/**
 * @typedef {Object} Param
 * @property {string} name
 * @property {string} errMsg
 * 
 * @param {Param} param0
 * @returns {Class}
 * @extends {IsuboError}
 * 
 * @param {...*} args - 构造函数的参数。
 * @param {*} args[0] - 参数1的描述。
 * @param {*} args[1] - 参数2的描述。
 */
export function primitiveDataErrorFactory({
  name,
  errMsg
}) {
  return class extends IsuboError {
    /**
     * 
     * @param {string} dataName 
     * @param {object} metadata 
     */
    constructor(dataName, metadata) {
      let warning = '';
      let lastDataName = dataName;
      if (!isNonEmptyString(dataName)) {
        lastDataName = 'data';
        warning = new NonEmptyStringError('data').message;
      }
      const lastErrMsg = errMsg.replace('%s', lastDataName);
      super(lastErrMsg, metadata);
      this.name = name;
      this.warning = warning;
    }
  }  
}


export class CtorParamDataObjectError extends IsuboError {
  constructor(metadata) {
    super('Constructor param must be non-empty Object', metadata);
    this.name = 'CtorParamDataObjectErr';
  }
}

/**
 * @class
 * @param {string} dataName
 * @param {object} [metadata]
 */
export const DataObjectError = primitiveDataErrorFactory({
  name: 'DataObjectError',
  errMsg: '%s must be non-empty Object'
});

export class AtLeastPropError extends IsuboError {
  constructor(propListStr, metadata) {
    let warning = '';
    let lastPropListStr = propListStr;
    if (!isNonEmptyString(propListStr)) {
      lastPropListStr = 'propList';
      warning = new NonEmptyStringError('propListStr').message;
    }
    super(`provide at least one of ${lastPropListStr}`, metadata);
    this.name = 'AtLeastPropError';
    this.warning = warning;
  }
}

/**
 * @class
 * @param {string} dataName
 * @param {object} [metadata]
 */
export const NonEmptyStringError = primitiveDataErrorFactory({
  name: 'NonEmptyStringError',
  errMsg: '%s must be a non-empty String'
});

/**
 * @class
 * @param {string} dataName
 * @param {object} [metadata]
 */
export const StringArrayError = primitiveDataErrorFactory({
  name: 'StringArrayError',
  errMsg: '%s must be a Array<String>'
});

/**
 * @class
 * @param {string} dataName
 * @param {object} [metadata]
 */
export const NonEmptyStringItemArrayError = primitiveDataErrorFactory({
  name: 'NonEmptyStringItemArrayError',
  errMsg: '%s must be a Array<String> and disable empty item'
});

export class FileNotExistError extends IsuboError {
  /**
   * @param {string} filepath - file path
   * @param {object} [metadata]
   */
  constructor(filepath, metadata) {
    let warning = '';
    let lastFilepath = filepath;
    if (!isNonEmptyString(filepath)) {
      lastFilepath = 'file path';
      warning = new NonEmptyError('filepath').message;
    }
    super(`${lastFilepath} not exist`, metadata);
    this.name = 'FileNotExistError';
    this.warning = warning;
  }
}

export class DirNotExistError extends IsuboError {
  constructor(dirpath, metadata) {
    let warning = '';
    let lastDirpath = dirpath;
    if (!isNonEmptyString(dirpath)) {
      lastDirpath = 'dir path';
      warning = new NonEmptyError('dirpath').message;
    }
    super(`${lastDirpath} not exist`, metadata);
    this.name = 'DirNotExistError';
    this.warning = warning;
  }
}

/**
 * @class
 * @param {string} dataName
 * @param {object} [metadata]
 */
export const TruthPositiveIntError = primitiveDataErrorFactory({
  name: 'TruthPositiveIntError',
  errMsg: '%s must be a positive integer'
});

/**
 * @class
 * @param {string} dataName
 * @param {object} [metadata]
 */
export const TruthNaturalNumError = primitiveDataErrorFactory({
  name: 'TruthNaturalNumError',
  errMsg: '%s must be a natural number'
});

export class InvalidPatternListError extends IsuboError {
  constructor(invalidPatternList, metadata) {
    let warning = '';
    let errMsg = '';
    if (isStringArray(invalidPatternList)) {
      errMsg = `patterns invalid: ${invalidPatternList.join(', ')}`;
    } else {
      errMsg = 'patterns have invalid item';
      warning = new StringArrayError('invalidPatternList').message;
    }
    super(errMsg, metadata);
    this.name = 'InvalidPatternListError';
    this.warning = warning;
  }
}

/**
 * @class
 * @param {string} dataName
 * @param {object} [metadata]
 */
export const NonEmptyError = primitiveDataErrorFactory({
  name: 'NonEmptyError',
  errMsg: '%s can not be empty'
});

/**
 * @class
 * @param {string} dataName
 * @param {object} [metadata]
 */
export const NonEmptyStringOrNonEmptyStringItemArrayError = primitiveDataErrorFactory({
  name: 'NonEmptyStringOrNonEmptyStringItemArrayError',
  errMsg: '%s must be non-empty string or non-empty string array'
});

/**
 * @class
 * @param {string} dataName
 * @param {object} [metadata]
 */
export const TruthNumberError = primitiveDataErrorFactory({
  name: 'TruthNumberError',
  errMsg: '%s must be a truth number'
});
