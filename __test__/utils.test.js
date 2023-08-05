import { describe, test, expect } from "@jest/globals";
import { cov2num, defineConstStruct, hintWraper, isAsyncFunction, isDataObject, isFunction, isNonEmptyAbsolutePathItemArray, isNonEmptyStringItemArray, isNull, isNullOrUndefined, isPlainFunction, isStringArray, isTruthNaturalNum, isTruthPositiveInt, isUndefined, requestQueue } from "../lib/utils/index.js";

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

  test.each([
    {
      name: 'exec async callback',
      callback: () => 'test',
      expectRet: 'test'
    },
    {
      name: 'throw error when exec callback',
      callback: () => {
        throw new Error('test')
      },
      expectErrMsg: 'test'
    },
  ])('hintWraper: $name', async ({ callback, expectRet, expectErrMsg }) => {
    try {
      const ret = await hintWraper({
        text: 'test text',
        action: 'test action',
        callback
      });

      if (expectRet) {
        expect(ret).toEqual(expectRet);
      }

      expect(false).toBeTruthy();
    } catch (error) {
      if (expectErrMsg) {
        expect(error.message).toEqual(expectErrMsg);
      }
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        0, false, function() {}, {}, '', undefined, null,
        ['a/b'], [''], [0], [false], [function() {}],
        [{}], [undefined], [null]
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        [], ['/a/b']
      ],
      expectRet: true
    }
  ])('isNonEmptyAbsolutePathItemArray, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isNonEmptyAbsolutePathItemArray(param);
      expect(ret).toEqual(expectRet);
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        0, false, function() {}, {}, '', undefined, null,
        [0], [false], [function() {}], [{}], [undefined], [null]
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        [], [''], ['0']
      ],
      expectRet: true
    }
  ])('isStringArray, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isStringArray(param);
      expect(ret).toEqual(expectRet);
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        0, false, function() {}, {}, '', undefined, null,
        [], [''], [0], [false], [function() {}], [{}],
        [undefined], [null]
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        ['10']
      ],
      expectRet: true
    }
  ])('isNonEmptyStringItemArray, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isNonEmptyStringItemArray(param);
      expect(ret).toEqual(expectRet);
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        0, false, function() {}, {}, [], '', undefined, null,
        new Set(), new Map()
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        { foo: 1 }
      ],
      expectRet: true
    }
  ])('isDataObject, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isDataObject(param);
      expect(ret).toEqual(expectRet);
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        0, false, function() {}, {}, [], '', undefined, null,
        new Set(), new Map(), () => {},
        function () { return new Promise(); },
        () => new Promise()
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        async function() {},
        async () => {}
      ],
      expectRet: true
    }
  ])('isAsyncFunction, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isAsyncFunction(param);
      expect(ret).toEqual(expectRet);
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        0, false, {}, [], '', undefined, null,
        new Set(), new Map(),
        async function() {},
        async () => {}
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        function() {},
        function () { return new Promise(); },
        () => {},
        () => new Promise()
      ],
      expectRet: true
    }
  ])('isPlainFunction, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isPlainFunction(param);
      expect(ret).toEqual(expectRet);
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        0, false, {}, [], '', undefined, null,
        new Set(), new Map()
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        function() {},
        () => {},
        async function() {},
        async () => {},
        function () { return new Promise(); },
        () => new Promise()
      ],
      expectRet: true
    }
  ])('isFunction, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isFunction(param);
      expect(ret).toEqual(expectRet);
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        0, false, {}, [], '', null,
        new Set(), new Map()
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        undefined
      ],
      expectRet: true
    }
  ])('isUndefined, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isUndefined(param);
      expect(ret).toEqual(expectRet);
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        0, false, {}, [], '', undefined,
        new Set(), new Map()
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        null
      ],
      expectRet: true
    }
  ])('isNull, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isNull(param);
      expect(ret).toEqual(expectRet);
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        0, false, {}, [], '',
        new Set(), new Map()
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        null, undefined
      ],
      expectRet: true
    }
  ])('isNullOrUndefined, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isNullOrUndefined(param);
      expect(ret).toEqual(expectRet);
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        -1, false, {}, [], '',
        new Set(), new Map(),
        1.1
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        0, 1, 2
      ],
      expectRet: true
    }
  ])('isTruthNaturalNum, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isTruthNaturalNum(param);
      expect(ret).toEqual(expectRet);
    }
  });

  test.each([
    {
      name: 'failed entry',
      paramArr: [
        -1, false, {}, [], '',
        new Set(), new Map(),
        1.1, 0
      ],
      expectRet: false
    },
    {
      name: 'passed entry',
      paramArr: [
        1, 2
      ],
      expectRet: true
    }
  ])('isTruthPositiveInt, $name', ({ paramArr, expectRet }) => {
    for (const param of paramArr) {
      const ret = isTruthPositiveInt(param);
      expect(ret).toEqual(expectRet);
    }
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
