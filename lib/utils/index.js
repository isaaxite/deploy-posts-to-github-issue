export function manualBpoint(msg = '') {
  throw new Error(msg || 'TEST')
}

export function ctx(data, cb) {
  return {
    ...cb(data),
    ...data
  };
}
