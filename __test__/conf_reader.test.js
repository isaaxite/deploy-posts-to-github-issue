import { describe, test, expect } from '@jest/globals';
import { ConfReader } from '../lib/conf_reader.js';

describe('conf reader', () => {
  test('read conf', () => {
    const confReader = new ConfReader({ path: '__test__/conf.yml' });
    const conf = confReader.get();

    expect(conf).not.toBeUndefined();
    expect(conf).toHaveProperty('post_dir');
    expect(conf).toHaveProperty('prefix');
    expect(conf).toHaveProperty('types');
  })
});
