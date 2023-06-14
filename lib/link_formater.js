import path from 'path';
import { URL } from 'url';

export class LinkFormater {
  src = '';
  #normalizeSrc = '';
  #conf = {
    url_prefix: ''
  };
  #dest = '';

  constructor(src, conf) {
    this.src = src;
    this.#setConf(conf);
    if (this.src.startsWith('http')) {
      this.#dest = this.src;
    } else {
      this.#normalizeSrc = path.normalize(this.src);
      this.#format();
    }
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
