import { ctx } from '../utils/index.js';

export const enumPushAssetType = ctx({
  DISABLE: 'disable',
  PROMPT: 'prompt',
  AUTO: 'auto'
}, ({ PROMPT }) => ({ IDLE: PROMPT }));

export const enumDeployType = ctx({
  PUBLISH: 'Publish',
  CREATE: 'Create',
  UPDATE: 'Update'
}, ({ PUBLISH }) => ({ IDLE: PUBLISH }));

export const enumLinkType = ctx({
  IMAGE: 'image',
  LINK: 'link'
}, ({ IMAGE }) => ({ IDLE: IMAGE }));
