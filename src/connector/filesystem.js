import {
  readdirSync,
  readFileSync,
  createReadStream,
  createWriteStream,
  rmdirSync,
  mkdirSync,
  existsSync,
} from 'fs';
import readline from 'readline';

// abstract all filesystem calls here, and make sure to stub appropriately in BookStub
export const listDirectory = (path) => readdirSync(path);
export const getFileContent = (path) => readFileSync(path, 'utf8');
export const getFileStreamReader = (path, lineHandler) => fileReader(path, lineHandler);
export const getFileStreamWriter = (path) => new FileWriter(path);
export const deleteDirectory = (path) => rmdirSync(path, { recursive: true });
export const createDirectory = (path) => mkdirSync(path, { recursive: true });
export const isExistingPath = (path) => existsSync(path);

class FileWriter {
  constructor(path) {
    // https://stackoverflow.com/a/39880990
    this.file = createWriteStream(path);
    this.promise = new Promise((resolve, reject) => {
      this.file.on('finish', resolve);
      this.file.on('error', reject);
    });
  }

  write(str) {
    this.file.write(str);
    return this; // in case you want to chain function calls
  }

  endWithPromise() {
    this.file.end();
    return this.promise;
  }
}

// https://nodejs.org/api/readline.html#readline_example_read_file_stream_line_by_line
const fileReader = async (path, lineHandler) => {
  const rl = readline.createInterface({
    input: createReadStream(path, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  // eslint-disable-next-line
  for await (const line of rl) {
    if (lineHandler(line) < 0) break;
  }
};
