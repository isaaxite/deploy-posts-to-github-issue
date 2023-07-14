import { describe, test, expect } from "@jest/globals";
import { FRONTMATTER_DATA, FRONTMATTER_TXT, FRONTMATTER_TXT_WITH_FENCE, LIMITED_MD_FULL_TXT_CASES, MD_CONTENT_TXT, MD_FULL_TXT, inject_data_to_frontmatter_of_a_markdown_text, inject_data_to_markdown_text_without_frontmatter, limit_only_the_top_of_the_file_content, md_frontmatter_parse, md_frontmatter_parse_with_filepath } from "./test_cases/md_frontmatter.js";
import { MdFrontmatter } from "../lib/md_frontmatter.js";
import { AtLeastPropError, CtorParamDataObjectError, DataObjectError, FileNotExistError, NonEmptyStringError } from "../lib/utils/error.js";

describe('class MdFrontmatter', () => {
  test('parse markdown text to frontmatter data, frontmatter text and markdown content', () => {
    const {
      frontmatterTxt,
      frontmatterTxtWithFence,
      markdownContTxt,
      frontmatterData
    } = md_frontmatter_parse();

    expect(frontmatterTxt).toEqual(FRONTMATTER_TXT);
    expect(frontmatterTxtWithFence).toEqual(FRONTMATTER_TXT_WITH_FENCE);
    expect(markdownContTxt).toEqual(MD_CONTENT_TXT);
    expect(frontmatterData).toHaveProperty('title', FRONTMATTER_DATA.title);
    expect(frontmatterData).toHaveProperty('date', FRONTMATTER_DATA.date);
    expect(frontmatterData).toHaveProperty('tags', FRONTMATTER_DATA.tags);
  });

  test('inject data to frontmatter of a markdown text', () => {
    const {
      injectIssueNumber,
      beforeFrontmatterData,
      afterFrontmatterData,
      beforeMarkdownContTxt,
      afterMarkdownContTxt
    } = inject_data_to_frontmatter_of_a_markdown_text();

    expect(injectIssueNumber).toEqual(afterFrontmatterData.issue_number);
    expect(beforeMarkdownContTxt).toEqual(afterMarkdownContTxt);
    expect(beforeFrontmatterData.title).toEqual(afterFrontmatterData.title);
    expect(beforeFrontmatterData.date).toEqual(afterFrontmatterData.date);
    expect(beforeFrontmatterData.tags).toEqual(
      expect.arrayContaining(afterFrontmatterData.tags)
    );
  });

  test('inject data to markdown text without frontmatter', () => {
    const {
      ONLY_MD_CONTENT_TXT,
      afterFrontmatterData,
      markdownContTxt
    } = inject_data_to_markdown_text_without_frontmatter();

    const {
      title,
      date,
      tags
    } = afterFrontmatterData;

    expect(markdownContTxt).toEqual(ONLY_MD_CONTENT_TXT);
    expect(title).toEqual(FRONTMATTER_DATA.title);
    expect(date).toEqual(FRONTMATTER_DATA.date);
    expect(tags).toEqual(
      expect.arrayContaining(FRONTMATTER_DATA.tags)
    );
  });

  test.each(LIMITED_MD_FULL_TXT_CASES)('Limit frontmatter, $name', ({ mdtxt }) => {
    const {
      frontmatterTxt,
      frontmatterTxtWithFence,
      frontmatterData,
      markdownContTxt
    } = limit_only_the_top_of_the_file_content(mdtxt);

    expect(frontmatterTxt).toEqual('');
    expect(frontmatterTxtWithFence).toEqual('');
    expect(frontmatterData).toEqual(null);
    expect(markdownContTxt).toEqual(mdtxt);
  });


  test('init with empty err', () => {
    try {
      new MdFrontmatter();
    } catch (error) {
      expect(error.message).toEqual(new CtorParamDataObjectError().message);
    }

    try {
      new MdFrontmatter({});
    } catch (error) {
      expect(error.message).toEqual(new CtorParamDataObjectError().message);
    }

    try {
      new MdFrontmatter({ foo: 0 });
    } catch (error) {
      expect(error.message).toEqual(new AtLeastPropError('markdownTxt, filepath').message);
    }

    try {
      new MdFrontmatter({
        markdownTxt: 1
      });
    } catch (error) {
      expect(error.message).toEqual(new NonEmptyStringError('markdownTxt').message);
    }

    try {
      new MdFrontmatter({
        filepath: {}
      });
    } catch (error) {
      expect(error.message).toEqual(new NonEmptyStringError('filepath').message);
    }
  });

  test('init with not exit file path err', () => {
    const filepath = 'not_exist_file.md'
    try {
      new MdFrontmatter({
        filepath
      });
    } catch (error) {
      expect(error.message).toEqual(new FileNotExistError(filepath).message);
    }
  });

  test('get frontmatterTxtWithFence', () => {
    const mdFrontmatter = new MdFrontmatter({
      markdownTxt: MD_FULL_TXT
    });
    expect(mdFrontmatter.frontmatterTxtWithFence).toEqual(FRONTMATTER_TXT_WITH_FENCE);
  });

  test('init with file path err', () => {
    const {
      frontmatterTxt,
      frontmatterTxtWithFence,
      markdownContTxt,
      frontmatterData
    } = md_frontmatter_parse_with_filepath();

    expect(frontmatterTxt).toEqual(FRONTMATTER_TXT);
    expect(frontmatterTxtWithFence).toEqual(FRONTMATTER_TXT_WITH_FENCE);
    expect(markdownContTxt).toEqual(MD_CONTENT_TXT);
    expect(frontmatterData).toHaveProperty('title', FRONTMATTER_DATA.title);
    expect(frontmatterData).toHaveProperty('date', FRONTMATTER_DATA.date);
    expect(frontmatterData).toHaveProperty('tags', FRONTMATTER_DATA.tags);
  });

  test('parse with markdow text without frontmatter', () => {
    const {
      frontmatterTxt,
      frontmatterTxtWithFence,
      frontmatterData,
      markdownContTxt
    } = md_frontmatter_parse(MD_CONTENT_TXT);

    expect(frontmatterTxt).toEqual('');
    expect(frontmatterTxtWithFence).toEqual('');
    expect(frontmatterData).toEqual(null);
    expect(markdownContTxt).toEqual(MD_CONTENT_TXT);
  });

  test('inject non-data', () => {
    try {
      const mdFrontmatter = new MdFrontmatter({
        markdownTxt: MD_FULL_TXT
      });
  
      mdFrontmatter.inject(1); 
    } catch (error) {
      expect(error.message).toEqual(new DataObjectError('data').message);
    }
  });

  test('generate frontmatter with data', () => {
    const mdFrontmatter = new MdFrontmatter({
      markdownTxt: MD_FULL_TXT
    });
    const ret = mdFrontmatter.genFrontmatterWithFence(FRONTMATTER_DATA);
    expect(ret).toEqual(FRONTMATTER_TXT_WITH_FENCE);
  });

  test('generate frontmatter with non-data, err', () => {
    try {
      const mdFrontmatter = new MdFrontmatter({
        markdownTxt: MD_FULL_TXT
      });
      mdFrontmatter.genFrontmatterWithFence(0); 
    } catch (error) {
      expect(error.message).toEqual(new DataObjectError('frontmatterData').message);
    }
  });
});
