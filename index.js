import { ConfReader } from "./lib/conf_reader.js";
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
  constructor({
    confPath,
    conf,
    cliParams
  }) {
    this.#setConf({
      conf,
      confPath
    });
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
    this.#cliParams = cliParams
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
      conf: {
        prefix: conf.prefix,
        types: conf.types
      }
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
      return await this.#updateOneBy({ filepath });
    } else {
      return await this.#createOneBy({ filepath });
    }
  }

  async create() {
    const retArr = []
    const filepathArr = this.#finder.getFilepaths();
    for (const filepath of filepathArr) {
      retArr.push(await this.#createOneBy({ filepath }));
    }

    return retArr;
  }

  async update() {
    const retArr = []
    const filepathArr = this.#finder.getFilepaths();
    for (const filepath of filepathArr) {
      retArr.push(await this.#updateOneBy({ filepath }));
    }

    return retArr;
  }

  async publish() {
    const retArr = []
    const filepathArr = this.#finder.getFilepaths();
    for (const filepath of filepathArr) {
      retArr.push(await this.#publishOneBy({ filepath }));
    }

    return retArr;
  }
}
