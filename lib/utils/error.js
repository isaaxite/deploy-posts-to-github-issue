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

export function throwCtorParamDataObjectErr() {
  throw new Error(`Constructor param must be non-empty Object`);
}

export function throwDataObjectErr(name) {
  throw new Error(`${name} must be non-empty Object`);
}

export function throwNonEmptyStringErr(name) {
  throw new Error(`${name} must be a non-empty String`);
}

export function throwStringArrayErr(name) {
  throw new Error(`${name} must be a Array<String>`);
}

export function throwNonEmptyStringItemArrayErr(name) {
  throw new Error(`${name} must be a Array<String> and disable empty item`);
}

export function throwFileExistErr(filepath) {
  throw new Error(`${filepath} not exist`);
}

export function throwTruthPositiveIntErr(name) {
  throw new Error(`${name} must be a positive integer`);
}
