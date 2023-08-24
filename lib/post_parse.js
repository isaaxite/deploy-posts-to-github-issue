import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { unified } from 'unified';
import markdown from 'remark-parse';
import stringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import { load as loadYaml } from 'js-yaml';
import { LinkFormater } from './link_formater.js';
import { AssetFinder } from './asset_finder.js';
import { hinter } from './hinter.js';
import {
  cov2num, isArray, isDataObject, isNonEmptyString, isString, isStringArray, isUndefined,
} from './utils/index.js';
import {
  DEF_LINK_TYPE_LIST, LINK_OPT_TYPES, FRONTMATTER, EMPTY_CONTENT_AST,
} from './constants/index.js';
import { MdFrontmatter } from './md_frontmatter.js';
import {
  AtLeastPropError,
  CtorParamDataObjectError,
  DataObjectError,
  FileNotExistError,
  NonArrayError,
  NonEmptyStringError,
  NonStringError,
} from './utils/error.js';

export class PostParse {
  #ast = EMPTY_CONTENT_AST;

  #filepath = '';

  #frontmatter = {
    title: '',
    tags: [],
    issue_number: 0,
  };

  #remarkFrontmatterOpt = {
    type: FRONTMATTER, marker: { open: '-', close: '-' },
  };

  #stringifyOpt = {
    bullet: '-',
    rule: '-',
  };

  #conf = {
    link_prefix: '',
    absolute_source_dir: '',
    types: DEF_LINK_TYPE_LIST,
    disable_asset_find: false,
  };

  #markdownText = '';

  #assetPathRelativeRepoSet = new Set();

  /**
   * parse a post
   *
   * @typedef {Object} PostParseCtorParam0
   * @property {string} markdownText - markdown text
   * @property {object} conf - isubo configuration
   * @property {boolean} disable_immediate_formatAssetLink - disable immediate formatAssetLink
   *
   * @typedef {Object} PostParseCtorParam1
   * @property {string} path - post file path
   * @property {object} conf - isubo configuration
   * @property {boolean} disable_immediate_formatAssetLink - disable immediate formatAssetLink
   *
   * @param {PostParseCtorParam0 | PostParseCtorParam1} param
   */
  constructor(param) {
    if (!isDataObject(param)) {
      throw new CtorParamDataObjectError();
    }

    const {
      conf,
      path: filepath,
      markdownText,
      disable_immediate_formatAssetLink,
    } = param;

    if (isUndefined(markdownText) && isUndefined(filepath)) {
      throw new AtLeastPropError('param.markdownText, param.path');
    }

    if (!isUndefined(markdownText)) {
      this.#setConf(conf, {
        disable_asset_find: true,
      });
      this.#setMarkdownText(markdownText);
    } else {
      this.#setConf(conf);
      this.#setFilepath(filepath);
      this.#setMarkdownText();
    }

    this.#ast = this.#getAst({ markdownText: this.#markdownText });

    const findFronmatterAstRefBy = ({ ast }) => {
      let ref = null;

      for (let idx = 0; idx < ast.children.length; idx += 1) {
        const it = ast.children[idx];
        if (it.type === FRONTMATTER) {
          ref = it;
          break;
        }
      }
      return ref;
    };

    const getFrontmatterBy = ({ ast }) => {
      let ret = {};

      const yamlRef = findFronmatterAstRefBy({ ast });

      if (!yamlRef) {
        return ret;
      }

      ret = loadYaml(yamlRef?.value);

      return ret;
    };
    const frontmatter = getFrontmatterBy({ ast: this.#ast });
    this.#setFrontmatter(frontmatter);
    if (!disable_immediate_formatAssetLink) {
      this.#formatAssetLink(this.#ast?.children);
    }
  }

  #setFilepath(filepath) {
    if (!existsSync(filepath)) {
      throw new FileNotExistError(filepath);
    }
    this.#filepath = filepath;
  }

  #setConf(conf, preConf = {}) {
    if (!isDataObject(conf)) {
      throw new DataObjectError('conf');
    }
    const {
      link_prefix,
      absolute_source_dir,
      disable_asset_find,
      hide_frontmatter,
    } = { ...conf, ...preConf };

    const disableAssetFind = !!disable_asset_find;

    if (!isNonEmptyString(link_prefix)) {
      throw new NonEmptyStringError('conf.link_prefix');
    }

    if (!disableAssetFind) {
      if (!isNonEmptyString(absolute_source_dir)) {
        throw new NonEmptyStringError('conf.absolute_source_dir');
      }

      this.#conf.absolute_source_dir = absolute_source_dir;
    }

    this.#conf.link_prefix = link_prefix;
    /**
     *
     * @param {{conf: object}} param0
     * @returns {[]}
     */
    const checkAndGetTypesFrom = (param0) => {
      const { types } = param0.conf;
      if (!types) {
        return DEF_LINK_TYPE_LIST;
      }

      if (!isArray(types)) {
        throw new NonArrayError('conf.types');
      }

      if (!types.length) {
        return DEF_LINK_TYPE_LIST;
      }

      let lastTypes = [];
      for (let idx = 0; idx < types.length; idx += 1) {
        const typeIt = types[idx];
        if (!LINK_OPT_TYPES.includes(typeIt)) {
          hinter.warnMsg(`${typeIt} in [${types.join()} invalid]`);
        } else {
          lastTypes.push(typeIt);
        }
      }

      if (lastTypes.length === 0) {
        hinter.warnMsg(`type items in [${types.join()}], use def types [${DEF_LINK_TYPE_LIST.join()}]`);
        lastTypes = DEF_LINK_TYPE_LIST;
      }

      return lastTypes;
    };
    this.#conf.types = checkAndGetTypesFrom({ conf });
    // TODO: disable_asset_find ? disable Assets Push : enable
    this.#conf.disable_asset_find = disableAssetFind;
    this.#conf.hide_frontmatter = isUndefined(hide_frontmatter) ? true : !!hide_frontmatter;
  }

  #setFrontmatter(frontmatter) {
    if (!isDataObject(frontmatter)) {
      // hinter.warnMsg('frontmatter is not a Object');
      // console.info(frontmatter);
      return;
    }
    const {
      title,
      tags,
      issue_number,
    } = frontmatter;
    if (isNonEmptyString(title)) {
      this.#frontmatter.title = title;
    }

    if (isStringArray(tags)) {
      this.#frontmatter.tags = tags;
    }

    this.#frontmatter.issue_number = cov2num(issue_number);
  }

  #setMarkdownText(markdownText) {
    if (!isUndefined(markdownText)) {
      if (!isString(markdownText)) {
        throw new NonStringError('markdownText');
      }
      this.#markdownText = markdownText;
      return;
    }
    this.#markdownText = this.#readPost();
  }

  #readPost() {
    const data = readFileSync(this.#filepath);
    return data;
  }

  #getAst({ markdownText }) {
    const ast = unified()
      .use(markdown)
      .use(remarkFrontmatter, this.#remarkFrontmatterOpt)
      .parse(markdownText);

    return ast;
  }

  #formatAssetLinkHandler(ast) {
    const conf = this.#conf;
    let lastUrl = ast?.url;

    if (!lastUrl) {
      hinter.warnMsg('Exist empty link');
      return;
    }

    if (conf.disable_asset_find) {
      const formater = new LinkFormater(lastUrl, {
        url_prefix: conf.link_prefix,
      });
      // eslint-disable-next-line no-param-reassign
      ast.url = formater.dest;
      return;
    }

    const assetFinder = new AssetFinder({
      assetPath: lastUrl,
      postpath: this.#filepath,
      sourceDirPath: conf.absolute_source_dir,
    });
    lastUrl = assetFinder.getRelativeToSourceDir();

    if (lastUrl) {
      const assetpath = assetFinder.get();
      this.#addToAssetPathRelativeRepoSet(assetpath);
      const formater = new LinkFormater(lastUrl, {
        url_prefix: conf.link_prefix,
      });
      // eslint-disable-next-line no-param-reassign
      ast.url = formater.dest;
    } else {
      const sourceDirname = path.basename(conf.absolute_source_dir);
      const assetname = path.basename(ast.url);
      hinter.warnMsg(`[${assetname}] was not found in the recursive search of the [${sourceDirname}] directory`);
    }
  }

  #formatAssetLink(astChildren) {
    if (!astChildren || !astChildren.length) {
      return;
    }

    const conf = this.#conf;

    for (let idx = 0; idx < astChildren.length; idx += 1) {
      const child = astChildren[idx];
      if (
        conf.types.includes(child.type)
        && !/^(http|https):\/\/[^\s/$.?#].[^\s]*$/.test(child.url)
      ) {
        this.#formatAssetLinkHandler(child);
      }
      this.#formatAssetLink(child.children);
    }
  }

  #addToAssetPathRelativeRepoSet(assetpath) {
    this.#assetPathRelativeRepoSet.add(assetpath);
  }

  get linkTypes() {
    return this.#conf.types;
  }

  get disableAssetFind() {
    return this.#conf.disable_asset_find;
  }

  get assetPathsRelativeRepoArr() {
    const ret = Array.from(this.#assetPathRelativeRepoSet)
      .map((it) => path.relative(process.cwd(), it));

    return ret;
  }

  getAst() {
    return this.#ast;
  }

  getInputMarkdown() {
    return this.#markdownText;
  }

  getFormatedMarkdown({ ast, hide_frontmatter } = {}) {
    const lastHideFrontmatter = isUndefined(hide_frontmatter)
      ? this.#conf.hide_frontmatter
      : !!hide_frontmatter;
    let lastAst = ast || this.#ast;
    if (!isDataObject(lastAst)) {
      return '';
    }

    if (lastHideFrontmatter) {
      const getNonFrontmatterAst = (preAst) => {
        let frontmatterIdx = -1;

        for (let idx = 0; idx < preAst.children.length; idx += 1) {
          const it = preAst.children[idx];
          if (it.type === FRONTMATTER) {
            frontmatterIdx = idx;
            break;
          }
        }

        const genAst = (children) => ({
          ...preAst,
          children,
        });

        if (frontmatterIdx === 0) {
          return genAst(preAst.children.slice(1));
        } if (frontmatterIdx === preAst.children.length - 1) {
          return genAst(preAst.children.slice(0, frontmatterIdx));
        }
        return genAst([
          ...preAst.children.slice(0, frontmatterIdx),
          ...preAst.children.slice(frontmatterIdx + 1),
        ]);
      };
      lastAst = getNonFrontmatterAst(lastAst);
    }

    const data = unified()
      .use(stringify, this.#stringifyOpt)
      .use(remarkFrontmatter, this.#remarkFrontmatterOpt)
      .stringify(lastAst);

    return data;
  }

  getFrontmatter() {
    return this.#frontmatter;
  }

  /**
   * inject data to post frontamtter
   *
   * @param {{issue_number: number, title?: string}} param0
   */
  injectFrontmatter({ issue_number, title }) {
    const destFrontmatter = {};

    if (title) {
      destFrontmatter.title = title;
    }
    destFrontmatter.issue_number = issue_number;

    const mdFrontmatter = new MdFrontmatter({ markdownTxt: this.#markdownText.toString() });

    const lastMarkdownTxt = mdFrontmatter.inject(destFrontmatter);

    writeFileSync(this.#filepath, lastMarkdownTxt);
  }
}
