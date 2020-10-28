import yaml from 'js-yaml';
import { basename } from 'path';
import {
  get, startCase, groupBy, forEach,
} from 'lodash';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import {
  listDirectory,
  getFileContent,
  getFileStreamReader,
  getFileStreamWriter,
  deleteDirectory,
  createDirectory,
  isExistingPath,
} from './connector/filesystem';
import {
  log, formatLine, listConfigFiles, allowedConfigFiles, lintFile,
} from './utils';

export class Bookit {
  constructor(argv = {}) {
    const { nolint } = argv;
    const configFiles = listConfigFiles();
    if (configFiles.length !== 1) {
      throw Error('Cannot load config. Must have exactly 1 file in the project root;'
        + ` Supported names: [ ${allowedConfigFiles.join(', ')} ]`);
    }

    this.configFile = `${process.cwd()}/${configFiles[0]}`;
    try {
      this.config = yaml.safeLoad(getFileContent(this.configFile));
    } catch (e) { /* istanbul ignore next */
      throw Error(`Failed to load ${this.configFile || 'config'} file.`);
    }
    this.lintSrc = nolint === true
      ? this.lintSrc = false
      : get(this, 'config.lintSrc', true);
    this.srcPath = `${process.cwd()}/${get(this, 'config.bookSrc', 'src')}`;
    this.bookPath = `${process.cwd()}/${get(this, 'config.bookDst', 'book')}`;
    this.imgPath = `${process.cwd()}/${get(this, 'config.imgDir', 'img')}`;

    log.debug(`Configuration:
      bookSrc: ${this.srcPath}
      bookDst: ${this.bookPath}
      imgDir: ${this.imgPath}
    `);
  }

  buildBook() {
    log.debug('Building book...');
    return this.buildBookMeta()
      .then((metaArray) => { // clean book dir
        log.debug('Cleaning book folder');
        deleteDirectory(this.bookPath);
        createDirectory(this.bookPath);
        return metaArray;
      })
      .then((metaArray) => this.addMissingUuid(metaArray))
      .then((metaArray) => this.buildBookToc(metaArray))
      .then((files) => {
        log.debug('Building Files...');
        forEach(files, (v, i) => {
          files[i].prev = i < 1 ? false : files[i - 1].fileName;
          files[i].next = i === files.length - 1 ? false : files[i + 1].fileName;
        });
        return Promise.all(files.map((f) => this.buildFile(f, files)));
      })
      .then(async (files) => {
        if (this.lintSrc) {
          log.debug('Linting Src Files...');
          await Promise.all(files.map((f) => this.lintFile(f, files)));
        }
        return files;
      });
  }

  formatSectionTitle(section) {
    const { chapter, title, bookFiles } = section;
    const chapTitle = title ? ` **${title}**` : '';
    return chapter
      ? `Chapter ${chapter}:${chapTitle}`
      : `[**${title}**](./${bookFiles[0].fileName})`;
  }

  formatChapterFileLink(file, chapter, index) {
    const { srcFile, fileName, title } = file;
    const num = `${chapter}.${index}`;

    return title
      ? `[${num} ${title}](./${fileName})`
      : `[${num} ${basename(srcFile).split('.')[0].replace(/[-_\d]+/g, ' ').trim()}](./${fileName})`;
  }

  addMissingUuid(metaArray) {
    log.debug('Adding any missing UUIDs');
    return Promise.all(metaArray.map(async (section) => {
      const bookFiles = await Promise.all(section.bookFiles
        .map((file) => {
          if (file.fileName) return file;
          const uuid = uuidv4();
          const fileName = `${uuid}.md`;
          const filePath = `${this.bookPath}/${fileName}`;
          const srcFilePath = `${this.srcPath}/${file.srcFile}`;
          const content = getFileContent(srcFilePath);
          const writer = getFileStreamWriter(srcFilePath);
          writer.write(`${uuid}\r\n`);
          writer.write(content);
          log.debug(`added uuid ${uuid} to ${file.srcFile}`);
          return writer.endWithPromise()
            .then(() => ({
              ...file,
              fileName,
              filePath,
            }));
        }));
      return {
        ...section,
        bookFiles,
      };
    }));
  }

