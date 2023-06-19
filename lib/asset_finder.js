import { existsSync } from "fs";
import path from "path";
import fg from 'fast-glob';

export class AssetFinder{
  #assetName = '';
  #assetPath = '';
  #postDirPath = '';
  #sourceDirPath = '';

  constructor({
    assetPath,
    postDirPath,
    sourceDirPath
  }) {
    this.#assetPath = assetPath;
    this.#setAssetNameBy({ assetPath });
    this.#setPostDirPath(postDirPath);
    this.#setSourceDirPath(sourceDirPath);
  }

  #setAssetNameBy({ assetPath }) {
    this.#assetName = path.basename(assetPath);
  }

  #setPostDirPath(postDirPath) {
    if (!existsSync(postDirPath)) {
      throw new Error(`postDirPath: ${postDirPath} not exist!`);
    }

    this.#postDirPath = postDirPath;
  }

  #setSourceDirPath(sourceDirPath) {
    if (!existsSync(sourceDirPath)) {
      throw new Error(`sourceDirPath: ${sourceDirPath} not exist!`);
    }

    this.#sourceDirPath = sourceDirPath;
  }

  #loopFind({
    dirPath
  }) {
    if (dirPath === this.#sourceDirPath) {
      return '';
    }

    const pattern = path.join(dirPath, `**/${this.#assetName}`);
    const ret = fg.sync(pattern)[0] || '';
    // console.info({
    //   pattern,
    //   ret,
    //   xx: fg.sync(pattern)
    // })

    if (existsSync(ret)) {
      return ret;
    }

    return this.#loopFind({
      dirPath: path.join(dirPath, '../')
    });
  }

  get() {
    let ret = path.join(this.#postDirPath, this.#assetPath);
    if (existsSync(ret)) {
      return ret;
    }
    return this.#loopFind({ dirPath: this.#postDirPath });
  }
}