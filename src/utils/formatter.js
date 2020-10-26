import { basename, relative } from 'path';
import { validate as isUuid } from 'uuid';

/* eslint-disable import/prefer-default-export */
export const formatLine = (line, context) => [{ ...context, line }]
  .map(replaceFileLinks)
  .map(replaceImgLinks)
  .map(replaceUuidLinks)[0].line;

const replaceFileLinks = (data) => {
  let { line } = data;
  const { srcFileNameMap } = data;
  const links = getMarkdownLinks(line);

  const replacements = links.flatMap((ln) => {
    const matches = Object.keys(srcFileNameMap).filter((srcFileName) => ln.includes(srcFileName));
    return matches.map((m) => [ln, `./${srcFileNameMap[m][0].fileName}`].join(':'));
  });
  // console.log('replacements', replacements);
  replacements.forEach((v) => {
    line = line.replace(new RegExp(v.split(':')[0], 'g'), v.split(':')[1]);
  });
  return { ...data, links, line };
};

const replaceImgLinks = (data) => {
  let { line } = data;
  const {
    links, imgPath, bookPath,
  } = data;
  const imgFolder = `/${relative(process.cwd(), imgPath)}/`;
  const relativeImgPath = relative(bookPath, imgPath);

  const replacements = links
    .filter((ln) => ln.includes(imgFolder))
    .map((ln) => [ln, `${relativeImgPath}/${ln.split(imgFolder)[1]}`].join(':'));
  // console.log('replacements', replacements);
  replacements.forEach((v) => {
    line = line.replace(new RegExp(v.split(':')[0], 'g'), v.split(':')[1]);
  });
  return {
    ...data,
    line,
  };
};

const replaceUuidLinks = (data) => {
  let { line } = data;
  const {
    links, bookPath,
  } = data;
  const bookFolder = `/${basename(bookPath)}/`;

  const replacements = links
    .filter((ln) => ln.includes(bookFolder)
      && isUuid(basename(ln).replace('.md', '')))
    .map((ln) => [ln, `./${basename(ln)}`].join(':'));
  // console.log('replacements', replacements);
  replacements.forEach((v) => {
    line = line.replace(new RegExp(v.split(':')[0], 'g'), v.split(':')[1]);
  });
  return {
    ...data,
    line,
  };
};

// https://regexr.com/
const getMarkdownLinks = (str) => getFirstGroup(/\[[^\]]*\]\(([^\)]+)\)/g, str);
const getFirstGroup = (regexp, str) => Array.from(str.matchAll(regexp), (m) => m[1]);
