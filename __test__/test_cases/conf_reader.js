import path from 'path';
import { removeSync } from 'fs-extra/esm';
import { ConfReader } from "../../lib/conf_reader.js";

export function init_conf({ remove } = {}) {
  const cwd = process.cwd();
  const confDefFilename = 'isubo.conf.yml';
  const tempCwd = '__test__/temp';
  const expectDest = path.join(tempCwd, confDefFilename);

  if (remove) {
    removeSync(expectDest);
  }
  process.chdir(tempCwd);
  ConfReader.initConf();
  process.chdir(cwd);

  return expectDest;
}