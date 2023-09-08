import path from 'path';
import { writeFileSync } from "fs";
import { ConfReader } from "../../lib/conf_reader.js";
import { dump as yamlDump } from 'js-yaml';
import { TempGitRepo, TempRepo, copyTempPostWithoutFrontmatter } from "../utils/index.js";
import { PostParse } from "../../lib/post_parse.js";
import { removeSync } from 'fs-extra/esm';

export function empty_parse_conf(preConf = {}) {
  const confpath = '__test__/temp/empty.conf.yml';
  writeFileSync(confpath, yamlDump(preConf));
  const confReader = new ConfReader({
    path: confpath
  });
  const ret = confReader.get();
  return ret;
}

export function inject_yml_data_to_md_file_without_yml_data(cb) {
  const {
    sourceDir,
    filepath
  } = copyTempPostWithoutFrontmatter('__test__/source/license.md');

  const getPostParse = () => new PostParse({
    path: filepath,
    conf: {
      link_prefix: 'https://isaaxite.github.io/blog/resources/',
      absolute_source_dir: path.resolve(sourceDir)
    }
  });

  const issue_number = Math.ceil(Math.random() * 100) + 100;
  const postParse1 = getPostParse();
  postParse1.injectFrontmatter({ issue_number });

  const postParse2 = getPostParse();
  const frontmatter = postParse2.getFrontmatter();

  removeSync(sourceDir);

  const ret = {
    settingIssueNum: issue_number,
    gettingIssueNum: frontmatter.issue_number
  };

  cb && cb(ret)

  return ret;
}

export async function inject_yml_data_to_md_file_existed_yml_data(cb) {
  const temp = new TempGitRepo();
  await temp.init();

  const postpath = path.join(temp.sourceDir, 'license.md');

  const getPostParse = () => new PostParse({
    path: postpath,
    conf: {
      link_prefix: 'https://isaaxite.github.io/blog/resources/',
      absolute_source_dir: path.resolve(temp.sourceDir)
    }
  });

  const issue_number = Math.ceil(Math.random() * 100) + 100;
  const postParse1 = getPostParse();
  postParse1.injectFrontmatter({ issue_number });

  removeSync(temp.repoLocalPath);
}

export function get_ast_from_empty_md_file(cb) {
  const filepath = '__test__/temp/empty.md';
  writeFileSync(filepath, '');
  const postParse = new PostParse({
    path: filepath,
    conf: {
      link_prefix: 'https://isaaxite.github.io/blog/resources/',
      absolute_source_dir: path.resolve('source'),
      types: ['non-enumLinkType']
    }
  });
  removeSync(filepath);

  const ast = postParse.getAst();
  cb && cb(ast);

  return ast;
}

export function get_hidden_frontmatter_formatedMarkdown(cb) {
  const tempRepo = new TempRepo();
  tempRepo.copy((conf) => {
    conf.hide_frontmatter = true;
    return conf;
  });

  const postpath = path.join(tempRepo.tempSourceDir, 'license.md');
  const confReader = new ConfReader({ path: tempRepo.tempConfPath });
  const conf = confReader.get();
  const postParse = new PostParse({
    path: postpath,
    conf
  });

  const markdownText = postParse.getFormatedMarkdown();

  const postParse1 = new PostParse({
    markdownText,
    conf: {
      ...conf,
      hide_frontmatter: false
    }
  });

  const prevFrontmatter = postParse.getFrontmatter();
  const nextFrontmatter = postParse1.getFrontmatter();

  const ret = {
    prevFrontmatter,
    nextFrontmatter
  };
  cb && cb(ret);
  return ret;
}

export function parse_md_file_without_yml_data(cb) {
  const {
    sourceDir,
    filepath
  } = copyTempPostWithoutFrontmatter('__test__/source/license.md');
  const postParse = new PostParse({
    path: filepath,
    conf: {
      link_prefix: 'https://isaaxite.github.io/blog/resources/',
      absolute_source_dir: path.resolve(sourceDir)
    }
  });
  const ret = postParse.getFrontmatter();
  cb && cb(ret);

  return ret;
}

export function get_formated_mdtxt_from_empty_md_file() {
  const filepath = '__test__/temp/empty.md';
  writeFileSync(filepath, '');
  const postParse = new PostParse({
    path: filepath,
    conf: {
      link_prefix: 'https://isaaxite.github.io/blog/resources/',
      absolute_source_dir: path.resolve('source'),
      types: ['non-enumLinkType']
    }
  });
  removeSync(filepath)

  const ret = postParse.getFormatedMarkdown();

  return ret;
}
