import { log, setLogLevel } from '../utils';
import { Bookit } from '../bookit';

export default {
  command: 'build',
  describe: 'build bookmark-able living book (constant urls)',
  builder: {
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
      await new Bookit().buildBook();
      log.info('Book built successfully!');
    } catch (e) {
      log.error(e);
      process.exit(-1);
    }
  },
};
