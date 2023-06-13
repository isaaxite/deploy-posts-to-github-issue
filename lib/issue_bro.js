import { Octokit } from 'octokit';

export class IssueBro {
  #owner = '';
  #repo = '';
  #token = '';
  // #octokit = null;

  constructor({
    owner,
    repo,
    token
  }) {
    this.#owner = owner;
    this.#repo = repo;
    this.#token = token;
    this.#octokit = new Octokit({ auth: this.#token });
  }

  #getBaseData() {
    return {
      owner: this.#owner,
      repo: this.#repo
    };
  }

  createBlog() {

  }

  async create({
    title,
    body,
    assignees,
    milestone,
    labels
  }) {
    const params = {
      ...this.#getBaseData(),
      title,
      body
    };

    if (assignees && assignees.length) {
      params.assignees = assignees;
    }

    if (labels && labels.length) {
      params.labels = labels;
    }

    if (milestone) {
      params.milestone = milestone;
    }

    const resp = await this.#octokit.request('POST /repos/{owner}/{repo}/issues', params);

    return resp;
  }

  async get({ issue_number }) {
    const resp = await this.#octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
      ...this.#getBaseData(),
      issue_number
    });

    return resp.data;
  }

  update() {

  }
}
