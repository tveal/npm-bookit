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
};

const SEED_CHAPTER_SECTION = `

# Let's Get Started!

Create markdown (*.md) files in their respective folder locations.
`.replace(/\n/g, '\r\n');

const getSeedContentForSection = (section) => `

Replace me with desired ${section} content!

`.replace(/\n/g, '\r\n');
