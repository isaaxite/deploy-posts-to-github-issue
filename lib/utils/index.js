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

export function isDataObject(val) {
  return protoStringCall(val) === '[object Object]';
}

export function isExecutableAsyncFn(val) {
  return protoStringCall(val) === '[object AsyncFunction]';
}

export function isExecutableFn(val) {
  return isExecutableAsyncFn(val) || protoStringCall(val) === '[object Function]';
}
