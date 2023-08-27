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

  #exts = ['.yml', '.yaml'];

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
      throw new IsuboError(`Only supports ${this.#exts.map((it) => `[${it}]`).join(', ')} files`);
    }

    this.#confPath = confPath;
  }

  #read() {
    const confPath = this.#confPath;
    const yamlConfStr = readFileSync(confPath, 'utf8');
    const yamlConf = loadYaml(yamlConfStr);
    const check = (conf) => {
      if (!isNonEmptyString(conf.owner)) {
        throw new NonEmptyStringError('conf.owner');
      }

      if (!isNonEmptyString(conf.repo)) {
        throw new NonEmptyStringError('conf.repo');
      }

      if (!isNonEmptyString(conf.token)) {
        throw new NonEmptyStringError('conf.token');
      }
    };

    check(yamlConf);

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
  // eslint-disable-next-line class-methods-use-this
  format(yamlConf) {
    const lastConf = yamlConf;

    if (lastConf.token.startsWith('$') && lastConf.token.toUpperCase() === lastConf.token) {
      lastConf.token = process.env[lastConf.token.slice(1)];
    }

    const formatBranch = (conf) => {
      if (!conf.branch) {
        // eslint-disable-next-line no-param-reassign
        conf.branch = 'main';
      }
      return conf.branch;
    };
    const formatSource = (conf) => {
      if (!conf.source_dir) {
        // eslint-disable-next-line no-param-reassign
        conf.source_dir = 'source';
      }
      return conf.source_dir;
    };
    const getAbsoluteSourceDirPath = (source_dir) => {
      // TODO: add root dir manually to path.resolve that compatible diffence working dir.
      // use `node --cwd /path/to/working/directory index.js` to achieve the above.
      const absoluteSourceDirPath = path.resolve(process.cwd(), source_dir);

      // if (!existsSync(absoluteSourceDirPath)) {
      // eslint-disable-next-line max-len
      //   throw new Error(`source_dir invalid, absolute source_dir path: ${absoluteSourceDirPath}`);
      // }

      return absoluteSourceDirPath;
    };
    const formatPrefix = (conf) => {
      const { link_prefix } = conf;
      let realPrefix = link_prefix || {};
      if (Object.prototype.toString.call(realPrefix) === '[object Object]') {
        realPrefix = `https://raw.githubusercontent.com/${path.normalize([
          link_prefix?.owner || conf.owner,
          link_prefix?.repo || conf.repo,
          link_prefix?.branch || conf.branch,
          link_prefix?.dir || conf.source_dir,
        ].join('/'))}`;
      }
      return realPrefix;
    };
    const formatTypes = (conf) => {
      if (conf.types) {
        return conf.types;
      }
      return ['image'];
    };
    /**
     * @param {Object<string, *>} conf
     * @returns {enumPushAssetType}
     */
    const formatPushAsset = (conf) => {
      if (
        !conf.push_asset
        || !Array.from(Object.values(enumPushAssetType)).includes(conf.push_asset)
      ) {
        return enumPushAssetType.PROMPT;
      }

      return conf.push_asset;
    };
    const formatPostTitleSeat = (post_title_seat) => {
      if (!isTruthNaturalNum(post_title_seat)) {
        return DEF_POST_TITLE_SEAT;
      }
      return post_title_seat;
    };

    lastConf.branch = formatBranch(lastConf);
    lastConf.source_dir = formatSource(lastConf);
    lastConf.absolute_source_dir = getAbsoluteSourceDirPath(lastConf.source_dir);
    lastConf.link_prefix = formatPrefix(lastConf);
    lastConf.types = formatTypes(lastConf);
    lastConf.push_asset = formatPushAsset(lastConf);
    lastConf.hide_frontmatter = isUndefined(lastConf.hide_frontmatter)
      ? true
      : !!lastConf.hide_frontmatter;
    lastConf.post_title_seat = formatPostTitleSeat(lastConf.post_title_seat);
    return lastConf;
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
      hinter.infoMsg(`${destPath} has existed!`);
    }
    // copySync(templatePath, destPath);
    writeFileSync(destPath, CONFIG_FILE_TEMPLATE);
  }
}
