import path from 'path';
import { describe, test, expect } from '@jest/globals';
import { PostParse } from '../lib/post_parse.js';
import { ConfReader } from '../lib/conf_reader.js';
import { PostFinder } from '../lib/post_finder.js';
import { TempRepo, copyTempPost, detectOnly, removeTempPost } from './utils/index.js';
import { readdirSync } from 'fs';
import { empty_parse_conf } from './test_cases/post_parse.js';
import { enumPushAssetType } from '../lib/constants/enum.js';

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

![image](./license/图片.png)
`;

const TEST_CASE_MARKDOWN_CN_ENCODE_PIC = TEST_CASE_FRONTMATTER + `
# Overview

![image](./license/%E5%9B%BE%E7%89%87.png)
`;

const DEF_TEST_INPUT_MD_PATH = '__test__/assets/post1.md';

const getConf = ({ link_prefix, types } = {}) => ({
  link_prefix: link_prefix || 'https://isaaxite.github.io/blog/resources/',
  types: types || ['image'],
  disable_asset_find: true
});

const getPostIns = ({ path, markdownText, conf } = {}) => new PostParse({
  path,
  markdownText,
  conf: conf || getConf()
});

describe('post_parse', () => {
  test.each(detectOnly([
    { 
      name: 'use path to get frontmatter:all props:',
      post: new PostParse({
        path: DEF_TEST_INPUT_MD_PATH,
        conf: getConf()
      }),
      // only: true
    },
    {
      name: 'input marddown text to get frontmatter:all props:',
      post: new PostParse({
        markdownText: TEST_CASE_FRONTMATTER,
        conf: getConf()
      })
    }
  ]))('$name', ({ post }) => {
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
  });

  test('use inputMarkdownText to get ast', () => {
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

  test.each(detectOnly([
    {
      name: 'en image link',
      markdownText: TEST_CASE_MARKDOWN_EN_PIC,
      expectedLink: 'https://isaaxite.github.io/blog/resources/license/pic.png',
      // only: true
    },
    {
      name: 'cn image link',
      markdownText: TEST_CASE_MARKDOWN_CN_PIC,
      expectedLink: 'https://isaaxite.github.io/blog/resources/license/图片.png',
      conf: getConf()
    },
    {
      name: 'cn(uriencode) image link',
      markdownText: TEST_CASE_MARKDOWN_CN_ENCODE_PIC,
      expectedLink: 'https://isaaxite.github.io/blog/resources/license/图片.png',
      conf: getConf()
    }
  ]))('test formated $name', ({ markdownText, expectedLink, conf, disable })=> {
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
  });

  test('detect asset paths of a post', () => {
    const tempRepo = new TempRepo();
    tempRepo.copy();

    const mdtxtPath = tempRepo.resolveFromSourceDir('license.md');
    const postParse = new PostParse({
      path: mdtxtPath,
      conf: tempRepo.conf
    });
    const licenseDirPath = path.join(tempRepo.tempSourceDir, 'license');
    const assetpathsInLicenseDir = readdirSync(licenseDirPath).map(fname => path.join(licenseDirPath, fname));

    tempRepo.remove();
    expect(postParse.assetPathsRelativeRepoArr).toEqual(
      expect.arrayContaining(assetpathsInLicenseDir)
    );
  });

  test('empty parse conf', () => {
    try {
      empty_parse_conf() 
    } catch (error) {
      expect(error.message).toEqual('owner is required');
    }

    try {
      empty_parse_conf({
        owner: 'isaaxite'
      });
    } catch (error) {
      expect(error.message).toEqual('repo is required');
    }

    try {
      empty_parse_conf({
        owner: 'isaaxite',
        repo: 'test-repo_deploy-posts-to-github-issue'
      });
    } catch (error) {
      expect(error.message).toEqual('token is required');
    }

    const preConf = {
      owner: 'isaaxite',
      repo: 'test-repo_deploy-posts-to-github-issue',
      token: process.env.GITHUB_TOKEN
    };
    const defConf = empty_parse_conf(preConf);
    expect(defConf.owner).toEqual(preConf.owner);
    expect(defConf.repo).toEqual(preConf.repo);
    expect(defConf.token).toEqual(preConf.token);
    expect(defConf.branch).toEqual('main');
    expect(defConf.source_dir).toEqual('source');
    expect(defConf.absolute_source_dir).toEqual(path.resolve('source'));
    expect(defConf.link_prefix).toEqual(`https://raw.githubusercontent.com/${preConf.owner}/${preConf.repo}/main/source`);
    expect(defConf.types).toEqual(expect.arrayContaining(['image']));
    expect(defConf.push_asset).toEqual(enumPushAssetType.IDLE);
  });

  test.todo('parse conf: if exist sep');

  test.skip('debug:inject frontmatter to src markdown', () => {
    const { filepath: postpath } = copyTempPost('__test__/temp/source/_posts/license.md');
    const getPostParseIns = () => new PostParse({
      path: postpath,
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        types: ['image']
      }
    });

    const postParse1 = getPostParseIns();
    const issue_number = Math.ceil(Math.random() * 100);
    
    postParse1.injectFrontmatter({ issue_number });

    const postParse2 = getPostParseIns();
    const lastFrontmatter = postParse2.getFrontmatter();

    expect(lastFrontmatter.issue_number).toEqual(issue_number);

    removeTempPost();
  });

  test.skip('debug', () => {
    const confReader = new ConfReader({ path: '__test__/conf.yml' });
    const conf = confReader.get();
    const finder = new PostFinder({ patterns: [conf.source_dir] });
    const filepaths = finder.getFilepaths();

    for (const filepath of filepaths.slice(0, 1)) {
      let postParse = new PostParse({
        path: filepath,
        conf: {
          dir: '',
          link_prefix: conf.link_prefix,
          types: conf.types
        }
      });
      const imputMarkdown = postParse.getInputMarkdown();
      const frontmatter = postParse.getFrontmatter();
      const formatedMarkdown = postParse.getFormatedMarkdown();

      console.info(frontmatter)



      postParse = null;
    }
    // console.info(filepaths);
  });
});
