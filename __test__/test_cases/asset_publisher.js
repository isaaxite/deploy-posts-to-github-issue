import path from "path";
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
    tempfilepath,
    repoLocalPath: tempGitRepo.repoLocalPath
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

export async function getIns_checkIsUnpushPostAndAssets({
  existUnpush,
  existStaged,
  existUnstaged
} = {}) {
  let stagedFiles = [];
  let unstagedFiles = [];
  const tempGitRepo = new TempGitRepo();

  await tempGitRepo.init();
  const licensePost = tempGitRepo.addNewPostSync('license_88526298164');

  if (!existUnpush) {
    await tempGitRepo.git.add([licensePost.postpath, ...licensePost.assetpaths]);
    await tempGitRepo.git.commit('init tempGitRepo');
  }

  if (existStaged) {
    const { postpath, assetpaths } = tempGitRepo.addNewPostSync('license');
    stagedFiles = [postpath, ...assetpaths].map(it => path.relative(tempGitRepo.repoLocalPath, it));
    await tempGitRepo.git.add(stagedFiles);
  }

  if (existUnstaged) {
    const { postpath, assetpaths } = tempGitRepo.addNewPostSync('WSL的hosts文件被重置');
    unstagedFiles = [postpath, ...assetpaths].map(it => path.relative(tempGitRepo.repoLocalPath, it));
  }

  const assetPublisher = new AssetPublisher({
    assetRecords: [licensePost],
    simpleGitOpt: tempGitRepo.simpleGitOpt
  });

  return {
    tempGitRepo,
    assetPublisher,
    stagedFiles,
    unstagedFiles
  };
}

/**
 * @typedef {{postpath: string, assetpaths: string[]}} AssetRecordItem
 * 
 * @typedef {Object} BeforeInstancParams
 * @property {Object<string, *>} git
 * @property {(postname: string) => AssetRecordItem} addNewPostSync
 * @property {(assetRecordItem: AssetRecordItem) => void} updateAssetRecords
 * 
 * @typedef {(param0: BeforeInstancParams) => Promise<void>} BeforeInstanceFunc
 * 
 * @param {{ beforeInstance?: BeforeInstanceFunc, assetPublisherParam?: Object<string, *> }} param0
 */
export async function getInsWith({
  beforeInstance,
  assetPublisherParam
} = {}) {
  const tempGitRepo = new TempGitRepo();

  await tempGitRepo.init();
  const licensePost = tempGitRepo.addNewPostSync('license_88526298164');
  await tempGitRepo.git.add('./*');
  await tempGitRepo.git.commit('init tempGitRepo');

  let assetRecords = [licensePost];

  beforeInstance && await beforeInstance({
    git: tempGitRepo.git,
    addNewPostSync: (postname) => tempGitRepo.addNewPostSync(postname),
    updateAssetRecords: (item) => {
      assetRecords = [item];
    }
  });

  const assetPublisher = new AssetPublisher({
    ...(assetPublisherParam || {}),
    assetRecords: assetRecords.filter(it => it.assetpaths.length),
    simpleGitOpt: tempGitRepo.simpleGitOpt
  });

  return {
    assetPublisher,
    tempGitRepo
  };
}