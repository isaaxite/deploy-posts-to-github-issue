import path from 'path';
import { copySync, ensureDirSync, ensureFileSync, removeSync } from 'fs-extra/esm'
// import { copySync, ensureFileSync, removeSync } from 'fs-extra'
import { AssetFinder } from '../../lib/asset_finder.js';
import { findImageFrom, getTimestampKey, makeTempConfFile } from '../utils/index.js';
import { ConfReader } from '../../lib/conf_reader.js';
import { PostParse } from '../../lib/post_parse.js';
import { writeFileSync } from 'fs';
import { postPath } from '../../lib/post_path.js';

export function multiLevelSearchForResources(cb) {
  const sourceDirPath = '__test__/temp/';
  const picname = 'asset_find.test.png'
  const picpath = `__test__/assets/${picname}`;
  const levelDirnames = ['level_1', 'level_2', 'level_3'];
  const fullDirpath = path.join(sourceDirPath, ...levelDirnames);
  for (let idx = 0; idx < levelDirnames.length; idx += 1) {
    const destPath = path.join(sourceDirPath, ...levelDirnames.slice(0, idx + 1), picname);
    const postpath = path.join(fullDirpath, 'temp.md');

    ensureFileSync(postpath);
    ensureDirSync(fullDirpath);
    copySync(picpath, destPath);
    
    const assetFinder = new AssetFinder({
      sourceDirPath,
      postpath,
      assetPath: `./${picname}`
    });
    const assetPath = assetFinder.get();
    cb && cb({
      destPath: path.resolve(destPath),
      assetPath: path.resolve(assetPath)
    });
    removeSync(path.join(sourceDirPath, levelDirnames[0]));
  }
}

export function asset_is_outside_the_source_dir() {
  const picname = 'asset_find.test.png'
  const picpath = `__test__/assets/${picname}`;
  const uniqueChars = getTimestampKey();
  const tempDir = `__test__/temp_${uniqueChars}`
  const sourceDir = path.join(tempDir, 'source');
  const postpath = path.join(sourceDir, 'temp.md');
  const assetDestPath = path.join(tempDir, picname);
  ensureFileSync(postpath);
  copySync(picpath, assetDestPath);

  const assetFinder = new AssetFinder({
    sourceDirPath: sourceDir,
    postpath,
    assetPath: `./${picname}`
  });
  const assetPath = assetFinder.get();
  assetFinder.getRelativeToSourceDir();
  removeSync(tempDir);

  return assetPath;
}

export function parse_a_md_file_and_find_nonrelative_path_asset(cb) {
  const timestemp = String(Date.now()).slice(2);
  const tempSource = `__test__/temp/source_${timestemp}`;
  copySync('__test__/source', tempSource);
  const tempConfPath = makeTempConfFile((preConf) => {
    preConf.source_dir = tempSource;
    return preConf;
  });

  const confReader = new ConfReader({
    path: tempConfPath
  });
  postPath.setConfBy({ confpath: tempConfPath });
  const conf = confReader.get();
  const postParse = new PostParse({
    path: path.join(tempSource, "WSL的hosts文件被重置.md"),
    conf
  });
  const mktxt = postParse.getFormatedMarkdown();
  const destPath = `__test__/temp/WSL的hosts文件被重置_${timestemp}.md`;
  writeFileSync(destPath, mktxt);
  const postParse1 = new PostParse({
    path: destPath,
    conf
  });

  const ast = postParse1.getAst();
  const imgAstArr = findImageFrom({ ast });

  const {
    owner,
    repo,
    branch
  } = conf;
  for (const imgAst of imgAstArr) {
    const imgSrc = imgAst.url;
    const urlDetail = new URL(imgSrc);
    const assetPath = decodeURIComponent(
      path.relative(`/${owner}/${repo}/${branch}/`, urlDetail.pathname)
    );

    cb && cb(assetPath);
  }
  removeSync(destPath);
  removeSync(tempConfPath);
  removeSync(tempSource);
}
