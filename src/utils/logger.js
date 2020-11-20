import DEBUG from 'debug';

/* eslint-disable import/prefer-default-export */
export const createLogger = (app) => {
  const log = {};
  ['error', 'info', 'debug'].forEach((level) => {
    let loggerPrefix = level;
    if (app) {
      loggerPrefix = `${level}:${app}`;
    }
    log[level] = DEBUG(loggerPrefix);
    // log[level].log = console.log.bind(console); // send to stdout instead of stderr
  });
  return log;
};

export const log = createLogger();

export const setLogLevel = (argv) => {
  const { info, quiet, debug } = argv;
  let level = 'error*';
  if (debug) {
    level = '*';
  } else if (info) {
    level = 'info*,error*';
  } else if (quiet) {
    level = '';
  }
  DEBUG.enable(level);
};
