import { Octokit } from 'octokit';
import {
  isDataObject, isNonEmptyString, isNonEmptyStringItemArray, isTruthPositiveInt, isUndefined,
} from './utils/index.js';
import {
  CtorParamDataObjectError,
  DataObjectError,
  NonEmptyStringError,
  NonEmptyStringItemArrayError,
  TruthPositiveIntError,
} from './utils/error.js';

export class PostManager {
  #owner = '';

  #repo = '';

  #token = '';

  #octokit = null;

  /**
   * use to update, create, forceCreate...
   * @typedef {Object} PostManagerCtorParam
   * @property {string} owner - github owner
   * @property {string} repo - github repo
   * @property {string} token - github token
   *
   * @param {PostManagerCtorParam} param
   */
  constructor(param) {
    if (!isDataObject(param)) {
      throw new CtorParamDataObjectError();
    }
    const {
      owner,
      repo,
      token,
    } = param;

    if (!isNonEmptyString(owner)) {
      throw new NonEmptyStringError('owner');
    }
    if (!isNonEmptyString(repo)) {
      throw new NonEmptyStringError('repo');
    }
    if (!isNonEmptyString(token)) {
      throw new NonEmptyStringError('token');
    }
    this.#owner = owner;
    this.#repo = repo;
    this.#token = token;
    this.#octokit = new Octokit({ auth: this.#token });
  }

  #getBaseData() {
    return {
      owner: this.#owner,
      repo: this.#repo,
    };
  }

  async #updateOrCreate(params) {
    if (!isDataObject(params)) {
      throw new DataObjectError('params');
    }

    const {
      title,
      body,
      // assignees,
      // milestone,
      labels,
      issue_number,
    } = params;

    if (!isNonEmptyString(title)) {
      throw new NonEmptyStringError('params.title');
    }

    if (!isNonEmptyString(body)) {
      throw new NonEmptyStringError('params.body');
    }

    const lastParams = {
      ...this.#getBaseData(),
      title,
      body,
    };

    // if (assignees && assignees.length) {
    //   lastParams.assignees = assignees;
    // }

    /*
    allow empty arrary to remove all labels of post
    */
    if (!isUndefined(labels)) {
      // disable emypt labels item
      if (!isNonEmptyStringItemArray(labels)) {
        throw new NonEmptyStringItemArrayError('params.labels');
      }
      lastParams.labels = labels;
    }

    // if (milestone) {
    //   lastParams.milestone = milestone;
    // }

    if (issue_number) {
      lastParams.issue_number = issue_number;

      const resp = await this.#octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', lastParams);

      return resp;
    }

    const resp = await this.#octokit.request('POST /repos/{owner}/{repo}/issues', lastParams);

    return resp;
  }

  async forceCreate(params) {
    if (params?.issue_number) {
      // eslint-disable-next-line no-param-reassign
      params.issue_number = '';
    }
    return this.#updateOrCreate(params);
  }

  async update(params) {
    if (!isTruthPositiveInt(params?.issue_number)) {
      throw new TruthPositiveIntError('params.issue_number');
    }

    return this.#updateOrCreate(params);
  }
}
