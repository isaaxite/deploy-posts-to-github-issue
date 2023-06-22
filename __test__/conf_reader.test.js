import { describe, test, expect } from '@jest/globals';
import { ConfReader } from '../lib/conf_reader.js';
import { copySync, removeSync } from 'fs-extra/esm';
import { load as loadYaml, dump as yamlDump } from 'js-yaml';
import { writeFileSync, readFileSync } from 'fs';

describe('conf reader', () => {
  const CONF_PATH = '__test__/assets/isubo.conf.yml';
  test('read conf', () => {
    const confReader = new ConfReader({ path: CONF_PATH });
    const conf = confReader.get();

    expect(conf).not.toBeUndefined();
    expect(conf).toHaveProperty('source_dir');
    expect(conf).toHaveProperty('owner');
    expect(conf).toHaveProperty('repo');
    expect(conf).toHaveProperty('token', process.env.GITHUB_TOKEN); 
  });

  test('read object link_prefix conf', () => {
    const destPath = `__test__/temp/isubo.conf.${String(Date.now()).slice(2)}.yml`;
    copySync(CONF_PATH, destPath);
    const preConf = loadYaml(readFileSync(destPath));
    preConf.link_prefix = {
      owner: preConf.owner,
      repo: preConf.repo,
      branch: 'master',
      dir: 'source/'
    };
    writeFileSync(destPath, yamlDump(preConf));
    // console.log(yamlDump(preConf))

    const confReader = new ConfReader({ path: destPath });
    const conf = confReader.get();
    expect(conf.link_prefix).toEqual('https://raw.githubusercontent.com/isaaxite/test-repo_deploy-posts-to-github-issue/master/source/')

    removeSync(destPath);
  });

  test('default link_prefix', () => {
    const destPath = `__test__/temp/isubo.conf.${String(Date.now()).slice(2)}.yml`;
    copySync(CONF_PATH, destPath);
    const preConf = loadYaml(readFileSync(destPath));
    preConf.link_prefix = '';
    writeFileSync(destPath, yamlDump(preConf));
    const confReader = new ConfReader({ path: destPath });
    const conf = confReader.get();
    // console.log(conf)
    expect(conf.link_prefix).toEqual('https://raw.githubusercontent.com/isaaxite/test-repo_deploy-posts-to-github-issue/master/__test__/source/')

    removeSync(destPath);
  });
});
