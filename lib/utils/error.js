export function trowCtorParamDataObjectErr() {
  throw new Error(`Constructor param must be non-empty Object`);
}

export function trowDataObjectErr(name) {
  throw new Error(`${name} must be non-empty Object`);
}

export function trowNonEmptyStringErr(name) {
  throw new Error(`${name} must be a non-empty String`);
}

export function throwFileExistErr(filepath) {
  throw new Error(`${filepath} not exist`);
}
