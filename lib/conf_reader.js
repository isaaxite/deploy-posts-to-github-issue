import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import { copySync } from 'fs-extra/esm';
import { load as loadYaml } from 'js-yaml';
import path from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

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

    conf.branch = this.#formatBranch(conf);
    conf.source_dir = this.#formatSource(conf);
    conf.link_prefix = this.#formatPrefix(conf);
    return conf;
  }

  #formatSource(conf) {
    if (!conf.source_dir) {
      conf.source_dir = 'source';
    }
    return conf.source_dir;
  }

  #formatBranch(conf) {
    if (!conf.branch) {
      conf.branch = 'main';
    }
    return conf.branch;
  }

  #formatPrefix(conf) {
    const { link_prefix } = conf;
    let realPrefix = link_prefix;
    if (!link_prefix || Object.prototype.toString.call(link_prefix) === '[object Object]') {

      realPrefix = 'https://raw.githubusercontent.com/' + path.normalize([
        link_prefix.owner || conf.owner,
        link_prefix.repo || conf.repo,
        link_prefix.branch || conf.branch,
        link_prefix.dir || conf.source_dir
      ].join('/'));
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

  static initConf() {
    const templatePath = path.join(__dirname, '../assets/conf.template.yml')
    const destPath = 'isubo.conf.yml';
    if (existsSync(destPath)) {
      console.warn(`${destPath} has existed!`)
    }
    copySync(templatePath, destPath);
  }
}
