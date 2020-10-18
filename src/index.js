#!/usr/bin/env node
import yargs from 'yargs';
import build from './commands/build';

yargs.command(build)
  .demandCommand()
  .help()
  .argv;
