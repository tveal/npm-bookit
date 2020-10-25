import { expect } from 'chai';
import * as sinon from 'sinon';
import { omit } from 'lodash';
import inquirer from 'inquirer';
import yaml from 'js-yaml';
import fs from 'fs';

import BookStub from '../../fixtures/BookStub';

import { initialize } from '../../../src/utils/init';
// import { getInitConfigFromUser } from '../../../src/connector/user';

let fsStub;
let cwdStub;
const initBookStub = () => new BookStub(
  fsStub,
  cwdStub,
);

describe('initialize', () => {
  const config = yaml.safeDump({
    bookSrc: 'src',
    bookDst: 'book',
    chapterTitles: {
      1: 'Tool Setup',
    },
  });
  beforeEach(() => {
    fsStub = sinon.stub(fs);
    cwdStub = sinon.stub(process, 'cwd');
    initBookStub();
  });

  afterEach(sinon.restore);

  it('should create default things for empty project', async () => {
    sinon.stub(inquirer, 'prompt')
      .onCall(0)
      .resolves({ sections: [] })
      .onCall(1)
      .resolves({ overrideConfig: false });

    const bookStub = initBookStub();
    bookStub.filesystem.testProject = {};

    await initialize({});

    // console.log(JSON.stringify(bookStub.filesystem.testProject, null, 2));
    expect(bookStub.filesystem.testProject).to.deep.equal({
      'bookit.yml': yaml.safeDump({
        bookSrc: 'src',
        bookDst: 'book',
        imgDir: 'img',
        chapterTitles: {
          1: 'Hello World!',
        },
      }),
      'book': {},
      'img': {},
      'src': {
        chapter01: {
          '01-getting-started.md': "\r\n\r\n# Let's Get Started!\r\n\r\nCreate markdown (*.md) files in their respective folder locations.\r\n",
        },
      },
    });
  });

  it('should create custom folders for empty project', async () => {
    sinon.stub(inquirer, 'prompt')
      .onCall(0)
      .resolves({
        bookSrc: 'src/book1',
        bookDst: 'published/book1',
        imgDir: 'assets',
        sections: [],
      })
      .onCall(1)
      .resolves({ overrideConfig: false });

    const bookStub = initBookStub();
    bookStub.filesystem.testProject = {};

    await initialize({});

    // console.log(JSON.stringify(bookStub.filesystem.testProject, null, 2));
    expect(bookStub.filesystem.testProject).to.deep.equal({
      'bookit.yml': yaml.safeDump({
        bookSrc: 'src/book1',
        bookDst: 'published/book1',
        imgDir: 'assets',
        chapterTitles: {
          1: 'Hello World!',
        },
      }),
      'published': {
        book1: {},
      },
      'assets': {},
      'src': {
        book1: {
          chapter01: {
            '01-getting-started.md': "\r\n\r\n# Let's Get Started!\r\n\r\nCreate markdown (*.md) files in their respective folder locations.\r\n",
          },
        },
      },
    });
  });

  it('should use existing config file and add new stuff, no override', async () => {
    sinon.stub(inquirer, 'prompt')
      .onCall(0)
      .resolves({
        bookSrc: 'sources', bookDst: 'dist', imgDir: 'assets', sections: [],
      })
      .onCall(1)
      .resolves({ overrideConfig: false });

    const bookStub = initBookStub();
    bookStub.filesystem.testProject = {
      'bookit.yml': config,
    };

    await initialize({ custom: true });

    // console.log(JSON.stringify(bookStub.filesystem.testProject, null, 2));
    expect(bookStub.filesystem.testProject).to.deep.equal({
      'bookit.yml': yaml.safeDump({
        bookSrc: 'src',
        bookDst: 'book',
        imgDir: 'assets',
        chapterTitles: {
          1: 'Tool Setup',
        },
      }),
      'book': {},
      'assets': {},
      'src': {
        chapter01: {
          '01-getting-started.md': "\r\n\r\n# Let's Get Started!\r\n\r\nCreate markdown (*.md) files in their respective folder locations.\r\n",
        },
      },
    });
  });

  it('should override existing config file', async () => {
    sinon.stub(inquirer, 'prompt')
      .onCall(0)
      .resolves({
        bookSrc: 'sources', bookDst: 'dist', imgDir: 'assets', sections: [],
      })
      .onCall(1)
      .resolves({ overrideConfig: true });

    const bookStub = initBookStub();
    bookStub.filesystem.testProject = {
      'bookit.yml': config,
    };

    await initialize({ custom: true });

    // console.log(JSON.stringify(bookStub.filesystem.testProject, null, 2));
    expect(bookStub.filesystem.testProject).to.deep.equal({
      'bookit.yml': yaml.safeDump({
        bookSrc: 'sources',
        bookDst: 'dist',
        chapterTitles: {
          1: 'Hello World!',
        },
        imgDir: 'assets',
      }),
      'dist': {},
      'assets': {},
      'sources': {
        chapter01: {
          '01-getting-started.md': "\r\n\r\n# Let's Get Started!\r\n\r\nCreate markdown (*.md) files in their respective folder locations.\r\n",
        },
      },
    });
  });

  it('should skip folders if exist', async () => {
    sinon.stub(inquirer, 'prompt')
      .onCall(0)
      .resolves({ sections: [] })
      .onCall(1)
      .resolves({ overrideConfig: false });

    const bookStub = initBookStub();
    bookStub.filesystem.testProject = {
      'bookit.yml': config,
      'book': {
        'f377f770-261c-4d5a-b752-0a94f18ff0b8.md': 'something...',
      },
      'img': { 'cats.png': 'meow' },
      'src': {
        chapter01: {},
      },
    };

    await initialize({});

    // console.log(JSON.stringify(bookStub.filesystem.testProject, null, 2));
    expect(bookStub.filesystem.testProject).to.deep.equal({
      'bookit.yml': yaml.safeDump({
        bookSrc: 'src',
        bookDst: 'book',
        imgDir: 'img',
        chapterTitles: {
          1: 'Tool Setup',
        },
      }),
      'book': {
        'f377f770-261c-4d5a-b752-0a94f18ff0b8.md': 'something...',
      },
      'img': { 'cats.png': 'meow' },
      'src': {
        chapter01: {},
      },
    });
  });

  it('should add chapter01 if does not exist', async () => {
    sinon.stub(inquirer, 'prompt')
      .onCall(0)
      .resolves({ sections: [] })
      .onCall(1)
      .resolves({ overrideConfig: false });

    const bookStub = initBookStub();
    bookStub.filesystem.testProject = {
      'bookit.yml': config,
      'src': {
        chapter02: {},
      },
    };

    await initialize({});

    // console.log(JSON.stringify(bookStub.filesystem.testProject, null, 2));
    expect(omit(bookStub.filesystem.testProject, 'bookit.yml')).to.deep.equal({
      book: {},
      img: {},
      src: {
        chapter01: {
          '01-getting-started.md': "\r\n\r\n# Let's Get Started!\r\n\r\nCreate markdown (*.md) files in their respective folder locations.\r\n",
        },
        chapter02: {},
      },
    });
  });

  it('should NOT add chapter01 if exists', async () => {
    sinon.stub(inquirer, 'prompt')
      .onCall(0)
      .resolves({ sections: [] })
      .onCall(1)
      .resolves({ overrideConfig: false });

    const bookStub = initBookStub();
    bookStub.filesystem.testProject = {
      'bookit.yml': config,
      'src': {
        chapter01: {
          'existing-file.md': 'I was already here. Do not delete me!',
        },
      },
    };

    await initialize({});

    // console.log(JSON.stringify(bookStub.filesystem.testProject, null, 2));
    expect(omit(bookStub.filesystem.testProject, 'bookit.yml')).to.deep.equal({
      // 'bookit.yml': config,
      book: {},
      img: {},
      src: {
        chapter01: {
          'existing-file.md': 'I was already here. Do not delete me!',
        },
      },
    });
  });

  it('should create sections', async () => {
    sinon.stub(inquirer, 'prompt')
      .onCall(0)
      .resolves({
        sections: [
          'Preface',
          'Foreword',
          'Introduction',
          'Glossary',
          'Appendix',
        ],
      })
      .onCall(1)
      .resolves({ overrideConfig: false });

    const bookStub = initBookStub();
    bookStub.filesystem.testProject = {
      'bookit.yml': config,
      'src': {
        chapter01: {
          'existing-file.md': 'I was already here. Do not delete me!',
        },
      },
    };

    await initialize({});

    // console.log(JSON.stringify(bookStub.filesystem.testProject, null, 2));
    expect(omit(bookStub.filesystem.testProject, 'bookit.yml')).to.deep.equal({
      // 'bookit.yml': config,
      book: {},
      img: {},
      src: {
        preface: {
          'preface.md': '\r\n\r\nReplace me with desired Preface content!\r\n\r\n',
        },
        foreword: {
          'foreword.md': '\r\n\r\nReplace me with desired Foreword content!\r\n\r\n',
        },
        introduction: {
          'introduction.md': '\r\n\r\nReplace me with desired Introduction content!\r\n\r\n',
        },
        chapter01: {
          'existing-file.md': 'I was already here. Do not delete me!',
        },
        glossary: {
          'glossary.md': '\r\n\r\nReplace me with desired Glossary content!\r\n\r\n',
        },
        appendix: {
          'appendix.md': '\r\n\r\nReplace me with desired Appendix content!\r\n\r\n',
        },
      },
    });
  });

  it('should only create sections that do not exist already', async () => {
    sinon.stub(inquirer, 'prompt')
      .onCall(0)
      .resolves({
        sections: [
          'Preface',
          'Foreword',
          'Introduction',
          'Glossary',
          'Appendix',
        ],
      })
      .onCall(1)
      .resolves({ overrideConfig: false });

    const bookStub = initBookStub();
    bookStub.filesystem.testProject = {
      'bookit.yml': config,
      'src': {
        foreword: {},
        introduction: {},
        chapter01: {
          'existing-file.md': 'I was already here. Do not delete me!',
        },
        glossary: {},
      },
    };

    await initialize({});

    // console.log(JSON.stringify(bookStub.filesystem.testProject, null, 2));
    expect(omit(bookStub.filesystem.testProject, 'bookit.yml')).to.deep.equal({
      // 'bookit.yml': config,
      book: {},
      img: {},
      src: {
        preface: {
          'preface.md': '\r\n\r\nReplace me with desired Preface content!\r\n\r\n',
        },
        foreword: {},
        introduction: {},
        chapter01: {
          'existing-file.md': 'I was already here. Do not delete me!',
        },
        glossary: {},
        appendix: {
          'appendix.md': '\r\n\r\nReplace me with desired Appendix content!\r\n\r\n',
        },
      },
    });
  });
});
