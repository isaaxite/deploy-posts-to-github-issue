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
    const prefixFlag = '> ';
    const POST_NAME_KEY = '{{post_name}}';
    let contentStr = '';
    if (this.#content?.length) {
      const content = [];
      for (let idx = 0; idx < this.#content.length; idx += 1) {
        contentStr += `${prefixFlag}\n${prefixFlag}${this.#content[idx]}\n`;
      }
      contentStr += `${prefixFlag}\n`;
    }

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
