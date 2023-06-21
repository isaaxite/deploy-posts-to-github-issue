import { simpleGit } from 'simple-git';

export class AssetPublisher {
  static async push() {
    const git = simpleGit();

    const curBranch = await git.branch();
    console.info(curBranch);
    const status = await git.status();
    if (status.isClean()) {
      return;
    }

    // git.add('./*')
    // git.commit('')
  }
}
