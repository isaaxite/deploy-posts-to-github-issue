import { describe, test, expect } from '@jest/globals';
import { LinkFormater } from '../lib/link_formater.js';
import { NonEmptyStringError } from '../lib/utils/error.js';

describe('Class LinkFormater', () => {
  const expextUrl = 'https://isaaxite.github.io/blog/resources/license/pic.png';
  test('add url link_prefix for relative src', () => {
    const formater1 = new LinkFormater('./license/pic.png', {
      url_prefix: 'https://isaaxite.github.io/blog/resources'
    });

    const formater2 = new LinkFormater('./license/pic.png', {
      url_prefix: 'https://isaaxite.github.io/blog/resources/'
    });

    expect(formater1.dest).toStrictEqual(expextUrl);
    expect(formater2.dest).toStrictEqual(expextUrl);
  });

  test('add url link_prefix(without schema) for relative src', () => {
    const formater = new LinkFormater('./license/pic.png', {
      url_prefix: 'isaaxite.github.io/blog/resources/'
    });

    expect(formater.dest).toStrictEqual(expextUrl);
  });

  test('test full url', () => {
    const formater = new LinkFormater(expextUrl, {
      url_prefix: 'https://isaaxite.github.io/blog/resources/'
    });
    expect(formater.dest).toStrictEqual(expextUrl);
  });


  test(`init with empty src, it will pass, but parse to ''`, () => {
    ['', 0, false, undefined].forEach(src => {
      const ins = new LinkFormater(src);
      expect(ins.dest).toEqual('');
      expect(ins.src).toEqual('');
    });
  });

  test('init with non-empty but non-string, it will emit err', () => {
    [
      1, [], {}, true, function(){}, () => {}
    ].forEach(src => {
      try {
        new LinkFormater(src); 
      } catch (error) {
        expect(error.message).toEqual(
          new NonEmptyStringError('src').message
        );
      }
    });
  });

  test('init with conf, conf.url_prefix is non-string or empty-string.It will emit err', () => {
    const src = './license/pic.png';
    [
      '', 1, [], {}, true, function(){}, () => {}
    ].forEach(url_prefix => {
      try {
        new LinkFormater(src, { url_prefix })
      } catch (error) {
        expect(error.message).toEqual(
          new NonEmptyStringError('url_prefix').message
        );
      }
    });
  });
});
