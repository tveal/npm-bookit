import fs from 'fs';
import yaml from 'js-yaml';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { omit, omitBy } from 'lodash';
import { Bookit } from '../../src/bookit';
import BookStub from '../fixtures/BookStub';
import {
  FILE_WELCOME,
  FILE_INSTALL_NODE,
  FILE_INTRO_PAGE1,
  FILE_INTRO_PAGE2,
  FILE_PREFACE,
  FILE_FOREWORD,
  FILE_GLOSSARY_PAGE1,
  FILE_GLOSSARY_PAGE2,
  FILE_APPENDIX,
  FILE_INVALID_UUID,
} from '../fixtures/mock-src-files';

let fsStub;
let cwdStub;
const initBookStub = () => new BookStub(
  fsStub,
  cwdStub,
);

describe('Bookit', () => {
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

    const bookit = new Bookit();

    expect(bookit.srcPath).to.equal('testProject/src');
    expect(bookit.bookPath).to.equal('testProject/book');
    expect(bookit.imgPath).to.equal('testProject/img');
    expect(bookit.lintSrc).to.be.true;
  });
  it('constructor should set lintSrc from persisted config', () => {
    initBookStub()
      .addRootFile('bookit.yml', yaml.safeDump({
        lintSrc: false,
      }));

    const bookit = new Bookit();

    expect(bookit.lintSrc).to.be.false;
  });
  it('constructor should set lintSrc from argv', () => {
    initBookStub()
      .addRootFile('bookit.yml', yaml.safeDump({
        lintSrc: true,
      }));

    const bookit = new Bookit({ nolint: true });

    expect(bookit.lintSrc).to.be.false;
  });
  it('constructor should throw error for no config file', () => {
    initBookStub();

    let error;
    let bookit;
    try {
      bookit = new Bookit();
    } catch (e) {
      error = e;
    }

    expect(bookit).to.be.undefined;
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

    const frontMatter = new Bookit().getFrontMatter();

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

    const chapters = new Bookit().getChapters();

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

    const backMatter = new Bookit().getBackMatter();

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

    const loader = new Bookit();
    const chapter = loader.getChapters()[0];

    const builtFile = await loader.buildFile({
      srcFile: `${chapter.folderName}/${chapter.files[0]}`,
      filePath: 'testProject/book/f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
      sectionTitle: 'Chapter 1: **Install Tools**',
      fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
      sectionNav: [
        {
          title: '1.0',
          fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
        },
        {
          title: '1.1',
          fileName: '700af3c6-9a77-4964-bfa7-489b6c208e16.md',
        },
      ],
    });
    expect(builtFile).to.deep.equal({
      filePath: 'testProject/book/f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
      srcFile: 'chapter01/01-node.md',
      sectionTitle: 'Chapter 1: **Install Tools**',
      fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
      sectionNav: [
        {
          title: '1.0',
          fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
        },
        {
          title: '1.1',
          fileName: '700af3c6-9a77-4964-bfa7-489b6c208e16.md',
        },
      ],
    });
    expect(bookStub.getBookFile('f377f770-261c-4d5a-b752-0a94f18ff0b8.md').split('\r\n'))
      .to.deep.equal([
        '**[HOME](./index.md)**',
        '',
        '> Chapter 1: **Install Tools**',
        '>',
        '> **1.0** |',
        '[1.1](./700af3c6-9a77-4964-bfa7-489b6c208e16.md)',
        '',
        '',
        '# Install Node',
        '',
        'Blob',
        '',
        '',
        '---',
        '',
        '**[HOME](./index.md)**',
        '',
        '',
      ]);
    // .to.deep.equal('**[HOME](./index.md)**\r\n\r\n\r\n# Install Node\r\n\r\nBlob\r\n\r\n\r\n---\r\n\r\n**[HOME](./index.md)**\r\n\r\n');
  });
  it('buildFile should NOT port src file to dst without valid UUIDv4', async () => {
    const bookStub = initBookStub()
      .addRootFile('bookit.yaml', config)
      .addSrcFile('chapter01', '01-node.md', FILE_INSTALL_NODE)
      .addSrcFile('chapter01', '02-ide.md', '# Integrated Dev Env');

    const loader = new Bookit();
    const chapter = loader.getChapters()[0];

    const builtFile = await loader.buildFile({
      srcFile: `${chapter.folderName}/${chapter.files[1]}`,
      sectionTitle: 'Chapter 1: **Install Tools**',
      fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
      sectionNav: [
        {
          title: '1.0',
          fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
        },
        {
          title: '1.1',
          fileName: '700af3c6-9a77-4964-bfa7-489b6c208e16.md',
        },
      ],
    });
    expect(builtFile).to.deep.equal({
      srcFile: 'chapter01/02-ide.md',
      sectionTitle: 'Chapter 1: **Install Tools**',
      fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
      sectionNav: [
        {
          title: '1.0',
          fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
        },
        {
          title: '1.1',
          fileName: '700af3c6-9a77-4964-bfa7-489b6c208e16.md',
        },
      ],
    });
    expect(bookStub.filesystem.testProject.book).to.deep.equal({});
  });
  it('buildBookMeta should return the book metadata', async () => {
    initBookStub()
      .addRootFile('bookit.yml', config)
      .addSrcFile('introduction', 'page1.md', FILE_INTRO_PAGE1)
      .addSrcFile('introduction', 'page2.md', FILE_INTRO_PAGE2)
      .addSrcFile('preface', 'preface.md', FILE_PREFACE)
      .addSrcFile('foreword', 'foreword.md', FILE_FOREWORD)
      .addSrcFile('chapter01', '01-node.md', FILE_INSTALL_NODE)
      .addSrcFile('chapter01', '02-ide.md', FILE_INVALID_UUID)
      .addSrcFile('glossary', 'glossy1.md', FILE_GLOSSARY_PAGE1)
      .addSrcFile('glossary', 'glossy2.md', FILE_GLOSSARY_PAGE2)
      .addSrcFile('appendix', 'appendix.md', FILE_APPENDIX);

    const cx = new Bookit();

    const book = await cx.buildBookMeta();
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
          '02-ide.md',
        ],
        bookFiles: [
          {
            title: 'Install Node',
            fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
            filePath: 'testProject/book/f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
            srcFile: 'chapter01/01-node.md',
          },
          {
            title: 'Setup Integrated Development Env',
            fileName: undefined,
            filePath: undefined,
            srcFile: 'chapter01/02-ide.md',
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
  it('addMissingUuid should add missing uuid to src file', async () => {
    const bookStub = initBookStub()
      .addRootFile('bookit.yml', config)
      .addSrcFile('introduction', 'page1.md', FILE_INTRO_PAGE1)
      .addSrcFile('introduction', 'page2.md', FILE_INTRO_PAGE2)
      .addSrcFile('preface', 'preface.md', FILE_PREFACE)
      .addSrcFile('foreword', 'foreword.md', FILE_FOREWORD)
      .addSrcFile('chapter01', '01-node.md', FILE_INSTALL_NODE)
      .addSrcFile('chapter01', '02-ide.md', FILE_INVALID_UUID)
      .addSrcFile('glossary', 'glossy1.md', FILE_GLOSSARY_PAGE1)
      .addSrcFile('glossary', 'glossy2.md', FILE_GLOSSARY_PAGE2)
      .addSrcFile('appendix', 'appendix.md', FILE_APPENDIX);

    const cx = new Bookit();

    const metaArray = await cx.buildBookMeta();
    const fixedUuid = await cx.addMissingUuid(metaArray);
    const diff = fixedUuid
      .map((m) => JSON.stringify(m))
      .filter((s) => !metaArray.map((m) => JSON.stringify(m)).includes(s))
      .map((s) => JSON.parse(s))
      .map((n) => {
        const old = metaArray.filter((o) => o.folderName === n.folderName)[0];
        const dif = omitBy(n, (v, k) => old[k] === v);
        return {
          old,
          new: n,
          dif,
        };
      });
    // .then((chapters) => console.log(JSON.stringify(chapters, null, 2)))
    // console.log(bookStub.filesystem.testProject.src);
    expect(diff.length).to.equal(1);
    expect(omit(diff[0].new, 'bookFiles')).to.deep.equal(omit(diff[0].old, 'bookFiles'));
    expect(diff[0].new.bookFiles[1].fileName).to.not.be.undefined;
    expect(diff[0].old.bookFiles[1].fileName).to.be.undefined;
    expect(bookStub.filesystem.testProject.src.chapter01['02-ide.md'])
      .containIgnoreSpaces(diff[0].new.bookFiles[1].fileName.split('.')[0]);
    // expect(metaArray).to.deep.equal(fixedUuid);
  });
  it('buildBook should work...', async () => {
    const bookStub = initBookStub()
      .addRootFile('bookit.yml', config)
      .addHomeFile(FILE_WELCOME)
      .addSrcFile('introduction', 'page1.md', FILE_INTRO_PAGE1)
      .addSrcFile('introduction', 'page1.md', FILE_INTRO_PAGE1)
      .addSrcFile('introduction', 'page2.md', FILE_INTRO_PAGE2)
      .addSrcFile('preface', 'preface.md', FILE_PREFACE)
      .addSrcFile('foreword', 'foreword.md', FILE_FOREWORD)
      .addSrcFile('chapter01', '01-node.md', FILE_INSTALL_NODE)
      .addSrcFile('chapter01', '02-ide.md', FILE_INVALID_UUID)
      .addSrcFile('glossary', 'glossy1.md', FILE_GLOSSARY_PAGE1)
      .addSrcFile('glossary', 'glossy2.md', FILE_GLOSSARY_PAGE2)
      .addSrcFile('appendix', 'appendix.md', FILE_APPENDIX);

    const cx = new Bookit();

    const book = await cx.buildBook();

    // console.log(bookStub.filesystem.testProject.book);
    expect(book.length).to.equal(9);
    expect(book.map((f) => f.srcFile)).to.deep.equal([
      'preface/preface.md',
      'foreword/foreword.md',
      'introduction/page1.md',
      'introduction/page2.md',
      'chapter01/01-node.md',
      'chapter01/02-ide.md',
      'glossary/glossy1.md',
      'glossary/glossy2.md',
      'appendix/appendix.md',
    ]);
    expect(Object.keys(bookStub.filesystem.testProject.book).length).to.equal(10); // index TOC
    // console.log(bookStub.filesystem.testProject.book['index.md']);
    expect(bookStub.filesystem.testProject.book['index.md']).to.include([
      '# Aloha Honua!',
      '',
      'A book of randomness...',
      '',
      '',
      '[**Preface**](./8b7b8a0f-a14c-41b8-ac48-45ebe461bd92.md)',
      '---',
      '[**Foreword**](./8fc14b25-33a0-48d3-b99f-35042aba0caa.md)',
      '---',
      '[**Introduction**](./c2b5996a-428d-4c36-b4e8-e02c3953ed44.md)',
      '---',
      'Chapter 1: **Tool Setup**',
      '---',
      '- [1.0 Install Node](./f377f770-261c-4d5a-b752-0a94f18ff0b8.md)',
      // next line has a runtime variable uuid
    ].join('\r\n'));
  });
  it('buildBook should cleanup old book files', async () => {
    const bookStub = initBookStub()
      .addRootFile('bookit.yml', config)
      .addBookFile('oops.md', 'Mwha ha ha!')
      .addBookFile('leftovers.md', 'DejaVu!')
      .addSrcFile('chapter01', '01-node.md', FILE_INSTALL_NODE);

    const cx = new Bookit({ nolint: true });

    expect(Object.keys(bookStub.filesystem.testProject.book)).to.deep.equal([
      'oops.md',
      'leftovers.md',
    ]);
    await cx.buildBook();

    expect(Object.keys(bookStub.filesystem.testProject.book)).to.have.members([
      'index.md',
      'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
    ]);
  });
  it('formatSectionTitle should be empty chapter title', () => {
    const title = new Bookit().formatSectionTitle({ chapter: 2, bookFiles: ['01-some-page.md'] });
    expect(title).to.equal('Chapter 2:');
  });
  it('formatChapterFileLink should derive title from filename', () => {
    const title = new Bookit().formatChapterFileLink({
      srcFile: 'chapter03/01-some-page.md',
      fileName: 'ebdde1f6-3dfb-4fb0-8c9e-c2192e73b050.md',
    }, 3, 1);
    expect(title).to.equal('[3.1 some page](./ebdde1f6-3dfb-4fb0-8c9e-c2192e73b050.md)');
  });
  it('sanity check: stub cwd()', () => {
    sinon.restore(); // already stubbed in beforeEach; reset
    sinon.stub(process, 'cwd').returns('').callsFake(() => 'blah');

    expect(process.cwd()).to.equal('blah');
  });
});
