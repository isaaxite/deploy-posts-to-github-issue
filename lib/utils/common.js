import path from 'path';
import { hinter } from '../hinter.js';

export function protoStringCall(val) {
  return Object.prototype.toString.call(val);
}

export function isArray(val) {
  return protoStringCall(val) === '[object Array]';
}

export function isString(val) {
  return protoStringCall(val) === '[object String]';
}

export function isStringArray(val) {
  return isArray(val) && val.every((s) => isString(s));
}

export function isNonEmptyArray(val) {
  return isArray(val) && !!val.length;
}

export function isNonEmptyStringItemArray(val) {
  return isNonEmptyArray(val) && val.every((s) => s && isString(s));
}

export function isNonEmptyString(val) {
  return val && isString(val);
}

export function isNonEmptyAbsolutePath(val) {
  return isNonEmptyString(val) && path.isAbsolute(val);
}

export function isNonEmptyAbsolutePathItemArray(val) {
  return isArray(val) && val.every((s) => isNonEmptyAbsolutePath(s));
}

export function isNonNullObject(val) {
  return !!val && protoStringCall(val) === '[object Object]';
}

export function isDataObject(val) {
  return isNonNullObject(val) && !!Object.keys(val).length;
}

export function uniqueArray(arr) {
  return Array.from(new Set(arr));
}

export function isUndefined(val) {
  return protoStringCall(val) === '[object Undefined]';
}

export function isNull(val) {
  return protoStringCall(val) === '[object Null]';
}

export function isNullOrUndefined(val) {
  return isUndefined(val) || isNull(val);
}

export function isTruthNumber(val) {
  return protoStringCall(val) === '[object Number]';
}

export function isTruthNaturalNum(val) {
  return isTruthNumber(val) && val >= 0 && Math.ceil(val) === val;
}

export function isTruthPositiveInt(val) {
  return isTruthNaturalNum(val) && val > 0;
}

export function isAtLeastOneOf(...argvs) {
  return argvs.some((argv) => !isUndefined(argv));
}

export function isPlainFunction(val) {
  return protoStringCall(val) === '[object Function]';
}

export function isAsyncFunction(val) {
  return protoStringCall(val) === '[object AsyncFunction]';
}

export function isFunction(val) {
  return isPlainFunction(val) || isAsyncFunction(val);
}

/**
 * @template DataType extends Object
 * @param {DataType} data
 * @returns {DataType}
 */
export function defineConstStruct(data) {
  const isBasicRefStruct = (val) => isArray(val) || isNonNullObject(val);
  if (!isBasicRefStruct(data)) {
    return data;
  }

  const ret = isArray(data) ? [] : {};

  if (isArray(data)) {
    ['push', 'pop', 'shift', 'splice'].forEach((funcName) => {
      Object.defineProperty(ret, funcName, {
        value: () => {},
        writable: false,
        enumerable: false,
        configurable: false,
      });
    });
  }

  const setDisWritableVal = (value) => ({
    value: defineConstStruct(value),
    writable: false,
    enumerable: true,
    configurable: false,
  });
  const param = {};

  Object.keys(data).forEach((key) => {
    const val = data[key];
    param[key] = setDisWritableVal(val);
  });

  Object.defineProperties(ret, param);

  return ret;
}

/**
 * @template SrcType
 * @template ExtendType
 *
 * @param {SrcType} data
 * @param {function(SrcType): ExtendType} cb
 * @returns {SrcType & ExtendType}
 */
export function ctx(data, cb) {
  return defineConstStruct({
    ...cb(data),
    ...data,
  });
}

/**
 * covert a string number to real number
 * if input data is not a string number, def will return insteat.
 *
 * @param {number|string} value data that need to covert to number
 * @param {number} def - default number
 * @returns {number}
 */
export function cov2num(value, def = 0) {
  let ret = def;
  if (isTruthNumber(value)) {
    ret = value;
  } else if (isString(value)) {
    const numberValue = parseInt(value, 10);
    if (!Number.isNaN(numberValue)) {
      ret = Number(value);
    }
  }

  return ret;
}

export function requestQueue(requests, opt = {}) {
  let index = 0;
  let activeRequests = 0;
  const results = [];
  const maxRequests = opt?.maxRequests || 6;
  const timeout = opt?.timeout || 5 * 1000;

  return new Promise((resolve) => {
    function next() {
      if (index >= requests.length && activeRequests === 0) {
        resolve(results);
        return;
      }

      while (activeRequests < maxRequests && index < requests.length) {
        const current = index;
        const promise = requests[current]();

        index += 1;
        activeRequests += 1;

        // Add timeout to the promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Request ${current} timed out after ${timeout} ms`));
          }, timeout);
        });

        Promise.race([promise, timeoutPromise]).then((result) => {
          results[current] = result;
        }).catch((error) => {
          results[current] = error;
        // eslint-disable-next-line no-loop-func
        }).finally(() => {
          activeRequests -= 1;
          next();
        });
      }
    }

    next();
  });
}

/**
 * @template CallbackRet
 *
 * @param {{text: string, action: string, callback: () => Promise<CallbackRet>}} param0
 * @returns {Promise<CallbackRet|null>}
 */
export async function hintWraper({
  text,
  action,
  callback,
}) {
  let ret = null;
  const hintKey = `${action}_${String(Math.random()).slice(2)}`;
  try {
    hinter.load(hintKey, { text });
    ret = await callback();
    hinter.loadSucc(hintKey);
  } catch (error) {
    hinter.loadFail(hintKey);
    throw error;
  }

  return ret;
}
