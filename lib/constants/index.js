import { uniqueArray } from "../utils/index.js";
import { enumLinkType } from "./enum.js";

export const DEF_LINK_TYPE_LIST = [enumLinkType.IDLE];
export const LINK_OPT_TYPES = uniqueArray(Object.values(enumLinkType));

export const FRONTMATTER = 'yaml_frontmatter';