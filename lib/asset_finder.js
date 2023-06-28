import { existsSync } from "fs";
import path from "path";
import fg from 'fast-glob';
import { isDataObject, isNonEmptyString } from "./utils/index.js";

export class AssetFinder{
  #ret = '';
  #assetName = '';
  #assetPath = '';
  #sourceDirPath = '';
  #postpath = '';

  constructor(param) {
    if (!isDataObject(param)) {
      throw new Error('Constructor param must be object');
    }
    const {
      assetPath,
      postpath,
      sourceDirPath
    } = param;
    this.#setPostpath(postpath);
    this.#setAssetPath(assetPath);
    this.#setAssetNameBy({ assetPath });
    this.#setSourceDirPath(sourceDirPath);
  }

  #setPostpath(postpath) {
    if (!isNonEmptyString(postpath)) {
      throw new Error('Must be provided non-empty string postpath');
    }

    if (!existsSync(postpath)) {
      throw new Error(`postpath: ${postpath} not exist!`)
    }

    this.#postpath = postpath;
  }

  #setAssetPath(assetPath) {
    if (!isNonEmptyString(assetPath)) {
      throw new Error('Must be provided non-empty string assetPath');
    }

    this.#assetPath = assetPath;
  }

  #setAssetNameBy({ assetPath }) {
    this.#assetName = path.basename(assetPath);
  }

  #setSourceDirPath(sourceDirPath) {
    if (!isNonEmptyString(sourceDirPath)) {
      throw new Error('Must be provided non-empty string sourceDirPath');
    }

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