import { describe, test, expect } from "@jest/globals";
import { TempGitRepo, detectOnly, sleepFactory } from "./utils/index.js";
import { AssetPublisher } from "../lib/asset_publisher.js";
import { getInsWith, getIns_checkIsUnpushPostAndAssets, revert_as_err_occurred_after_backup_prev_staged, set_prev_staged_includes_a_post_will_be_pushed_then_check_reset_staged_after_pushed } from "./test_cases/asset_publisher.js";
import { CtorParamDataObjectError, NonArrayError, NonEmptyAbsolutePathError, NonEmptyAbsolutePathItemArrayError } from "../lib/utils/error.js";
import { DEF_SIMPLE_GIT_OPT } from "../lib/constants/index.js";
import { removeSync } from "fs-extra/esm";

describe('Class AssetPublisher, init instance', () => {
  test.each(detectOnly([
    {
      name: 'init with undefined, it will emit err',
      param: undefined,
      getExpext: () => new CtorParamDataObjectError().message
    },
    {
      name: 'init with {}, it will emit err',
      param: {},
      getExpext: () => new CtorParamDataObjectError().message
    },
    {
      name: 'init with { assetRecords: {} }, it will emit err',
      param: { assetRecords: {} },
      getExpext: () => new NonArrayError('assetRecords').message
    },
    {
      // only: 1,
      name: 'init with { assetRecords: [{}] }, it will emit err',
      param: { assetRecords: [{}] },
      getExpext: () => new NonEmptyAbsolutePathError('assetRecords[].postpath').message
    },
    {
      name: 'init with { assetRecords: [{ postpath: 1 }] }, it will emit err',
      param: { assetRecords: [{ postpath: 1 }] },
      getExpext: () => new NonEmptyAbsolutePathError('assetRecords[].postpath').message
    },
    {
      name: 'init with { assetRecords: [{postpath: \'/temp.md\'}] }, it will emit err',
      param: { assetRecords: [{postpath: '/temp.md'}] },
      getExpext: () => new NonEmptyAbsolutePathItemArrayError('assetRecords[].assetpaths').message
    },
    {
      name: 'init with { assetRecords: [{postpath: \'/temp.md\', assetpaths: {}}] }, it will emit err',
      param: { assetRecords: [{postpath: '/temp.md', assetpaths: {}}] },
      getExpext: () => new NonEmptyAbsolutePathItemArrayError('assetRecords[].assetpaths').message
    },
    {
      name: 'init with { assetRecords: [{postpath: \'/temp.md\', assetpaths: [\'\']}] }, it will emit err',
      param: { assetRecords: [{postpath: '/temp.md', assetpaths: ['']}] },
      getExpext: () => new NonEmptyAbsolutePathItemArrayError('assetRecords[].assetpaths').message
    },
    {
      name: 'init with { assetRecords: [] }, it will pass',
      param: { assetRecords: [] },
    },
    {
      name: 'init with { assetRecords: [{postpath: \'/temp.md\', assetpaths: []}] }, it will be passed',
      param: {
        assetRecords: [{
          postpath: '/temp.md', assetpaths: []
        }]
      }
    }
  ]))('AssetPublisher ctor param, $name', ({ param, getExpext }) => {
    try {
      const ins = new AssetPublisher(param);
      if (getExpext) {
        throw new Error('Did not trigger the expected error');
      }
      expect(ins instanceof AssetPublisher).toBeTruthy();
    } catch (error) {
      // console.info(`errMsg: ${error.message}`);
      expect(error.message).toEqual(getExpext({ param }));
    }
  });

  test.each(detectOnly([
    {
      name: 'non-data-object',
      simpleGitOpt: {}
    },
    {
      // only: 1,
      name: 'include baseDir',
      simpleGitOpt: DEF_SIMPLE_GIT_OPT
    }
  ]))('init with simpleGitOpt that $name', ({ simpleGitOpt }) => {
    const ins = new AssetPublisher({
      assetRecords: [],
      simpleGitOpt
    });
  });
});

