import { describe, test, expect } from '@jest/globals';
import { LinkFormater } from '../lib/link_formater.js';

describe('link formater', () => {
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
});
