import path from 'path';
import { ConfReader } from "./lib/conf_reader.js";
import { hinter } from "./lib/hinter.js";
import { PostFinder } from "./lib/post_finder.js";
import { PostManager } from "./lib/post_manager.js";
import { PostParse } from "./lib/post_parse.js";
import { AssetPublisher } from './lib/asset_publisher.js';
import { enumDeployType, enumPushAssetType } from './lib/constants/enum.js';
import prompts from 'prompts';

export class Isubo {
  #conf = {};
  #cliParams = {};
  #finder = null;
  #postManager = null;
  #selectPosts = false;
  #assetpathRecords = [];
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

  static getLoadHintTextBy({ filepath, type }) {
    const filename = path.basename(filepath);
    return `${type} post: ${filename}`;
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

  #addAssetpathRecord(postpath, assetpaths) {
    if (!assetpaths.length) {
      return;
    }
    this.#assetpathRecords.push({
      postpath,
      assetpaths
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
    const assetPathsRelativeRepoArr = postParse.assetPathsRelativeRepoArr
    return {
      postParse,
      inputMarkdown,
      frontmatter,
      formatedMarkdown,
      assetPathsRelativeRepoArr,
      injectFrontmatterFn: (...args) => postParse.injectFrontmatter(...args)
    };
  }

  async #updateOneBy({ filepath }) {
    const { frontmatter, formatedMarkdown, assetPathsRelativeRepoArr } = this.#getPostDetailBy({ filepath });
    this.#addAssetpathRecord(filepath, assetPathsRelativeRepoArr);
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
      frontmatter,
      formatedMarkdown,
      assetPathsRelativeRepoArr,
      injectFrontmatterFn
    } = this.#getPostDetailBy({ filepath });
    this.#addAssetpathRecord(filepath, assetPathsRelativeRepoArr);
    const ret = await this.#postManager.forceCreate({
      title: frontmatter.title,
      labels: frontmatter.tags,
      body: formatedMarkdown
    });

    // todo: check forceCreate success or not

    injectFrontmatterFn({
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
      hinter.load(filepath, { text: Isubo.getLoadHintTextBy({ type, filepath }) });
    }
  }

  async #publishAssets() {
    const conf = this.#conf;

    if (conf.push_asset === enumPushAssetType.DISABLE) {
      return;
    }

    if (conf.push_asset === enumPushAssetType.PROMPT) {
      const isPushAsset = (await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Push the above posts and relatived assets?',
        initial: true
      })).value;

      if (!isPushAsset) {
        return;
      }
    }

    if (!this.#assetpathRecords.length) {
      hinter.errMsg('Without any posts were deploy!');
      return;
    }

    const getAssetPublisherIns = () => new AssetPublisher({
      conf,
      assetRecords: this.#assetpathRecords
    });

    if (conf.auto_push_asset) {
      await getAssetPublisherIns().push();
      return;
    }

    
    const isExistUnpush = await getAssetPublisherIns().checkIsUnpushPostAndAssets();
    if (!isExistUnpush) {
      return;
    }

    hinter.warnMsg('There are some posts and corresponding assets didn\'t publish, You should deal with it as soon as possible.');
  }

  async create() {
    const STR_TPYE = enumDeployType.CREATE;
    const retArr = []
    const filepathArr = await this.#getFilepaths();
    this.#setLoadHints(filepathArr, STR_TPYE);
    for (const filepath of filepathArr) {
      try {
        retArr.push(await this.#createOneBy({ filepath }));
        hinter.loadSucc(filepath);
      } catch (error) {
        const filename = path.parse(filepath).name;
        hinter.loadFail(filepath, { text: `${STR_TPYE} ${filename}: ${error.message}  ` });
      }
    }

    await this.#publishAssets();

    return retArr;
  }

  async #getFilepaths() {
    return this.#selectPosts
      ? await this.#finder.selectPosts()
      : this.#finder.getFilepaths();
  }

  async update() {
    const STR_TPYE = enumDeployType.UPDATE;
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

    await this.#publishAssets();

    return retArr;
  }

  async publish() {
    const STR_TPYE = enumDeployType.PUBLISH;
    const retArr = []
    const filepathArr = await this.#getFilepaths();
    this.#setLoadHints(filepathArr, STR_TPYE);
    for (const filepath of filepathArr) {
      try {
        const { ret, type } = await this.#publishOneBy({ filepath });
        retArr.push(ret);
        hinter.loadSucc(filepath, { text: Isubo.getLoadHintTextBy({ type, filepath }) });
      } catch (error) {
        console.error(error);
        hinter.loadFail(filepath, { text: Isubo.getLoadHintTextBy({ type, filepath }) });
        hinter.errMsg(error.message)
      }
    }

    await this.#publishAssets();

    return retArr;
  }
}
