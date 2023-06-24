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

  #getAbsoluteSourceDirPath(source_dir) {
    // TODO: add root dir manually to path.resolve that compatible diffence working dir. 
    // use `node --cwd /path/to/working/directory index.js` to achieve the above.
    const absoluteSourceDirPath = path.resolve(process.cwd(), source_dir);

    // if (!existsSync(absoluteSourceDirPath)) {
    //   throw new Error(`source_dir invalid, absolute source_dir path: ${absoluteSourceDirPath}`);
    // }

    return absoluteSourceDirPath;
  }

  #format(yamlConf) {
    let conf = yamlConf;
    
    if (conf.token.startsWith('$') && conf.token.toUpperCase() === conf.token) {
      conf.token = process.env[conf.token.slice(1)];
    }

    conf.branch = this.#formatBranch(conf);
    conf.source_dir = this.#formatSource(conf);
    conf.absolute_source_dir = this.#getAbsoluteSourceDirPath(conf.source_dir);
    conf.link_prefix = this.#formatPrefix(conf);
    conf.types = this.#formatTypes(conf);
    conf.disable_asset_find = !!conf.disable_asset_find;
    conf.auto_push_asset = !!conf.auto_push_asset;
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
    let realPrefix = link_prefix || {};
    if (Object.prototype.toString.call(realPrefix) === '[object Object]') {
      realPrefix = 'https://raw.githubusercontent.com/' + path.normalize([
        link_prefix?.owner || conf.owner,
        link_prefix?.repo || conf.repo,
        link_prefix?.branch || conf.branch,
        link_prefix?.dir || conf.source_dir
      ].join('/'));
    }
    return realPrefix;
  }

  #formatTypes(conf) {
    if (conf.types) {
      return conf.types;
    }
    return ['image'];
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
