#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { init } from './commands/init.js';
import { showVersion } from './commands/version.js';

const program = new Command();

program
  .name('neev')
  .description('NeevJS CLI — build business apps, not frontend chaos.')
  .version('0.1.0-beta');

program
  .command('init')
  .description('Initialize a new NeevJS project')
  .argument('[name]', 'Project name')
  .action((name) => init(name));

program
  .command('version')
  .description('Show NeevJS version')
  .action(() => showVersion());

program.parse();
