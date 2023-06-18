import fg from 'fast-glob';
import { existsSync } from 'fs';
import path from 'path';

export class PostFinder {
  #limitedExts = ['md'];
  #filename = '';
  #ext = 'md';
  #patterns = [];
  #sourceDir = '';

  constructor({
    patterns,
    sourceDir,
    ext,
    filename
  } = {}) {
    this.#setSourceDir(sourceDir);
    this.#setExt(ext);
    this.#setFilename(filename);

    if (this.#sourceDir) {
      this.#setPatternsWith({ sourceDir: this.#sourceDir });
    } else {
      this.#setPatterns(patterns);
    }

    // todo: checked required params
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
      console.warn(`unexpext ${ext}, allow ext like: ${this.#limitedExts,join(', ')}, default use md.`);
    } else {
      this.#ext = ext;
    }
  }

  #setSourceDir(sourceDir) {
    if (!sourceDir) {
      return;
    }

    if (!existsSync(sourceDir)) {
      console.warn('post dir not exist!');
      throw new Error();
    }

    this.#sourceDir = path.join(sourceDir, './');
  }

  #setPatterns(patterns) {
    this.#patterns = patterns;
  }

  #setPatternsWith({ sourceDir }) {
    if (this.#filename) {
      this.#patterns = this.#filename.map(filenameIt => `${sourceDir}**/${filenameIt}.${this.#ext}`);
    } else {
      this.#patterns = [`${sourceDir}**/*.${this.#ext}`];
    }
  }

  getFilepaths() {
    const ret = fg.sync(this.#patterns, { unique: true });

    return ret;
  }
}
