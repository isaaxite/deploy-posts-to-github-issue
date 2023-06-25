import { existsSync } from "fs";
import path from "path";
import fg from 'fast-glob';

export class AssetFinder{
  #ret = '';
  #assetName = '';
  #assetPath = '';
  #sourceDirPath = '';
  #postpath = '';

  constructor({
    assetPath,
    postpath,
    sourceDirPath
  }) {
    this.#postpath = postpath;
    this.#assetPath = assetPath;
    this.#setAssetNameBy({ assetPath });
    this.#setSourceDirPath(sourceDirPath);
  }

  // TODO: check constructor params

  #setAssetNameBy({ assetPath }) {
    this.#assetName = path.basename(assetPath);
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
    const breakDirpath = path.join(this.#sourceDirPath, '../');
    // path.join(dirPath, './') for promise end with sep. 
    if (path.join(dirPath, './') === breakDirpath) {
      return '';
    }

    const pattern = path.join(dirPath, `**/${this.#assetName}`);
    const ret = fg.sync(pattern)[0] || '';

    if (ret && existsSync(ret)) {
      return ret;
    }

    return this.#loopFind({
      dirPath: path.join(dirPath, '../')
    });
  }

  #forceGet() {
    let dirPath = this.#postpath.replace(path.extname(this.#postpath), '');
    let ret = path.join(dirPath, this.#assetPath);
    if (existsSync(ret)) {
      return ret;
    }

    dirPath = path.resolve(dirPath, '../');
    ret = this.#loopFind({ dirPath });
    return ret;
  }

  #get() {
    if (!this.#ret) {
      this.#ret = this.#forceGet();
    }

    return this.#ret;
  }

  get() {
    return this.#get();
  }

  getRelativeToSourceDir() {
    const assetpath = this.#get();
    if (!assetpath) {
      return assetpath;
    }

    return path.relative(this.#sourceDirPath, assetpath);
  }
}