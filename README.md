<div align="center">
  <img src="assets/logo.png" />
</div>
<br/>
<div align="center">
  <a href="https://github.com/isaaxite/deploy-posts-to-github-issue/blob/main/LICENSE">
    <img alt="GitHub" src="https://img.shields.io/github/license/isaaxite/deploy-posts-to-github-issue">
  </a>
  <a href="https://github.com/isaaxite/deploy-posts-to-github-issue">
    <img src="https://img.shields.io/github/languages/top/isaaxite/deploy-posts-to-github-issue" alt="languages-top">
  </a>
  <a href="https://github.com/isaaxite/deploy-posts-to-github-issue">
    <img src="https://img.shields.io/github/package-json/v/isaaxite/deploy-posts-to-github-issue" alt="version">
  </a>
  <a href="https://github.com/isaaxite/deploy-posts-to-github-issue">
    <img src="https://img.shields.io/github/languages/count/isaaxite/deploy-posts-to-github-issue" alt="languages-count">
  </a>
  <a href="https://github.com/isaaxite/deploy-posts-to-github-issue">
    <img src="https://img.shields.io/github/directory-file-count/isaaxite/deploy-posts-to-github-issue" alt="files">
  </a>
  <a href="https://github.com/isaaxite/deploy-posts-to-github-issue">
    <img src="https://img.shields.io/github/languages/code-size/isaaxite/deploy-posts-to-github-issue" alt="code-size">
  </a>
  <a href="https://github.com/isaaxite/deploy-posts-to-github-issue/commits/main">
    <img src="https://img.shields.io/github/commit-activity/t/isaaxite/deploy-posts-to-github-issue" alt="commit-activity">
  </a>
  <a href="https://github.com/isaaxite/deploy-posts-to-github-issue/commits/main">
    <img src="https://img.shields.io/github/last-commit/isaaxite/deploy-posts-to-github-issue" alt="last-commit">
  </a>
  <a href="https://github.com/isaaxite/deploy-posts-to-github-issue/issues/new">
    <img alt="Static Badge" src="https://img.shields.io/badge/Issue-Report-blue">
  </a>
  <a href="https://isaaxite.github.io/deploy-posts-to-github-issue/reports/test.html">
    <img alt="Static Badge" src="https://img.shields.io/badge/Test-Report-blue">
  </a>
  <a href="https://isaaxite.github.io/deploy-posts-to-github-issue/reports/coverage/index.html">
    <img alt="Static Badge" src="https://img.shields.io/badge/Test-Coverage-blue">
  </a>
</div>

# Overview

deploy posts are written in markdown  to github issue

# Install

```shell
npm i isubo -g
```

# Quick Start

## Configuration


### Init

```
isubo init conf
```

### Setting

#### owner

Repository owner, Such as `isaaxite` in `isaaxite/blog`.

```yml
owner: <owner>

# e.g.
owner: isaaxite
```

#### repo

Repository name, refer to `blog` in the example above.Please ensure that this repository has been manually created by you, it will be used to store posts resources, and posts will also be published to this repository's issue.

```yml
repo: <repo>

# e.g.
repo: issue-blog
```

#### token

Github Token, it will be used to invoked github api to publish posts, you can get it in https://github.com/settings/tokens.

**It is strongly recommended not to use plaintext to prevent others from stealing your token.**

You can try to use environment variables.If you use an environment variable, please start with `$` and use uppercase letters for the remaining part to declare,  and isubo will automatically obtain this environment variable.

```yml
token: <token>

# e.g.
# use an environment variable. [strongly recommended]
token: $GITHUB_TOKEN

# use plaintext. [not recommended]
token: ghp_CMg41ahiAAtNEN_xxxxxxx_sZctu2M5t6W
```

### Usage

#### Type CLI

```shell
isubo publish
```

#### Select posts

![]()



# Test situation

- [Test Report](https://isaaxite.github.io/deploy-posts-to-github-issue/reports/test.html)

- [Coverage](https://isaaxite.github.io/deploy-posts-to-github-issue/reports/coverage/index.html)
