import fs from 'fs';
import { CORE_SCHEMA, load as loadYaml, dump as yamlDump } from 'js-yaml';
import {
  CtorParamDataObjectError,
  FileNotExistError,
  DataObjectError,
  NonEmptyStringError,
  AtLeastPropError,
} from './utils/error.js';
import { isDataObject, isNonEmptyString } from './utils/index.js';

const DEF_MARK = {
  open: '-',
  close: '-',
};

export class MdFrontmatter {
  #alreadyInit = false;

  #marker = DEF_MARK;

  #srcMarkdownTxt = '';

  #frontmatterTxt = '';

  #markdownContTxt = '';

  #frontmatterTxtWithFence = '';

  #frontmatterData = null;

  /**
   * parse post to get frontmatter, inject frontmatter
   *
   * @typedef {Object} MdFrontmatterCtorParam0
   * @property {string} markdownTxt - markdown text
   *
   * @typedef {Object} MdFrontmatterCtorParam1
   * @property {string} filepath - post file path
   *
   * @param {MdFrontmatterCtorParam0|MdFrontmatterCtorParam1} param
   */
  constructor(param) {
    if (!isDataObject(param)) {
      throw new CtorParamDataObjectError();
    }
    const {
      markdownTxt,
      filepath,
    } = param;

    if (markdownTxt) {
      if (!isNonEmptyString(markdownTxt)) {
        throw new NonEmptyStringError('markdownTxt');
      }
      this.#srcMarkdownTxt = markdownTxt;
    } else if (filepath) {
      if (!isNonEmptyString(filepath)) {
        throw new NonEmptyStringError('filepath');
      }

      if (!fs.existsSync(filepath)) {
        throw new FileNotExistError(filepath);
      }

      this.#srcMarkdownTxt = fs.readFileSync(filepath, { encoding: 'utf8' });
    } else {
      throw new AtLeastPropError('markdownTxt, filepath');
    }
  }

  get frontmatterTxt() {
    if (!this.#alreadyInit) {
      this.#init();
    }

    return this.#frontmatterTxt;
  }

  get frontmatterTxtWithFence() {
    if (!this.#alreadyInit) {
      this.#init();
    }

    return this.#frontmatterTxtWithFence;
  }

  get frontmatterData() {
    if (!this.#alreadyInit) {
      this.#init();
    }

    return this.#frontmatterData;
  }

  get markdownContTxt() {
    if (!this.#alreadyInit) {
      this.#init();
    }

    return this.#markdownContTxt;
  }

  #getFence() {
    const get = (s) => new Array(3).fill(s).join('');

    return {
      start: get(this.#marker.open),
      end: get(this.#marker.close),
    };
  }

  #init() {
    const fence = this.#getFence();
    const regexStr = `^${fence.start}\n([\\s\\S]*?)\n${fence.end}$`;
    const regex = new RegExp(regexStr, 'm');
    const match = regex.exec(this.#srcMarkdownTxt);
    if (!match) {
      this.#markdownContTxt = this.#srcMarkdownTxt;
      this.#alreadyInit = true;
      return;
    }

    const otherTxtArr = this.#srcMarkdownTxt.split(match[0]);
    if (otherTxtArr.length > 1 && otherTxtArr[0].replace(/[\r\n]+/g, '')) {
      this.#markdownContTxt = this.#srcMarkdownTxt;
      this.#alreadyInit = true;
      return;
    }

    const frontmatterTxt = match[1];
    this.#frontmatterTxt = frontmatterTxt;

    this.#frontmatterData = loadYaml(frontmatterTxt, {
      schema: CORE_SCHEMA,
    });

    const frontmatterTxtWithFence = match[0];
    this.#frontmatterTxtWithFence = frontmatterTxtWithFence;

    const markdownContTxt = this.#srcMarkdownTxt.replace(frontmatterTxtWithFence, '');
    this.#markdownContTxt = markdownContTxt;
    this.#alreadyInit = true;
  }

  genFrontmatterWithFence(frontmatterData) {
    if (!isDataObject(frontmatterData)) {
      throw new DataObjectError('frontmatterData');
    }

    const lastFrontmatterTxt = yamlDump(frontmatterData, { schema: CORE_SCHEMA });
    const fence = this.#getFence();
    return `${fence.start}\n${lastFrontmatterTxt}${fence.end}`;
  }

  inject(data) {
    if (!isDataObject(data)) {
      throw new DataObjectError('data');
    }

    const lastData = this.frontmatterData ? {
      ...this.frontmatterData,
      ...data,
    } : data;

    const frontmatterWithFence = this.genFrontmatterWithFence(lastData);

    const lastMarkdownContTxt = /^[\r\n]+/.test(this.markdownContTxt) ? this.markdownContTxt : `\n\n${this.markdownContTxt}`;
    return `${frontmatterWithFence}${lastMarkdownContTxt}`;
  }
}
