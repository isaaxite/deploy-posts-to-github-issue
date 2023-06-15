import { readFileSync, writeFileSync } from 'fs';
import { unified } from 'unified';
import markdown from'remark-parse';
import stringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import { load as loadYaml, dump as yamlDump } from 'js-yaml';
import { URL } from 'url';
import { LinkFormater } from './link_formater.js';

const FRONTMATTER = 'yaml_frontmatter';

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
    dir: '',
    prefix: '',
    types: ['image']
  };
  #markdownText = '';

  constructor({
    path: filepath,
    conf,
    markdownText
  }) {
    if (!markdownText) {
      this.#setFilepath(filepath);
    }

    this.#setConf(conf);
    this.#setMarkdownText(markdownText);
    this.#ast = this.#getAst({ markdownText: this.#markdownText });
    const frontmatter = this.#getFrontmatterBy({ ast: this.#ast });
    this.#setFrontmatter(frontmatter)

    this.#formatAssetLink(this.#ast.children);
  }

  #setFilepath(filepath) {
    this.#filepath = filepath;
  }

  #setConf({
    dir,
    prefix,
    types
  }) {
    this.#conf.dir = dir;
    this.#conf.prefix = prefix;
    this.#conf.types = types;
  }

  #setFrontmatter({
    title,
    tags,
    issue_number
  }) {
    this.#frontmatter.title = title;
    this.#frontmatter.tags = tags;
    this.#frontmatter.issue_number = issue_number;
  }

  #setMarkdownText(markdownText) {

    if (markdownText) {
      this.#markdownText = markdownText;
      return;
    }
    this.#markdownText = this.#readPost(this.#filepath);
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
    // let data = {};

    // for (const it of ast.children) {
    //   if (it.type === FRONTMATTER) {
    //     data = loadYaml(it.value);
    //     break;
    //   }
    // }

    const yamlRef = this.#findFronmatterAstRefBy({ ast });
    const data = loadYaml(yamlRef.value);

    return data;
  }

  #formatAssetLinkHandler(ast) {
    const conf = this.#conf;
    const { url } = ast;
  
    // let newUrl = url;
  
    // if (url.startsWith(`./${conf.dir}`)) {
    //   newUrl = url.replace(`./${conf.dir}/`, '');
    // }
  
    // if (url.startsWith(conf.dir)) {
    //   newUrl = url.replace(`${conf.dir}/`, '');;
    // }
  
    // newUrl = new URL(newUrl, conf.prefix).href;
  
    // ast.url = newUrl;

    const formater = new LinkFormater(url, {
      url_prefix: conf.prefix
    });



    ast.url = formater.dest;
  }

  #formatAssetLink(astChildren) {
    if (!astChildren || !astChildren.length) {
      return;
    }
  
    const conf = this.#conf;

    for (const child of astChildren) {
      if (conf.types.includes(child.type)) {
        this.#formatAssetLinkHandler(child);
      }
      this.#formatAssetLink(child.children);
    }
  }

  getAst() {
    return this.#ast;
  }

  getInputMarkdown() {
    return this.#markdownText;
  }

  getFormatedMarkdown() {
    const data = unified()
      .use(stringify, this.#stringifyOpt)
      .use(remarkFrontmatter, this.#remarkFrontmatterOpt)
      .stringify(this.#ast);

    return data;
  }

  getFrontmatter() {
    return this.#frontmatter;
  }

  injectFrontmatter({ issue_number }) {
    const frontmatterAstRef = this.#findFronmatterAstRefBy({ ast: this.#ast });
    const srcFrontmatter = this.#getFrontmatterBy({ ast: this.#ast });
    const destFrontmatter = {
      ...srcFrontmatter,
      issue_number
    };

    const destFrontmatterYaml = yamlDump(destFrontmatter);

    frontmatterAstRef.value = destFrontmatterYaml;


    writeFileSync(this.#filepath, this.getFormatedMarkdown());
  }
}
