import { unified } from 'unified';
import markdown from'remark-parse';
import stringify from 'remark-stringify';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Transform the AST back into Markdown text
// const markdownOutput = unified().use(stringify).stringify(ast);

// console.log(markdownOutput);
const testdir = (restPath) => path.resolve('./__test__', restPath);
const conf = {
  dir: 'license',
  prefix: 'https://isaaxite.github.io/blog/resources/license/',
  types: ['image']
};

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

(function main() {
  const markdownText = readFileSync(testdir('post1.md'));

  // Parse the Markdown text into an AST
  const ast = unified().use(markdown).parse(markdownText);

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
  const markdownOutput = unified().use(stringify).stringify(ast);

  writeFileSync(testdir('post1_formated.md'), markdownOutput);
})();
