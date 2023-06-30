import path from "path";
import { describe, test, expect } from '@jest/globals';
import { Isubo } from '../index.js';
import { TempRepo, sleep, sleepFactory } from './utils/index.js';
import { PostParse } from '../lib/post_parse.js';
import { enumPushAssetType } from "../lib/constants/enum.js";

describe('isubo', () => {
  sleepFactory(test)('create one post', async () => {
    const tempRepo = new TempRepo();
    tempRepo.copy((preConf) => ({
      ...preConf,
      source_dir: tempRepo.tempSourceDir,
      push_asset: enumPushAssetType.DISABLE
    }));
    const conf = tempRepo.conf;
    const isubo = new Isubo({
      conf,
      cliParams: {
        filename: 'license'
      }
    });
    const ret = (await isubo.create()).pop();
    const postParse = new PostParse({
      path: path.join(tempRepo.tempSourceDir, 'license.md'),
      conf
    });

    const frontmatter = postParse.getFrontmatter();
    expect(ret.data.number).toEqual(frontmatter.issue_number);
  }, 60 * 1000);

  sleepFactory(test)('update one post', async () => {
    const issue_number = 1;
    const tempRepo = new TempRepo();
    tempRepo.copy((preConf) => ({
      ...preConf,
      source_dir: tempRepo.tempSourceDir,
      push_asset: enumPushAssetType.DISABLE
    }));
    const conf = tempRepo.conf;
    const postParse = new PostParse({
      path: path.join(tempRepo.tempSourceDir, 'license.md'),
      conf
    });
    postParse.injectFrontmatter({
      issue_number
    });
    const isubo = new Isubo({
      conf,
      cliParams: {
        filename: 'license'
      }
    });
    const ret = (await isubo.update()).pop();
    expect(ret).not.toBeUndefined();
    expect(ret.status).toBeGreaterThanOrEqual(200);
    expect(ret.status).toBeLessThan(300);
  }, 60 * 1000);

  sleepFactory(test)('publish posts, according post\'s issue_number', async () => {
    const issue_number = 58;
    const tempRepo = new TempRepo();
    tempRepo.copy((preConf) => ({
      ...preConf,
      source_dir: tempRepo.tempSourceDir,
      push_asset: enumPushAssetType.DISABLE
    }));
    const conf = tempRepo.conf;
    const postParse = new PostParse({
      path: path.join(tempRepo.tempSourceDir, 'license.md'),
      conf
    });
    postParse.injectFrontmatter({
      issue_number
    });
    const isubo = new Isubo({
      conf,
      cliParams: {
        filename: ['license', 'WSL的hosts文件被重置']
      }
    });
    await isubo.publish();
  }, 60 * 1000);
});
