import { describe, test } from "@jest/globals";
import { requestQueue } from "../lib/utils/index.js";

describe('lib utils', () => {
  test('util:requeseQueue', async () => {
    const getTempReq = (sec = 3) => {
      return () => new Promise((resolve) => {
        const key = String(Math.random()).slice(2);
        console.info('invoked:', key);
        setTimeout(() => {
          console.info('resolve:', key);
          return resolve(key);
        }, sec * 1000);
      });
    };

    const ret = await requestQueue([
      getTempReq(1),
      getTempReq(2),
      getTempReq(3),
      getTempReq(4),
      getTempReq(2),
      getTempReq(1),
    ], {
      maxRequests: 3,
      timeout: 2000
    });

    console.info(ret)
  }, 60 * 1000);
});
