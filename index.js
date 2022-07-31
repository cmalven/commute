#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { execSync } from 'child_process';
import merge from 'deepmerge';

const options = {
  operations: [
    'down',
    'dump',
  ],
};

program
  .version('0.0.1')
  .usage('<project> <operation>')
  .parse(process.argv);

// Show "Help" if no arguments
if (!program.args.length) {
  program.help();
  process.exit();
}

// Pull out command line arguments
const [argProject, argCommand] = program.args;

// Reference to the main config file and project
let file;
let project;

// Store the current time
const currentdate = new Date();
const time = currentdate.getFullYear() + '-'
  + (currentdate.getMonth()+1) + '-'
  + currentdate.getDate() + '-'
  + currentdate.getHours() + '-'
  + currentdate.getMinutes() + '-'
  + currentdate.getSeconds();

// Read projects file
try {
  file = yaml.load(fs.readFileSync(process.env['HOME'] + '/.commute.yml', 'utf8'));
} catch (error) {
  console.log(chalk.red.underline('Error:') + " Couldn't find a " + chalk.cyan('.commute.yml') + ' file in ' + chalk.yellow(process.env['HOME']));
  process.exit();
}

// Try to find passed project within file
try {
  project = Object.entries(file).find(entry => entry[0] === argProject)[1];
} catch (error) {
  console.log(chalk.red.underline('Error:') + " Couldn't find a project in .commute.yml " + chalk.cyan('projects.json') + ' called ' + chalk.yellow(argProject));
  process.exit();
}

// Stop if the second argument isn't valid
if (options.operations.includes(argCommand < 0)) {
  const availableOptions = options.operations.join(', ');
  console.log(chalk.red.underline('Error:') + ' The operation must be one of ' + chalk.cyan(availableOptions));
  process.exit();
}

const operations = {
  getSqlConnect: function(environment, mysqlArgs = []) {
    const connectMethod = this.getConnectMethod(project, environment);

    const host = connectMethod.secure ? '127.0.0.1' : connectMethod.host || '127.0.0.1';
    const user = connectMethod.db.u || 'root';
    const pass = connectMethod.db.p || null;

    const connectionDetails = [
      '--host=' + host,
      '--user=' + user,
    ];

    // Apply password
    if (pass) {
      connectionDetails.push('--password=' + pass);
    }

    // Add a port, if set
    if (connectMethod.secure) {
      connectionDetails.push('--port=3306');
    }

    return connectionDetails.concat(mysqlArgs).join(' ') + ' ' + connectMethod.db.name;
  },

  runOperation: function(command, commandName) {
    execSync(command,
      function(error) {
        if (error) {
          console.log(chalk.red.underline('Error:') + ' The operation failed:');
          console.log(chalk.red(error));

        } else {
          return console.log('The ' + chalk.yellow(commandName) + ' operation was ' + chalk.cyan('successful!'));
        }
      },
    );
  },

  getConnectMethod: function(project, environment) {
    const connectMethod = project[environment];
    let source = {};

    // Bail out if we can't find the desired environment
    if (!connectMethod) {
      console.log(chalk.red(`We couldn't find the environment ${environment} for the project ${project}`));
      process.exit();
    }

    // If the environment has a `source`, we want it
    if (connectMethod.source) {
      // No sources found
      if (!file.sources) {
        console.log(chalk.red(`The environment ${environment} for the project ${project} references a source, but there are no "sources" defined in .commute.yml`));
        process.exit();
      }

      // Try to find the source
      source = file.sources[connectMethod.source];

      // The referenced source is missing
      if (!file.sources) {
        console.log(chalk.red(`The environment ${environment} for the project ${project} references a source ${connectMethod.source} that doesn't exist in your "sources" in .commute.yml`));
        process.exit();
      }
    }

    return merge(source, connectMethod);
  },

  getSsh: function(environment) {
    const connectMethod = this.getConnectMethod(project, environment);
    return `ssh ${connectMethod.u}@${connectMethod.host}`;
  },

  getSqlCommand: function(command, environment) {
    const connectMethod = this.getConnectMethod(project, environment);
    if (connectMethod.secure) {
      return `${operations.getSsh(environment)} "${command}"`;
    } else {
      return command;
    }
  },

  dumpFromEnvironment: function(environment) {
    console.log(chalk.cyan('Dumping contents of ' + chalk.cyan.underline(environment) + ' database.'));
    let command = operations.getSqlCommand(
      `mysqldump ${operations.getSqlConnect(environment, ['--no-tablespaces'])} | gzip -9`,
      environment,
    );
    command += ` > ~/Downloads/${this.getDbFilename(environment)}.sql.gz`;
    operations.runOperation(command, 'dump');
  },

  getDbFilename: function(environment) {
    const connectMethod = this.getConnectMethod(project, environment);
    return `${connectMethod.db.name}-${time}`;
  },

  expandArchive: function() {
    console.log(chalk.cyan('Expanding dumped database archive.'));
    const command = `gunzip ~/Downloads/${this.getDbFilename('remote')}.sql.gz`;
    operations.runOperation(command, 'expand');
  },

  seed: function() {
    console.log(chalk.cyan('Seeding contents of ' + chalk.cyan.underline('local') + ' database.'));
    let command = operations.getSqlCommand(
      `mysql ${operations.getSqlConnect('local')}`,
      'local',
    );
    command += ` < ~/Downloads/${this.getDbFilename('remote')}.sql`;
    operations.runOperation(command, 'seed');
  },

  // Exposed to command line utility

  down: function() {
    operations.dumpFromEnvironment('remote');
    operations.expandArchive();
    operations.seed();
  },

  dump: function() {
    operations.dumpFromEnvironment('remote');
  },
};

// Proceed based on passed direction
console.log('Running ' + chalk.cyan(argCommand));
operations[argCommand]();