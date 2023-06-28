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

export function uniqueArray(arr) {
  return Array.from(new Set(arr));
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
