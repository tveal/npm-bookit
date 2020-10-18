import DEBUG from 'debug';
import { log } from '../utils';
import { FileConnector } from '../connector';

export default {
  command: 'build',
  describe: 'create a book of linked markdown files with constant filenames',
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

    try {
      await new FileConnector().buildBook();
      log.info('Book built successfully!');
    } catch (e) {
      log.error(e);
      process.exit(-1);
    }
  },
};
