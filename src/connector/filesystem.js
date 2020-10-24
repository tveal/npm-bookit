import {
  readdirSync,
  readFileSync,
  createReadStream,
  createWriteStream,
  rmdirSync,
  mkdirSync,
} from 'fs';

export const listDirectory = (path) => readdirSync(path);
export const getFileContent = (path) => readFileSync(path, 'utf8');
export const readFileStream = (path) => createReadStream(path, { encoding: 'utf8' });
export const writeFileStream = (path) => createWriteStream(path);
export const deleteDirectory = (path) => rmdirSync(path, { recursive: true });
export const createDirectory = (path) => mkdirSync(path, { recursive: true });
