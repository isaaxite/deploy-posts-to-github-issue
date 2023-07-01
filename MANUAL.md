# Table Of Content
- [Installation](#installation)
- [Init](#init)
- [Configuration](#configuration)
  * [Github Info](#github-info)
    + [owner](#owner)
    + [repo](#repo)
    + [token](#token)
  * [Post Source](#post-source)
    + [source_dir](#source_dir)
  * [Link Format](#link-format)
    + [link_prefix](#link_prefix)
    + [types](#types)
  * [Assets Push](#assets-push)
    + [push_asset](#push_asset)

# Installation

```shell
npm i isubo -g

# or

npm i isubo
```

# Init

Init a configuration file name `isubo.conf.yml`.

```shell
isubo init conf

# or

./node_modules/.bin/isubo init conf
```

# Configuration

## Github Info

### owner

State: `required`

Type: `string`

Default: `none`

Repository owner, Such as "isaaxite" in "isaaxite/blog".

```yml
owner: <owner>
```

### repo

State: `required`

Type: `string`

Default: `none`

Repository name, refer to "blog" in the example above. Please ensure that this repository has been manually created by you, it will be used to store posts resources, and posts will also be published to this repository's issue.

```yml
repo: <repo>
```


### token

State: `required`

Type: `string`

Default: `none`

Github Token, it will be used to invoked github api to publish posts, you can get it in https://github.com/settings/tokens.

**⚠️ It is strongly recommended not to use plaintext to prevent others from stealing your token.**

*You can try to use environment variables.*

**📝Hint:** If you use an environment variable, please **start with `$`** and use **uppercase letters** for the remaining part to declare, and isubo will automatically obtain this environment variable.


## Post Source

### source_dir

State: `optional`

Type: `string`, path relative to repo directory.

Default: `source/`

Source dir, The top-level directory where articles are stored, and where isubo should looking for.

```yml
ource_dir: source/
```

## Link Format

### link_prefix

State: `optional`

Type: `string | object`

Default: `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<source_dir>/`

Used to format links in articles, and format relative links as url links. it can take a string or plain object, as the blew example

#### `string`

todo: desc

```yml
link_prefix: <link_prefix>
```

#### `object`

todo: desc

```yml
link_prefix:
  owner: <owner>
  repo: <repo>
  branch: <branch>
  dir: <dir>
```

##### owner

State: `optional`

Type: `string`

Default: `<global owner>`

todo: desc

```yml
link_prefix:
  owner: <owner>
```

##### repo

State: `optional`

Type: `string`

Default: `<global repo>`

todo: desc

```yml
link_prefix:
  repo: <repo>
```

##### branch

State: `optional`

Type: `string`

Default: `<global branch>`

todo: desc

```yml
link_prefix:
  branch: <branch>
```

##### dir

State: `optional`

Type: `string`

Default: `<global source_dir>`

todo: desc

```yml
link_prefix:
  dir: <dir>
```

### types

State: `optional`

Type: `array`, include `image` and `link`.

Default: `[image]`

types, Which link type should be formated. According to the type specified by types, format the corresponding non-http path. Currently supports two formats of `image` and `link`, the default is only `image` format.

- `image`: format link of `![]()`.

- `link`: format link of `[]()`.

```yml
types:
  - image

# or
types:
  - image
  - link
```

## Assets Push

todo: desc

### push_asset

State: `optional`

Type: `string`, one of `prompt | auto | disable`

Default: `prompt`

Setting this configuration that will detect link assets of those posts and judge which assets need to push when you published the posts. If there are some assets need to push and this configuration'value is `prompt` or `auto`, Isubo will use git-lib to push them.

**📝Hint:** You can use this feature with confidence, because we will temporary storage those changes other than assets, and recover them after pushed assets successfuly, in case we also set up a temporary branch as the last resort. 

```yml
push_asset: prompt
```

#### `prompt`

Setting `prompt` will pop up a prompt to ask whether to push the post and related resources to github after the posts is successfully published.

![](./assets/complete.gif)

#### `auto`

Setting `auto` will skip the confirmation of prompt above.

#### `disable`

Setting `auto` will disable the push of posts and assets. The resource referenced by the issue may not take effect, then you need to push it manually.

**📢 If your resources are not saved using github, then of course you should set it to `disable`.**