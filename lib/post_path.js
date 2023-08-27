import path from 'path';
import { existsSync } from 'fs';
import { ConfReader } from './conf_reader.js';
import { isDataObject, isNonEmptyString, isUndefined } from './utils/index.js';
import {
  AtLeastPropError, DataObjectError, FileNotExistError, IsuboError, NonEmptyStringError,
} from './utils/error.js';

export class PostPathParse {
  #conf = null;

  #getPostTitle(detail) {
    const { post_title_seat, absolute_source_dir } = this.#conf;
    const postpath = detail.dir;
    let relativedPostpath = path.relative(absolute_source_dir, postpath);
    relativedPostpath = path.join(relativedPostpath, './');
    relativedPostpath = relativedPostpath.slice(0, -1);

    const items = relativedPostpath.split(path.sep);
    items.push(detail.name);

    let idx = items.length - 1 - post_title_seat;
    idx = idx > items.length - 1
      ? items.length - 1
      : idx;
    idx = idx < 0
      ? 0
      : idx;
    const title = items[idx];

    return title;
  }

  init(conf) {
    this.setConfBy({ conf });
  }

  /**
   * set conf by confpath or conf
   *
   * @typedef {Object} SetConfByArgv0
   * @property {string} [confpath]
   * @property {object} [conf]
   *
   * @param {SetConfByArgv0} argv
   * @returns {void}
   */
  setConfBy(argv) {
    if (!isDataObject(argv)) {
      throw new DataObjectError('argv');
    }

    const { confpath, conf } = argv;
    if (isUndefined(confpath) && isUndefined(conf)) {
      throw new AtLeastPropError('confpath, conf');
    }

    if (!isUndefined(conf)) {
      if (!isDataObject(conf)) {
        throw new DataObjectError('conf');
      }
      this.#conf = conf;
      return;
    }

    if (!isNonEmptyString(confpath)) {
      throw new NonEmptyStringError('confpath');
    }

    if (!existsSync(confpath)) {
      throw new FileNotExistError(confpath);
    }
    const confReader = new ConfReader({ path: confpath });
    this.#conf = confReader.get();
  }

  parse(postpath) {
    if (!this.#conf) {
      throw new IsuboError('Pleace set confpath');
    }

    const detail = path.parse(postpath);
    return {
      ...detail,
      postTitle: this.#getPostTitle(detail),
    };
  }
}

export const postPath = new PostPathParse();
