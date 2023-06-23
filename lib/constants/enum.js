import { ctx } from '../utils/index.js';

export const enumPushAssetType = ctx({
  DISABLE: 'disable',
  PROMPT: 'prompt',
  AUTO: 'auto'
}, ({ DISABLE }) => ({ IDLE: DISABLE }));

export const enumDeployType = ctx({
  PUBLISH: 'Publish',
  CREATE: 'Create',
  UPDATE: 'Update'
}, ({ PUBLISH }) => ({ IDLE: PUBLISH }));
