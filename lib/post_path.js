import path from 'path';
import { ConfReader } from './conf_reader.js';
import { existsSync } from 'fs';

export class PostPathParse {
  #conf = null;

  constructor({
    confpath
  }) {
    this.#initConf(confpath); 
  }

  #initConf(confpath) {
    if (existsSync(confpath)) {
      this.setConfBy({ confpath })
    }
  }

  #getPostTitle(detail) {
    const { post_title_seat, absolute_source_dir } = this.#conf;

    if (post_title_seat <= 0) {
      return detail.name;
    }

    const postpath = detail.dir;
    let relativedPostpath = path.relative(absolute_source_dir, postpath);
    relativedPostpath = path.join(relativedPostpath, './');
    relativedPostpath = relativedPostpath.slice(0, -1);

    const items = relativedPostpath.split(path.sep);
    let idx = items.length - post_title_seat - 1;
    idx = idx > items.length - 1
      ? items.length - 1
      : idx < 0
        ? 0
        : idx;
    const title = items[idx+1];

    return title;
  }

  setConfBy({ confpath } = {}) {
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

export const postPath = new PostPathParse({
  confpath: 'isubo.conf.yml'
});
