import { expect } from 'chai';
import * as sinon from 'sinon';
import { formatLine, lintFile } from '../../../src/utils';

describe('Line Formatting', () => {
  beforeEach(() => {
    sinon.stub(process, 'cwd').returns('testProject');
  });
  afterEach(sinon.restore);
  const imgPath = 'testProject/img';
  const srcPath = 'testProject/src';
  const bookPath = 'testProject/book';
  const srcFileNameMap = {
    'preface.md': [
      {
        title: undefined,
        fileName: '8b7b8a0f-a14c-41b8-ac48-45ebe461bd92.md',
        filePath: 'testProject/book/8b7b8a0f-a14c-41b8-ac48-45ebe461bd92.md',
        srcFile: 'preface/preface.md',
        prev: false,
        next: '8fc14b25-33a0-48d3-b99f-35042aba0caa.md',
      },
    ],
    'foreword.md': [
      {
        title: undefined,
        fileName: '8fc14b25-33a0-48d3-b99f-35042aba0caa.md',
        filePath: 'testProject/book/8fc14b25-33a0-48d3-b99f-35042aba0caa.md',
        srcFile: 'foreword/foreword.md',
        prev: '8b7b8a0f-a14c-41b8-ac48-45ebe461bd92.md',
        next: 'c2b5996a-428d-4c36-b4e8-e02c3953ed44.md',
      },
    ],
    'page1.md': [
      {
        title: 'Introduction',
        fileName: 'c2b5996a-428d-4c36-b4e8-e02c3953ed44.md',
        filePath: 'testProject/book/c2b5996a-428d-4c36-b4e8-e02c3953ed44.md',
        srcFile: 'introduction/page1.md',
        prev: '8fc14b25-33a0-48d3-b99f-35042aba0caa.md',
        next: 'c227518b-3fc1-4afe-8c3e-27b6455617b3.md',
      },
    ],
    'page2.md': [
      {
        title: undefined,
        fileName: 'c227518b-3fc1-4afe-8c3e-27b6455617b3.md',
        filePath: 'testProject/book/c227518b-3fc1-4afe-8c3e-27b6455617b3.md',
        srcFile: 'introduction/page2.md',
        prev: 'c2b5996a-428d-4c36-b4e8-e02c3953ed44.md',
        next: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
      },
    ],
    '01-node.md': [
      {
        title: 'Install Node',
        fileName: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
        filePath: 'testProject/book/f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
        srcFile: 'chapter01/01-node.md',
        prev: 'c227518b-3fc1-4afe-8c3e-27b6455617b3.md',
        next: '972a9e51-d22a-484f-a1fa-8ac24288d282.md',
      },
    ],
    '02-ide.md': [
      {
        title: 'Setup Integrated Development Env',
        fileName: '972a9e51-d22a-484f-a1fa-8ac24288d282.md',
        filePath: 'testProject/book/972a9e51-d22a-484f-a1fa-8ac24288d282.md',
        srcFile: 'chapter01/02-ide.md',
        prev: 'f377f770-261c-4d5a-b752-0a94f18ff0b8.md',
        next: '64e4bf19-55fc-4d4e-95b7-670235d8b16c.md',
      },
    ],
    'glossy1.md': [
      {
        title: 'Glossary',
        fileName: '64e4bf19-55fc-4d4e-95b7-670235d8b16c.md',
        filePath: 'testProject/book/64e4bf19-55fc-4d4e-95b7-670235d8b16c.md',
        srcFile: 'glossary/glossy1.md',
        prev: '972a9e51-d22a-484f-a1fa-8ac24288d282.md',
        next: 'c405743d-1526-432b-9a8b-139ce2c928c9.md',
      },
    ],
    'glossy2.md': [
      {
        title: undefined,
        fileName: 'c405743d-1526-432b-9a8b-139ce2c928c9.md',
        filePath: 'testProject/book/c405743d-1526-432b-9a8b-139ce2c928c9.md',
        srcFile: 'glossary/glossy2.md',
        prev: '64e4bf19-55fc-4d4e-95b7-670235d8b16c.md',
        next: '40cb2ae8-8d99-49e9-9fdc-8d60e6862548.md',
      },
    ],
    'appendix.md': [
      {
        title: 'Appendix',
        fileName: '40cb2ae8-8d99-49e9-9fdc-8d60e6862548.md',
        filePath: 'testProject/book/40cb2ae8-8d99-49e9-9fdc-8d60e6862548.md',
        srcFile: 'appendix/appendix.md',
        prev: 'c405743d-1526-432b-9a8b-139ce2c928c9.md',
        next: false,
      },
    ],
  };
  it('formatLine should replace file link', () => {
    const line = [
      'ext img ln no title ![](https://github.com/something?query=param)',
      'relative book path [here](../chapter01/02-ide.md)',
    ].join(' ');

    const fmt = formatLine(line, {
      srcFileNameMap, srcPath, imgPath, bookPath,
    });

    expect(fmt).to.equal([
      'ext img ln no title ![](https://github.com/something?query=param)',
      'relative book path [here](./972a9e51-d22a-484f-a1fa-8ac24288d282.md)',
    ].join(' '));
  });
  it('formatLine should replace img link', () => {
    const line = [
      'ext img ln no title ![](https://github.com/something?query=param)',
      'relative img path [here](../assets/img/linux/tux.md)',
    ].join(' ');

    const fmt = formatLine(line, {
      srcFileNameMap,
      srcPath: 'testProject/sources',
      imgPath: 'testProject/assets/img',
      bookPath: 'testProject/dist/handbook',
    });

    expect(fmt).to.equal([
      'ext img ln no title ![](https://github.com/something?query=param)',
      'relative img path [here](../../assets/img/linux/tux.md)',
    ].join(' '));
  });
  it('formatLine should replace book uuid link', () => {
    const line = [
      'ext img ln no title ![](https://github.com/something?query=param)',
      'relative img path [here](../../book/8b7b8a0f-a14c-41b8-ac48-45ebe461bd92.md)',
    ].join(' ');

    const fmt = formatLine(line, {
      srcFileNameMap, srcPath, imgPath, bookPath,
    });

    expect(fmt).to.equal([
      'ext img ln no title ![](https://github.com/something?query=param)',
      'relative img path [here](./8b7b8a0f-a14c-41b8-ac48-45ebe461bd92.md)',
    ].join(' '));
  });
  it('lintFile should replace file links with relative path to book uuid file', () => {
    const content = [
      'ext img ln no title ![](https://github.com/something?query=param)',
      'relative book path [here](../chapter01/02-ide.md)',
      'relative book path2 [here](../introduction/page2.md)',
    ].join('\r\n');

    const fmt = lintFile(content, {
      srcFileNameMap, srcFilePath: `${srcPath}/chapter01/01-something.md`, bookPath,
    });

    expect(fmt.split('\r\n')).to.deep.equal([
      'ext img ln no title ![](https://github.com/something?query=param)',
      'relative book path [here](../../book/972a9e51-d22a-484f-a1fa-8ac24288d282.md)',
      'relative book path2 [here](../../book/c227518b-3fc1-4afe-8c3e-27b6455617b3.md)',
    ]);
  });
});
