import { describe, test, expect } from "@jest/globals";
import { cov2num, defineConstStruct, isAsyncFunction, requestQueue, setManualInterval } from "../lib/utils/index.js";
import { TruthNumberError } from "../lib/utils/error.js";

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

  test.each([
    {
      name: 'input string natual num',
      param: { value: '1' },
      expectRet: 1
    },
    {
      name: 'input real num',
      param: { value: 1 },
      expectRet: 1
    },
    {
      name: 'input num that non-string-num or not real num',
      param: { value: {} },
      expectRet: 0
    },
    {
      name: 'input wrong value, retrun def val',
      param: { value: {}, def: 1 },
      expectRet: 1
    },
  ])('cov2num, $name', ({ param, expectRet }) => {
    const ret = cov2num(...[param.value, param.def]);
    expect(ret).toEqual(expectRet);
  });


  test('setManualInterval, init with right params', async () => {
    
    let count = 0;
    let now = Date.now();
    let prevms = now;
    let prevTimeid = null;
    let resolveFunc = () => {};
    const exitCount = 3;
    const waitFinish = new Promise((resolve) => {
      resolveFunc = resolve;
    });

    setManualInterval((ref) => {
      const now = Date.now();
      const costms = now - prevms;
      count += 1;

      expect(ref.timerId._idleTimeout).not.toEqual(prevTimeid);
      expect(ref.interval).toEqual(Math.round(costms / 100) * 100);
      expect(ref.count).toEqual(count);

      if (ref.count === exitCount) {
        ref.clearTimeout();
        resolveFunc('end');
      }

      prevms = now;
      ref.interval += 200;
      prevTimeid = ref.timerId._idleTimeout;
    }, 200);

    const ret = await waitFinish;
    expect(ret).toEqual('end');
  });

  test('setManualInterval, init with non-number interval. It will emit err.', () => {
    try {
      setManualInterval((ref) => {
        ref.clearTimeout();
      }, '500'); 
    } catch (error) {
      expect(error.message).toEqual(
        new TruthNumberError('interval').message
      );
    }
  });

  test('isAsyncFunction', () => {
    [
      () => {},
      class Temp{},
      function(){},
      {},
      []
    ].every(fn => {
      expect(isAsyncFunction(fn)).not.toBeTruthy();
    });

    [
      async () => {},
      async function(){},
      () => new Promise(),
      () => Promise.reject(),
      () => Promise.resolve(),
    ].every(fn => {
      expect(isAsyncFunction(fn)).toBeTruthy();
    });
  });
});

describe('lib utils: defineConstStruct', () => {
  test('test', () => {
    const src = {
      foo: {
        brz: [1, 2, { bar: 10 }]
      },
      brz: [1, 2, { bar: 10 }],
      bar: [1, 2],
      far: 10
    }
    const ret = defineConstStruct(src);

    expect(ret).toHaveProperty('foo');
    expect(ret.foo).toHaveProperty('brz', [1, 2, { bar: 10 }]);
    expect(ret.foo.brz[2]).toHaveProperty('bar', 10);

    expect(ret).toHaveProperty('brz', [1, 2, { bar: 10 }]);
    expect(ret.brz[2]).toHaveProperty('bar', 10);
    expect(ret).toHaveProperty('bar', [1, 2]);
    expect(ret).toHaveProperty('far', 10);

    const expectThrowErr = (cb) => {
      [false, 0, function() {}, [], {}, null, undefined].forEach(val => {
        expect(() => {
          cb(val)
        }).toThrowError();
      });
    };

    expectThrowErr((val) => ret.foo = val);
    expectThrowErr((val) => ret.foo.brz = val);
    expectThrowErr((val) => ret.foo.brz[0] = val);
    expectThrowErr((val) => ret.foo.brz[2] = val);
    expectThrowErr((val) => ret.foo.brz[2].bar = val);

    expectThrowErr((val) => ret.brz = val);
    expectThrowErr((val) => ret.brz[0] = val);
    expectThrowErr((val) => ret.brz[2] = val);
    expectThrowErr((val) => ret.brz[2].bar = val);

    expectThrowErr((val) => ret.bar = val);
    expectThrowErr((val) => ret.bar[0] = val);

    expectThrowErr((val) => ret.far = val);

    const oldBarLen = ret.bar.length;
    const oldBarVal = [...ret.bar];
    ret.bar.push(1);
    expect(ret.bar.length).toEqual(oldBarLen);
    expect(ret.bar).toEqual(expect.arrayContaining(oldBarVal));

    ret.bar.pop();
    expect(ret.bar.length).toEqual(oldBarLen);
    expect(ret.bar).toEqual(expect.arrayContaining(oldBarVal));

    ret.bar.shift();
    expect(ret.bar.length).toEqual(oldBarLen);
    expect(ret.bar).toEqual(expect.arrayContaining(oldBarVal));

    ret.bar.splice(0, 1, 33);
    expect(ret.bar.length).toEqual(oldBarLen);
    expect(ret.bar).toEqual(expect.arrayContaining(oldBarVal));
  });
});
