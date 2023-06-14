import { describe, test, expect } from '@jest/globals';
import { PostParse } from '../lib/post_parse.js';
const TEST_CASE_MARKDOWN = `---
title: LICENSE的选择与生成
date: 2023-05-30 16:50:28
tags:
- 开发标准
- LICENSE
issue_number: 1
---`;
const getConf = ({ dir, prefix, types } = {}) => ({
  dir: dir || 'license',
  prefix: prefix || 'https://isaaxite.github.io/blog/resources/license/',
  types: types || ['image']
});

describe('post_parse', () => {
  const postFromPath = new PostParse({
    path: '__test__/post1.md',
    conf: getConf()
  });

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
  test('use path to get frontmatter:all props:', testFrontmatterAllProps(postFromPath));

  test('input marddown to get get frontmatter:all props:', testFrontmatterAllProps(new PostParse({
    markdownText: TEST_CASE_MARKDOWN,
    conf: getConf()
  })))
});
