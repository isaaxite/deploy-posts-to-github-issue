import fs from 'fs';
import { MdFrontmatter } from "../../lib/md_frontmatter.js";

export const FRONTMATTER_DATA = {
  title: 'LICENSE的选择与生成',
  date: '2023-05-30 16:50:28',
  tags: ['开发标准', 'LICENSE']
};
export const FRONTMATTER_TXT = `title: ${FRONTMATTER_DATA.title}
date: ${FRONTMATTER_DATA.date}
tags:
  - ${FRONTMATTER_DATA.tags[0]}
  - ${FRONTMATTER_DATA.tags[1]}`;

export const FRONTMATTER_TXT_WITH_FENCE = [
  '---',
  FRONTMATTER_TXT,
  '---'
].join('\n');

export const MD_CONTENT_TXT = `
# Overview

![]()`;

export const MD_FULL_TXT = [FRONTMATTER_TXT_WITH_FENCE, MD_CONTENT_TXT].join('')

export const LIMITED_MD_FULL_TXT_CASES = [
  {
    name: 'preceded by text',
    mdtxt: `xxx\n${MD_FULL_TXT}`
  },
  {
    name: 'start with non ---',
    mdtxt: `xxx${MD_FULL_TXT}`
  },
  {
    name: 'end with non ---',
    mdtxt: `${FRONTMATTER_TXT_WITH_FENCE}xxx${MD_CONTENT_TXT}`
  }
];

export function md_frontmatter_parse(markdownTxt = MD_FULL_TXT) {
  const mdFrontmatter = new MdFrontmatter({
    markdownTxt
  });

  const ret = {
    frontmatterTxt: mdFrontmatter.frontmatterTxt,
    frontmatterTxtWithFence: mdFrontmatter.frontmatterTxtWithFence,
    markdownContTxt: mdFrontmatter.markdownContTxt,
    frontmatterData: mdFrontmatter.frontmatterData
  };

  return ret;
}

export function md_frontmatter_parse_with_filepath() {
  const filepath = `__test__/temp/${String(Date.now()).slice(2)}.md`;

  fs.writeFileSync(filepath, MD_FULL_TXT);

  const mdFrontmatter = new MdFrontmatter({
    filepath
  });

  const ret = {
    frontmatterTxt: mdFrontmatter.frontmatterTxt,
    frontmatterTxtWithFence: mdFrontmatter.frontmatterTxtWithFence,
    markdownContTxt: mdFrontmatter.markdownContTxt,
    frontmatterData: mdFrontmatter.frontmatterData
  };

  fs.unlinkSync(filepath);

  return ret;
}

export function inject_data_to_frontmatter_of_a_markdown_text() {
  const mdFrontmatter = new MdFrontmatter({
    markdownTxt: MD_FULL_TXT
  });

  const issue_number = Math.ceil(Math.random() * 100) + 100;
  const retMdFullTxt = mdFrontmatter.inject({
    issue_number
  });

  const mdFrontmatter2 = new MdFrontmatter({
    markdownTxt: retMdFullTxt
  });

  const ret = {
    injectIssueNumber: issue_number,
    beforeMarkdownContTxt: mdFrontmatter.markdownContTxt,
    afterMarkdownContTxt: mdFrontmatter2.markdownContTxt,
    beforeFrontmatterData: mdFrontmatter.frontmatterData,
    afterFrontmatterData: mdFrontmatter2.frontmatterData
  };

  return ret;
}

export function inject_data_to_markdown_text_without_frontmatter() {
  const filepath = `__test__/temp/${String(Date.now()).slice(2)}.md`;
  const ONLY_MD_CONTENT_TXT = [
    '# Overview',
    '![]()',
    ''
  ].join('\n');
  fs.writeFileSync(filepath, ONLY_MD_CONTENT_TXT);

  const mdFrontmatter = new MdFrontmatter({
    filepath
  });

  const retMarkdownTxt = mdFrontmatter.inject(FRONTMATTER_DATA);
  fs.writeFileSync(filepath, retMarkdownTxt);
  const mdFrontmatter2 = new MdFrontmatter({
    filepath
  });

  const ret = {
    ONLY_MD_CONTENT_TXT,
    afterFrontmatterData: mdFrontmatter2.frontmatterData,
    markdownContTxt: mdFrontmatter.markdownContTxt
  };

  fs.unlinkSync(filepath);

  return ret;
}

export function limit_only_the_top_of_the_file_content(markdownTxt) {
  const mdFrontmatter = new MdFrontmatter({
    markdownTxt
  });

  const ret = {
    frontmatterTxt: mdFrontmatter.frontmatterTxt,
    frontmatterTxtWithFence: mdFrontmatter.frontmatterTxtWithFence,
    frontmatterData: mdFrontmatter.frontmatterData,
    markdownContTxt: mdFrontmatter.markdownContTxt
  };

  return ret;
}
