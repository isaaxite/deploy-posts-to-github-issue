import { Isubo } from '../index.js';
import { TempGitRepo } from '../__test__/utils/index.js';

async function main({
  filename,
  cmd
}) {
  const tempGitRepo = new TempGitRepo();
  tempGitRepo.init(preConf => {
    preConf.source_dir = 'source';
    return preConf;
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
  cmd: 'update'
});
