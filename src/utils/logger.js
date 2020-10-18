import debug from 'debug';

/* eslint-disable import/prefer-default-export */
export const createLogger = (app) => {
  const log = {};
  ['error', 'info', 'debug'].forEach((level) => {
    let loggerPrefix = level;
    if (app) {
      loggerPrefix = `${level}:${app}`;
    }
    log[level] = debug(loggerPrefix);
    // log[level].log = console.log.bind(console); // send to stdout instead of stderr
  });
  return log;
};

export const log = createLogger();
