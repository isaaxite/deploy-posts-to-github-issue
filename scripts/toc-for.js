import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const marker = {
  open: '<!-- TOC_OPEN -->',
  close: '<!-- TOC_CLOSE -->'
};
const argv = process.argv.slice(2);

function getTocWithMark(toc) {
  return [
    marker.open,
    '# Table Of Content',
    toc,
    marker.close
  ].join('\n');
}

function getToc(filepath) {
  const cmd = [
    `npx markdown-toc`,
    filepath,
    `--maxdepth=3`
  ].join(' ');
  
  const toc = execSync(cmd, { stdio: 'pipe' });
  return toc;
}

function main() {
  
  for (const filepath of argv) {
    const toc = getToc(filepath);
    const mdTxt = readFileSync(filepath, 'utf8');

    const regex = new RegExp(`${marker.open}([\\s\\S]*?)${marker.close}`, 'm');
    const match  = mdTxt.match(regex);
    const newTocWithMark = getTocWithMark(toc);
    const newMdTxt = !match
      ? [newTocWithMark, mdTxt].join('\n\n')
      : mdTxt.replace(match[0], newTocWithMark);

    writeFileSync(filepath, newMdTxt);
  }
}

main();
