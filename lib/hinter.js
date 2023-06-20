import Spinnies from 'spinnies';
import org from 'ora';

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

  loadFail(key, param) {
    this.#spinnies.fail(key, param);
  }

  failMsg() {

  }

  succMsg() {

  }

  errMsg(text) {
    this.#orgMsg.fail(text);
  }
}

export const hinter = new Hinter();
