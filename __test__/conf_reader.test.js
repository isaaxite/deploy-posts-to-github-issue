import { describe, test, expect } from '@jest/globals';
import { ConfReader } from '../lib/conf_reader.js';
import { copySync, removeSync } from 'fs-extra/esm';
import { load as loadYaml, dump as yamlDump } from 'js-yaml';
import { writeFileSync, readFileSync } from 'fs';

describe('conf reader', () => {
  test('read conf', () => {
    const confReader = new ConfReader({ path: '__test__/conf.yml' });
    const conf = confReader.get();

    expect(conf).not.toBeUndefined();
    expect(conf).toHaveProperty('source_dir');
    expect(conf).toHaveProperty('link_prefix');
    expect(conf).toHaveProperty('types');
    expect(conf).toHaveProperty('owner');
    expect(conf).toHaveProperty('repo');
    expect(conf).toHaveProperty('token', process.env.GITHUB_TOKEN); 
  });

  test('read object link_prefix conf', () => {
    const destPath = `__test__/temp/conf.${String(Date.now()).slice(2)}.yml`;
    copySync('__test__/conf.yml', destPath);
    const preConf = loadYaml(readFileSync(destPath));
    preConf.link_prefix = {
      owner: preConf.owner,
      repo: preConf.repo,
      branch: 'master',
      dir: 'posts/'
    };
    writeFileSync(destPath, yamlDump(preConf));
    // console.log(yamlDump(preConf))

    const confReader = new ConfReader({ path: destPath });
    const conf = confReader.get();
    expect(conf.link_prefix).toEqual('https://raw.githubusercontent.com/isaaxite/test-repo_deploy-posts-to-github-issue/master/posts/')

    removeSync(destPath);
  });

  test('default link_prefix', () => {
    const destPath = `__test__/temp/conf.${String(Date.now()).slice(2)}.yml`;
    copySync('__test__/conf.yml', destPath);
    const preConf = loadYaml(readFileSync(destPath));
    preConf.link_prefix = '';
    writeFileSync(destPath, yamlDump(preConf));
    const confReader = new ConfReader({ path: destPath });
    const conf = confReader.get();
    expect(conf.link_prefix).toEqual('https://raw.githubusercontent.com/isaaxite/test-repo_deploy-posts-to-github-issue/main/source/')

    removeSync(destPath);
  });
});
