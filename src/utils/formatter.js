/* eslint-disable import/prefer-default-export */
export const formatLine = (line, srcFileNameMap) => {
  // https://regexr.com/
  const links = getFirstGroup(/\[[^\]]*\]\(([^\)]+)\)/g, line);
  // console.log('links', links);
  const replacements = links.flatMap((ln) => {
    const matches = Object.keys(srcFileNameMap).filter((srcFileName) => ln.includes(srcFileName));
    // console.log('matches', matches);
    return matches.map((m) => [ln, `./${srcFileNameMap[m][0].fileName}`].join(':'));
  });
  // console.log('replacements', replacements);
  let newLine = line;
  replacements.forEach((v) => {
    newLine = newLine.replace(new RegExp(v.split(':')[0], 'g'), v.split(':')[1]);
  });
  return newLine;
};

const getFirstGroup = (regexp, str) => Array.from(str.matchAll(regexp), (m) => m[1]);
