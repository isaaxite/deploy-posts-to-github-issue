import { writeFileSync } from "fs";
import { ConfReader } from "../../lib/conf_reader.js";
import { load as loadYaml, dump as yamlDump } from 'js-yaml';

export function empty_parse_conf(preConf = {}) {
  const confpath = '__test__/temp/empty.conf.yml';
  writeFileSync(confpath, yamlDump(preConf));
  const confReader = new ConfReader({
    path: confpath
  });
  const ret = confReader.get();
  return ret;
}