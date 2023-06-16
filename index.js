import { ConfReader } from "./lib/conf_reader.js";
import { PostFinder } from "./lib/post_finder.js";
import { PostParse } from "./lib/post_parse.js";

export function isubo({
  confPath
}) {
    const confReader = new ConfReader({ path: confPath });
    const conf = confReader.get();
    const finder = new PostFinder({ patterns: [conf.post_dir] });
    const filepaths = finder.getFilepaths();

    for (const filepath of filepaths.slice(0, 1)) {
      let postParse = new PostParse({
        path: filepath,
        conf: {
          prefix: conf.prefix,
          types: conf.types
        }
      });
      const imputMarkdown = postParse.getInputMarkdown();
      const frontmatter = postParse.getFrontmatter();
      const formatedMarkdown = postParse.getFormatedMarkdown();

      console.info(frontmatter)



      postParse = null;
    }
    // console.info(filepaths);
}
