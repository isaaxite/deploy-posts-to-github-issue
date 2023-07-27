import { genOneLayerReadOnlyDataObject, uniqueArray } from "../utils/index.js";
import { enumLinkType } from "./enum.js";

export const DEF_LINK_TYPE_LIST = [enumLinkType.IDLE];
export const LINK_OPT_TYPES = uniqueArray(Object.values(enumLinkType));

export const FRONTMATTER = 'yaml_frontmatter';

export const DEF_SIMPLE_GIT_OPT = {
  baseDir: process.cwd(),
  binary: 'git',
  maxConcurrentProcesses: 1,
  config: [],
  trimmed: false
};

export const FRONTMATTER_COMMENT = {
  open: '<!--FRONTMATTER_COMMENT--',
  close: '--FRONTMATTER_COMMENT-->'
};

export const DEF_POST_TITLE_SEAT = 0;

export const EMPTY_CONTENT_AST = {
  type: 'root',
  children: [],
  position: {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 1, offset: 0 }
  }
};
