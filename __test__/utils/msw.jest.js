import { beforeAll, afterEach, afterAll } from '@jest/globals';
import { server } from './msw.core.js';

const URL = `https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues`;

// "https://api.github.com/repos/isaaxite/test-repo_deploy-posts-to-github-issue/issues"

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
