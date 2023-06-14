import fg from 'fast-glob';

export class PostFinder {
  #patterns = [];

  constructor({
    patterns
  }) {
    this.#setPatterns(patterns);
  }

  #setPatterns(patterns) {
    this.#patterns = patterns;
  }

  getFilepaths() {
    const ret = fg.sync(this.#patterns, { unique: true });

    return ret;
  }
}
