import fg from 'fast-glob';
import { existsSync } from 'fs';
import path from 'path';
import prompts from 'prompts';
import { hinter } from './hinter.js';
import {
  isDataObject,
  isNonEmptyString,
  isNonEmptyStringItemArray,
  isNullOrUndefined,
  isTruthNaturalNum,
  isUndefined,
} from './utils/index.js';
import { postPath } from './post_path.js';
import {
  AtLeastPropError,
  CtorParamDataObjectError,
  DirNotExistError,
  InvalidPatternListError,
  NonEmptyError,
  NonEmptyStringError,
  NonEmptyStringItemArrayError,
  NonEmptyStringOrNonEmptyStringItemArrayError,
  TruthNaturalNumError,
} from './utils/error.js';

export class PostFinder {
  #limitedExts = ['md'];

  #filename = '';

  #ext = 'md';

  #patterns = [];

  #sourceDir = '';

  #postTitleSeat = 0;

  /**
  patterns was used in the end.sourceDir, ext and filename all are used to contruct a pattern
  so, patterns and them is mutually independant
  */
  /**
  * @typedef {Object} PostFinderCtorParam0
  * @property {string[]} patterns - glob pattern list
  * @typedef {Object} PostFinderCtorParam1
  * @property {string} sourceDir - source dir path
  * @property {string} [ext] - extname, e.g. 'md'
  * @typedef {Object} PostFinderCtorParam2
  * @property {string} sourceDir - source dir path
  * @property {string} filename - post title
  * @property {number} postTitleSeat
  * @property {string} [ext] - extname, e.g. 'md'
  * @param {PostFinderCtorParam0|PostFinderCtorParam1|PostFinderCtorParam2} param
  */
  constructor(param) {
    if (!isDataObject(param)) {
      throw new CtorParamDataObjectError();
    }

    const {
      // [required] number, natual number
      postTitleSeat,

      // [optional required], Array<string>
      patterns,

      // [optional required], string
      sourceDir,

      // [optional], string
      // not start with point(.)
      ext,

      // [optional], Array<string> | string
      filename,
    } = param;
    // 0. required params
    if (isUndefined(patterns) && isUndefined(sourceDir)) {
      throw new AtLeastPropError('param.patterns, param.sourceDir');
    }

    // 1. Determine whether to use patterns directly, and if so, check whether it is valid
    if (!isUndefined(patterns)) {
      this.#setPatterns(patterns);
    } else {
      this.#setExt(ext);

      if (!isNullOrUndefined(filename)) {
        this.#setPostTitleSeat(postTitleSeat);
        this.#setFilename(filename);
      }
      this.#setSourceDir(sourceDir);
      this.#setPatternsWith({ sourceDir: this.#sourceDir });
    }
  }

  #setPostTitleSeat(postTitleSeat) {
    if (isNullOrUndefined(postTitleSeat)) {
      throw new NonEmptyError('postTitleSeat');
    }

    if (!isTruthNaturalNum(postTitleSeat)) {
      throw new TruthNaturalNumError('postTitleSeat');
    }

    this.#postTitleSeat = postTitleSeat;
  }

  #setFilename(filename) {
    if (!isNonEmptyString(filename) && !isNonEmptyStringItemArray(filename)) {
      throw new NonEmptyStringOrNonEmptyStringItemArrayError('filename');
    }

    const destArr = [];
    const srcArr = isNonEmptyString(filename) ? [filename] : filename;

    for (let idx = 0; idx < srcArr.length; idx += 1) {
      const it = srcArr[idx];
      const ext = path.extname(it);
      const readFilename = ext
        ? path.basename(it).replace(ext, '')
        : path.basename(it);
      destArr.push(readFilename);
    }

    this.#filename = Array.from(new Set(destArr));
  }

  #setExt(ext) {
    if (!ext) {
      return;
    }

    if (!this.#limitedExts.includes(ext)) {
      hinter.warnMsg(`unexpext ${ext}, allow ext like: ${this.#limitedExts.join(', ')}, default use md.`);
    } else {
      this.#ext = ext;
    }
  }

  #setSourceDir(sourceDir) {
    if (!isNonEmptyString(sourceDir)) {
      throw new NonEmptyStringError('sourceDir');
    }

    if (!existsSync(sourceDir)) {
      throw new DirNotExistError(`sourceDir(${sourceDir})`);
    }

    this.#sourceDir = path.join(sourceDir, './');
  }

  #setPatterns(prePatterns) {
    const validatePatterns = (patterns) => {
      if (!isNonEmptyStringItemArray(patterns)) {
        throw new NonEmptyStringItemArrayError('patterns');
      }

      const validPatterns = [];
      const invalidPatterns = [];
      for (let idx = 0; idx < patterns.length; idx += 1) {
        const pattern = patterns[idx];
        if (!pattern.includes('*')) {
          if (!existsSync(pattern)) {
            invalidPatterns.push(pattern);
          } else {
            validPatterns.push(pattern);
          }
        } else {
          const [parentDir] = pattern.split('*');
          if (!existsSync(parentDir)) {
            invalidPatterns.push(pattern);
          } else {
            validPatterns.push(pattern);
          }
        }
      }

      if (invalidPatterns.length === patterns.length) {
        throw new InvalidPatternListError(invalidPatterns);
      }

      if (invalidPatterns.length) {
        hinter.warnMsg(`${invalidPatterns.join(', ')} are invalid. Corresponding patterns will be deleted.`);
      }
      return validPatterns;
    };
    const validPatterns = validatePatterns(prePatterns);
    this.#patterns = validPatterns;
  }

  #getPatternSuffix(postTitle) {
    let suffix = path.join(postTitle, new Array(this.#postTitleSeat).fill('*').join(path.sep));
    suffix += `.${this.#ext}`;

    return suffix;
  }

  #setPatternsWith({ sourceDir }) {
    if (this.#filename) {
      this.#patterns = this.#filename.map((filenameIt) => {
        const suffix = this.#getPatternSuffix(filenameIt);
        return `${sourceDir}**/${suffix}`;
      });
    } else {
      this.#patterns = [`${sourceDir}**/*.${this.#ext}`];
    }
  }

  get ext() {
    return this.#ext;
  }

  get patterns() {
    return this.#patterns;
  }

  getFilepaths() {
    const ret = fg.sync(this.#patterns, { unique: true });

    return ret;
  }

  async selectPosts() {
    const ALL_POSTS = '__ALL__';
    const filepathArr = this.getFilepaths();
    let choices = filepathArr.map((filepath) => {
      // const filename = path.basename(filepath);
      const title = postPath.parse(filepath).postTitle;
      return {
        title,
        value: filepath,
      };
    });

    choices = [
      { title: 'All', value: ALL_POSTS },
      ...choices,
    ];

    const lastRet = (await prompts({
      instructions: false,
      type: 'autocompleteMultiselect',
      name: 'userSelected',
      message: 'Select one or several posts!',
      choices,
      max: 6,
      hint: '- [Space] to select. [Enter] to submit.[↑/↓] to move.',
      format(ret) {
        if (ret.includes(ALL_POSTS)) {
          return filepathArr;
        }
        return ret;
      },
    })).userSelected;

    return lastRet;
  }
}
