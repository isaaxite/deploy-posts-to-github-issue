import path from 'path';
import { Isubo } from '../index.js';
import { TempGitRepo } from '../__test__/utils/index.js';
import { enumPushAssetType } from '../lib/constants/enum.js';
import { postPath } from '../lib/post_path.js';

const enumCmdType = {
  UPDATE: 'update',
  CREATE: 'create',
  PUBLISH: 'publish'
};

async function main({
  postTitleSeat,
  filename,
  cmd
}) {
  const tempGitRepo = new TempGitRepo();
  await tempGitRepo.init({
    preConf(conf) {
      conf.push_asset = enumPushAssetType.AUTO;
      conf.post_title_seat = postTitleSeat || 0;
      return conf;
    }
  });

  tempGitRepo.addNewPostSync(filename);

  tempGitRepo.adjustPostDirStruct();

  // const { postpath } = tempGitRepo.addNewPostSync(filename);


  process.chdir(tempGitRepo.repoLocalPath);

  postPath.setConfBy({ confpath: path.join(tempGitRepo.repoLocalPath, 'isubo.conf.yml') });
  // const { postTitle } = postPath.parse(postpath);

  const isubo = new Isubo({
    confPath: 'isubo.conf.yml',
    cliParams: {
      // filename: postTitle
    }
  });

  const ret = await isubo[cmd]();
  console.info(ret)
}

main({
  postTitleSeat: 1,
  filename: ['license'],
  cmd: enumCmdType.PUBLISH
});
