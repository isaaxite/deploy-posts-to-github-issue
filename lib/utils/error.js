import { isDataObject } from "./index.js";

export class IsuboError extends Error {
  constructor(message, metadata) {
    super(message);
    this.name = 'IsuboError';
    let lastMetadata = null;
    if (metadata) {
      if (!isDataObject(metadata)) {
        throw new Error('metadata must be non-empty Object');
      }

      lastMetadata = metadata;
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
    super(`${dataName} must be non-empty Object`, metadata);
    this.name = 'DataObjectErr';
  }
}

export class AtLeastPropError extends IsuboError {
  constructor(propListStr, metadata) {
    super(`provide at least one of ${propListStr}`, metadata);
    this.name = 'AtLeastPropError';
  }
}

export class NonEmptyStringError extends IsuboError {
  constructor(dataName, metadata) {
    super(`${dataName} must be a non-empty String`, metadata);
    this.name = 'NonEmptyStringError';
  }
}

export class StringArrayError extends IsuboError {
  constructor(dataName, metadata) {
    super(`${dataName} must be a Array<String>`, metadata);
    this.name = 'StringArrayError';
  }
}

export class NonEmptyStringItemArrayError extends IsuboError {
  constructor(dataName, metadata) {
    super(`${dataName} must be a Array<String> and disable empty item`, metadata);
    this.name = 'NonEmptyStringItemArrayError';
  }
}

export class FileNotExistError extends IsuboError {
  constructor(filepath, metadata) {
    super(`${filepath} not exist`, metadata);
    this.name = 'FileNotExistError';
  }
}

export class TruthPositiveIntError extends IsuboError {
  constructor(dataName, metadata) {
    super(`${dataName} must be a positive integer`, metadata);
    this.name = 'TruthPositiveIntError';
  }
}