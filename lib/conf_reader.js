import { existsSync, readFileSync } from 'fs';
import { load as loadYaml } from 'js-yaml';

export class ConfReader {
  #confPath = '';
  #conf = null;

  constructor({ path }) {
    this.#confPath = path;
  }

  #format(yamlConf) {
    let conf = yamlConf;
    
    if (conf.token.startsWith('$') && conf.token.toUpperCase() === conf.token) {
      conf.token = process.env[conf.token.slice(1)];
    }

    conf.prefix = this.#formatPrefix(conf);
    return conf;
  }

  #formatPrefix(conf) {
    const { prefix } = conf;
    let realPrefix = prefix;
    if (Object.prototype.toString.call(prefix) === '[object Object]') {
      realPrefix = [
        'https://raw.githubusercontent.com',
        prefix.owner || conf.owner,
        prefix.repo || conf.repo,
        prefix.branch || conf.branch,
        prefix.dir
      ].join('/');
    }
    return realPrefix;
  }

  #read() {
    const confPath = this.#confPath;
    if (!existsSync(confPath)) {
      throw new Error(`Cannot find conf in ${confPath}`);
    }

    const yamlConfStr = readFileSync(confPath, 'utf8');
    const yamlConf = loadYaml(yamlConfStr);

    // todo: format conf

    return this.#format(yamlConf);

  }

  get() {
    if (!this.#conf) {
      this.#conf = this.#read();
    }

    return this.#conf;
  } 
}
