import { existsSync, readFileSync } from 'fs';
import { load as loadYaml } from 'js-yaml';

export class ConfReader {
  #confPath = '';
  #conf = null;

  constructor({ path }) {
    this.#confPath = path;
  }

  #read() {
    const confPath = this.#confPath;
    if (!existsSync(confPath)) {
      throw new Error(`Cannot find conf in ${confPath}`);
    }

    const yamlConfStr = readFileSync(confPath, 'utf8');
    const yamlConf = loadYaml(yamlConfStr);

    return yamlConf;

  }

  get() {
    if (!this.#conf) {
      this.#conf = this.#read();
    }

    return this.#conf;
  } 
}