describe('Class AssetPublisher, method test', () => {
  // const cachePath = await TempGitRepo.cache();
  sleepFactory(test)('Without prev staged, push a post and relatived assets', async () => {
    const tempGitRepo = new TempGitRepo();

    await tempGitRepo.init()
    const licensePost = tempGitRepo.addNewPostSync('license');
    // tempGitRepo.addNewPostSync("WSL的hosts文件被重置");
    // tempGitRepo.touch();
    const assetPublisher = new AssetPublisher({
      assetRecords: [licensePost],
      simpleGitOpt: tempGitRepo.simpleGitOpt
    });

    await assetPublisher.push();
    removeSync(tempGitRepo.repoLocalPath);
  }, 60 * 1000)

  sleepFactory(test)('set prev staged, then push a post and relatived assets', async () => {
    const tempGitRepo = new TempGitRepo();

    await tempGitRepo.init()
    const licensePost = tempGitRepo.addNewPostSync('license');
    // tempGitRepo.addNewPostSync("WSL的hosts文件被重置");
    const tempfilepath = tempGitRepo.touch();
    await tempGitRepo.git.add(tempfilepath);
    const prevStaged = (await tempGitRepo.git.status()).staged;
    const assetPublisher = new AssetPublisher({
      assetRecords: [licensePost],
      simpleGitOpt: tempGitRepo.simpleGitOpt
    });
    await assetPublisher.push();
    const curStaged = (await tempGitRepo.git.status()).staged;
    expect(curStaged).toEqual(expect.arrayContaining(prevStaged));
    removeSync(tempGitRepo.repoLocalPath);
  }, 60 * 1000);

  sleepFactory(test)('set prev staged includes a post will be pushed, then check reset staged after pushed', async () => {
    await set_prev_staged_includes_a_post_will_be_pushed_then_check_reset_staged_after_pushed(({
      prevStaged,
      curStaged,
      tempfilepath,
      repoLocalPath
    }) => {
      expect(curStaged).not.toEqual(expect.arrayContaining(prevStaged));
      expect(curStaged.length).toEqual(1);
      expect(curStaged[0]).toStrictEqual(tempfilepath);
      removeSync(repoLocalPath);
    });
  }, 60 * 1000);

  const getAssetPublisherInsForTestRevert = async (hooks) => {
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
  };

  sleepFactory(test)('Revert as err occurred after backup prev staged', async () => {
    const {
      curStaged,
      prevStaged
    } = await revert_as_err_occurred_after_backup_prev_staged();
    expect(curStaged).toEqual(expect.arrayContaining(prevStaged));
  }, 60 * 1000);

  sleepFactory(test)('Revert as err occurred after commit post and assets', async () => {
    const {
      prevStaged,
      tempGitRepo,
      assetPublisher
    } = await getAssetPublisherInsForTestRevert({
      afterCommitPostAndAssets: () => { throw new Error('Revert as err occurred after commit post and assets') }
    })
    try {
      await assetPublisher.push(); 
    } catch (error) {
      // console.log(error);
    }
    const curStaged = (await tempGitRepo.git.status()).staged;
    // console.info((await tempGitRepo.git.status()))
    
    expect(curStaged).toEqual(expect.arrayContaining(prevStaged));
  }, 60 * 1000);

  sleepFactory(test)('Revert as err occurred before push post and assets or push fail', async () => {
    const {
      prevStaged,
      tempGitRepo,
      assetPublisher
    } = await getAssetPublisherInsForTestRevert({
      beforePushPostAndAssets: () => { throw new Error('Revert as err occurred beforePushPostAndAssets') }
    });
    try {
      await assetPublisher.push(); 
    } catch (error) {}
    const curStaged = (await tempGitRepo.git.status()).staged;
    
    expect(curStaged).toEqual(expect.arrayContaining(prevStaged));
  }, 60 * 1000);

  sleepFactory(test)('Revert as err occurred after push post and assets', async () => {
    let postAndAssetsCommitId = '';
    const {
      prevStaged,
      tempGitRepo,
      assetPublisher
    } = await getAssetPublisherInsForTestRevert({
      afterPushPostAndAssets: async (commitId) => {
        postAndAssetsCommitId = commitId;
        throw new Error('Revert as err occurred afterPushPostAndAssets');
      }
    });
    
    try {
      await assetPublisher.push(); 
    } catch (error) {}
    const gitlog = await tempGitRepo.git.log();
    
    expect(postAndAssetsCommitId).not.toStrictEqual('');
    expect(postAndAssetsCommitId).toEqual(gitlog.latest.hash);
  }, 60 * 1000);

  sleepFactory(test.each([
    {
      name: 'exist post and assets unpush',
      param: { existUnpush: true },
      expectRet: true
    },
    {
      name: 'clear cwd, without assets need to push',
      param: {},
      expectRet: false
    },
    {
      name: 'exist staged files',
      param: { existStaged: true, existUnstaged: false },
      expectRet: false
    },
    {
      name: 'exist staged and not-added files',
      param: { existStaged: true, existUnstaged: true },
      expectRet: false
    },
  ]))('checkIsUnpushPostAndAssets, $name', async ({ param, expectRet }) => {
    const {
      assetPublisher,
      stagedFiles,
      unstagedFiles,
      tempGitRepo
    } = await getIns_checkIsUnpushPostAndAssets(param);
    const ret = await assetPublisher.checkIsUnpushPostAndAssets();

    expect(ret).toEqual(expectRet);

    if (param.existStaged) {
      const { staged } = await tempGitRepo.git.status();
      expect(stagedFiles.length).toBeGreaterThan(0);
      expect(staged.length).toBeGreaterThan(0);
      expect(staged).toEqual(
        expect.arrayContaining(stagedFiles)
      );
    }

    if (param.existUnstaged) {
      const { not_added } = await tempGitRepo.git.status();
      expect(unstagedFiles.length).toBeGreaterThan(0);
      expect(not_added.length).toBeGreaterThan(0);
      expect(not_added).toEqual(
        expect.arrayContaining(unstagedFiles)
      );
    }
  }, 60 * 1000);

  test('push a post that without assets', async () => {
    const {
      assetPublisher,
    } = await getInsWith({
      beforeInstance({ addNewPostSync, updateAssetRecords }) {
        const item = addNewPostSync('$set和$del和方法的实现原理');
        updateAssetRecords(item);
      }
    });
    await assetPublisher.push();
  });

  test('without', async () => {
    const {
      assetPublisher,
    } = await getInsWith();
    await assetPublisher.push();
  });

  test('push post and assets timeout', async () => {
    const {
      assetPublisher
    } = await getInsWith({
      beforeInstance: async ({ addNewPostSync, updateAssetRecords }) => {
        const item = addNewPostSync('license');
        updateAssetRecords(item);
      },
      assetPublisherParam: {
        pushPostAndAssetsTimeout: 10
      }
    });
    await assetPublisher.push();
  }, 60 * 1000);

  test.each([
    { name: '' },
    {
      name: ', err was emited agaign at resetToStashCommit',
      taskName: 'resetToStashCommit'
    },
    {
      name: ', err was emited agaign at recoverPrevStaged',
      taskName: 'recoverPrevStaged'
    }
  ])('throw err when pushing post and assets$name', async ({ taskName }) => {
    const {
      assetPublisher
    } = await getInsWith({
      beforeInstance: async ({ addNewPostSync, updateAssetRecords }) => {
        const item = addNewPostSync('license');
        updateAssetRecords(item);
      },
      assetPublisherParam: {
        pushHooks: {
          pushingPostAndAssets({ child }) {
            child.kill();
          },
          recoveringTasks(argv) {
            if (taskName && taskName === argv.name) {
              throw new Error(`test case`);
            }
          }
        }
      }
    });
    await assetPublisher.push();
  }, 60 * 1000);

  test('Revert as err occurred before set backup branch', async () => {
    const {
      assetPublisher
    } = await getInsWith({
      beforeInstance: async ({ addNewPostSync, updateAssetRecords }) => {
        const item = addNewPostSync('license');
        updateAssetRecords(item);
      },
      assetPublisherParam: {
        pushHooks: {
          beforeSetBackupBranch() {
            throw new Error(`test case`);
          }
        }
      }
    });
    await assetPublisher.push();
  }, 60 * 1000);
});
