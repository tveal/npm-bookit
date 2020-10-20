import { log, setLogLevel } from '../utils';
import { FileConnector } from '../connector';

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
      await new FileConnector().buildBook();
      log.info('Book built successfully!');
    } catch (e) {
      log.error(e);
      process.exit(-1);
    }
  },
};
