import yaml from 'js-yaml';
import { basename } from 'path';
import {
  get, startCase, groupBy, forEach,
} from 'lodash';
import readline from 'readline';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import {
  readdirSync,
  readFileSync,
  createReadStream,
  createWriteStream,
  rmdirSync,
  mkdirSync,
} from 'fs';
import { log, formatLine } from '../utils';

export class FileConnector {
  constructor() {
    log.info('HI!');
    log.error('Test err');
    log.debug('Test debug');
    const configFiles = readdirSync(process.cwd()).filter((i) => allowedConfigFiles.includes(i));
    this.configFile = `${process.cwd()}/${configFiles[0]}`;
    if (configFiles.length !== 1) {
      throw Error('Cannot load config. Must have exactly 1 file in the project root;'
        + ` Supported names: [ ${allowedConfigFiles.join(', ')} ]`);
    }
    try {
      this.config = yaml.safeLoad(readFileSync(this.configFile, 'utf8'));
    } catch (e) { /* istanbul ignore next */
      throw Error(`Failed to load ${this.configFile || 'config'} file.`);
    }
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
        rmdirSync(this.bookPath, { recursive: true });
        mkdirSync(this.bookPath, { recursive: true });
        return metaArray;
      })
      .then((metaArray) => this.addMissingUuid(metaArray))
      .then((metaArray) => this.buildBookToc(metaArray))
      .then((files) => {
        log.debug('Building Files...');
        forEach(files, (v, i) => {
          files[i].prev = i < 1 ? false : files[i-1].fileName;
          files[i].next = i === files.length-1 ? false : files[i+1].fileName;
        });
        return Promise.all(files.map((f) => this.buildFile(f, files)));
      });
  }

  formatSectionTitle(section) {
    const { chapter, title, bookFiles } = section;
    const chapTitle = title ? ` **${title}**` : '';
    return chapter
      ? `Chapter ${chapter}:${chapTitle}`
      : `[**${title}**](./${bookFiles[0].fileName})`;
  }

  formatChapterFileLink(file, chapter) {
    const { srcFile, fileName, title } = file;
    const num = `${chapter}.${Number(basename(srcFile).replace(/\D+/g, ''))}`;

    return title
      ? `[${num} ${title}](./${fileName})`
      : `[${num} ${basename(srcFile).split('.')[0].replace(/[-_\d]+/g, ' ').trim()}](./${fileName})`;
  }

  addMissingUuid(metaArray) {
    log.debug('Adding any missing UUIDs');
    return metaArray.map((section) => {
      const bookFiles = section.bookFiles
        .map((file) => {
          if (file.fileName) return file;
          const uuid = uuidv4();
          const fileName = `${uuid}.md`;
          const filePath = `${this.bookPath}/${fileName}`;
          const srcFilePath = `${this.srcPath}/${file.srcFile}`;
          const content = readFileSync(srcFilePath);
          const writer = createWriteStream(srcFilePath);
          writer.write(`${uuid}\r\n`);
          writer.write(content);
          log.debug(`added uuid ${uuid} to ${file.srcFile}`);
          return {
            ...file,
            fileName,
            filePath,
          };
        });
      return {
        ...section,
        bookFiles,
      };
    });
  }

  buildBookToc(metaArray) {
    log.debug('Building TOC...');
    const metaMap = groupBy(metaArray, (m) => m.folderName.replace(/\d+/g, ''));

    const fileArray = [];
    const writer = createWriteStream(`${this.bookPath}/index.md`);
    const writeNonChapters = (section) => {
      const sectionTitle = this.formatSectionTitle(section);
      writer.write(`${sectionTitle}\r\n---\r\n`);
      log.debug(sectionTitle);
      fileArray.push(...section.bookFiles);
      return section;
    };
    const writeChapters = (section) => {
      const sectionTitle = this.formatSectionTitle(section);
      writer.write(`${sectionTitle}\r\n---\r\n`);
      log.debug(sectionTitle);
      section.bookFiles.map((file) => {
        const chLink = `- ${this.formatChapterFileLink(file, section.chapter)}`;
        writer.write(`${chLink}\r\n`);
        log.debug(chLink);
        return file;
      });
      fileArray.push(...section.bookFiles);
      writer.write('\r\n');
      return section;
    };

    try {
      const homeContent = readFileSync(`${this.srcPath}/home.md`);
      if (homeContent) {
        writer.write(homeContent);
        log.debug('Added home.md content to TOC');
      }
    } catch (e) { /* istanbul ignore next */
      log.debug('No home.md file found. No Header will be added to the TOC.');
    }
    writer.write('\r\n\r\n');

    get(metaMap, 'preface', []).map(writeNonChapters);
    get(metaMap, 'foreword', []).map(writeNonChapters);
    get(metaMap, 'introduction', []).map(writeNonChapters);
    get(metaMap, 'chapter', []).map(writeChapters);
    get(metaMap, 'glossary', []).map(writeNonChapters);
    get(metaMap, 'appendix', []).map(writeNonChapters);

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
    return readdirSync(this.srcPath)
      .filter((item) => isValidFrontMatter(item))
      .map((folderName) => ({
        title: startCase(folderName),
        folderName,
        files: readdirSync(`${this.srcPath}/${folderName}`).filter((i) => isMarkdownFile(i)),
      }));
  }

  getChapters() {
    const things = readdirSync(this.srcPath);
    return things
      .filter((item) => isValidChapter(item))
      .map((folderName) => {
        const chapter = Number(folderName.replace(/\D+/g, ''));
        return {
          chapter,
          title: get(this, `config.chapterTitles[${chapter}]`, false),
          folderName,
          files: readdirSync(`${this.srcPath}/${folderName}`).filter((i) => isMarkdownFile(i)),
        };
      });
  }

  getBackMatter() {
    return readdirSync(this.srcPath)
      .filter((item) => isValidBackMatter(item))
      .map((folderName) => ({
        title: startCase(folderName),
        folderName,
        files: readdirSync(`${this.srcPath}/${folderName}`).filter((i) => isMarkdownFile(i)),
      }));
  }

  // https://nodejs.org/api/readline.html#readline_example_read_file_stream_line_by_line
  async buildFileMeta(srcFile) {
    const rl = readline.createInterface({
      input: createReadStream(`${this.srcPath}/${srcFile}`, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    let lineNumber = 0;

    // file props
    let title;
    let fileName;
    let filePath;

    // eslint-disable-next-line
    for await (const line of rl) {
      lineNumber += 1;
      if (lineNumber > 5 || title) break;

      if (lineNumber === 1) {
        if (isUuid(line.trim())) {
          fileName = `${line.trim()}.md`;
          filePath = `${this.bookPath}/${fileName}`;
        } else {
          log.debug(
            `Warning - no uuid4 for ${srcFile}.
              Add one to the first line of the file.
              Suggested uuid4: ${uuidv4()}`,
          );
        }
      } else if (!title && line.startsWith('# ')) {
        title = line.substring(2);
      }
    } // for each line
    rl.close();

    return {
      title,
      fileName,
      filePath,
      srcFile,
    };
  }

  async buildFile(fileMeta, files) {
    const {
      srcFile, next, prev, filePath,
    } = fileMeta;
    const rl = readline.createInterface({
      input: createReadStream(`${this.srcPath}/${srcFile}`, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    let lineNumber = 0;
    let writer;

    const navArray = [];
    if (prev) navArray.push(`**[⏪ PREV](./${prev})**`);
    navArray.push('**[HOME](./index.md)**');
    if (next) navArray.push(`**[NEXT ⏩](./${next})**`);
    const nav = `${navArray.join(' | ')}\r\n\r\n`;

    // eslint-disable-next-line
    for await (const line of rl) {
      lineNumber += 1;
      // console.log('+++++line:', line);

      if (lineNumber === 1) {
        if (isUuid(line.trim())) {
          writer = createWriteStream(filePath);
          writer.write(nav);
        } else {
          log.error(
            `ERROR no uuid4 for ${srcFile}.
              Add one to the first line of the file.
              Suggested uuid4: ${uuidv4()}`,
          );
          break;
        }
      } else {
        const context = {
          srcFileNameMap: groupBy(files, (f) => basename(f.srcFile)),
          srcPath: this.srcPath,
          imgPath: this.imgPath,
          bookPath: this.bookPath,
        };
        writer.write(`${formatLine(line, context)}\r\n`);
      }
    } // for each line
    if (writer) writer.write(`\r\n\r\n---\r\n\r\n${nav}`);
    rl.close();

    log.debug(`built ${srcFile}`);
    return fileMeta;
  }
}

const allowedConfigFiles = [
  'bookit.yml',
  'bookit.yaml',
];

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
