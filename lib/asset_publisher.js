import path from 'path';
import { simpleGit, ResetMode } from 'simple-git';
import process from 'node:process';
import { hinter } from './hinter.js';

export class AssetPublisher {
  #git = null;
  #staged = [];
  #assetRecords = [];
  #srcPostpaths = [];
  #srcAssetpaths = [];
  #srcUnpushPaths = [];
  #unpushPaths = [];
  #stashCommitId = '';
  #postAndAssetsCommitId = '';
  #latestCommitId = '';

  constructor({
    assetRecords
  }) {
    this.#git = simpleGit();
    this.#assetRecords = assetRecords;
    this.#setSrcAssetpathsAndSrcPostpaths();
    this.#srcUnpushPaths = [
      ...this.#srcPostpaths,
      ...this.#srcAssetpaths
    ];
  }

  async #setLatestCommitId() {
    const ret = await this.#git.log();
    this.#latestCommitId = ret.latest.hash;
  }

  #setSrcAssetpathsAndSrcPostpaths() {
    const srcPostpaths = [];
    let srcAssetpaths = [];

    for (const it of this.#assetRecords) {
      srcPostpaths.push(it.postpath);
      srcAssetpaths = [ ...srcAssetpaths, ...it.assetpaths ];
    }

    this.#srcPostpaths = Array.from(new Set(srcPostpaths));
    this.#srcAssetpaths = Array.from(new Set(srcAssetpaths));
  }

  #getUnpushPathsBy({ status }) {
    const unpushFilepaths = status.files.map(it => it.path);
    return this.#srcUnpushPaths.filter((it) => unpushFilepaths.includes(it));
  }

  async #commitPostAndAssetsBy({ status }) {
    const git = this.#git;

    this.#unpushPaths = this.#getUnpushPathsBy({ status });
    await git.add(this.#unpushPaths);

    const firstPostname = path.parse(this.#srcPostpaths[0]).name;
    const ret = await git.commit(this.#srcPostpaths.length > 1
      ? `Update ${this.#srcPostpaths.length} articles  including "${firstPostname}", and related resources`
      : `Update "${firstPostname}" article and related resources`
    );
    this.#postAndAssetsCommitId = ret.commit;
  }

  async #commitStash() {
    const git = this.#git;
    await git.add('.');
    const ret = await git.commit('stash');
    this.#stashCommitId = ret.commit;
  }

  async #recover() {
    const git = this.#git;
    const staged = this.#staged.filter(it => !this.#unpushPaths.includes(it));

    await git.reset(ResetMode.HARD, {
      [this.#stashCommitId]: null
    });
    await git.reset(ResetMode.MIXED, { [this.#postAndAssetsCommitId]: null });
    if (staged.length) {
      await git.add(staged);
    }
  }

  async #recoverAsErr() {
    const git = this.#git;
    await git.reset(ResetMode.HARD, { [this.#stashCommitId]: null });
    await git.reset(ResetMode.MIXED, { [this.#latestCommitId]: null });
    if (this.#staged.length) {
      await git.add(this.#staged);
    }
  }

  async #pushPostAndAssets() {
    const git = this.#git;
    await git.reset(ResetMode.HARD, {
      [this.#postAndAssetsCommitId]: null
    });
    const branchLocal = await git.branchLocal();
    const ret = await git.push(['origin', branchLocal.current]);
    console.info(ret);
  }

  #hintRevertCli() {
    hinter.warnMsg('If exit midway, need to exec the below cmd to restore:')
    hinter.warnMsg(`git reset --hard ${this.#stashCommitId.slice(0,7)} && git reset ${this.#latestCommitId.slice(0,7)}`)
  }

  async #push() {
    const git = this.#git;
    let status = await git.status();

    if (status.staged.length) {
      this.#staged = [...status.staged];
      await git.reset(ResetMode.MIXED);
      status = await git.status();
    }

    await this.#commitPostAndAssetsBy({ status });
    await this.#commitStash();
    this.#hintRevertCli();

    const publishAssetsKey = `publishAssets_${String(Date.now()).slice}`;
    const text = 'Publish posts and corresponding assets';
    try {
      hinter.load(publishAssetsKey, { text });
      await this.#pushPostAndAssets();
      await this.#recover();
      hinter.loadSucc(publishAssetsKey);
    } catch (error) {
      hinter.loadFail(publishAssetsKey);
      throw error
    }
  }

  async push() {
    const git = this.#git;
    let status = await git.status();

    if (status.isClean()) {
      return;
    }


    // const curBranch = await git.branchLocal();
    try {
      await this.#setLatestCommitId();
      
      await this.#push()
      // process.on('SIGINT', async () => {
      //   console.info(1111)
      //   await this.#recoverAsErr();
      // });
    } catch (error) {
      await this.#recoverAsErr();
      throw error;
    }
  }

  async checkIsUnpushPostAndAssets() {
    const git = this.#git;
    let status = await git.status();

    if (status.staged.length) {
      this.#staged = [...status.staged];
      await git.reset(ResetMode.MIXED);
      status = await git.status();
    }

    this.#unpushPaths = this.#getUnpushPathsBy({ status });
    if (this.#staged.length) {
      await git.add(this.#staged);
    }
    return this.#unpushPaths;
  }
}
