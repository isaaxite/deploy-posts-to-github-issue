import { unified } from 'unified';
import markdown from'remark-parse';
import stringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter'
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { load as loadYaml } from 'js-yaml';
import { PostParse } from '../lib/post_parse.js';

// Transform the AST back into Markdown text
// const markdownOutput = unified().use(stringify).stringify(ast);

// console.log(markdownOutput);
const testdir = (restPath) => path.resolve('./__test__', restPath);
const conf = {
  dir: 'license',
  prefix: 'https://isaaxite.github.io/blog/resources/license/',
  types: ['image']
};

const FRONTMATTER = 'yaml_frontmatter';

function formatAssetLink(astChildren, cb) {
  if (!astChildren || !astChildren.length) {
    return;
  }

  for (const child of astChildren) {
    if (conf.types.includes(child.type)) {
      cb(child);
    }
    formatAssetLink(child.children, cb);
  }
}

function getFrontmatterBy({ ast }) {
  let data = {};

  for (const it of ast.children) {
    if (it.type === FRONTMATTER) {
      data = loadYaml(it.value);
      break;
    }
  }

  return data;
}

function main() {
  const markdownText = readFileSync(testdir('post1.md'));

  // Parse the Markdown text into an AST
  const ast = unified().use(markdown).use(remarkFrontmatter, {
    type: FRONTMATTER, marker: {open: '-', close: '-'
  }}).parse(markdownText);

  const frontmatter = getFrontmatterBy({ ast });
  console.log(frontmatter)

  writeFileSync(testdir('ast.json'), JSON.stringify(ast, null, 2));

  formatAssetLink(ast.children, (ast) => {  
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
    // console.log({
    //   ...ast,
    //   children: 'deleted to show!'
    // })
  });

  // Transform the AST back into Markdown text
  // docs for remark-stringify: https://github.com/remarkjs/remark/tree/main/packages/remark-stringify
  const markdownOutput = unified().use(stringify, {
    bullet: '-',
    rule: '-'
  }).use(remarkFrontmatter, {
    type: FRONTMATTER, marker: {open: '-', close: '-'
  }}).stringify(ast);

  writeFileSync(testdir('post1_formated.md'), markdownOutput);
}

function main2() {
  const post = new PostParse({
    path: testdir('post1.md'),
    conf
  });

  const frontmatter = post.getFrontmatter();
  console.info(frontmatter);
  const markdownOutput = post.getFormatedMarkdown();
  writeFileSync(testdir('post1_formated.md'), markdownOutput);
}


main2();
