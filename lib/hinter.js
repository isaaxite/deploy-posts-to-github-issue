import Spinnies from 'spinnies';
import org from 'ora';
import chalk from 'chalk';

class Hinter {
  uniqueKey = String(Math.random()).slice(2);

  #spinnies = null;

  #orgMsg = null;

  constructor() {
    this.#spinnies = new Spinnies();
    this.#orgMsg = org();
  }

  load(key, param) {
    this.#spinnies.add(key, param);
  }

  loadSucc(key, param) {
    this.#spinnies.succeed(key, param);
  }

  loadUpdate(key, param) {
    this.#spinnies.update(key, param);
  }

  loadFail(key, param) {
    this.#spinnies.fail(key, param);
  }

  infoMsg(text) {
    this.#orgMsg.info(text);
  }

  warnMsg(text) {
    this.#orgMsg.warn(chalk.yellowBright(text));
  }

  errMsg(text) {
    this.#orgMsg.fail(chalk.redBright(text));
  }

  // eslint-disable-next-line class-methods-use-this
  streamlog(text) {
    process.stderr.write(`${text}\n`);
  }
}

export const hinter = new Hinter();
