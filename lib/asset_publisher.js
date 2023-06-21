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
  #uniqueKey = `publish_assets_${String(Date.now()).slice(2)}`;

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
    const statusFiles = status.files || [];
    const unpushFilepaths = statusFiles.map(it => it.path);
    return this.#srcUnpushPaths.filter((it) => unpushFilepaths.includes(it));
  }

  async #commitPostAndAssets() {
    const git = this.#git;
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

  async #backupStagedBy({ status }) {
    if (status.staged.length) {
      this.#staged = [...status.staged];
      await git.reset(ResetMode.MIXED);
      status = await git.status();
    }

    return status;
  }

  async #recoverStaged() {
    const staged = this.#staged.filter(it => !this.#unpushPaths.includes(it));
    if (staged.length) {
      await this.#git.add(staged);
    }
  }

  async #resetToStashCommit(resetMode) {
    if (this.#stashCommitId) {
      await this.#git.reset(resetMode, { [this.#stashCommitId]: null });
    }
  }

  async #resetTolatestCommit(resetMode) {
    if (this.#latestCommitId) {
      await this.#git.reset(resetMode, { [this.#latestCommitId]: null });
    }
  }

  async #resetToPostAndAssetsCommit(resetMode) {
    if (this.#postAndAssetsCommitId) {
      await this.#git.reset(resetMode, { [this.#postAndAssetsCommitId]: null });
    }
  }

  async #recover() {
    await this.#resetToStashCommit(ResetMode.HARD);
    await this.#resetToPostAndAssetsCommit(ResetMode.MIXED);
    await this.#recoverStaged();
  }

  async #recoverAsErr() {
    await this.#resetToStashCommit(ResetMode.HARD);
    await this.#resetTolatestCommit(ResetMode.MIXED);

    if (this.#staged.length) {
      await this.#git.add(this.#staged);
    }
  }

  async #setBackupBranch() {
    const git = this.#git;
    return await git.branch([`backup_${this.#uniqueKey}`]);
  } 

  async #pushPostAndAssets() {
    const git = this.#git;

    await this.#resetToPostAndAssetsCommit(ResetMode.HARD);
    const branchLocal = await git.branchLocal();
    const ret = await git.push(['origin', branchLocal.current]);
    return ret;
  }

  async #pushPostAndAssetsWithHint() {
    this.#pushPostAndAssets();
  }

  #hintRevertCli() {
    hinter.warnMsg('If exit midway, need to exec the below cmd to restore:')
    hinter.warnMsg(`git reset --hard ${this.#stashCommitId.slice(0,7)} && git reset ${this.#latestCommitId.slice(0,7)}`)
  }

  async #push() {
    const publishAssetsKey = this.#uniqueKey;
    const git = this.#git;
    let status = await git.status();

    status = await this.#backupStagedBy({ status });
    this.#unpushPaths = this.#getUnpushPathsBy({ status });

    if (!this.#unpushPaths.length) {
      hinter.infoMsg('Without any posts and corresponding assets need to publish!');
      return;
    }

    await this.#commitPostAndAssets();
    await this.#commitStash();
    this.#hintRevertCli();

    const text = 'Publish posts and corresponding assets';
    try {
      hinter.load(publishAssetsKey, { text });
      await this.#setBackupBranch();
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
      hinter.infoMsg('Current branch is clean, please check if need to manually push!');
      return;
    }

    // const curBranch = await git.branchLocal();
    try {
      await this.#setLatestCommitId();
      await this.#push();
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
