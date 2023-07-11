export const CONFIG_FILE_TEMPLATE = `
# Isubo Configuration
## Docs: https://github.com/isaaxite/deploy-posts-to-github-issue/blob/main/README.md
## Source: https://github.com/isaaxite/deploy-posts-to-github-issue


# Github Info

## [required]
## Repository owner, Such as "isaaxite" in "isaaxite/blog".
# e.g.
# owner: isaaxite
owner: ''

## [required]
## Repository name, refer to "blog" in the example above.
### Please ensure that this repository has been manually created by you, 
### it will be used to store posts resources, and posts will also be published to this repository's issue.
# e.g.
# repo: blog
repo: ''

## [optional]
## Branch of <owner>/<repo>, the branch where the resource is actually stored.
## Default 'main'
## branch: main
# branch: main

## [required]
## Github Token, it will be used to invoked github api to publish posts
## you can get it in https://github.com/settings/tokens
## It is strongly recommended not to use plaintext to prevent others from stealing your token. 
## You can try to use environment variables.
## If you use an environment variable, please start with $ and use uppercase letters for the remaining part to declare, 
## and isubo will automatically obtain this environment variable
# e.g.
# token: $GITHUB_TOKEN
token: ''


# Post Source

## [optional]
## Source dir, The top-level directory where articles are stored, and where isubo should looking for.
## Default "source/"
## e.g.
## source_dir: "source/"
# source_dir: source/


# Link Format

## [optional]
## Used to format links in articles, and format relative links as url links
## it can take a string or plain object, as the blew example
##
## string: 
##  link_prefix: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<source_dir>/
##
## object:
##  link_prefix:
##    owner: <owner>, default is global owner
##    repo: <repo>, default is global repo
##    branch: <branch>, default is global branch
##    dir: '<dir>', default is global source_dir
##
## Default:
##  link_prefix: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<source_dir>/
# link_prefix: 

## [optional]
## types, Which link type should be formated.
## According to the type specified by types, format the corresponding non-http path.
## Currently supports two formats of "image" and "link", the default is only "image" format.
# types: 
#   - image

## [optional]
# disable_asset_find: false

# Assets Push

## [optional]
## Setting this configuration that will detect link assets of those posts and judge which assets need to push when you published the posts.
## If there are some assets need to push and this configuration'value is 'prompt' or 'auto', isubo will use git-lib to push them.
## Hint: You can use this feature with confidence, because we will temporary storage those changes other than assets, 
## and recover them after pushed assets successfuly, in case we also set up a temporary branch as the last resort. 
##
## push_asset: prompt | auto | disable
##   prompt: prompt to if push assets
##   auto: push assets automatically
##   disable: just disable pushing assets
## Default setting is 'prompt'.
#push_asset: prompt

## [optional]
## In Isubo, the post support yml metadata like the below. By default, the published issue will delete this part of metadata.
## If you want to show that, you should set 'hide_frontmatter: false'.
## Default: true
hide_frontmatter: true

## [optional]
## Isubo use directory name or filename at post path as post title
## By default, filename is used as the title of the post
## You can set it with 'post_title_seat'
## e.g.
## /home/issue-blog/source/license.md
## 0: license
## 1: source
## 2: isubo-blog
post_title_seat: 0
`;