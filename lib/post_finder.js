import fg from 'fast-glob';
import { existsSync } from 'fs';
import path from 'path';
import prompts from 'prompts';
import { hinter } from './hinter.js';
import { isArray, isUndefined } from './utils/index.js';
import { postPath } from './post_path.js';

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
  constructor({
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
    filename
  } = {}) {
    // 0. required params
    if (!patterns && !sourceDir) {
      throw new Error('<patterns> or <sourceDir> must be provided');
    }

    // 1. Determine whether to use patterns directly, and if so, check whether it is valid
    if (patterns) {
      this.#setPatterns(patterns);
    } else {
      this.#setExt(ext);

      if (filename) {
        this.#setPostTitleSeat(postTitleSeat);
        this.#setFilename(filename);
      }
      this.#setSourceDir(sourceDir);
      this.#setPatternsWith({ sourceDir: this.#sourceDir });
    }
  }

  #setPostTitleSeat(postTitleSeat) {
    if (isUndefined(postTitleSeat)) {
      throw new Error('postTitleSeat must be provided');
    }
    this.postTitleSeat = postTitleSeat;
  }

  #setFilename(filename) {
    if (!filename) {
      return;
    }

    const destArr = [];
    const srcArr = typeof filename === 'string' ? [filename] : filename;

    for (const it of srcArr) {
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
    if (!sourceDir) {
      return;
    }

    if (!existsSync(sourceDir)) {
      throw new Error(`source dir(${sourceDir}) not exist`);
    }

    this.#sourceDir = path.join(sourceDir, './');
  }

  #validatePatterns(patterns) {
    if (!isArray(patterns)) {
      throw new Error('patterns must be Array<string>');
    }

    const validPatterns = [];
    const errStack = [];
    for (const pattern of patterns) {
      if (!pattern.includes('*')) {
        if (!existsSync(pattern)) {
          errStack.push(`${pattern} invalid`);
        } else {
          validPatterns.push(pattern);
        }
      } else {
        const [parentDir] = pattern.split('*');
        if (!existsSync(parentDir)) {
          errStack.push(`${parentDir} invalid`);
        } else {
          validPatterns.push(pattern);
        }
      }
    }

    if (errStack.length === patterns.length) {
      throw new Error(`patterns invalid: ${errStack.join(', ')}`);
    }

    if (errStack.length) {
      hinter.warnMsg(`${errStack.join(', ')}.Corresponding patterns will be deleted.`);
    }
    return validPatterns;
  }

  #setPatterns(patterns) {
    const validPatterns = this.#validatePatterns(patterns);
    this.#patterns = validPatterns;
  }

  #getPatternSuffix(postTitle) {
    let suffix = path.join(postTitle, new Array(this.postTitleSeat).fill('*').join(path.sep));
    suffix += `.${this.#ext}`;

    return suffix;
  }

  #setPatternsWith({ sourceDir }) {
    if (this.#filename) {
      this.#patterns = this.#filename.map(filenameIt => {
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
    const filepathArr = this.getFilepaths();
    const choices = filepathArr.map((filepath) => {
      // const filename = path.basename(filepath);
      const title = postPath.parse(filepath).postTitle;
      return {
        title,
        value: filepath
      };
    });

    const ret = (await prompts({
      instructions: false,
      type: 'autocompleteMultiselect',
      name: 'userSelected',
      message: 'Select one or several posts!',
      choices,
      max: 6,
      hint: '- [Space] to select. [Enter] to submit.[↑/↓] to move.',
    })).userSelected;

    return ret;
  }
}
