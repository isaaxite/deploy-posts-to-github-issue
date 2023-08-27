/* eslint max-classes-per-file: "off" */

import {
  isDataObject, isNonEmptyString, isNullOrUndefined, isStringArray,
} from './index.js';

/**
 * @typedef {string} IsuboErrorMessage
 * @typedef {Object<string, *>} IsuboErrorMetadata
 */

export class IsuboError extends Error {
  /**
   *
   * @param {IsuboErrorMessage} message
   * @param {IsuboErrorMetadata} metadata
   */
  constructor(message, metadata) {
    super(message);
    this.name = 'IsuboError';
    this.warning = '';
    let lastMetadata = null;
    if (!isNullOrUndefined(metadata)) {
      if (!isDataObject(metadata)) {
        // eslint-disable-next-line no-use-before-define
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
 */
export function primitiveDataErrorFactory({
  name,
  errMsg,
}) {
  return class extends IsuboError {
    /**
     * @param {string} dataName
     * @param {Object<string, *>} [metadata]
     */
    constructor(dataName, metadata) {
      let warning = '';
      let lastDataName = dataName;
      if (!isNonEmptyString(dataName)) {
        lastDataName = 'data';
        // eslint-disable-next-line no-use-before-define
        warning = new NonEmptyStringError('data').message;
      }
      const lastErrMsg = errMsg.replace('%s', lastDataName);
      super(lastErrMsg, metadata);
      this.name = name;
      this.warning = warning;
    }
  };
}

export class CtorParamDataObjectError extends IsuboError {
  /**
   * @param {Object<string, *>} [metadata]
   */
  constructor(metadata) {
    super('Constructor param must be non-empty Object', metadata);
    this.name = 'CtorParamDataObjectErr';
  }
}

export const DataObjectError = primitiveDataErrorFactory({
  name: 'DataObjectError',
  errMsg: '%s must be non-empty Object',
});

export class AtLeastPropError extends IsuboError {
  /**
   * @param {string} propListStr
   * @param {IsuboErrorMetadata} [metadata]
   */
  constructor(propListStr, metadata) {
    let warning = '';
    let lastPropListStr = propListStr;
    if (!isNonEmptyString(propListStr)) {
      lastPropListStr = 'propList';
      // eslint-disable-next-line no-use-before-define
      warning = new NonEmptyStringError('propListStr').message;
    }
    super(`provide at least one of ${lastPropListStr}`, metadata);
    this.name = 'AtLeastPropError';
    this.warning = warning;
  }
}

export const NonEmptyStringError = primitiveDataErrorFactory({
  name: 'NonEmptyStringError',
  errMsg: '%s must be a non-empty String',
});

export const StringArrayError = primitiveDataErrorFactory({
  name: 'StringArrayError',
  errMsg: '%s must be a Array<String>',
});

export const NonEmptyStringItemArrayError = primitiveDataErrorFactory({
  name: 'NonEmptyStringItemArrayError',
  errMsg: '%s must be a Array<String> and disable empty item',
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
      // eslint-disable-next-line no-use-before-define
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
      // eslint-disable-next-line no-use-before-define
      warning = new NonEmptyError('dirpath').message;
    }
    super(`${lastDirpath} not exist`, metadata);
    this.name = 'DirNotExistError';
    this.warning = warning;
  }
}

export const TruthPositiveIntError = primitiveDataErrorFactory({
  name: 'TruthPositiveIntError',
  errMsg: '%s must be a positive integer',
});

export const TruthNaturalNumError = primitiveDataErrorFactory({
  name: 'TruthNaturalNumError',
  errMsg: '%s must be a natural number',
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

export const NonEmptyError = primitiveDataErrorFactory({
  name: 'NonEmptyError',
  errMsg: '%s can not be empty',
});

export const NonEmptyStringOrNonEmptyStringItemArrayError = primitiveDataErrorFactory({
  name: 'NonEmptyStringOrNonEmptyStringItemArrayError',
  errMsg: '%s must be non-empty string or non-empty string array',
});

export const TruthNumberError = primitiveDataErrorFactory({
  name: 'TruthNumberError',
  errMsg: '%s must be a truth number',
});

export const NonArrayError = primitiveDataErrorFactory({
  name: 'NonArrayError',
  errMsg: '%s must be a Array',
});

export const NonStringError = primitiveDataErrorFactory({
  name: 'NonStringError',
  errMsg: '%s must be a String',
});

export const NonEmptyAbsolutePathError = primitiveDataErrorFactory({
  name: 'NonEmptyAbsolutePathError',
  errMsg: '%s must be non-empty absolute path',
});

export const NonEmptyAbsolutePathItemArrayError = primitiveDataErrorFactory({
  name: 'NonEmptyAbsolutePathItemArrayError',
  errMsg: '%s must be Array<AbsolutePath>',
});
