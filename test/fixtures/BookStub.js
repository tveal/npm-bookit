import { get, merge, set } from 'lodash';
import { basename, dirname } from 'path';
import { Readable } from 'stream';

const getLodashPath = (path) => {
  const fileName = basename(path);
  return fileName.includes('.')
    ? `${dirname(path).split('/').join('.')}['${fileName}']`
    : `${path.split('/').join('.')}`;
};

/* eslint max-classes-per-file: ["error", 2] */
class MockWriteStream {
  constructor(writeFunc) {
    this.writeFunc = writeFunc;
  }

  write(str) {
    try {
      this.writeFunc(str);
    } catch (e) {
      this.reject(e);
    }
  }

  on(event, func) {
    if (event === 'finish') this.resolve = func;
    if (event === 'error') this.reject = func;
  }

  end() {
    this.resolve();
  }
}

export default class BookStub {
  constructor(fsStub, cwdStub) {
    this.fsStub = fsStub;
    this.cwdStub = cwdStub;

    this.filesystem = {
      testProject: { // for mocked process.cwd()
        src: {},
        book: {},
      },
    };

    this.cwdStub.returns('testProject');
    this.fsStub.readdirSync.callsFake((path) => this.getDirListing(path));
    this.fsStub.readFileSync.callsFake((path) => this.getFile(path));
    this.fsStub.createReadStream.callsFake((path) => Readable.from(this.getFile(path).split('\n')));
    this.fsStub.createWriteStream.callsFake((filePath) => {
      const fileLodashPath = getLodashPath(filePath);
      set(this.filesystem, fileLodashPath, ''); // new file
      return new MockWriteStream((line) => {
        const current = get(this.filesystem, fileLodashPath);
        set(this.filesystem, fileLodashPath, current + line);
      });
    });
    this.fsStub.rmdirSync.callsFake((path) => {
      set(this.filesystem, getLodashPath(path), undefined); // "delete" folder
    });
    this.fsStub.mkdirSync.callsFake((path) => {
      set(this.filesystem, getLodashPath(path), {}); // "new" folder
    });
    this.fsStub.existsSync.callsFake((path) => get(this.filesystem, getLodashPath(path), null) !== null);
  }

  addRootFile(fileName, content) {
    const objToSave = {
      [fileName]: content,
    };
    this.filesystem.testProject = merge(this.filesystem.testProject, objToSave);
    return this;
  }

  addHomeFile(content) {
    const objToSave = {
      'home.md': content,
    };
    this.filesystem.testProject.src = merge(this.filesystem.testProject.src, objToSave);
    return this;
  }

  addSrcFile(folderName, fileName, content) {
    const objToSave = {
      [folderName]: {
        [fileName]: content,
      },
    };
    this.filesystem.testProject.src = merge(this.filesystem.testProject.src, objToSave);
    return this;
  }

  addBookFile(fileName, content) {
    const objToSave = {
      [fileName]: content,
    };
    this.filesystem.testProject.book = merge(this.filesystem.testProject.book, objToSave);
    return this;
  }

  getDirListing(path) {
    const testPath = toTestPath(path);
    const obj = get(this.filesystem, testPath, {});
    // console.log('path', path);
    // console.log('testPath', testPath);
    // console.log('obj', obj);
    return Object.keys(obj);
  }

  getFile(path) {
    const testPath = toTestPath(path);
    const obj = get(this.filesystem, testPath);
    return obj;
  }

  getBookFile(fileName) {
    return this.filesystem.testProject.book[fileName];
  }
}

const toTestPath = (path) => (path.includes('/')
  ? `${dirname(path).split('/').join('.')}['${basename(path)}']`
  : path);
