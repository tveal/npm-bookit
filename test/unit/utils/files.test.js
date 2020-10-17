import fs from 'fs';
import yaml from 'js-yaml';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { omit } from 'lodash';
import { FileConnector } from '../../../src/utils';
import BookStub from '../../fixtures/BookStub';
import {
  FILE_INSTALL_NODE,
  FILE_INTRO_PAGE1,
  FILE_INTRO_PAGE2,
  FILE_PREFACE,
  FILE_FOREWORD,
  FILE_GLOSSARY_PAGE1,
  FILE_GLOSSARY_PAGE2,
  FILE_APPENDIX,
} from '../../fixtures/srcFiles';

let fsStub;
let cwdStub;
const initBookStub = () => new BookStub(
  fsStub,
  cwdStub,
);

describe('FileConnector', () => {
  let config;
  beforeEach(() => {
    fsStub = sinon.stub(fs);
    cwdStub = sinon.stub(process, 'cwd');
    config = yaml.safeDump({
      bookSrc: 'src',
      bookDst: 'book',
      chapterTitles: {
        1: 'Tool Setup',
      },
    });
    initBookStub().addRootFile('bookit.yml', config);
  });
  afterEach(sinon.restore);
  it('constructor should default src and book paths if not in config', () => {
    initBookStub()
      .addRootFile('bookit.yml', yaml.safeDump({}));

    const fileConnector = new FileConnector();

    expect(fileConnector.srcPath).to.equal('testProject/src');
    expect(fileConnector.bookPath).to.equal('testProject/book');
    expect(fileConnector.imgPath).to.equal('testProject/img');
  });
  it('constructor should throw error for no config file', () => {
    initBookStub();

    let error;
    let fileConnector;
    try {
      fileConnector = new FileConnector();
    } catch (e) {
      error = e;
    }

    expect(fileConnector).to.be.undefined;
    expect(error.message)
      .to.equal('Cannot load config. Must have exactly 1 file in the project root; Supported names: [ bookit.yml, bookit.yaml ]');
  });
  it('getFrontMatter', () => {
    initBookStub()
      .addRootFile('bookit.yml', config)
      .addSrcFile('introduction', '01-node.md', 'something')
      .addSrcFile('introduction', '02-ide.md', 'something')
      .addSrcFile('preface', 'pre.md', 'something')
      .addSrcFile('foreword', 'foreword.md', 'something')
      .addSrcFile('other', 'unknown.md', 'something')
      .addSrcFile('glossary', 'glossy.md', 'something');

    const frontMatter = new FileConnector().getFrontMatter();

    expect(frontMatter).to.deep.equal([
      {
        title: 'Introduction',
        folderName: 'introduction',
        files: ['01-node.md', '02-ide.md'],
      },
      {
        title: 'Preface',
        folderName: 'preface',
        files: ['pre.md'],
      },
      {
        title: 'Foreword',
        folderName: 'foreword',
        files: ['foreword.md'],
      },
    ]);
  });
  it('getChapters', () => {
    initBookStub()
      .addRootFile('bookit.yml', config)
      .addSrcFile('chapter01', '01-node.md', 'something')
      .addSrcFile('chapter01', '02-ide.md', 'something')
      .addSrcFile('chapter01', '03-git.md', 'something')
      .addSrcFile('chapter01', '04-java.md', 'something')
      .addSrcFile('chapter02', '01-test-patterns.md', 'something')
      .addSrcFile('chapter02', '02-test-frameworks.md', 'something');

    const chapters = new FileConnector().getChapters();

    expect(chapters).to.deep.equal([
      {
        chapter: 1,
        title: 'Tool Setup',
        folderName: 'chapter01',
        files: [
          '01-node.md',
          '02-ide.md',
          '03-git.md',
          '04-java.md',
        ],
      },
      {
        chapter: 2,
        title: false,
        folderName: 'chapter02',
        files: [
          '01-test-patterns.md',
          '02-test-frameworks.md',
        ],
      },
    ]);
  });
  it('getBackMatter', () => {
    initBookStub()
      .addRootFile('bookit.yml', config)
      .addSrcFile('preface', 'pre.md', 'something')
      .addSrcFile('appendix', 'appendix.md', 'something')
      .addSrcFile('other', 'unknown.md', 'something')
      .addSrcFile('glossary', 'glossy.md', 'something');

    const backMatter = new FileConnector().getBackMatter();

    expect(backMatter).to.deep.equal([
      {
        title: 'Appendix',
        folderName: 'appendix',
        files: ['appendix.md'],
      },
      {
        title: 'Glossary',
        folderName: 'glossary',
        files: ['glossy.md'],
      },
    ]);
  });
  it('buildFile should port src file to dst and return the file details', async () => {
    const bookStub = initBookStub()
      .addRootFile('bookit.yml', config)
      .addSrcFile('chapter01', '01-node.md', FILE_INSTALL_NODE);

    const loader = new FileConnector();
    const chapter = loader.getChapters()[0];

    const builtFile = await loader.buildFile(`${chapter.folderName}/${chapter.files[0]}`);
    expect(omit(builtFile, 'filePath')).to.deep.equal({
      title: 'Install Node',
      fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
      srcFile: 'chapter01/01-node.md',
    });
    expect(builtFile.filePath).to.endsWith('book/f377f770-261c-4d5a-b752-0a94f18ff0b8.md');
    expect(bookStub.getBookFile('f377f770-261c-4d5a-b752-0a94f18ff0b8.md'))
      .to.equal('\r\n# Install Node\r\n\r\nBlob\r\n');
  });
  it('buildFile should NOT port src file to dst without valid UUIDv4', async () => {
    const bookStub = initBookStub()
      .addRootFile('bookit.yaml', config)
      .addSrcFile('chapter01', '01-node.md', FILE_INSTALL_NODE)
      .addSrcFile('chapter01', '02-ide.md', '# Integrated Dev Env');

    const loader = new FileConnector();
    const chapter = loader.getChapters()[0];

    const builtFile = await loader.buildFile(`${chapter.folderName}/${chapter.files[1]}`);
    expect(builtFile).to.deep.equal({
      title: undefined,
      fileName: undefined,
      filePath: undefined,
      srcFile: 'chapter01/02-ide.md',
    });
    expect(bookStub.filesystem.testProject.book).to.deep.equal({});
  });
  it('buildBook should return the built book data', async () => {
    initBookStub()
      .addRootFile('bookit.yml', config)
      .addSrcFile('introduction', 'page1.md', FILE_INTRO_PAGE1)
      .addSrcFile('introduction', 'page2.md', FILE_INTRO_PAGE2)
      .addSrcFile('preface', 'preface.md', FILE_PREFACE)
      .addSrcFile('foreword', 'foreword.md', FILE_FOREWORD)
      .addSrcFile('chapter01', '01-node.md', FILE_INSTALL_NODE)
      .addSrcFile('glossary', 'glossy1.md', FILE_GLOSSARY_PAGE1)
      .addSrcFile('glossary', 'glossy2.md', FILE_GLOSSARY_PAGE2)
      .addSrcFile('appendix', 'appendix.md', FILE_APPENDIX);

    const cx = new FileConnector();

    const book = await cx.buildBook();
    // console.log(book);
    // .then((chapters) => console.log(JSON.stringify(chapters, null, 2)))
    expect(book).to.deep.equal([
      {
        title: 'Introduction',
        folderName: 'introduction',
        files: [
          'page1.md',
          'page2.md',
        ],
        bookFiles: [
          {
            title: 'Introduction',
            fileName: 'c2b5996a-428d-4c36-b4e8-e02c3953ed44.md',
            filePath: 'testProject/book/c2b5996a-428d-4c36-b4e8-e02c3953ed44.md',
            srcFile: 'introduction/page1.md',
          },
          {
            title: undefined,
            fileName: 'c227518b-3fc1-4afe-8c3e-27b6455617b3.md',
            filePath: 'testProject/book/c227518b-3fc1-4afe-8c3e-27b6455617b3.md',
            srcFile: 'introduction/page2.md',
          },
        ],
      },
      {
        title: 'Preface',
        folderName: 'preface',
        files: [
          'preface.md',
        ],
        bookFiles: [
          {
            title: undefined,
            fileName: '8b7b8a0f-a14c-41b8-ac48-45ebe461bd92.md',
            filePath: 'testProject/book/8b7b8a0f-a14c-41b8-ac48-45ebe461bd92.md',
            srcFile: 'preface/preface.md',
          },
        ],
      },
      {
        title: 'Foreword',
        folderName: 'foreword',
        files: [
          'foreword.md',
        ],
        bookFiles: [
          {
            title: undefined,
            fileName: '8fc14b25-33a0-48d3-b99f-35042aba0caa.md',
            filePath: 'testProject/book/8fc14b25-33a0-48d3-b99f-35042aba0caa.md',
            srcFile: 'foreword/foreword.md',
          },
        ],
      },
      {
        chapter: 1,
        title: 'Tool Setup',
        folderName: 'chapter01',
        files: [
          '01-node.md',
        ],
        bookFiles: [
          {
            title: 'Install Node',
            fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
            filePath: 'testProject/book/f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
            srcFile: 'chapter01/01-node.md',
          },
        ],
      },
      {
        title: 'Glossary',
        folderName: 'glossary',
        files: [
          'glossy1.md',
          'glossy2.md',
        ],
        bookFiles: [
          {
            title: 'Glossary',
            fileName: '64e4bf19-55fc-4d4e-95b7-670235d8b16c.md',
            filePath: 'testProject/book/64e4bf19-55fc-4d4e-95b7-670235d8b16c.md',
            srcFile: 'glossary/glossy1.md',
          },
          {
            title: undefined,
            fileName: 'c405743d-1526-432b-9a8b-139ce2c928c9.md',
            filePath: 'testProject/book/c405743d-1526-432b-9a8b-139ce2c928c9.md',
            srcFile: 'glossary/glossy2.md',
          },
        ],
      },
      {
        title: 'Appendix',
        folderName: 'appendix',
        files: [
          'appendix.md',
        ],
        bookFiles: [
          {
            title: 'Appendix',
            fileName: '40cb2ae8-8d99-49e9-9fdc-8d60e6862548.md',
            filePath: 'testProject/book/40cb2ae8-8d99-49e9-9fdc-8d60e6862548.md',
            srcFile: 'appendix/appendix.md',
          },
        ],
      },
    ]);
  });
  it('sanity check: stub cwd()', () => {
    sinon.restore(); // already stubbed in beforeEach; reset
    sinon.stub(process, 'cwd').returns('').callsFake(() => 'blah');

    expect(process.cwd()).to.equal('blah');
  });
});
