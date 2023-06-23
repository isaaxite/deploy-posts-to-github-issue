export function ctx(data, cb) {
  return {
    ...cb(data),
    ...data
  };
}
