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
  #uniqueKey = String(Date.now()).slice(2);
  #recoverQueue = [];

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

  async #commitPostAndAssetsWithHint() {
    return await this.#hintWraper({
      action: 'commitPostAndAssets',
      text: 'Set a commit for posts and corresponding assets',
      callback: this.#commitPostAndAssets.bind(this)
    });
  }

  async #hintWraper({
    text,
    action,
    callback
  }) {
    let ret = null;
    const hintKey = `${action}_${this.#uniqueKey}`;
    try {
      hinter.load(hintKey, { text });
      ret = await callback();
      hinter.loadSucc(hintKey);
    } catch (error) {
      hinter.loadFail(hintKey);
      throw error;
    }

    return ret;
  }

  async #commitStash() {
    const git = this.#git;
    await git.add('.');
    const ret = await git.commit('stash');
    this.#stashCommitId = ret.commit;
  }

  async #commitStashWithHint() {
    return await this.#hintWraper({
      action: 'commitStash',
      text: 'Set a commit to stash rest changes',
      callback: this.#commitStash.bind(this)
    });
  }

  async #addRecoverTask(name, hint, task) {
    this.#recoverQueue.push({ name, hint, task });
  }

  async #dumpRecoverTasks() {
    this.#recoverQueue = [];
  }

  async #execRecoverTasks() {
    const recoverQueue = this.#recoverQueue;
    for (let i = 0; i < recoverQueue.length; i += 1 ) {
      const { name, task, hint } = recoverQueue.pop();
      if (!hint) {
        await task();
        continue;
      }

      const hintKey = `exec_recover_rask_${name}_${String(Date.now()).slice(2)}`;
      try {
        hinter.load(hintKey, { text: hint });
        await task();
        hinter.loadSucc(hintKey);
      } catch (error) {
        hinter.loadFail(hintKey);
      }
    }

    this.#dumpRecoverTasks();
  }

  async #backupPrevStagedBy({ status }) {
    if (status.staged.length) {
      this.#staged = [...status.staged];
      await git.reset(ResetMode.MIXED);
      status = await git.status();
    }

    return status;
  }

  async #recoverPrevStaged() {
    if (this.#staged.length) {
      await this.#git.add(this.#staged);
    }
  }

  async #backupPrevStagedWithHintBy({ status }) {
    return this.#hintWraper({
      action: 'backupStaged',
      text: 'Backup current staged',
      callback: async () => await this.#backupPrevStagedBy({ status })
    });
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

  async #recoverAsSucPush() {
    await this.#resetToStashCommit(ResetMode.HARD);
    await this.#resetToPostAndAssetsCommit(ResetMode.MIXED);
    await this.#recoverStaged();
  }

  async #recoverAsSucPushWithHint() {
    return this.#hintWraper({
      action: 'recoverAsSucPush',
      text: 'Recover stash and staged above',
      callback: this.#recoverAsSucPush.bind(this)
    });
  }

  async #setBackupBranch() {
    const git = this.#git;
    return await git.branch([`backup_${this.#uniqueKey}`]);
  }
  
  async #setBackupBranchWithHint() {
    return await this.#hintWraper({
      action: 'setBackupBranch',
      text: `Set a temp branch(backup_${this.#uniqueKey}) to backup`,
      callback: this.#setBackupBranch.bind(this)
    })
  }

  async #delBackupBranch() {
    const git = this.#git;
    return await git.deleteLocalBranch(`backup_${this.#uniqueKey}`);
  }

  async #delBackupBranchWithHint() {
    return await this.#hintWraper({
      action: 'delBackupBranch',
      text: `Delete temp branch(backup_${this.#uniqueKey})`,
      callback: this.#delBackupBranch.bind(this)
    })
  }

  async #pushPostAndAssets() {
    const git = this.#git;
    const branchLocal = await git.branchLocal();
    const ret = await git.push(['origin', branchLocal.current]);
    return ret;
  }

  async #pushPostAndAssetsWithHint() {
    return await this.#hintWraper({
      action: 'publish_posts_and_asset',
      text: 'Publish posts and corresponding assets',
      callback: this.#pushPostAndAssets.bind(this)
    });
  }

  #hintRevertCli() {
    hinter.warnMsg('If exit midway, need to exec the below cmd to restore:')
    hinter.warnMsg(`git reset --hard ${this.#stashCommitId.slice(0,7)} && git reset ${this.#latestCommitId.slice(0,7)}`)
  }

  async #push() {
    const git = this.#git;
    let status = await git.status();

    status = await this.#backupPrevStagedWithHintBy({ status });
    this.#addRecoverTask({
      name: 'recoverPrevStaged',
      hint: 'Revert prev staged',
      task: this.#recoverPrevStaged.bind(this)
    });
    this.#unpushPaths = this.#getUnpushPathsBy({ status });

    if (!this.#unpushPaths.length) {
      hinter.infoMsg('Without any posts and corresponding assets need to publish!');
      return;
    }

    await this.#commitPostAndAssetsWithHint();
    this.#addRecoverTask({
      name: 'resetTolatestCommit',
      hint: 'Revert to the record before push',
      task: this.#resetTolatestCommit.bind(this, ResetMode.MIXED)
    });
    await this.#commitStashWithHint();
    this.#hintRevertCli();
    await this.#setBackupBranchWithHint();
    await this.#resetToPostAndAssetsCommit(ResetMode.HARD);
    this.#addRecoverTask({
      name: 'resetToStashCommit',
      task: this.#resetToStashCommit(ResetMode.HARD)
    });
    await this.#pushPostAndAssetsWithHint();
    this.#dumpRecoverTasks();
    await this.#recoverAsSucPushWithHint();
    await this.#delBackupBranchWithHint();
  }

  async push() {
    const git = this.#git;
    let status = await git.status();

    if (status.isClean()) {
      hinter.infoMsg('Current branch is clean, please check if need to manually push!');
      return;
    }

    // const curBranch = await git.branchLocal();
    await this.#setLatestCommitId();
    try {
      await this.#push();
    } catch (error) {
      await this.#execRecoverTasks();
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
