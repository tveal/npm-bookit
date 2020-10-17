import yaml from 'js-yaml';
import { get, startCase } from 'lodash';
import readline from 'readline';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import {
  readdirSync,
  readFileSync,
  createReadStream,
  createWriteStream,
} from 'fs';
import { createLogger } from './logger';

const log = createLogger('FileConnector');

export class FileConnector {
  constructor() {
    const configFiles = readdirSync(process.cwd()).filter((i) => allowedConfigFiles.includes(i));
    this.configFile = `${process.cwd()}/${configFiles[0]}`;
    if (configFiles.length !== 1) {
      throw Error('Cannot load config. Must have exactly 1 file in the project root;'
        + ` Supported names: [ ${allowedConfigFiles.join(', ')} ]`);
    }
    try {
      this.config = yaml.safeLoad(readFileSync(this.configFile, 'utf8'));
    } catch (e) { /* istanbul ignore next */
      console.log(e); /* istanbul ignore next */
      throw Error(`Failed to load ${this.configFile || 'config'} file.`);
    }
    this.srcPath = `${process.cwd()}/${this.config.bookSrc || 'src'}`;
    this.bookPath = `${process.cwd()}/${this.config.bookDst || 'book'}`;
    this.imgPath = `${process.cwd()}/${this.config.imgDir || 'img'}`;
  }

  // https://doc.rust-lang.org/stable/book/
  buildBook() {
    return Promise.all([
      ...this.buildMatter(this.getFrontMatter()),
      ...this.buildMatter(this.getChapters()),
      ...this.buildMatter(this.getBackMatter()),
    ]);
  }

  buildMatter(matter) {
    return matter.map(
      (folder) => {
        const filesInProgress = folder.files
          .map((file) => this.buildFile(`${folder.folderName}/${file}`));

        return Promise.all(filesInProgress)
          .then((bookFiles) => ({
            ...folder,
            bookFiles: bookFiles.filter((f) => f.fileName),
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
  async buildFile(srcFile) {
    const rl = readline.createInterface({
      input: createReadStream(`${this.srcPath}/${srcFile}`, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    let lineNumber = 0;
    let writer;

    // file props
    let title;
    let fileName;
    let filePath;

    // eslint-disable-next-line
    for await (const line of rl) {
      lineNumber += 1;
      // console.log('+++++line:', line);

      if (lineNumber === 1) {
        if (isUuid(line.trim())) {
          fileName = `${line.trim()}.md`;
          filePath = `${this.bookPath}/${fileName}`;
          writer = createWriteStream(filePath);
        } else {
          log.error(
            `ERROR no uuid4 for ${srcFile}.
              Add one to the first line of the file.
              Suggested uuid4: ${uuidv4()}`,
          );
          break;
        }
      } else {
        if (!title && line.startsWith('# ')) {
          title = line.substring(2);
        }
        writer.write(`${line}\r\n`);
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
