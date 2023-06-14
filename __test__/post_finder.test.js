import { describe, it, expect } from '@jest/globals';
import { PostFinder } from '../lib/post_finder.js';

describe('post_finder', () => {
  it('glob', () => {
    const finder = new PostFinder({
      patterns: ['/home/isaac/workspace/blog/source/_posts/**/*.md']
    });

    const ret = finder.getFilepaths();

    expect(ret).not.toBeUndefined();
  });
});
