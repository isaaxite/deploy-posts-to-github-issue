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
