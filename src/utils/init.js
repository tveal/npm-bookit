import { basename } from 'path';
import {
  lowerCase, merge,
} from 'lodash';
import yaml from 'js-yaml';
import { log } from './logger';
import { getInitConfigFromUser, getConfigOverrideConfirmationFromUser } from '../connector/user';
import {
  listDirectory,
  getFileContent,
  createDirectory,
  getFileStreamWriter,
  isExistingPath,
} from '../connector/filesystem';

export const allowedConfigFiles = [
  'bookit.yml',
  'bookit.yaml',
];

export const listConfigFiles = () => listDirectory(process.cwd()).filter((i) => allowedConfigFiles.includes(i));

export const loadOrCreateConfig = async (argv, newConfig) => {
  const configFiles = listConfigFiles();
  let config = merge({}, newConfig);
  let configPath = `${process.cwd()}/bookit.yml`;
  if (configFiles.length > 0) {
    const { overrideConfig } = await getConfigOverrideConfirmationFromUser(argv);
    configPath = `${process.cwd()}/${configFiles[0]}`;
    config = overrideConfig
      ? merge(yaml.safeLoad(getFileContent(configPath)), newConfig)
      : merge(newConfig, yaml.safeLoad(getFileContent(configPath)));
  }
  return {
    config,
    configPath,
  };
};

export const loadOrCreateReadme = () => {
  const cwd = process.cwd();
  const filename = listDirectory(cwd).filter((i) => 'readme.md'.includes(lowerCase(i)))[0]
    || 'README.md';
  const path = `${cwd}/${filename}`;
  if (isExistingPath(path)) return { content: getFileContent(path), path };
  return {
    content: `# ${basename(cwd)}\r\n`,
    path,
  };
};

export const initialize = async (argv) => {
  log.debug('Initializing Bookit...');
  const {
    bookSrc = 'src',
    bookDst = 'book',
    imgDir = 'img',
    sections,
  } = await getInitConfigFromUser(argv);

  const { config, configPath } = await loadOrCreateConfig(argv, {
    bookSrc, bookDst, imgDir, chapterTitles: { 1: 'Hello World!' },
  });
  const cwd = process.cwd();
  const srcPath = `${cwd}/${config.bookSrc}`;
  const bookPath = `${cwd}/${config.bookDst}`;
  const imgPath = `${cwd}/${config.imgDir}`;

  log.debug('Setting up bookit config:', {
    cwd, srcPath, bookPath, imgPath, configPath,
  });

  // update config
  const configWriter = getFileStreamWriter(configPath);
  configWriter.write(yaml.safeDump(config));
  await configWriter.endWithPromise();

  if (!isExistingPath(bookPath)) {
    createDirectory(bookPath);
    log.debug('Created book directory', bookPath);
  } else {
    log.debug('Book directory already exists. Skipping creation.');
  }

  if (!isExistingPath(imgPath)) {
    createDirectory(imgPath);
    log.debug('Created image directory', imgPath);
  } else {
    log.debug('Image directory already exists. Skipping creation.');
  }

  if (!isExistingPath(srcPath)) {
    createDirectory(srcPath);
    log.debug('Created source directory', srcPath);
  } else {
    log.debug('Source directory already exists. Skipping creation.');
  }

  const homePath = `${srcPath}/home.md`;
  if (!isExistingPath(homePath)) {
    const writer = getFileStreamWriter(homePath);
    writer.write(SEED_HOME);
    await writer.endWithPromise();
    log.debug('Created home.md', homePath);
  } else {
    log.debug('File home.md already exists. Skipping creation.');
  }

  const seedChapterPath = `${srcPath}/chapter01`;
  if (!isExistingPath(seedChapterPath)) {
    createDirectory(seedChapterPath);
    const writer = getFileStreamWriter(`${seedChapterPath}/01-getting-started.md`);
    writer.write(SEED_CHAPTER_SECTION);
    await writer.endWithPromise();
    log.debug('Created chapter directory and seeded a section file.', seedChapterPath);
  } else {
    log.debug('Chapter directory already exists. Skipping creation.', seedChapterPath);
  }

  await Promise.all(sections.map(async (s) => {
    const section = lowerCase(s);
    const sectionPath = `${srcPath}/${section}`;
    if (!isExistingPath(sectionPath)) {
      createDirectory(sectionPath);
      const writer = getFileStreamWriter(`${sectionPath}/${section}.md`);
      writer.write(getSeedContentForSection(s));
      await writer.endWithPromise();
      log.debug('Created section directory and seeded a section file.', sectionPath);
    } else {
      log.debug('Section directory already exists. Skipping creation.', sectionPath);
    }
    return { // because map requires a return
      section,
      sectionPath,
    };
  }));

  const readme = loadOrCreateReadme();
  if (!readme.content.includes(SEED_README)) {
    const readmeWriter = getFileStreamWriter(readme.path);
    readmeWriter.write(readme.content);
    readmeWriter.write(SEED_README);
    await readmeWriter.endWithPromise();
    log.debug('Initialized bookit doc in README.', readme.path);
  } else {
    log.debug('README already has bookit doc. Skipping appendage');
  }
};

export const SEED_HOME = `# My New Handbook

The content in the \`home.md\` file is added to the top of the Table-of-Contents
`.replace(/\n/g, '\r\n');

export const SEED_CHAPTER_SECTION = `

# Let's Get Started!

Create markdown (*.md) files in their respective folder locations.
`.replace(/\n/g, '\r\n');

const getSeedContentForSection = (section) => `

Replace me with desired ${section} content!

`.replace(/\n/g, '\r\n');

export const SEED_README = `

## Bookit Generation Tool

To rebuild this book from source
\`\`\`
npx bookit build
\`\`\`
`.replace(/\n/g, '\r\n');