  async buildBookToc(metaArray) {
    log.debug('Building TOC...');
    const metaMap = groupBy(metaArray, (m) => m.folderName.replace(/\d+/g, ''));

    const fileArray = [];
    const writer = getFileStreamWriter(`${this.bookPath}/index.md`);

    const homePath = `${this.srcPath}/home.md`;
    const context = {
      srcFileNameMap: groupBy(metaArray.flatMap((m) => m.bookFiles), (f) => basename(f.srcFile)),
      srcPath: this.srcPath,
      imgPath: this.imgPath,
      bookPath: this.bookPath,
    };
    if (isExistingPath(homePath)) {
      await getFileStreamReader(homePath, (line) => {
        writer.write(`${formatLine(line, context)}\r\n`);
        return 0;
      });
      log.debug('Added home.md content to TOC');
    } else { /* istanbul ignore next */
      log.debug('No home.md file found. No Header will be added to the TOC.');
    }

    const writeNonChapters = (section) => {
      const sectionTitle = this.formatSectionTitle(section);
      writer.write(`${sectionTitle}\r\n---\r\n`);
      log.debug(sectionTitle);
      const sectionNav = [];
      let index = 1; // page 1
      section.bookFiles.map((file) => {
        sectionNav.push({
          title: `page ${index}`,
          fileName: file.fileName,
        });
        index += 1;
        return file;
      });
      fileArray.push(...section.bookFiles.map((f) => ({ ...f, sectionNav, sectionTitle })));
      return section;
    };
    const writeChapters = (section) => {
      const sectionTitle = this.formatSectionTitle(section);
      writer.write(`${sectionTitle}\r\n---\r\n`);
      log.debug(sectionTitle);
      const sectionNav = [];
      let index = 0; // chapter 1.0
      section.bookFiles.map((file) => {
        sectionNav.push({
          title: `${section.chapter}.${index}`,
          fileName: file.fileName,
        });
        const chLink = `- ${this.formatChapterFileLink(file, section.chapter, index)}`;
        writer.write(`${chLink}\r\n`);
        log.debug(chLink);
        index += 1;
        return file;
      });
      fileArray.push(...section.bookFiles.map((f) => ({ ...f, sectionNav, sectionTitle })));
      writer.write('\r\n');
      return section;
    };
    writer.write('\r\n\r\n');

    get(metaMap, 'preface', []).map(writeNonChapters);
    get(metaMap, 'foreword', []).map(writeNonChapters);
    get(metaMap, 'introduction', []).map(writeNonChapters);
    get(metaMap, 'chapter', []).map(writeChapters);
    get(metaMap, 'glossary', []).map(writeNonChapters);
    get(metaMap, 'appendix', []).map(writeNonChapters);
    await writer.endWithPromise();

    return fileArray;
  }

  // https://doc.rust-lang.org/stable/book/
  buildBookMeta() {
    return Promise.all([
      ...this.buildMatterMeta(this.getFrontMatter()),
      ...this.buildMatterMeta(this.getChapters()),
      ...this.buildMatterMeta(this.getBackMatter()),
    ]);
  }

  buildMatterMeta(matter) {
    return matter.map(
      (folder) => {
        const filesInProgress = folder.files
          .map((file) => this.buildFileMeta(`${folder.folderName}/${file}`));

        return Promise.all(filesInProgress)
          .then((bookFiles) => ({
            ...folder,
            bookFiles,
          }));
      },
    );
  }

  getFrontMatter() {
    return listDirectory(this.srcPath)
      .filter((item) => isValidFrontMatter(item))
      .map((folderName) => ({
        title: startCase(folderName),
        folderName,
        files: listDirectory(`${this.srcPath}/${folderName}`).filter((i) => isMarkdownFile(i)),
      }));
  }

  getChapters() {
    const things = listDirectory(this.srcPath);
    return things
      .filter((item) => isValidChapter(item))
      .map((folderName) => {
        const chapter = Number(folderName.replace(/\D+/g, ''));
        return {
          chapter,
          title: get(this, `config.chapterTitles[${chapter}]`, false),
          folderName,
          files: listDirectory(`${this.srcPath}/${folderName}`).filter((i) => isMarkdownFile(i)),
        };
      });
  }

