import { describe, test, expect } from '@jest/globals';
import { PostParse } from '../lib/post_parse.js';

describe('post_parse', () => {
  const post = new PostParse({
    path: '__test__/post1.md',
    conf: {
      dir: 'license',
      prefix: 'https://isaaxite.github.io/blog/resources/license/',
      types: ['image']
    }
  });

  test('get frontmatter', () => {
    const {
      title,
      tags,
      issue_number
    } = post.getFrontmatter();

    expect(title).toStrictEqual('LICENSE的选择与生成');
    expect(tags.length).not.toBeUndefined();
    expect((tags || []).length).toBeGreaterThan(0);
    expect(issue_number).not.toBeUndefined();
  });
});
