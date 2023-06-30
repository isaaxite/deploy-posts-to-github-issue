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

# 📑 Overview

deploy posts are written in markdown  to github issue

👍 It focuses on:

- **Easy to use:** Just one cmmand (`isubo publish`) to publish posts what you want.

- **Excellent interaction:** Enter the title of the post, Isubo will automatically search for the relevant list, all you need to do is select and confirm.

- **Non-intrusively:** Isubo will search the asset links in the post and format them to full https url non-intrusively.Allows you to write locally so as to get an excellent writing and preview experience, without requiring you to format resource links one by one.

- **Trustworthy:** More than 80 test cases to ensure the reliability of the core logic.Every version is published after pass all test cases.

🧀 Its features include:

- **Publish local posts as github issues:** Write posts locally, use `isubo command` to publish, update and force create as issues.

- **Autocomplete resource links:** Format the resource link, no matter what path is used, as long as it exists, it will be formatted as a path relative to the repo directory, and finally get an accessible https link.

- **Assets push:** 

# 💻 Prerequisites

- A valid Githun Token.

- At least a Github Reposibility used to publish issues.

- NodeJS environment, node version >= `12.0.0`

# 📥 Installation

```shell
npm i isubo -g
```

# 🚀 Quick Start

## 🛠️ Configuration

Fist of all, you need to init a configuration file.And setting several required properties include `owner`, `repo` and `token` in the above configuration file.

Then, you can write a post what you want 🎊.

### Init

Use the below `cmd` to init a configuration file. A file name `isubo.conf.yml` will be created at current directory.It contain several required setting and a lost of optional setting that have default.You can alter theme according to your situation.

```shell
isubo init conf
```

### Setting

There are three required basic setting at the below.They are important info for publish your articles.

#### 📌 owner

Repository owner, Such as `isaaxite` in `isaaxite/blog`.

```yml
owner: <owner>

# e.g.
owner: isaaxite
```

#### 📌 repo

Repository name, refer to `blog` in the example above.Please ensure that this repository has been manually created by you, it will be used to store posts resources, and posts will also be published to this repository's issue.

```yml
repo: <repo>

# e.g.
repo: issue-blog
```

#### 📌 token

Github Token, it will be used to invoked github api to publish posts, you can get it in https://github.com/settings/tokens.

**⚠️ It is strongly recommended not to use plaintext to prevent others from stealing your token.**

*You can try to use environment variables.*

**📝Hint:** If you use an environment variable, please **start with `$`** and use **uppercase letters** for the remaining part to declare,  and isubo will automatically obtain this environment variable.

```yml
token: <token>

# e.g.
# use an environment variable. [strongly recommended]
token: $GITHUB_TOKEN

# use plaintext. [not recommended]
token: ghp_CMg41ahiAAtNEN_xxxxxxx_sZctu2M5t6W
```

### 🕹️ Usage

#### Type CLI

```shell
isubo publish
```

#### Select posts

![]()


# 📞 Contact

If you encounter a bug, please open an [issue]().I will handle it as possible as i can.

For general questions or discussions, you can also use:

- Email: issaxite@outlook.com

# 🎁 Donate

- Star this repo

- Buy me a coffe ☕️

# 📄 Test situation

- [Test Report](https://isaaxite.github.io/deploy-posts-to-github-issue/reports/test.html)

- [Coverage](https://isaaxite.github.io/deploy-posts-to-github-issue/reports/coverage/index.html)

# 📜 Licence

MIT @ IssacKam
