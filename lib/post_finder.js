import fg from 'fast-glob';
import { existsSync } from 'fs';
import path from 'path';

export class PostFinder {
  #limitedExts = ['md'];
  #filename = '';
  #ext = 'md';
  #patterns = [];
  #postDir = '';

  constructor({
    patterns,
    postDir,
    ext,
    filename
  } = {}) {
    this.#setPostDir(postDir);
    this.#setExt(ext);
    this.#setFilename(filename);

    if (this.#postDir) {
      this.#setPatternsWith({ postDir: this.#postDir });
    } else {
      this.#setPatterns(patterns);
    }

    // todo: checked required params
  }

  #setFilename(filename) {
    if (!filename) {
      return;
    }
    const ext = path.extname(filename);
    const readFilename = ext 
      ? path.basename(filename).replace(ext, '') 
      : path.basename(filename);
    this.#filename = readFilename;
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

  #setPostDir(postDir) {
    if (!postDir) {
      return;
    }

    if (!existsSync(postDir)) {
      console.warn('post dir not exist!');
      throw new Error();
    }

    this.#postDir = path.join(postDir, './');
  }

  #setPatterns(patterns) {
    this.#patterns = patterns;
  }

  #setPatternsWith({ postDir }) {
    const pattern = `${postDir}**/${this.#filename ? this.#filename : '*'}.${this.#ext}`;
    this.#patterns = [pattern];
  }

  getFilepaths() {
    const ret = fg.sync(this.#patterns, { unique: true });

    return ret;
  }
}
