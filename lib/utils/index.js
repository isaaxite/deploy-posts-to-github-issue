import path from 'path';
import { TruthNumberError } from './error';

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
  return isNonEmptyArray(val) && val.every(s => s && isString(s));
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

export function isNull(val) {
  return protoStringCall(val) === '[object Undefined]';
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
    let numberValue = parseInt(value);
    if (!isNaN(numberValue)) {
      ret = Number(value);
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

/**
 * intervalGenerator that achieve with setTimeout
 * interval can be updated manualy when callback(func) exec
 * 
 * @typedef {Object} IntervalRef
 * @property {number} interval
 * @property {number} count
 * @property {number} timerId
 * @property {function(): void} clearTimeout
 * 
 * @param {function(IntervalRef): void} func 
 * @param {number} interval
 * @returns {IntervalRef}
 */
export function setManualInterval(func, interval) {
  if (!isTruthNumber(interval)) {
    throw new TruthNumberError('interval');
  }
  const intervalRef = {
    interval,
    count: 0,
    timerId: 0,
    clearTimeout() {
      setTimeout(() => {
        clearTimeout(intervalRef.timerId);
      })
    },
  };
  intervalRef.timerId = setTimeout(function inner() {
    intervalRef.count++;
    func(intervalRef);
    intervalRef.timerId = setTimeout(inner, intervalRef.interval);
  }, intervalRef.interval);
  return intervalRef;
}

function getLinerIntervals(cnt, time, start = 0) {
  const midIdx = (cnt - 1) / 2;
  let midTime = time / cnt;
  let lastStart = start > midTime ? midTime : start;
  midTime = midTime - lastStart;
  const getTime = (idx) => Math.round(lastStart + idx * (midTime / midIdx));

  return new Array(cnt).fill(null).map((_, idx) => getTime(idx));
}

export function setLinerInterval(func, opt) {
  const intervals = getLinerIntervals(opt.cnt, opt.time, opt.interval);
  const manualIntervalRef = setManualInterval((ref) => {
    func();
    if (ref.count >= opt.cnt) {
      ref.clearTimeout();
      return;
    }
    ref.interval = intervals[ref.count];
  }, intervals[0]);

  return {
    clearLinerInterval: () => manualIntervalRef.clearTimeout()
  };
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
        const current = index++;
        const promise = requests[current]();

        activeRequests++;

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
        }).finally(() => {
          activeRequests--;
          next();
        });
      }
    }

    next();
  });
}
