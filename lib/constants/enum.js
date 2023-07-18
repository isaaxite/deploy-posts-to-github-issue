import { ctx } from '../utils/index.js';

/**
 * @enum
 */
export const enumPushAssetType = ctx({
  DISABLE: 'disable',
  PROMPT: 'prompt',
  AUTO: 'auto'
}, ({ PROMPT }) => ({ IDLE: PROMPT }));

/**
 * @enum
 */
export const enumDeployType = ctx({
  PUBLISH: 'Publish',
  CREATE: 'Create',
  UPDATE: 'Update'
}, ({ PUBLISH }) => ({ IDLE: PUBLISH }));

/**
 * @enum
 */
export const enumLinkType = ctx({
  IMAGE: 'image',
  LINK: 'link'
}, ({ IMAGE }) => ({ IDLE: IMAGE }));
