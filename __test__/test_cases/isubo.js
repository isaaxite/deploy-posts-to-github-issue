import path from 'path';
import { Isubo } from "../../index.js";
import { PostParse } from "../../lib/post_parse.js";
import { TempRepo } from "../utils/index.js";
import { enumPushAssetType } from '../../lib/constants/enum.js';

export async function create_one_post(cb) {
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
  const lastRet = {
    ret,
    frontmatter
  };
  cb && cb(lastRet);

  return lastRet;
};

export async function update_one_post(cb) {
  const issue_number = 1;
  const tempRepo = new TempRepo();
  tempRepo.copy((preConf) => ({
    ...preConf,
    source_dir: tempRepo.tempSourceDir,
    push_asset: enumPushAssetType.DISABLE
  }));
  const conf = tempRepo.conf;
  // if(1) return console.info(conf)
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

  cb && cb(ret);

  return ret;
}
