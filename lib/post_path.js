import path from 'path';
import { ConfReader } from './conf_reader.js';
import { existsSync } from 'fs';
import { isDataObject } from './utils/index.js';

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
      : idx < 0
        ? 0
        : idx;
    const title = items[idx];

    return title;
  }

  init(conf) {
    this.setConfBy({ conf });
  }

  setConfBy({ confpath, conf } = {}) {
    if (conf) {
      if (!isDataObject(conf)) {
        throw new Error('conf must be non-empty Object');
      }
      this.#conf = conf;
      return;
    }

    if (!existsSync(confpath)) {
      throw new Error('confpath not exist');
    }
    const confReader = new ConfReader({ path: confpath });
    this.#conf = confReader.get();
  }

  parse(postpath) {
    if (!this.#conf) {
      throw new Error('Pleace set confpath');
    }

    const detail = path.parse(postpath);
    return {
      ...detail,
      postTitle: this.#getPostTitle(detail)
    };
  }
}

export const postPath = new PostPathParse();
