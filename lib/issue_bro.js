import { Octokit } from 'octokit';

export class IssueBro {
  #owner = '';
  #repo = '';
  #token = '';
  #octokit = null;

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

  async getAll() {
    const resp = await this.#octokit.request('GET /user/issues');
    return resp;
  }

  async getOne(issue_number) {
    const resp = await this.#octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
      ...this.#getBaseData(),
      issue_number
    });

    return resp.data;
  }

  async getBy({ issue_number } = {}) {
    if (typeof issue_number === 'undefined') {
      return await this.getAll();
    }

    if (issue_number) {
      return await this.getOne(issue_number);
    }

    throw new Error('Wrong params!');
  }

  async #updateOrCreate({
    title,
    body,
    assignees,
    milestone,
    labels,
    issue_number
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

    if (issue_number) {
      params.issue_number = issue_number;

      const resp = await this.#octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', params);

      return resp;
    }

    const resp = await this.#octokit.request('POST /repos/{owner}/{repo}/issues', params);

    return resp;
  }

  async forceCreate(params) {
    if (params.issue_number) {
      params.issue_number = '';
    }
    return await this.#updateOrCreate(params);
  }
}
