#!/usr/bin/env node

var program = require('commander');
var fs      = require('fs');
var _       = require('lodash');
var chalk   = require('chalk');
var exec    = require('child_process').exec;

var options = {
  operations: [
    'up',
    'down',
    'seed',
    'dump'
  ]
};

program
  .version('0.0.1')
  .usage('<project> <operation>')
  .parse(process.argv);

// Show "Help" if no arguments
if (!program.args.length) {
  return program.help();
}

// Read projects file
try {
  var projectsFile = fs.readFileSync(process.env['HOME'] + '/commute/projects.json', 'utf8');
}
catch (error) {
  console.log('error', error);
  return console.log(chalk.red.underline('Error:') + " Couldn't find a " + chalk.cyan('projects.json') + " file in " + chalk.yellow('~/commute/') );
}

// Try to find passed project within file
var project = _.findWhere(JSON.parse(projectsFile), { name: program.args[0] });
if (!project) {
  return console.log(chalk.red.underline('Error:') + " Couldn't find a project in " + chalk.cyan('projects.json') + " called " + chalk.yellow(program.args[0]) );
}

// Stop if the second argument isn't valid
if (!_.contains(options.operations, program.args[1])) {
  var availableOptions = options.operations.join(', ');
  return  console.log(chalk.red.underline('Error:') + " The operation must be one of " + chalk.cyan(availableOptions) );
}

var operations = {
  connect: function(environment) {
    var connectMethod = project[environment];

    return [
      "--host=" + connectMethod.host,
      "--user=" + connectMethod.user,
      "--password=" + connectMethod.password,
      connectMethod.database
    ].join(' ');
  },

  runOperation: function(command) {
    var child = exec(command,
      function(error, stdout, stderr) {
        if (error) {
          return console.log(chalk.red.underline('Error:') + " The operation failed.");
        }
        else {
          return console.log("The " + chalk.yellow(program.args[1]) + " operation was " + chalk.cyan('successful!'));
        }
      }
    );
  },

  getMysqlConnect: function(environment) {
    var connectMethod = project[environment];
    return {
      mysql: (connectMethod.useMamp) ? '/Applications/MAMP/Library/bin/mysql ' : 'mysql ',
      mysqldump: (connectMethod.useMamp) ? '/Applications/MAMP/Library/bin/mysqldump ' : 'mysqldump ',
    };
  },

  up: function() {
    console.log("The " + chalk.cyan('up') + " command hasn't been implemented yet");
  },

  down: function() {
    console.log("The " + chalk.cyan('down') + " command hasn't been implemented yet");
  },

  seed: function() {
    var command = operations.getMysqlConnect('local')['mysql'] + operations.connect('local') + ' < ' + project.seedDbPath;
    operations.runOperation(command);
  },

  dump: function() {
    var command = operations.getMysqlConnect('local')['mysqldump'] + ' > ' + project.seedDbPath + ' ' + operations.connect('local') ;
    operations.runOperation(command);
  },
};

// Proceed based on passed direction
console.log('Running ' + chalk.cyan(program.args[1]));
operations[program.args[1]]();