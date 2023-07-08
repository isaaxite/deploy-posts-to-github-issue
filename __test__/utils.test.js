import { describe, test, expect } from "@jest/globals";
import { requestQueue } from "../lib/utils/index.js";

describe('lib utils', () => {
  test('util:requeseQueue', async () => {
    const isErr = (val) => Object.prototype.toString.call(val) === '[object Error]';
    const getKey = () => String(Math.random()).slice(2);
    const getTempReq = (param, key) => {
      return () => new Promise((resolve, reject) => {
        // console.info('invoked:', key);
        if (isErr(param)) {
          return reject(param);
        }

        const sec = param;
        setTimeout(() => {
          // console.info('resolve:', key);
          return resolve(key);
        }, sec * 1000);
      });
    };

    const timeoutSec = 2;
    const paramsArr = [
      [1, getKey()],
      [2, getKey()],
      [3, getKey()],
      [new Error('test err'), getKey()],
      [2, getKey()],
      [1, getKey()],
    ];
    const requests = paramsArr.map(params => getTempReq(...params));
    const retArr = await requestQueue(requests, {
      maxRequests: 3,
      timeout: timeoutSec * 1000
    });

    for (let idx = 0; idx < paramsArr.length; idx += 1) {
      const params = paramsArr[idx];
      
      if (isErr(params[0])) {
        expect(isErr(retArr[idx])).toBeTruthy();
      } else if (params[0] > timeoutSec) {
        expect(isErr(retArr[idx])).toBeTruthy();
      } else {
        expect(retArr[idx]).toEqual(params[1]);
      }
    }
  }, 60 * 1000);
});
