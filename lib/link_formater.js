import path from 'path';
import { URL } from 'url';
import { isNonEmptyString } from './utils/index.js';
import { NonEmptyStringError } from './utils/error.js';

export class LinkFormater {
  src = '';

  #normalizeSrc = '';

  #conf = {
    url_prefix: '',
  };

  #dest = '';

  /**
   * format relatived asset link to url
   *
   * @typedef {Object} IsuboConfPartial
   * @property {string} url_prefix
   *
   * @param {string} src - asset link, url or relative path
   * @param {IsuboConfPartial} conf - isubo configuration
   */
  constructor(src, conf) {
    if (!src) {
      return;
    }

    this.#setSrc(src);
    this.#setConf(conf);
    if (this.src.startsWith('http')) {
      this.#dest = this.src;
    } else {
      this.#normalizeSrc = path.normalize(this.src);
      this.#format();
    }
  }

  /**
   * @param {string} [src]
   */
  #setSrc(src) {
    if (!isNonEmptyString(src)) {
      throw new NonEmptyStringError('src');
    }
    this.src = src;
  }

  #setConf({
    url_prefix,
  }) {
    let lastUrlPrefix = url_prefix;
    if (!isNonEmptyString(lastUrlPrefix)) {
      throw new NonEmptyStringError('url_prefix');
    }

    if (!lastUrlPrefix.startsWith('http')) {
      lastUrlPrefix = `https://${lastUrlPrefix}`;
    }

    const urlIns = new URL(lastUrlPrefix);
    urlIns.pathname = path.join(urlIns.pathname, './');

    this.#conf.url_prefix = urlIns.href;
  }

  #format() {
    const {
      url_prefix,
    } = this.#conf;
    this.#dest = new URL(this.#normalizeSrc, url_prefix).href;
  }

  get dest() {
    return this.#dest;
  }
}
