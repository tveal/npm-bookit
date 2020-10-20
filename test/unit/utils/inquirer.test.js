import { expect } from 'chai';
import * as sinon from 'sinon';
import inquirer from 'inquirer';
import { getInitConfigFromUser, directoryQuestions } from '../../../src/utils';

describe('getInitConfigFromUser', () => {
  let promptStub;
  beforeEach(() => {
    promptStub = sinon.stub(inquirer, 'prompt');
  });

  afterEach(sinon.restore);

  it('should prompt for book sections only, if not custom', () => {
    getInitConfigFromUser({});

    expect(promptStub).to.have.been.calledOnceWith([
      {
        name: 'sections',
        type: 'checkbox',
        message: '(Optional) Select additional book sections:',
        choices: [
          'Preface',
          'Foreword',
          'Introduction',
          'Glossary',
          'Appendix',
        ],
      },
    ]);
  });
  it('should prompt for custom book directories and book sections', () => {
    getInitConfigFromUser({ custom: true });

    expect(promptStub).to.have.been.calledOnceWith([
      ...directoryQuestions,
      {
        name: 'sections',
        type: 'checkbox',
        message: '(Optional) Select additional book sections:',
        choices: [
          'Preface',
          'Foreword',
          'Introduction',
          'Glossary',
          'Appendix',
        ],
      },
    ]);
  });
  it('should validate custom book src input', () => {
    expect(directoryQuestions[0].validate('')).to.equal('Please provide the book src folder.');
    expect(directoryQuestions[0].validate('src')).to.be.true;
  });
  it('should validate custom book dst input', () => {
    expect(directoryQuestions[1].validate('')).to.equal('Please provide the book dst folder.');
    expect(directoryQuestions[1].validate('book')).to.be.true;
  });
  it('should validate custom book img input', () => {
    expect(directoryQuestions[2].validate('')).to.equal('Please provide the book img folder.');
    expect(directoryQuestions[2].validate('img')).to.be.true;
  });
});
