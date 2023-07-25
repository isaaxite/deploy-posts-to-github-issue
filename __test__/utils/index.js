import path from 'path';
import fg from 'fast-glob';
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { copySync, removeSync, ensureDirSync, moveSync } from 'fs-extra/esm';
import { PostParse } from '../../lib/post_parse.js';
import { load as loadYaml, dump as yamlDump } from 'js-yaml';
import { ConfReader } from '../../lib/conf_reader.js';
import simpleGit from 'simple-git';
import { execSync } from 'child_process';
import { cwd } from 'process';
import { FRONTMATTER } from '../../lib/constants/index.js';
import { postPath } from '../../lib/post_path.js';
import { PostFinder } from '../../lib/post_finder.js';

const DEST_SOURCE_PATH_PREFIX = '__test__/temp/source_';

export const removeTempPost = (postpath = '') => {
  if (postpath) {
    removeSync(path.parse(postpath).dir);
    return;
  }
  fg.sync([`${DEST_SOURCE_PATH_PREFIX}*/*.md`]).forEach(itPath => {
    removeSync(path.parse(itPath).dir);
  });
}

export const copyTempPost = (param) => {
  const ret = [];
  let srcArr = param;
  const timeStr = String(Date.now()).slice(2);
  const destSourceDir = `${DEST_SOURCE_PATH_PREFIX}${timeStr}`;

  if (typeof param === 'string') {
    srcArr = [param];
  }

  for (const src of srcArr) {
    const srcPathDetail = path.parse(src);
    const srcPostAssetPath = path.join(srcPathDetail.dir, srcPathDetail.name);
    const destPostAssetPath = path.join(destSourceDir, srcPathDetail.name);
    const destPostFilepath = path.join(destSourceDir, srcPathDetail.base);

    copySync(src, destPostFilepath)
    copySync(srcPostAssetPath, destPostAssetPath);

    ret.push({
      filename: srcPathDetail.name,
      filepath: destPostFilepath,
      sourceDir: destSourceDir
    });
  }

  return ret.length > 1 ? ret : ret.pop();
};

export const copyServeralTempPostBy = ({
  srcArr
}) => {
  for (const src of srcArr) {
    copyTempPost(src);
  }
};

export class TempPost {
  #post = null;
  dest = '';
  constructor({ src, conf, disable_asset_find }) {
    const { filepath } = copyTempPost(src);
    this.dest = filepath

    this.#post = new PostParse({
      path: this.dest,
      conf
    });
  }
  getContent() {
    return this.#post.getFormatedMarkdown();
  }
  getFrontmatter() {
    return this.#post.getFrontmatter();
  }
  getData() {
    const ret = {
      formatedMarkdown: this.#post.getFormatedMarkdown(),
      frontmatter: this.#post.getFrontmatter()
    };
    removeTempPost(this.dest);
    return ret;
  }

  destory() {
    removeTempPost(this.dest);
  }
}

export function detectOnly(arr) {
  const onlyItem = []; 
  const restItems = [];
  for (const it of arr) {
    if (it.only || Object.keys(it).includes('only')) {
      onlyItem.push(it);
    } else {
      restItems.push(it);
    }
  }

  return onlyItem.length ? onlyItem : restItems;
}

export function makeTempConfFile(cb) {
  const destPath = `__test__/temp/isubo.conf_${String(Date.now()).slice(2)}.yml`;
  copySync('__test__/assets/isubo.conf.yml', destPath);
  const preConf = loadYaml(readFileSync(destPath));
  writeFileSync(destPath, yamlDump(cb(preConf)));
  return destPath;
}

export function updateConfFileSync(src, cb) {
  const preConf = loadYaml(readFileSync(src));
  writeFileSync(src, yamlDump(cb(preConf)));
}

export function findImageFrom({ ast }, ret = []) {
  if (ast.type === 'image') {
    ret.push(ast);
    return ast;
  }

  if (!ast.children) {
    return;
  }

  for (const it of ast.children) {
    findImageFrom({ ast: it }, ret);
  }

  return ret;
}

export class TempRepo {
  uniqueKey = `${String(Math.random()).slice(2)}`;
  tempRepo = `__test__/temp/repo_${this.uniqueKey}`;
  tempConfPath = path.join(this.tempRepo, 'isubo.conf.yml');
  tempSourceDir = path.join(this.tempRepo, 'source');
  conf = null;

  copy(cb = val => val) {
    ensureDirSync(this.tempRepo);
    copySync('__test__/assets/isubo.conf.yml', this.tempConfPath);
    postPath.setConfBy({ confpath: this.tempConfPath });
    const preConf = loadYaml(readFileSync(this.tempConfPath));
    preConf.source_dir = this.tempSourceDir;
    writeFileSync(this.tempConfPath, yamlDump(cb(preConf)));
    const confReader = new ConfReader({ path: this.tempConfPath });
    this.conf = confReader.get();
    copySync('__test__/source', this.tempSourceDir);
  }

