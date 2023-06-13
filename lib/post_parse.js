import { readFileSync } from 'fs';
import { unified } from 'unified';
import markdown from'remark-parse';
import stringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import { load as loadYaml } from 'js-yaml';
import path from 'path';

const FRONTMATTER = 'yaml_frontmatter';

export class PostParse {
  #ast = {};
  #filepath = '';
  #frontmatter = {
    title: '',
    tags: []
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

  constructor({
    path: filepath,
    conf
  }) {
    this.#setFilepath(filepath);
    this.#setConf(conf);

    const markdownText = this.#readPost();
    this.#ast = this.#getAst({ markdownText });
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
    tags
  }) {
    this.#frontmatter.title = title;
    this.#frontmatter.tags = tags;
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

  #getFrontmatterBy({ ast }) {
    let data = {};

    for (const it of ast.children) {
      if (it.type === FRONTMATTER) {
        data = loadYaml(it.value);
        break;
      }
    }

    return data;
  }

  #formatAssetLinkHandler(ast) {
    const conf = this.#conf;
    const { url } = ast;
  
    let newUrl = url;
  
    if (url.startsWith(`./${conf.dir}`)) {
      newUrl = url.replace(`./${conf.dir}/`, '');
    }
  
    if (url.startsWith(conf.dir)) {
      newUrl = url.replace(`${conf.dir}/`, '');;
    }
  
    newUrl = path.join(conf.prefix, newUrl);
  
    ast.url = newUrl;
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
}
