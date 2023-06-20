import path from 'path';
import { ConfReader } from "./lib/conf_reader.js";
import { hinter } from "./lib/hinter.js";
import { PostFinder } from "./lib/post_finder.js";
import { PostManager } from "./lib/post_manager.js";
import { PostParse } from "./lib/post_parse.js";

const DeployType = {
  IDLE: 'idle',
  CREATE: 'create',
  UPDATE: 'date'
};

export class Isubo {
  #conf = {};
  #cliParams = {};
  #finder = null;
  #postManager = null;
  #selectPosts = false;
  constructor({
    confPath,
    conf,
    cliParams,
    selectPosts
  }) {
    this.#setConf({
      conf,
      confPath
    });
    this.#selectPosts = !!selectPosts;
    this.#setCliParams(cliParams);
    this.#setPostManager();
    this.#setFinder();
  }

  #setFinder() {
    const conf = this.#conf;
    const {
      filename,
      patterns,
      pattern
    } = this.#cliParams;
    const params = {};

    if (patterns) {
      params.patterns = patterns;
    } else if (pattern) {
      params.patterns = [pattern];
    } else {
      params.sourceDir = conf.source_dir;
      params.filename = filename;
    }

    this.#finder = new PostFinder(params);
  }

  #setCliParams(cliParams) {
    this.#cliParams = cliParams;
  }

  #setConf({
    conf,
    confPath
  }) {
    if (conf) {
      this.#conf = conf;
    } else {
      // todo: check confPath
      const confReader = new ConfReader({ path: confPath });
      this.#conf = confReader.get();
    }
  }

  #setPostManager() {
    const conf = this.#conf;
    this.#postManager = new PostManager({
      owner: conf.owner,
      repo: conf.repo,
      token: conf.token
    });
  }

  #getPostDetailBy({ filepath }) {
    const conf = this.#conf;
    const postParse = new PostParse({
      path: filepath,
      conf
    });
    const inputMarkdown = postParse.getInputMarkdown();
    const frontmatter = postParse.getFrontmatter();
    const formatedMarkdown = postParse.getFormatedMarkdown();
    return {
      postParse,
      inputMarkdown,
      frontmatter,
      formatedMarkdown
    };
  }

  async #updateOneBy({ filepath }) {
    const { frontmatter, formatedMarkdown } = this.#getPostDetailBy({ filepath });
    const ret = await this.#postManager.update({
      title: frontmatter.title,
      labels: frontmatter.tags,
      issue_number: frontmatter.issue_number,
      body: formatedMarkdown
    });

    return ret;
  }

  async #createOneBy({ filepath }) {
    const {
      postParse,
      frontmatter,
      formatedMarkdown
    } = this.#getPostDetailBy({ filepath });
    const ret = await this.#postManager.forceCreate({
      title: frontmatter.title,
      labels: frontmatter.tags,
      body: formatedMarkdown
    });

    // todo: check forceCreate success or not

    postParse.injectFrontmatter({
      issue_number: ret.data.number
    });

    return ret;
  }

  async #publishOneBy({ filepath }) {
    const { frontmatter } = this.#getPostDetailBy({ filepath });
    if (frontmatter.issue_number) {
      return {
        type: 'update',
        ret: await this.#updateOneBy({ filepath })
      };
    } else {
      return {
        type: 'create',
        ret: await this.#createOneBy({ filepath })
      };
    }
  }

  #setLoadHints(filepathArr, type) {
    for (const filepath of filepathArr) {
      const filename = path.parse(filepath).name;
      hinter.load(filepath, { text: `${type}: ${filename}` });
    }
  }

  async create() {
    const STR_TPYE = 'Create';
    const retArr = []
    const filepathArr = await this.#getFilepaths();
    this.#setLoadHints(filepathArr, STR_TPYE);
    for (const filepath of filepathArr) {
      try {
        retArr.push(await this.#createOneBy({ filepath }));
        hinter.loadSucc(filepath);
      } catch (error) {
        const filename = path.parse(filepath).name;
        hinter.loadFail(filepath, { text: `${STR_TPYE} ${filename}: ${error.message}` });
      }
    }

    return retArr;
  }

  async #getFilepaths() {
    return this.#selectPosts
      ? await this.#finder.selectPosts()
      : this.#finder.getFilepaths();
  }

  async update() {
    const STR_TPYE = 'Update';
    const retArr = []
    const filepathArr = await this.#getFilepaths();
    this.#setLoadHints(filepathArr, STR_TPYE);
    for (const filepath of filepathArr) {
      try {
        retArr.push(await this.#updateOneBy({ filepath }));
        hinter.loadSucc(filepath);
      } catch (error) {
        const filename = path.parse(filepath).name;
        hinter.loadFail(filepath, { text: `${STR_TPYE} ${filename}: ${error.message}` });
      }
    }

    return retArr;
  }

  async publish() {
    const STR_TPYE = 'Update';
    const retArr = []
    const filepathArr = await this.#getFilepaths();
    this.#setLoadHints(filepathArr, STR_TPYE);
    for (const filepath of filepathArr) {
      const filename = path.parse(filepath).name;
      try {
        const {
          type,
          ret
        } = await this.#publishOneBy({ filepath });
        retArr.push(ret);
        hinter.loadSucc(filepath, { text: `${type}: ${filename}` });
      } catch (error) {
        hinter.loadFail(filepath, { text: `${STR_TPYE} ${filename}: ${error.message}` });
      }
    }

    return retArr;
  }
}
