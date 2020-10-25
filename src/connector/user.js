import { prompt } from 'inquirer';

export const getInitConfigFromUser = (argv) => {
  const { custom } = argv;
  const questions = [];

  if (custom) {
    questions.push(...directoryQuestions);
  }

  questions.push({
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
  });

  return prompt(questions);
};

export const getConfigOverrideConfirmationFromUser = (argv) => {
  const { custom } = argv;

  const questions = [{
    name: 'overrideConfig',
    type: 'confirm',
    message: 'WARNING: bookit yaml config already exists; override?',
    default: false,
  }];

  return custom
    ? prompt(questions)
    : { overrideConfig: false };
};

export const directoryQuestions = [
  {
    name: 'bookSrc',
    type: 'input',
    message: 'Enter the book source folder, relative to this directory:',
    validate(value) {
      if (value.length) {
        return true;
      }
      return 'Please provide the book src folder.';
    },
  },
  {
    name: 'bookDst',
    type: 'input',
    message: 'Enter the book destination folder, relative to this directory:',
    validate(value) {
      if (value.length) {
        return true;
      }
      return 'Please provide the book dst folder.';
    },
  },
  {
    name: 'imgDir',
    type: 'input',
    message: 'Enter the image folder, relative to this directory:',
    validate(value) {
      if (value.length) {
        return true;
      }
      return 'Please provide the book img folder.';
    },
  },
];
