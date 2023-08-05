// import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import path from 'path';
import { enumPushAssetType } from './constants/enum.js';
import { isNonEmptyString, isTruthNaturalNum, isUndefined } from './utils/index.js';
import { DEF_POST_TITLE_SEAT } from './constants/index.js';
import { CONFIG_FILE_TEMPLATE } from './constants/asset.js';
import { FileNotExistError, IsuboError, NonEmptyStringError } from './utils/error.js';
import { hinter } from './hinter.js';

// const __dirname = fileURLToPath(new URL('.', import.meta.url));

export class ConfReader {
  #confPath = '';
  #conf = null;
  #exts = ['.yml', '.yaml']

  /**
   * @typedef {Object} ConfReaderCtorParam
   * @property {string} path - Isubo config path
   * 
   * @param {ConfReaderCtorParam} param
   */
  constructor(param) {
    if (!isNonEmptyString(param?.path)) {
      throw new NonEmptyStringError('param.path');
    }

    this.#setConfPath(param.path);
  }

  #setConfPath(confPath) {
    if (!existsSync(confPath)) {
      throw new FileNotExistError(confPath);
    }

    const { ext } = path.parse(confPath);

    if (!this.#exts.includes(ext)) {
      throw new IsuboError(`Only supports ${this.#exts.map(it => `[${it}]`).join(', ')} files`);
    }
    
    this.#confPath = confPath;
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

  #formatPostTitleSeat(post_title_seat) {
    if (!isTruthNaturalNum(post_title_seat)) {
      return DEF_POST_TITLE_SEAT;
    }
    return post_title_seat;
  }

  /**
   * @param {Object<string, *>} conf 
   * @returns {enumPushAssetType}
   */
  #formatPushAsset(conf) {
    if (
      !conf.push_asset
      || !Array.from(Object.values(enumPushAssetType)).includes(conf.push_asset)
    ) {
      return enumPushAssetType.PROMPT;
    }

    return conf.push_asset;
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

  #check(conf) {
    if (!isNonEmptyString(conf.owner)) {
      throw new NonEmptyStringError('conf.owner');
    }

    if (!isNonEmptyString(conf.repo)) {
      throw new NonEmptyStringError('conf.repo');
    }

    if (!isNonEmptyString(conf.token)) {
      throw new NonEmptyStringError('conf.token');
    }
  }

  #read() {
    const confPath = this.#confPath;
    const yamlConfStr = readFileSync(confPath, 'utf8');
    const yamlConf = loadYaml(yamlConfStr);

    this.#check(yamlConf);

    return this.format(yamlConf);
  }

  get exts() {
    return [...this.#exts];
  }

  /**
   * @typedef {Object<string, *>} SrcConf
   * @typedef {Object} FormatConf
   * @property {string} branch
   * @property {string} source_dir
   * @property {string} absolute_source_dir
   * @property {string} link_prefix
   * @property {Array<'image'|'link'>} types
   * @property {enumPushAssetType} push_asset
   * @property {boolean} hide_frontmatter
   * @property {number} post_title_seat
   * 
   * @param {SrcConf} yamlConf 
   * @returns {FormatConf}
   */
  format(yamlConf) {
    let conf = yamlConf;
    
    if (conf.token.startsWith('$') && conf.token.toUpperCase() === conf.token) {
      conf.token = process.env[conf.token.slice(1)];
    }

    conf.branch = this.#formatBranch(conf);
    conf.source_dir = this.#formatSource(conf);
    conf.absolute_source_dir = this.#getAbsoluteSourceDirPath(conf.source_dir);
    conf.link_prefix = this.#formatPrefix(conf);
    conf.types = this.#formatTypes(conf);
    conf.push_asset = this.#formatPushAsset(conf);
    conf.hide_frontmatter = isUndefined(conf.hide_frontmatter) ? true : !!conf.hide_frontmatter;
    conf.post_title_seat = this.#formatPostTitleSeat(conf.post_title_seat);
    return conf;
  }

  get() {
    if (!this.#conf) {
      this.#conf = this.#read();
    }

    return this.#conf;
  }

  static initConf() {
    // const templatePath = path.join(__dirname, '../assets/conf.template.yml')
    const destPath = 'isubo.conf.yml';
    if (existsSync(destPath)) {
      hinter.infoMsg(`${destPath} has existed!`)
    }
    // copySync(templatePath, destPath);
    writeFileSync(destPath, CONFIG_FILE_TEMPLATE);
  }
}
