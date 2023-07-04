import path from 'path';

export function manualBpoint(msg = '') {
  throw new Error(msg || 'TEST')
}

export function ctx(data, cb) {
  return {
    ...cb(data),
    ...data
  };
}

function protoStringCall(val) {
  return Object.prototype.toString.call(val);
}

export function isArray(val) {
  return protoStringCall(val) === '[object Array]';
}

export function isStringArray(val) {
  return isArray(val) && val.every(s => isString(s));
}

export function isNonEmptyStringItemArray(val) {
  return isArray(val) && val.every(s => s && isString(s));
}

export function isNonEmptyAbsolutePathItemArray(val) {
  return isArray(val) && val.every(s => isNonEmptyAbsolutePath(s));
}

export function isNonEmptyArray(val) {
  return isArray(val) && val.length;
}

export function isNonNullObject(val) {
  return val && protoStringCall(val) === '[object Object]';
}

export function isDataObject(val) {
  return isNonNullObject(val) && !!Object.keys(val).length;
}

export function isExecutableAsyncFn(val) {
  return protoStringCall(val) === '[object AsyncFunction]';
}

export function isExecutableFn(val) {
  return isExecutableAsyncFn(val) || protoStringCall(val) === '[object Function]';
}

export function isString(val) {
  return protoStringCall(val) === '[object String]';
}

export function isNonEmptyString(val) {
  return val && isString(val);
}

export function isNonEmptyAbsolutePath(val) {
  return isNonEmptyString(val) && path.isAbsolute(val);
}

export function uniqueArray(arr) {
  return Array.from(new Set(arr));
}

export function isUndefined(val) {
  return protoStringCall(val) === '[object Undefined]';
}

export function isTruthNumber(val) {
  return protoStringCall(val) === '[object Number]';
}

export function isTruthNaturalNum(val) {
  return isTruthNumber(val) && val >= 0;
}

export function cov2num(value, def = 0) {
  let ret = def;
  if (typeof value === 'number') {
    ret = value;
  } else if (typeof value === 'string') {
    let numberValue = parseInt(value);
    if (!isNaN(numberValue)) {
      ret = NUmber(value);
    }
  }

  return ret;
}

export function genOneLayerReadOnlyDataObject(data) {
  const ret = {};
  const setWritableVal = (value) => ({ value, writable: false });
  const param = {};

  for (const [key, val] of Object.entries(data)) {
    param[key] = setWritableVal(val);
  }
  Object.defineProperties(ret, param);

  return ret;
}
