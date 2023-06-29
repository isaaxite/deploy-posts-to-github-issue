import { describe, test, expect } from "@jest/globals";
import { TempGitRepo, sleepFactory } from "./utils/index.js";
import { AssetPublisher } from "../lib/asset_publisher.js";

describe('asset_publisher', () => {
  // const cachePath = await TempGitRepo.cache();
  sleepFactory(test)('Without prev staged, push a post and relatived assets', async () => {
    const tempGitRepo = new TempGitRepo();

    await tempGitRepo.init()
    const licensePost = tempGitRepo.addNewPostSync('license');
    // tempGitRepo.addNewPostSync('WSL的hosts文件被重置');
    // tempGitRepo.touch();
    const assetPublisher = new AssetPublisher({
      assetRecords: [licensePost],
      simpleGitOpt: tempGitRepo.simpleGitOpt
    });

    await assetPublisher.push();
  }, 60 * 1000)

  sleepFactory(test)('set prev staged, then push a post and relatived assets', async () => {
    const tempGitRepo = new TempGitRepo();

    await tempGitRepo.init()
    const licensePost = tempGitRepo.addNewPostSync('license');
    // tempGitRepo.addNewPostSync('WSL的hosts文件被重置');
    const tempfilepath = tempGitRepo.touch();
    await tempGitRepo.git.add(tempfilepath);
    const prevStaged = (await tempGitRepo.git.status()).staged;
    const assetPublisher = new AssetPublisher({
      assetRecords: [licensePost],
      simpleGitOpt: tempGitRepo.simpleGitOpt
    });
    await assetPublisher.push();
    const curStaged = (await tempGitRepo.git.status()).staged;
    expect(curStaged).toEqual(expect.arrayContaining(prevStaged))
  }, 60 * 1000);

  sleepFactory(test)('set prev staged includes a post will be pushed, then check reset staged after pushed', async () => {
    const tempGitRepo = new TempGitRepo();

    await tempGitRepo.init()
    const licensePost = tempGitRepo.addNewPostSync('license');
    // tempGitRepo.addNewPostSync('WSL的hosts文件被重置');
    const tempfilepath = tempGitRepo.touch();
    await tempGitRepo.git.add([tempfilepath, licensePost.postpath]);
    const prevStaged = (await tempGitRepo.git.status()).staged;
    const assetPublisher = new AssetPublisher({
      assetRecords: [licensePost],
      simpleGitOpt: tempGitRepo.simpleGitOpt
    });
    await assetPublisher.push();
    const curStaged = (await tempGitRepo.git.status()).staged;
    
    expect(curStaged).not.toEqual(expect.arrayContaining(prevStaged));
    expect(curStaged.length).toEqual(1);
    expect(curStaged[0]).toStrictEqual(tempfilepath);
  }, 60 * 1000);

  const getAssetPublisherInsForTestRevert = async (hooks) => {
    const tempGitRepo = new TempGitRepo();

    await tempGitRepo.init()
    const licensePost = tempGitRepo.addNewPostSync('license');
    tempGitRepo.addNewPostSync('WSL的hosts文件被重置');
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

  test.each([
    {
      name: 'init with undefined, it will emit err',
      param: undefined,
      getExpext: () => 'Constructor param muse be object'
    },
    {
      name: 'init with {}, it will emit err',
      param: {},
      getExpext: () => 'Constructor param muse be object'
    },
    {
      name: 'init with { assetRecords: {} }, it will emit err',
      param: { assetRecords: {} },
      getExpext: () => 'Constructor param assetRecords must be Array'
    },
    {
      name: 'init with { assetRecords: [{}] }, it will emit err',
      param: { assetRecords: [{}] },
      getExpext: () => 'assetRecords[].postpath must be non-empty string'
    },
    {
      name: 'init with { assetRecords: [{ postpath: 1 }] }, it will emit err',
      param: { assetRecords: [{ postpath: 1 }] },
      getExpext: () => 'assetRecords[].postpath must be non-empty string'
    },
    {
      name: 'init with { assetRecords: [{postpath: \'temp.md\'}] }, it will emit err',
      param: { assetRecords: [{postpath: 'temp.md'}] },
      getExpext: () => 'assetRecords[].assetpaths must be Array<string>'
    },
    {
      name: 'init with { assetRecords: [{postpath: \'temp.md\', assetpaths: {}}] }, it will emit err',
      param: { assetRecords: [{postpath: 'temp.md', assetpaths: {}}] },
      getExpext: () => 'assetRecords[].assetpaths must be Array<string>'
    },
    {
      name: 'init with { assetRecords: [{postpath: \'temp.md\', assetpaths: [\'\']}] }, it will emit err',
      param: { assetRecords: [{postpath: 'temp.md', assetpaths: ['']}] },
      getExpext: () => 'assetRecords[].assetpaths must be Array<string>'
    },
    {
      name: 'init with { assetRecords: [] }, it will pass',
      param: { assetRecords: [] },
    },
    {
      name: 'init with { assetRecords: [{postpath: \'temp.md\', assetpaths: []}] }, it will be passed',
      param: {
        assetRecords: [{
          postpath: 'temp.md', assetpaths: []
        }]
      }
    }
  ])('AssetPublisher ctor param, $name', ({ param, getExpext }) => {
    try {
      const ins = new AssetPublisher(param);
      expect(ins instanceof AssetPublisher).toBeTruthy();
    } catch (error) {
      console.info(`errMsg: ${error.message}`);
      expect(error.message).toEqual(getExpext({ param }));
    }
  });
});
