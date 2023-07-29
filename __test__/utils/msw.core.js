import { rest } from 'msw';
import { setupServer } from 'msw/node';

const URL = `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues`;

"https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues"

export const server = setupServer(
  rest.post(URL, (req, res, ctx) => {
    let ret = {};
    try {
      ret = respDataForCreate(req, res, ctx); 
    } catch (error) {
      console.log(error);
    }
    return res(ctx.json(ret));
  }),
  rest.patch(`${URL}/:issue_number`, (req, res, ctx) => {
    let ret = {};
    try {
      ret = respDataForUpdate(req, res, ctx); 
    } catch (error) {
      console.log(error);
    }
    return res(ctx.json(ret));
  }),
);

function respDataForCreate(req) {
  const issue_number = Math.ceil(Math.random() * 100) + 100;
  const { title, body, labels } = req.body;
  const lastLabels = (labels || []).map(label => {
    return {
      id: String(Date.now()).slice(2),
      node_id: "LA_kwDOKA-MBM8AAAABWO8sPw",
      url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/labels/${encodeURIComponent(label)}`,
      name: label,
      color: "ededed",
      default: false,
      description: null,
    };
  });

  return {
    url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}`,
    repository_url: "https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue",
    labels_url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}/labels{/name}`,
    comments_url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}/comments`,
    events_url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}/events`,
    html_url: `https://github.com/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}`,
    id: 1827342031,
    node_id: "I_kwDOKA-MBM5s6wbP",
    number: issue_number,
    title,
    user: {
      login: "isaaxite",
      id: 25907273,
      node_id: "MDQ6VXNlcjI1OTA3Mjcz",
      avatar_url: "https://avatars.githubusercontent.com/u/25907273?v=4",
      gravatar_id: "",
      url: "https://api.github.com/users/isaaxite",
      html_url: "https://github.com/isaaxite",
      followers_url: "https://api.github.com/users/isaaxite/followers",
      following_url: "https://api.github.com/users/isaaxite/following{/other_user}",
      gists_url: "https://api.github.com/users/isaaxite/gists{/gist_id}",
      starred_url: "https://api.github.com/users/isaaxite/starred{/owner}{/repo}",
      subscriptions_url: "https://api.github.com/users/isaaxite/subscriptions",
      organizations_url: "https://api.github.com/users/isaaxite/orgs",
      repos_url: "https://api.github.com/users/isaaxite/repos",
      events_url: "https://api.github.com/users/isaaxite/events{/privacy}",
      received_events_url: "https://api.github.com/users/isaaxite/received_events",
      type: "User",
      site_admin: false,
    },
    labels: lastLabels,
    state: "open",
    locked: false,
    assignee: null,
    assignees: [
    ],
    milestone: null,
    comments: 0,
    created_at: "2023-07-29T06:12:44Z",
    updated_at: "2023-07-29T06:12:44Z",
    closed_at: null,
    author_association: "OWNER",
    active_lock_reason: null,
    body,
    closed_by: null,
    reactions: {
      url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}/reactions`,
      total_count: 0,
      "+1": 0,
      "-1": 0,
      laugh: 0,
      hooray: 0,
      confused: 0,
      heart: 0,
      rocket: 0,
      eyes: 0,
    },
    timeline_url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}/timeline`,
    performed_via_github_app: null,
    state_reason: null,
  };
}

function respDataForUpdate(req) {
  const { title, body, labels } = req.body;
  const { issue_number } = req.params;
  const lastLabels = labels.map(label => {
    return {
      id: String(Date.now()).slice(2),
      node_id: "LA_kwDOKA-MBM8AAAABWO8sPw",
      url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/labels/${encodeURIComponent(label)}`,
      name: label,
      color: "ededed",
      default: false,
      description: null,
    };
  });

  return {
    url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}`,
    repository_url: "https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue",
    labels_url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}/labels{/name}`,
    comments_url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}/comments`,
    events_url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}/events`,
    html_url: `https://github.com/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}`,
    id: 1827342031,
    node_id: "I_kwDOKA-MBM5s6wbP",
    number: issue_number,
    title,
    user: {
      login: "isaaxite",
      id: 25907273,
      node_id: "MDQ6VXNlcjI1OTA3Mjcz",
      avatar_url: "https://avatars.githubusercontent.com/u/25907273?v=4",
      gravatar_id: "",
      url: "https://api.github.com/users/isaaxite",
      html_url: "https://github.com/isaaxite",
      followers_url: "https://api.github.com/users/isaaxite/followers",
      following_url: "https://api.github.com/users/isaaxite/following{/other_user}",
      gists_url: "https://api.github.com/users/isaaxite/gists{/gist_id}",
      starred_url: "https://api.github.com/users/isaaxite/starred{/owner}{/repo}",
      subscriptions_url: "https://api.github.com/users/isaaxite/subscriptions",
      organizations_url: "https://api.github.com/users/isaaxite/orgs",
      repos_url: "https://api.github.com/users/isaaxite/repos",
      events_url: "https://api.github.com/users/isaaxite/events{/privacy}",
      received_events_url: "https://api.github.com/users/isaaxite/received_events",
      type: "User",
      site_admin: false,
    },
    labels: lastLabels,
    state: "open",
    locked: false,
    assignee: null,
    assignees: [
    ],
    milestone: null,
    comments: 0,
    created_at: "2023-07-29T06:12:44Z",
    updated_at: "2023-07-29T06:12:45Z",
    closed_at: null,
    author_association: "OWNER",
    active_lock_reason: null,
    body,
    closed_by: null,
    reactions: {
      url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}/reactions`,
      total_count: 0,
      "+1": 0,
      "-1": 0,
      laugh: 0,
      hooray: 0,
      confused: 0,
      heart: 0,
      rocket: 0,
      eyes: 0,
    },
    timeline_url: `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues/${issue_number}/timeline`,
    performed_via_github_app: null,
    state_reason: null,
  };
}
