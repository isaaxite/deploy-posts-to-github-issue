import { describe, test, expect } from '@jest/globals';
import { PostParse } from '../lib/post_parse.js';
const TEST_CASE_FRONTMATTER = `---
title: LICENSE的选择与生成
date: 2023-05-30 16:50:28
tags:
- 开发标准
- LICENSE
issue_number: 1
---`;
const TEST_CASE_MARKDOWN_EN_PIC = TEST_CASE_FRONTMATTER + `
# Overview

![image](./license/pic.png)
`;

const TEST_CASE_MARKDOWN_CN_PIC = TEST_CASE_FRONTMATTER + `
# Overview

![image](./许可证/图片.png)
`;

const TEST_CASE_MARKDOWN_CN_ENCODE_PIC = TEST_CASE_FRONTMATTER + `
# Overview

![image](./许可证/%E5%9B%BE%E7%89%87.png)
`;

const DEF_TEST_INPUT_MD_PATH = '__test__/post1.md';

const getConf = ({ dir, prefix, types } = {}) => ({
  dir: dir || 'license',
  prefix: prefix || 'https://isaaxite.github.io/blog/resources/license/',
  types: types || ['image']
});

const getPostIns = ({ path, markdownText, conf } = {}) => new PostParse({
  path,
  markdownText,
  conf: conf || getConf()
});

describe('post_parse', () => {

  const testFrontmatterAllProps = (post) => () => {
    const ret = post.getFrontmatter();

    expect(ret).toHaveProperty('title');
    expect(ret).toHaveProperty('tags');
    expect(ret).toHaveProperty('issue_number');

    const {
      title,
      tags,
      issue_number
    } = ret;
    expect(title).toStrictEqual('LICENSE的选择与生成');
    expect(tags.length).not.toBeUndefined();
    expect((tags || []).length).toBeGreaterThan(0);
    expect(issue_number).not.toBeUndefined();
  };

  test('use path to get frontmatter:all props:', testFrontmatterAllProps(new PostParse({
    path: DEF_TEST_INPUT_MD_PATH,
    conf: getConf()
  })));

  test('input marddown text to get frontmatter:all props:', testFrontmatterAllProps(new PostParse({
    markdownText: TEST_CASE_FRONTMATTER,
    conf: getConf()
  })));

  test('get ast', () => {
    const post = getPostIns({ markdownText: TEST_CASE_MARKDOWN_EN_PIC });
    const ret = post.getAst();
    
    expect(ret).not.toBeUndefined();
    expect(ret).toHaveProperty('type', 'root');
    expect(ret).toHaveProperty('children');
    expect(ret.children).not.toBeUndefined();
    expect(ret.children.length).toBeGreaterThan(0);
  });

  test('method:getInputMarkdown', () => {
    const post1 = getPostIns({ markdownText: TEST_CASE_MARKDOWN_EN_PIC });
    const post2 = getPostIns({ path: DEF_TEST_INPUT_MD_PATH });

    const ret1 = post1.getInputMarkdown();
    const ret2 = post2.getInputMarkdown();

    expect(ret1).not.toBeUndefined();
    expect(ret2).not.toBeUndefined();
  });

  test('method:getFormatedMarkdown', () => {
    const post1 = getPostIns({ markdownText: TEST_CASE_MARKDOWN_EN_PIC });
    const ret1 = post1.getFormatedMarkdown();

    expect(ret1).not.toBeUndefined();
  });

  const testLinkFormatFactory = ({ markdownText, expectedLink, conf, disable } = {}) => () => {
    if (disable) {
      return;
    }
    const lastConf = conf || getConf();
    const post1 = getPostIns({ markdownText, conf: lastConf });
    const ret1 = post1.getFormatedMarkdown();
    const findImage = (ast) => {
      let ret = '';
    
      if (ast.type === 'image') {
        return ast;
      }

      if (!ast.children) {
        return;
      }

      for (const it of ast.children) {
        const itRet = findImage(it);
        if (itRet) {
          ret = itRet;
          break;
        }
      }

      return ret;
    };

    expect(ret1).not.toBeUndefined();

    const post2 = getPostIns({ markdownText: ret1 });
    const ast2 = post2.getAst();
    const imgAst = findImage(ast2);

    expect(imgAst.url).not.toBeUndefined();
    expect(decodeURIComponent(imgAst.url)).toStrictEqual(expectedLink);
  };

  test('test formated en image link', testLinkFormatFactory({
    markdownText: TEST_CASE_MARKDOWN_EN_PIC,
    expectedLink: 'https://isaaxite.github.io/blog/resources/license/pic.png',
    // disable: true
  }));

  test('test formated cn image link', testLinkFormatFactory({
    markdownText: TEST_CASE_MARKDOWN_CN_PIC,
    expectedLink: 'https://isaaxite.github.io/blog/resources/license/图片.png',
    conf: getConf({ dir: '许可证' })
  }));

  test('test formated cn(uriencode) image link', testLinkFormatFactory({
    markdownText: TEST_CASE_MARKDOWN_CN_ENCODE_PIC,
    expectedLink: 'https://isaaxite.github.io/blog/resources/license/图片.png',
    conf: getConf({ dir: '许可证' })
  }));

  test('empty parse conf', () => {});

  test('parse conf: if exist sep', () => {});
});
