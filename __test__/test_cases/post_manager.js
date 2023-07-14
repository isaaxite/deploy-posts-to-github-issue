import { PostManager } from "../../lib/post_manager.js";
import { TempPost } from "../utils/index.js";

const OWNER = 'isaaxite';
const REPO = 'test-repo_deploy-posts-to-github-issue';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export const getPostManagerIns = () => new PostManager({
  owner: OWNER,
  repo: REPO,
  token: GITHUB_TOKEN
});

export async function force_create_a_issue_and_then_update_it({
  forceCreate,
  update
} = {}) {
  const tempFile = new TempPost({
    src: '__test__/source/license.md',
    conf: {
      link_prefix: 'https://isaaxite.github.io/blog/resources/',
      types: ['image'],
      disable_asset_find: true
    }
  });
  const {
    frontmatter,
    formatedMarkdown: mdtext
  } = tempFile.getData();
  const {
    title,
    tags
  } = frontmatter;
  const postManager = getPostManagerIns();
  const ret = await postManager.forceCreate({
    title,
    issue_number: Math.ceil(Math.random() * 100) + 100,
    body: mdtext,
    labels: tags
  });

  forceCreate && forceCreate(ret);

  const updateTitle = title + String(Date.now()).slice(2);
  const updateRet = await postManager.update({
    title: updateTitle,
    body: mdtext,
    labels: tags,
    issue_number: ret.data.number
  });

  update && update(updateRet, updateTitle);

  return {
    forceCreateRet: ret,
    updateRet
  };
}

export async function update_a_post_without_issue_number() {
  const tempFile = new TempPost({
    src: '__test__/source/license.md',
    conf: {
      link_prefix: 'https://isaaxite.github.io/blog/resources/',
      types: ['image'],
      disable_asset_find: true
    }
  });
  const {
    frontmatter,
    formatedMarkdown: mdtext
  } = tempFile.getData();
  const {
    title,
    tags
  } = frontmatter;
  const postManager = getPostManagerIns();
  await postManager.update({
    title,
    body: mdtext,
    labels: tags
  });
}
