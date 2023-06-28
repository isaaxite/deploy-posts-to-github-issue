import { readFileSync, writeFileSync } from 'fs';
import { unified } from 'unified';
import markdown from'remark-parse';
import stringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import { load as loadYaml, dump as yamlDump } from 'js-yaml';
import { LinkFormater } from './link_formater.js';
import { AssetFinder } from './asset_finder.js';
import path from 'path';
import { hinter } from './hinter.js';
import { cov2num, isDataObject, isNonEmptyArray, isNonEmptyString, isStringArray } from './utils/index.js';
import { DEF_LINK_TYPE_LIST, LINK_OPT_TYPES, FRONTMATTER } from './constants/index.js';

export class PostParse {
  #ast = {};
  #filepath = '';
  #frontmatter = {
    title: '',
    tags: [],
    issue_number: 0
  };
  #remarkFrontmatterOpt = {
    type: FRONTMATTER, marker: { open: '-', close: '-' }
  };
  #stringifyOpt = {
    bullet: '-',
    rule: '-'
  };
  #conf = {
    link_prefix: '',
    absolute_source_dir: '',
    types: DEF_LINK_TYPE_LIST,
    disable_asset_find: false
  };
  #markdownText = '';
  #assetPathRelativeRepoSet = new Set();

  constructor(param) {
    if (!isDataObject(param)) {
      throw new Error('Constructor param must be object');
    }

    const {
      // [required]
      conf,
      
      // [optional required]
      path: filepath,

      // [optional required]
      // Not recommended, only used for testing
      markdownText,

      // [optional]
      disable_immediate_formatAssetLink
    } = param;

    if (!markdownText && !filepath) {
      throw new Error('Must provide <markdownText> or <filepath>');
    }


    if (markdownText) {
      this.#setConf(conf, {
        disable_asset_find: true
      });
      this.#setMarkdownText(markdownText);
    } else {
      this.#setConf(conf);
      this.#setFilepath(filepath);
      this.#setMarkdownText();
    }

    this.#ast = this.#getAst({ markdownText: this.#markdownText });
    const frontmatter = this.#getFrontmatterBy({ ast: this.#ast });
    this.#setFrontmatter(frontmatter);
    if (!disable_immediate_formatAssetLink) {
      this.#formatAssetLink(this.#ast?.children);
    }
  }

  #setFilepath(filepath) {
    this.#filepath = filepath;
  }

  #checkAndGetTypesFrom({ conf }) {
    const { types } = conf;
    if (!types) {
      return DEF_LINK_TYPE_LIST;
    }

    if (!isNonEmptyArray(types)) {
      throw Error('conf.types must be a non-empty Array');
    }

    let lastTypes = [];
    for (const typeIt of types) {
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
  }

  #setConf(conf, preConf = {}) {
    if (!isDataObject(conf)) {
      throw Error('conf must be a non-empty Object');
    }
    const {
      link_prefix,
      absolute_source_dir,
      disable_asset_find,
    } = { ...conf, ...preConf };

    const disableAssetFind = !!disable_asset_find

    if (!isNonEmptyString(link_prefix)) {
      throw Error('conf.link_prefix must be a non-empty String');
    }

    if (!disableAssetFind) {
      if (!isNonEmptyString(absolute_source_dir)) {
        throw Error('conf.absolute_source_dir must be a non-empty String');
      }

      this.#conf.absolute_source_dir = absolute_source_dir;
    }

    this.#conf.link_prefix = link_prefix;
    this.#conf.types = this.#checkAndGetTypesFrom({ conf });
    // TODO: disable_asset_find ? disable Assets Push : enable
    this.#conf.disable_asset_find = disableAssetFind;
  }

  #setFrontmatter(frontmatter) {
    if (!isDataObject(frontmatter)) {
      hinter.warnMsg('frontmatter is not a Object');
      return;
    }
    const {
      title,
      tags,
      issue_number
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

    if (markdownText) {
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
    if (!isNonEmptyString(markdownText)) {
      return null;
    }

    const ast = unified()
      .use(markdown)
      .use(remarkFrontmatter, this.#remarkFrontmatterOpt)
      .parse(markdownText);

    return ast;
  }

  #findFronmatterAstRefBy({ ast }) {
    let ref = {};
    for (const it of ast.children) {
      if (it.type === FRONTMATTER) {
        ref = it;
        break;
      }
    }

    return ref;
  }

  #getFrontmatterBy({ ast }) {

    if (!isDataObject(ast)) {
      return {};
    }

    const yamlRef = this.#findFronmatterAstRefBy({ ast });
    const data = loadYaml(yamlRef.value);

    return data;
  }

  #formatAssetLinkHandler(ast) {
    const conf = this.#conf;
    let lastUrl = ast?.url;

    if (!lastUrl) {
      hinter.warnMsg(`Exist empty link in ${assetname}`);
      return;
    }

    if (conf.disable_asset_find) {
      const formater = new LinkFormater(lastUrl, {
        url_prefix: conf.link_prefix
      });
      ast.url = formater.dest;
      return;
    }

    const assetFinder = new AssetFinder({
      assetPath: lastUrl,
      postpath: this.#filepath,
      sourceDirPath: conf.absolute_source_dir
    });
    lastUrl = assetFinder.getRelativeToSourceDir();

    if (lastUrl) {
      this.#addToAssetPathRelativeRepoSet(assetFinder.get());
      const formater = new LinkFormater(lastUrl, {
        url_prefix: conf.link_prefix
      });
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

    for (const child of astChildren) {
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

  get assetPathsRelativeRepoArr() {
    const ret = Array.from(this.#assetPathRelativeRepoSet).map(it => path.relative(process.cwd(), it));

    return ret;
  }

  getAst() {
    return this.#ast;
  }

  getInputMarkdown() {
    return this.#markdownText;
  }

  getFormatedMarkdown({ ast } = {}) {
    const data = unified()
      .use(stringify, this.#stringifyOpt)
      .use(remarkFrontmatter, this.#remarkFrontmatterOpt)
      .stringify(ast || this.#ast);

    return data;
  }

  getFrontmatter() {
    return this.#frontmatter;
  }

  injectFrontmatter({ issue_number }) {
    const ast = this.#getAst({ markdownText: this.#markdownText });
    const frontmatterAstRef = this.#findFronmatterAstRefBy({ ast });
    const srcFrontmatter = this.#getFrontmatterBy({ ast });
    const destFrontmatter = {
      ...srcFrontmatter,
      issue_number
    };

    const destFrontmatterYaml = yamlDump(destFrontmatter);

    frontmatterAstRef.value = destFrontmatterYaml;


    writeFileSync(this.#filepath, this.getFormatedMarkdown({ ast }));
  }
}
