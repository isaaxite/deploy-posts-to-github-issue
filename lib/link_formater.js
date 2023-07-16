import path from 'path';
import { URL } from 'url';

export class LinkFormater {
  src = '';
  #normalizeSrc = '';
  #conf = {
    url_prefix: ''
  };
  #dest = '';

  /**
   * format relatived asset link to url
   * 
   * @typedef {Object.<string, *>} IsuboConf
   * 
   * @param {string} src - asset link, url or relative path
   * @param {IsuboConf} conf - isubo configuration
   */
  constructor(src, conf) {
    this.#setSrc(src);
    this.#setConf(conf);
    if (this.src.startsWith('http')) {
      this.#dest = this.src;
    } else {
      this.#normalizeSrc = path.normalize(this.src);
      this.#format();
    }
  }

  #setSrc(src) {
    this.src = src;
  }

  #setConf({
    url_prefix
  }) {
    let lastUrlPrefix = url_prefix;
    if (!lastUrlPrefix) {
      throw new Error('expect url_prefix');
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
      url_prefix
    } = this.#conf;
    if (this.#normalizeSrc.startsWith('http')) {
      this.#dest = this.#normalizeSrc;
    } else {
      this.#dest = new URL(this.#normalizeSrc, url_prefix).href;
    }
  }

  get dest() {
    return this.#dest;
  }
}
