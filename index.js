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

    var host = (connectMethod.ssh) ? '127.0.0.1' : connectMethod.host;

    var connectionDetails = [
      "--host=" + host,
      "--user=" + connectMethod.user,
      "--password=" + connectMethod.password
    ];

    // Add a port, if set
    if (connectMethod.port) {
      connectionDetails.push("--port=" + connectMethod.port);
    }

    return connectionDetails.join(' ') + ' ' + connectMethod.database;
  },

  runOperation: function(command) {
    var child = exec(command,
      function(error, stdout, stderr) {
        if (error) {
          console.log(chalk.red.underline('Error:') + " The operation failed:");
          console.log(chalk.red(error));
          return;
        }
        else {
          return console.log("The " + chalk.yellow(program.args[1]) + " operation was " + chalk.cyan('successful!'));
        }
      }
    );
  },

  createSshTunnel: function (environment) {
    if (!project[environment]['ssh']) return;
    console.log(chalk.green('Creating a secure tunnel to database…'));
    var command = 'ssh -f ' + project[environment]['user'] + '@' + project[environment]['host'] + ' -L 3307:' + project[environment]['host'] + ':3306 -N';
    operations.runOperation(command);
  },

  getMysqlConnect: function(environment) {
    var connectMethod = project[environment];
    return {
      mysql: (connectMethod.useMamp) ? '/Applications/MAMP/Library/bin/mysql ' : 'mysql ',
      mysqldump: (connectMethod.useMamp) ? '/Applications/MAMP/Library/bin/mysqldump ' : 'mysqldump ',
    };
  },

  dumpFromEnvironment: function (environment) {
    console.log(chalk.cyan('Dumping contents of ' + chalk.cyan.underline(environment) + ' database.'));
    var command = operations.getMysqlConnect(environment)['mysqldump'] + '> ' + project.seedDbPath + ' ' + operations.connect(environment);
    operations.runOperation(command);
  },

  pushToEnvironment: function (environment) {
    console.log(chalk.cyan('Pushing file at ' + project['seedDbPath'] + ' to ' + chalk.cyan.underline(environment) + ' database.'));
    var command = operations.getMysqlConnect(environment)['mysql'] + ' ' + operations.connect(environment) + ' < ' + project.seedDbPath;
    operations.runOperation(command);
  },


  // Exposed to command line utility

  up: function() {
    operations.createSshTunnel('staging');
    operations.pushToEnvironment('staging');
  },

  down: function() {
    operations.createSshTunnel('staging');
    operations.dumpFromEnvironment('staging');
  },

  seed: function() {
    var command = operations.getMysqlConnect('local')['mysql'] + operations.connect('local') + ' < ' + project.seedDbPath;
    operations.runOperation(command);
  },

  dump: function() {
    operations.dumpFromEnvironment('local');
  },
};

// Proceed based on passed direction
console.log('Running ' + chalk.cyan(program.args[1]));
operations[program.args[1]]();