import { Isubo } from '../index.js';
import { TempGitRepo } from '../__test__/utils/index.js';
import { enumPushAssetType } from '../lib/constants/enum.js';

const enumCmdType = {
  UPDATE: 'update',
  CREATE: 'create',
  PUBLISH: 'publish'
};

async function main({
  filename,
  cmd
}) {
  const tempGitRepo = new TempGitRepo();
  await tempGitRepo.init({
    preConf(conf) {
      conf.push_asset = enumPushAssetType.AUTO;
      return conf;
    }
  });

  process.chdir(tempGitRepo.repoLocalPath);

  const isubo = new Isubo({
    confPath: 'isubo.conf.yml',
    cliParams: {
      filename
    }
  });

  await isubo[cmd]();
}

main({
  filename: ['license'],
  cmd: enumCmdType.PUBLISH
});
