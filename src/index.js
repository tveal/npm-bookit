#!/usr/bin/env node
import yargs from 'yargs';
import build from './commands/build';
import init from './commands/init';

yargs.command(build)
  .command(init)
  .demandCommand()
  .help()
  .argv;