  getBackMatter() {
    return listDirectory(this.srcPath)
      .filter((item) => isValidBackMatter(item))
      .map((folderName) => ({
        title: startCase(folderName),
        folderName,
        files: listDirectory(`${this.srcPath}/${folderName}`).filter((i) => isMarkdownFile(i)),
      }));
  }

  // https://nodejs.org/api/readline.html#readline_example_read_file_stream_line_by_line
  async buildFileMeta(srcFile) {
    let lineNumber = 0;

    // file props
    let title;
    let fileName;
    let filePath;

    return getFileStreamReader(`${this.srcPath}/${srcFile}`, (line) => {
      lineNumber += 1;
      if (lineNumber > 5 || title) return -1;

      if (lineNumber === 1) {
        if (isUuid(line.trim())) {
          fileName = `${line.trim()}.md`;
          filePath = `${this.bookPath}/${fileName}`;
        }
      } else if (!title && line.startsWith('# ')) {
        title = line.substring(2);
      }
      return 0;
    })
      .then(() => ({
        title,
        fileName,
        filePath,
        srcFile,
      }));
  }

  async buildFile(fileMeta, files) {
    const {
      srcFile, next, prev, filePath, sectionTitle, sectionNav, fileName,
    } = fileMeta;

    let lineNumber = 0;
    let writer;

    const navArray = [];
    if (prev) navArray.push(`**[⏪ PREV](./${prev})**`);
    navArray.push('**[HOME](./index.md)**');
    if (next) navArray.push(`**[NEXT ⏩](./${next})**`);
    const nav = `${navArray.join(' | ')}\r\n\r\n`;
    const sectionHeader = [
      `> ${sectionTitle}`,
      '>',
      `> ${sectionNav.map((n) => (n.fileName === fileName
        ? `**${n.title}**`
        : `[${n.title}](./${n.fileName})`)).join(' |\r\n')}`,
      '\r\n',
    ].join('\r\n');

    const context = {
      srcFileNameMap: groupBy(files, (f) => basename(f.srcFile)),
      srcPath: this.srcPath,
      imgPath: this.imgPath,
      bookPath: this.bookPath,
    };
    return getFileStreamReader(`${this.srcPath}/${srcFile}`, (line) => {
      lineNumber += 1;
      // console.log('+++++line:', line);

      if (lineNumber === 1) {
        if (isUuid(line.trim())) {
          writer = getFileStreamWriter(filePath);
          writer.write(nav);
          if (sectionNav.length > 1) writer.write(sectionHeader);
        } else {
          log.error(
            `ERROR no uuid4 for ${srcFile}.
              Add one to the first line of the file.
              Suggested uuid4: ${uuidv4()}`,
          );
          return -1;
        }
      } else {
        writer.write(`${formatLine(line, context)}\r\n`);
      }
      return 0;
    })
      .then(() => {
        if (writer) {
          writer.write(`\r\n\r\n---\r\n\r\n${nav}`);
          return writer.endWithPromise().then(() => {
            log.debug(`built ${srcFile}`);
            return fileMeta;
          });
        } else {
          return fileMeta;
        }
      });
  }

  async lintFile(fileMeta, files) {
    const { srcFile } = fileMeta;
    const srcFilePath = `${this.srcPath}/${srcFile}`;
    const content = getFileContent(srcFilePath);
    const writer = getFileStreamWriter(srcFilePath);
    const context = {
      srcFilePath,
      bookPath: this.bookPath,
      srcFileNameMap: groupBy(files, (f) => basename(f.srcFile)),
    };
    writer.write(lintFile(content, context));
    log.debug(`linted source file ${srcFile}`);
    return writer.endWithPromise().then(() => fileMeta);
  }
}

export const isValidChapter = (filename) => filename.includes('chapter')
  && !filename.includes('.');

export const isValidFrontMatter = (filename) => [
  'preface',
  'foreword',
  'introduction',
].includes(filename);

export const isValidBackMatter = (filename) => [
  'glossary',
  'appendix',
].includes(filename);

export const isMarkdownFile = (filename) => filename.endsWith('.md');
