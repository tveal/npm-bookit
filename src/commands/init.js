import { log, setLogLevel, initialize } from '../utils';

export default {
  command: 'init',
  describe: 'setup new book project',
  builder: {
    custom: {
      alias: 'c',
      type: 'boolean',
      describe: 'specify different book base-directories',
    },
    debug: {
      alias: 'd',
      type: 'boolean',
      describe: 'all logs',
    },
    info: {
      alias: 'i',
      type: 'boolean',
      describe: 'info + error logs',
    },
    quiet: {
      alias: 'q',
      type: 'boolean',
      describe: 'suppress logging',
    },
  },
  handler: async (argv) => {
    setLogLevel(argv);

    try {
      await initialize(argv);

      log.info('Initialized book successfully!');
    } catch (e) {
      log.error(e);
      process.exit(-1);
    }
  },
};
