import { basename, dirname, relative } from 'path';
import { v4 as uuidv4, validate as isUuid } from 'uuid';

// for unit test mocking... ugh
export const UuidUtils = {
  generate: () => uuidv4(),
  validate: (u) => isUuid(u),
};

export const formatLine = (line, context) => [{ ...context, line }]
  .map(adornLinks)
  .map(replaceFileLinks)
  .map(replaceImgLinks)
  .map(replaceUuidLinks)[0].line;

export const lintFile = (content, context) => [{ ...context, line: content }]
  .map(adornLinks)
  .map(lintSrcFileLinks)[0].line;

const adornLinks = (data) => ({ ...data, links: getMarkdownLinks(data.line) });

const replaceFileLinks = (data) => {
  let { line } = data;
  const { srcFileNameMap, links } = data;

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
      && UuidUtils.validate(basename(ln).replace('.md', '')))
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

const lintSrcFileLinks = (data) => {
  let { line } = data;
  const {
    links,
    bookPath,
    srcFilePath,
    srcFileNameMap,
  } = data;
  const relativeBookPath = relative(dirname(srcFilePath), bookPath);

  const replacements = links.flatMap((ln) => {
    const matches = Object.keys(srcFileNameMap).filter((srcFileName) => ln.includes(srcFileName));
    return matches.map((m) => [ln, `${relativeBookPath}/${srcFileNameMap[m][0].fileName}`].join(':'));
  });
  // console.log('replacements', replacements);
  replacements.forEach((v) => {
    line = line.replace(new RegExp(v.split(':')[0], 'g'), v.split(':')[1]);
  });
  return { ...data, line };
};

// https://regexr.com/
const getMarkdownLinks = (str) => getFirstGroup(/\[[^\]]*\]\(([^\)]+)\)/g, str);
const getFirstGroup = (regexp, str) => Array.from(str.matchAll(regexp), (m) => m[1]);
