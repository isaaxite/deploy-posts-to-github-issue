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

export class CtorParamDataObjectError extends IsuboError {
  constructor(metadata) {
    super('Constructor param must be non-empty Object', metadata);
    this.name = 'CtorParamDataObjectErr';
  }
}

export class DataObjectError extends IsuboError {
  constructor(dataName, metadata) {
    let warning = '';
    let lastDataName = dataName;
    if (!isNonEmptyString(dataName)) {
      lastDataName = 'data';
      warning = new NonEmptyStringError('data').message;
    }
    super(`${lastDataName} must be non-empty Object`, metadata);
    this.name = 'DataObjectErr';
    this.warning = warning;
  }
}

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

export class NonEmptyStringError extends IsuboError {
  constructor(dataName, metadata) {
    let warning = '';
    let lastDataName = dataName;
    if (!isNonEmptyString(dataName)) {
      lastDataName = 'data';
      warning = new NonEmptyStringError('data').message;
    }
    super(`${lastDataName} must be a non-empty String`, metadata);
    this.name = 'NonEmptyStringError';
    this.warning = warning;
  }
}

export class StringArrayError extends IsuboError {
  constructor(dataName, metadata) {
    let warning = '';
    let lastDataName = dataName;
    if (!isNonEmptyString(dataName)) {
      lastDataName = 'data';
      warning = new NonEmptyStringError('data').message;
    }
    super(`${lastDataName} must be a Array<String>`, metadata);
    this.name = 'StringArrayError';
    this.warning = warning;
  }
}

export class NonEmptyStringItemArrayError extends IsuboError {
  constructor(dataName, metadata) {
    let warning = '';
    let lastDataName = dataName;
    if (!isNonEmptyString(dataName)) {
      lastDataName = 'data';
      warning = new NonEmptyStringError('data').message;
    }
    super(`${lastDataName} must be a Array<String> and disable empty item`, metadata);
    this.name = 'NonEmptyStringItemArrayError';
    this.warning = warning;
  }
}

export class FileNotExistError extends IsuboError {
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


export class TruthPositiveIntError extends IsuboError {
  constructor(dataName, metadata) {
    let warning = '';
    let lastDataName = dataName;
    if (!isNonEmptyString(dataName)) {
      lastDataName = 'data';
      warning = new NonEmptyStringError('data').message;
    }
    super(`${lastDataName} must be a positive integer`, metadata);
    this.name = 'TruthPositiveIntError';
    this.warning = warning;
  }
}

export class TruthNaturalNumError extends IsuboError {
  constructor(dataName, metadata) {
    let warning = '';
    let lastDataName = dataName;
    if (!isNonEmptyString(dataName)) {
      lastDataName = 'data';
      warning = new NonEmptyStringError('data').message;
    }
    super(`${lastDataName} must be a natural number`, metadata);
    this.name = 'TruthNaturalNumError';
    this.warning = warning;
  }
}

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

export class NonEmptyError extends IsuboError {
  constructor(dataName, metadata) {
    let warning = '';
    let lastDataName = dataName;
    if (!isNonEmptyString(dataName)) {
      lastDataName = 'data';
      warning = new NonEmptyStringError('data').message;
    }
    super(`${lastDataName} can not be empty`, metadata);
    this.name = 'NonEmptyError';
    this.warning = warning;
  }
}

export class NonEmptyStringOrNonEmptyStringItemArrayError extends IsuboError {
  constructor(dataName, metadata) {
    let warning = '';
    let lastDataName = dataName;
    if (!isNonEmptyString(dataName)) {
      lastDataName = 'data';
      warning = new NonEmptyStringError('data').message;
    }
    super(`${lastDataName} must be non-empty string or non-empty string array`, metadata);
    this.name = 'NonEmptyStringOrNonEmptyStringItemArrayError';
    this.warning = warning;
  }
}

