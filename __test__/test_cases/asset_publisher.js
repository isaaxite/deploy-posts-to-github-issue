import { AssetPublisher } from "../../lib/asset_publisher.js";
import { TempGitRepo } from "../utils/index.js";

export async function set_prev_staged_includes_a_post_will_be_pushed_then_check_reset_staged_after_pushed(cb) {
  const tempGitRepo = new TempGitRepo();

  await tempGitRepo.init()
  const licensePost = tempGitRepo.addNewPostSync('license');
  // tempGitRepo.addNewPostSync("WSL的hosts文件被重置");
  const tempfilepath = tempGitRepo.touch();
  await tempGitRepo.git.add([tempfilepath, licensePost.postpath]);
  const prevStaged = (await tempGitRepo.git.status()).staged;
  const assetPublisher = new AssetPublisher({
    assetRecords: [licensePost],
    simpleGitOpt: tempGitRepo.simpleGitOpt
  });
  await assetPublisher.push();
  const curStaged = (await tempGitRepo.git.status()).staged;
  const ret = {
    curStaged,
    prevStaged,
    tempfilepath
  };

  cb && cb(ret);

  return ret;
}

export async function revert_as_err_occurred_after_backup_prev_staged(cb) {
  const {
    prevStaged,
    tempGitRepo,
    assetPublisher
  } = await getAssetPublisherInsForTestRevert({
    afterBackupPrevStaged: async () => {
      // const latest = (await tempGitRepo.git.log()).latest;
      // console.info('afterBackupPrevStaged hook:', latest)
      throw new Error('Test error occrrued after backup prev staged')
    }
  })
  try {
    await assetPublisher.push(); 
  } catch (error) {
    // console.info(error);
  }
  const curStaged = (await tempGitRepo.git.status()).staged;

  const ret = {
    prevStaged,
    curStaged
  };
  cb && cb(ret);

  return ret;
}

async function getAssetPublisherInsForTestRevert(hooks) {
  const tempGitRepo = new TempGitRepo();

  await tempGitRepo.init()
  const licensePost = tempGitRepo.addNewPostSync('license');
  tempGitRepo.addNewPostSync("WSL的hosts文件被重置");
  const tempfilepath = tempGitRepo.touch();
  await tempGitRepo.git.add([tempfilepath, licensePost.postpath]);
  const prevStaged = (await tempGitRepo.git.status()).staged;
  const assetPublisher = new AssetPublisher({
    assetRecords: [licensePost],
    simpleGitOpt: tempGitRepo.simpleGitOpt,
    pushHooks: hooks
  });

  return {
    prevStaged,
    tempGitRepo,
    assetPublisher
  };
}
