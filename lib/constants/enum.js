import { ctx } from '../utils/index.js';

/**
 * @enum {string}
 */
export const enumPushAssetType = ctx({
  DISABLE: 'disable',
  PROMPT: 'prompt',
  AUTO: 'auto',
}, ({ PROMPT }) => ({ IDLE: PROMPT }));

/**
 * @enum {string}
 */
export const enumDeployType = ctx({
  PUBLISH: 'Publish',
  CREATE: 'Create',
  UPDATE: 'Update',
}, ({ PUBLISH }) => ({ IDLE: PUBLISH }));

/**
 * @enum {string}
 */
export const enumLinkType = ctx({
  IMAGE: 'image',
  LINK: 'link',
}, ({ IMAGE }) => ({ IDLE: IMAGE }));
