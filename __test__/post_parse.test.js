import { describe, test, expect } from '@jest/globals';
import { PostParse } from '../lib/post_parse.js';

describe('post_parse', () => {
  const post = new PostParse({
    path: testdir('post1.md'),
    conf
  });

  test('get frontmatter', () => {
    const {
      title,
      tags,
      issue_number
    } = post.getFrontmatter();

    expect(title).toStrictEqual('LICENSE的选择与生成')
  });
});
