export function manualBpoint(msg = '') {
  throw new Error(msg || 'TEST')
}

export function ctx(data, cb) {
  return {
    ...cb(data),
    ...data
  };
}

function toStringCall(val) {
  return Object.prototype.toString.call(val);
}

export function isArray(val) {
  return toStringCall(val) === '[object Array]';
}
