import { lowerCase } from 'lodash';
import yaml from 'js-yaml';
import { log } from './logger';
import { getInitConfigFromUser } from '../connector/user';
import {
  listDirectory,
  createDirectory,
  getFileStreamWriter,
  isExistingPath,
} from '../connector/filesystem';

export const allowedConfigFiles = [
  'bookit.yml',
  'bookit.yaml',
];

export const listConfigFiles = () => listDirectory(process.cwd()).filter((i) => allowedConfigFiles.includes(i));

export const initialize = async (argv) => {
  log.debug('Initializing Bookit...');
  const {
    bookSrc = 'src',
    bookDst = 'book',
    imgDir = 'img',
    sections,
  } = await getInitConfigFromUser(argv);

  const cwd = process.cwd();
  const srcPath = `${cwd}/${bookSrc}`;
  const bookPath = `${cwd}/${bookDst}`;
  const imgPath = `${cwd}/${imgDir}`;
  const configPath = `${cwd}/bookit.yml`;

  log.debug('Setting up bookit config:', {
    cwd, srcPath, bookPath, imgPath, configPath,
  });

  const configFiles = listConfigFiles();
  if (configFiles.length < 1) {
    const writer = getFileStreamWriter(configPath);
    writer.write(yaml.safeDump({
      bookSrc,
      bookDst,
      chapterTitles: {
        1: 'Hello World!',
      },
    }));
    await writer.endWithPromise();
  } else {
    log.debug('Config file(s) already exist. Skipping creation.', configFiles);
  }

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
