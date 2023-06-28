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

export function isDataObject(val) {
  return protoStringCall(val) === '[object Object]';
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