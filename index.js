import path from 'path';
import { ConfReader } from "./lib/conf_reader.js";
import { hinter } from "./lib/hinter.js";
import { PostFinder } from "./lib/post_finder.js";
import { PostManager } from "./lib/post_manager.js";
import { PostParse } from "./lib/post_parse.js";
import { AssetPublisher } from './lib/asset_publisher.js';
import { enumDeployType, enumPushAssetType } from './lib/constants/enum.js';
import prompts from 'prompts';
import { postPath } from './lib/post_path.js';
import { isAtLeastOneOf, isDataObject, isFunction, isNonEmptyArray, isNonEmptyString, isNonEmptyStringItemArray, isNullOrUndefined, isUndefined, requestQueue } from './lib/utils/index.js';
import { AtLeastPropError, CtorParamDataObjectError, DataObjectError, NonEmptyError, NonEmptyStringError, NonEmptyStringOrNonEmptyStringItemArrayError } from './lib/utils/error.js';

export class Isubo {
  #conf = {};
  #cliParams = {};
  #finder = null;
  #postManager = null;
  #selectPosts = false;
  #assetpathRecords = [];
  #hooks = {
    beforeDeploy: async () => {}
  };

  /**
   * @typedef {Object} CliParams
   * @property {string|string[]} filename
   * 
   * @typedef {Object.<string, *>} IsuboConf
   * @property {string|string[]} filename
   * 
   * @typedef {Object} Hooks
   * @property {function():Promise<void>} beforeDeploy
   * 
   * @typedef {Object} IsuboCtorParam0 - init with confPath
   * @property {string} confPath
   * @property {CliParams} [cliParams]
   * @property {boolean} [selectPosts]
   * @property {Hooks} [hooks]
   * 
   * @typedef {Object} IsuboCtorParam1 - init with config data
   * @property {IsuboConf} conf
   * @property {CliParams} [cliParams]
   * @property {boolean} [selectPosts]
   * @property {Hooks} [hooks]
   * 
   * @param {IsuboCtorParam0|IsuboCtorParam1} param
   */
  constructor(param) {
    if (!isDataObject(param)) {
      throw new CtorParamDataObjectError();
    }

    const {
      confPath,
      conf,
      cliParams,
      selectPosts,
      hooks
    } = param;

    this.#setConfByOneOf({
      conf,
      confPath
    });
    // TODO: compatile the input of filename and patterns 
    this.#setHooks(hooks);
    this.#selectPosts = !!selectPosts;
    this.#setCliParams(cliParams);
    this.#setPostManager();
    this.#setFinder();
  }

  #setHooks(hooks) {
    if (!isDataObject(hooks)) {
      return;
    }

    if (isFunction(hooks.beforeDeploy)) {
      this.#hooks.beforeDeploy = hooks.beforeDeploy;
    }
  }

  #getLoadHintTextBy({ filepath, type }) {
    const { postTitle } = postPath.parse(filepath);
    return `${type} post: ${postTitle}`;
  }

  #setFinder() {
    const conf = this.#conf;
    const {
      filename,
      // patterns,
      // pattern
    } = this.#cliParams;
    // TODO: achieve patterns and pattern

    // const params = {
    //   postTitleSeat: conf.post_title_seat
    // };

    // if (patterns) {
    //   params.patterns = patterns;
    // } else if (pattern) {
    //   params.patterns = [pattern];
    // } else {
    //   params.sourceDir = conf.absolute_source_dir;
    //   params.filename = filename;
    // }

    const params = {
      postTitleSeat: conf.post_title_seat,
      sourceDir: conf.absolute_source_dir,
      filename
    };

    this.#finder = new PostFinder(params);
  }

  /**
   * set cliParams and validate it
   * @param {CliParams} cliParams 
   */
  #setCliParams(cliParams) {
    if (isUndefined(cliParams)) {
      return;
    }

    if (!isDataObject(cliParams)) {
      throw new DataObjectError('cliParams');
    }

    if (!isNonEmptyString(cliParams.filename) && !isNonEmptyStringItemArray(cliParams.filename)) {
      throw new NonEmptyStringOrNonEmptyStringItemArrayError('cliParams.filename');
    }

    this.#cliParams = cliParams;
  }

  #setConfByOneOf({
    conf,
    confPath
  }) {
    if (!isAtLeastOneOf(conf, confPath)) {
      throw new AtLeastPropError('conf, confPath');
    }

    if (!isUndefined(conf)) {
      if (!isDataObject(conf)) {
        throw new DataObjectError('conf');
      }
      // TODO: use ConfReader to format input-conf
      this.#conf = conf;
    } else {
      const confReader = new ConfReader({ path: confPath });
      this.#conf = confReader.get();
    }

    postPath.init(this.#conf);
  }

  #setPostManager() {
    const conf = this.#conf;
    this.#postManager = new PostManager({
      owner: conf.owner,
      repo: conf.repo,
      token: conf.token
    });
  }

  /**
   * add record for asset paths of the post,
   * add only if assets exist
   * 
   * @param {string} postpath - post path
   * @param {string[]} assetpaths - asset paths of the post
   * @returns 
   */
  #addAssetpathRecord(postpath, assetpaths) {
    if (!assetpaths.length) {
      return;
    }
    const { absolute_source_dir } = this.#conf;
    this.#assetpathRecords.push({
      postpath: path.resolve(absolute_source_dir, postpath),
      assetpaths: assetpaths.map(assetpath => path.resolve(absolute_source_dir, assetpath))
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
    const assetPathsRelativeRepoArr = postParse.assetPathsRelativeRepoArr;
    return {
      postParse,
      inputMarkdown,
      frontmatter,
      formatedMarkdown,
      assetPathsRelativeRepoArr,
      injectFrontmatterFn: (...args) => postParse.injectFrontmatter(...args)
    };
  }

  #getPostTitleBy({ frontmatter, filepath }) {
    if (!frontmatter.title) {
      return postPath.parse(filepath).postTitle;
    }

    return frontmatter.title;
  }

  async #updateOneBy({ filepath }) {
    const { frontmatter, formatedMarkdown, assetPathsRelativeRepoArr } = this.#getPostDetailBy({ filepath });
    const title = this.#getPostTitleBy({ frontmatter, filepath });
    this.#addAssetpathRecord(filepath, assetPathsRelativeRepoArr);
    const ret = await this.#postManager.update({
      title,
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
    const title = this.#getPostTitleBy({ frontmatter, filepath });
    this.#addAssetpathRecord(filepath, assetPathsRelativeRepoArr);
    const params = {
      title,
      body: formatedMarkdown
    };
    if (isNonEmptyArray(frontmatter.tags)) {
      params.labels = frontmatter.tags;
    }
    const ret = await this.#postManager.forceCreate(params);

    // TODO: check forceCreate success or not

    const injectedFrontmatter = {
      issue_number: ret.data.number
    };
    if (!frontmatter.title) {
      injectedFrontmatter.title = title;
    }

    injectFrontmatterFn(injectedFrontmatter);

    return ret;
  }

  async #publishOneBy({ filepath }) {
    let type;
    const getLoadOpt = (type) => ({ text: this.#getLoadHintTextBy({ type, filepath }) });
    const { frontmatter } = this.#getPostDetailBy({ filepath });
    if (frontmatter.issue_number) {
      type = enumDeployType.UPDATE;
      hinter.loadUpdate(filepath, getLoadOpt(type));
      return {
        type,
        ret: await this.#updateOneBy({ filepath })
      };
    } else {
      type = enumDeployType.CREATE;
      hinter.loadUpdate(filepath, getLoadOpt(type));
      return {
        type,
        ret: await this.#createOneBy({ filepath })
      };
    }
  }

  async #publishAssets() {
    const conf = this.#conf;
    const getAssetPublisherIns = () => new AssetPublisher({
      conf,
      assetRecords: this.#assetpathRecords
    });

    let isPushAsset = false;
    switch (conf.push_asset) {
      case enumPushAssetType.DISABLE: {
        isPushAsset = false;
        const isExistUnpush = await getAssetPublisherIns().checkIsUnpushPostAndAssets();
        if (!isExistUnpush) {
          break;
        }

        hinter.warnMsg('There are some posts and corresponding assets didn\'t publish, You should deal with it as soon as possible.');
        break;
      }

      case enumPushAssetType.AUTO: {
        if (!this.#assetpathRecords.length) {
          hinter.warnMsg('Without any posts and relatived assets need to push!');
          break;
        }
        isPushAsset = true;
        break;
      }

      case enumPushAssetType.PROMPT:
      default: {
        if (!this.#assetpathRecords.length) {
          hinter.warnMsg('Without any posts and relatived assets need to push!');
          break;
        }
        isPushAsset = (await prompts({
          type: 'confirm',
          name: 'value',
          message: 'Push the above posts and relatived assets?',
          initial: true
        })).value;
      }
    }

    if (isPushAsset) {
      await getAssetPublisherIns().push();
    }
  }

  async #getFilepaths() {
    return this.#selectPosts
      ? await this.#finder.selectPosts()
      : this.#finder.getFilepaths();
  }

  async #requestQueue(requests) {
    return await requestQueue(requests, {
      maxRequests: 6,
      timeout: 10 * 1000
    });
  }

  async create() {
    const STR_TPYE = enumDeployType.CREATE;
    const retArr = []
    const filepathArr = await this.#getFilepaths();

    // TODO: without select should stop at here!

    await this.#requestQueue(filepathArr.map(filepath => async () => {
      try {
        hinter.load(filepath, { text: this.#getLoadHintTextBy({ type: STR_TPYE, filepath }) });
        await this.#hooks.beforeDeploy();
        retArr.push(await this.#createOneBy({ filepath }));
        hinter.loadSucc(filepath);
      } catch (error) {
        const { postTitle } = postPath.parse(filepath);
        hinter.loadFail(filepath, { text: `${STR_TPYE} ${postTitle}: ${error.message}  ` });
        throw error;
      }
    }));

    // TODO: if exist deploy item err, it's record should be remove from this.#assetpathRecords
    await this.#publishAssets();

    return retArr;
  }

  async update() {
    const STR_TPYE = enumDeployType.UPDATE;
    const retArr = []
    const filepathArr = await this.#getFilepaths();

    await this.#requestQueue(filepathArr.map(filepath => async () => {
      try {
        hinter.load(filepath, { text: this.#getLoadHintTextBy({ type: STR_TPYE, filepath }) });
        await this.#hooks.beforeDeploy();
        retArr.push(await this.#updateOneBy({ filepath }));
        hinter.loadSucc(filepath);
      } catch (error) {
        const { postTitle } = postPath.parse(filepath);
        hinter.loadFail(filepath, { text: `${STR_TPYE} ${postTitle}: ${error.message}` });
        throw error;
      }
    }));

    await this.#publishAssets();

    return retArr;
  }

  async publish() {
    let type = enumDeployType.PUBLISH;
    const retArr = []
    const filepathArr = await this.#getFilepaths();

    await this.#requestQueue(filepathArr.map(filepath => async () => {
      try {
        hinter.load(filepath, { text: this.#getLoadHintTextBy({ type, filepath }) });
        await this.#hooks.beforeDeploy();
        const resp = await this.#publishOneBy({ filepath });
        type = resp.type;
        retArr.push({
          filepath,
          ret: resp.ret
        });
        hinter.loadSucc(filepath, { text: this.#getLoadHintTextBy({ type, filepath }) });
      } catch (error) {
        retArr.push({
          filepath,
          ret: error
        });
        hinter.loadFail(filepath, { text: this.#getLoadHintTextBy({ type, filepath }) });
        hinter.errMsg(error.message);
        throw error;
      }
    }));

    await this.#publishAssets();

    return retArr;
  }
}