  remove() {
    removeSync(this.tempRepo);
  }

  resolveFromSourceDir(restPath) {
    const filepath = path.join(this.tempSourceDir, restPath);
    if (!existsSync(filepath)) {
      throw new Error(`${restPath} not exist in ${this.tempSourceDir}, filepath: ${filepath}`);
    }

    return filepath;
  }
}

export function getEnsureDirSync(dirpath) {
  ensureDirSync(dirpath);
  return path.resolve(dirpath);
}

export function getTimestampKey() {
  return String(Date.now()).slice(2);
}

/**
1 init repo
2 new a temp branch base on master;
3  add one or several changes of post file;
*/
export class TempGitRepo {
  static #cachePath = '__test__/temp/.cache/test-repo_deploy-posts-to-github-issue';
  static #repo = 'git@github.com:isaaxite/test-repo_deploy-posts-to-github-issue.git';
  #uniqueKey = getTimestampKey();
  #repoLocalPath = getEnsureDirSync(`__test__/temp/git_repo_${this.#uniqueKey}`);
  #conf = null;
  #confPath = path.join(this.#repoLocalPath, 'isubo.conf.yml');
  #sourceDir = path.join(this.#repoLocalPath, 'source');
  #branch = `temp_branch_${this.#uniqueKey}`;
  #simpleGitOpt = {
    baseDir: this.#repoLocalPath,
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
    config: ['http.proxy=127.0.0.1']
  };
  #git = simpleGit(this.#simpleGitOpt);
  
  constructor() {
    // ensureDirSync(this.#repoLocalPath);
    console.info(this.#repoLocalPath)
  }

  get repoLocalPath() {
    return this.#repoLocalPath;
  }

  get simpleGitOpt () {
    return {
      ...this.#simpleGitOpt,
      config: [...this.#simpleGitOpt.config]
    };
  }

  get git () {
    return this.#git;
  }

  get confPath () {
    return this.#confPath;
  }

  get sourceDir() {
    return this.#sourceDir;
  }

  async init({
    preConf: preConfFn
  } = {}) {
    let ret = null;
    if (existsSync(path.join(TempGitRepo.#cachePath, 'isubo.conf.yml'))) {
      copySync(TempGitRepo.#cachePath, this.#repoLocalPath);
    } else {
      getEnsureDirSync(TempGitRepo.#cachePath);
      ret = await this.#git.clone(TempGitRepo.#repo, this.#repoLocalPath);
      copySync(this.#repoLocalPath, TempGitRepo.#cachePath);
    }
    ret = await this.#git.checkout(['-b', this.#branch]);
    updateConfFileSync(path.join(this.#repoLocalPath, 'isubo.conf.yml'), (preConf) => {
      preConf.source_dir = 'source/';
      preConf.branch = 'master';
      delete preConf.prefix;
      delete preConf.post_dir;
      preConfFn && preConfFn(preConf);
      return preConf;
    });

    const confReader = new ConfReader({ path: this.#confPath });
    this.#conf = confReader.get();

    execSync(`cd ${this.#repoLocalPath} && pnpm add ${cwd()}`);

    return ret;
  }

  #addNewPostSyncWithSeat(postname) {
    const { post_title_seat } = this.#conf;
    const lastPostname = path.parse(postname).name;
    const postFinder = new PostFinder({
      postTitleSeat: post_title_seat,
      filename: lastPostname,
      sourceDir: this.#sourceDir
    });
    const src = postFinder.getFilepaths().pop();
    const detail = path.parse(src);
    let pathItems = detail.dir.split(path.sep);
    pathItems.push(detail.name);
    pathItems.reverse();
    let destPathIts = [...pathItems];

    pathItems = pathItems.slice(post_title_seat);
    pathItems.reverse();
    const srcDir = pathItems.join(path.sep);

    const destname = `${lastPostname}_${this.#uniqueKey}`;
    // destPathIts = destPathIts.slice(post_title_seat);
    destPathIts[post_title_seat] = destname;
    const postPathIts = [...destPathIts];
    postPathIts.reverse();
    const postpath = postPathIts.join(path.sep) + detail.ext;

    destPathIts = destPathIts.slice(post_title_seat);
    destPathIts.reverse();
    const destDir = destPathIts.join(path.sep);
    copySync(srcDir, destDir);

    const confReader = new ConfReader({ path: this.#confPath });
    const conf = confReader.get();
    const postParse = new PostParse({
      path: postpath,
      conf,
      disable_immediate_formatAssetLink: true
    });
    const astRef = postParse.getAst();
    const assetPatterns = [];
    const format = (astChildren) => {
      if (!astChildren || !astChildren.length) {
        return;
      }
      for (const astRef of astChildren) {
        if (conf.types.includes(astRef.type) && !astRef.url.startsWith('http')) {
          const basename = path.basename(astRef.url);
          assetPatterns.push(path.join(destDir, '**/', basename));
        }
        format(astRef.children);
      }
    };
    format(astRef.children);

    const assetpaths = fg.sync(assetPatterns);

    return {
      postpath: path.resolve(this.#repoLocalPath, postpath),
      assetpaths
    };
  }

  #addNewPostSync(postname) {
    const destname = `${postname}_${this.#uniqueKey}`;

    const { post_title_seat } = this.#conf;
    const lastPostname = path.parse(postname).name;
    const postFinder = new PostFinder({
      postTitleSeat: post_title_seat,
      filename: lastPostname,
      sourceDir: this.#sourceDir
    });
    const src = postFinder.getFilepaths()[0];
    const detail = path.parse(src);
    const srcDir = path.join(detail.dir, detail.name);
    detail.name = destname;
    detail.base = detail.name + detail.ext;
    const dest = path.format(detail);
    const destDir = path.join(detail.dir, detail.name);

    copySync(src, dest);
    copySync(srcDir, destDir);
    const confReader = new ConfReader({ path: this.#confPath });
    const conf = confReader.get();
    const postParse = new PostParse({
      path: dest,
      conf,
      disable_immediate_formatAssetLink: true
    });
    const astRef = postParse.getAst();
    const format = (astChildren) => {
      if (!astChildren || !astChildren.length) {
        return;
      }
      for (const astRef of astChildren) {
        if (conf.types.includes(astRef.type)) {

          astRef.url = astRef.url.replace(postname, destname);
        }
        format(astRef.children);
      }
    };

    format(astRef.children);
    const mdtxt = postParse.getFormatedMarkdown();
    writeFileSync(dest, mdtxt);

    return {
      postpath: path.resolve(this.#repoLocalPath, dest),
      assetpaths: readdirSync(destDir).map(it => path.resolve(
        this.#repoLocalPath,
        path.join(destDir, it)
      ))
    };
  }

  addNewPostSync(postname) {
    const { post_title_seat } = this.#conf;
    if (post_title_seat <= 0) {
      return this.#addNewPostSync(postname);
    }

    return this.#addNewPostSyncWithSeat(postname);
  }

  #ensurePostDir(postTitle) {
    const { post_title_seat } = this.#conf;

    const mid = new Array(post_title_seat - 1).fill(() => `${String(Math.random()).slice(2)}`).map(exec => exec()).join(path.sep);

    const dir = path.join(this.#sourceDir, postTitle, mid);
    ensureDirSync(dir);
    return dir;
  }

  adjustPostDirStruct() {
    const { post_title_seat } = this.#conf;

    if (post_title_seat <= 0) {
      return;
    }

    const backSourceDir = `${this.#sourceDir}_backup`;
    moveSync(this.#sourceDir, backSourceDir);
    const postArr = fg.sync([`${backSourceDir}/**/*.md`]).map(postPath => {
      const absolutePath = path.resolve(postPath);

      return {
        postTitle: path.parse(absolutePath).name,
        postPath: absolutePath,
        assetDirPath: absolutePath.replace('.md', '')
      };
    });

    ensureDirSync(this.#sourceDir);

    for (const it of postArr) {
      const postDir = this.#ensurePostDir(it.postTitle);
      moveSync(it.postPath, path.join(postDir, path.basename(it.postPath)));
      moveSync(it.assetDirPath, path.join(postDir, path.basename(it.assetDirPath)));
    }

    removeSync(backSourceDir);
  }

  touch() {
    const dest = path.join(this.#repoLocalPath, `temp_${this.#uniqueKey}.txt`);
    writeFileSync(dest, `temp_${this.#uniqueKey}`);
    return path.relative(this.#repoLocalPath, dest);
  }

  async addStaged(filepaths) {
    await this.#git.add(filepaths)
  }
}

export function copyTempPostWithoutFrontmatter(src) {
  const temp = copyTempPost(src);
  const {
    sourceDir,
    filepath
  } = temp;
  const getPostParse = () => new PostParse({
    path: filepath,
    conf: {
      link_prefix: 'https://isaaxite.github.io/blog/resources/',
      absolute_source_dir: path.resolve(sourceDir)
    },
    disable_immediate_formatAssetLink: true
  });

  const postParse = getPostParse();
  const ast = postParse.getAst();

  if (ast.children[0].type === FRONTMATTER) {
    ast.children = ast.children.slice(1);
  }
  const mdtxt = postParse.getFormatedMarkdown({ ast });
  writeFileSync(filepath, mdtxt);

  return temp;
}


export async function sleep(ms = 1000) {
  return new Promise(fn => setTimeout(() => fn(null), ms))
}

export function sleepFactory(testExec, sleepMs = 1000) {
  return (name, cb, timeout = 5000) => testExec(...[
    name,
    async (...argvs) => {
      await sleep(sleepMs);
      await cb(...argvs);
    },
    timeout + sleepMs
  ]);
}


export function getErrMsgFrom({ throwErrFunc }) {
  try {
    throwErrFunc();
  } catch (error) {
    return error.message;
  }
}