import { unified } from 'unified';
import markdown from 'remark-parse';
import { isNonEmptyStringItemArray } from './utils/common.js';
import { NonEmptyStringItemArrayError } from './utils/error.js';

export class SourceStatementer {
  #content = [];
  #metadata = {};

  constructor(param) {
    const {
      content,
      postName
    } = param;

    if (!isNonEmptyStringItemArray(content)) {
      throw new NonEmptyStringItemArrayError('content');
    }

    if (postName) {
      this.#metadata.postName = postName;
    }

    this.#content = content;
  }

  getAst() {
    const POST_NAME_KEY = '{{post_name}}';
    let contentStr = this.#content.map((s) => `> ${s}`).join('\n');

    if (
      contentStr
      && contentStr.includes(POST_NAME_KEY)
      && this.#metadata.postName
    ) {
      contentStr = contentStr.replace(POST_NAME_KEY, this.#metadata.postName);
    }

    const ast = unified()
      .use(markdown)
      .parse(contentStr);

    return ast;
  }
}
