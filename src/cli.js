const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { TIME_WINDOWS, DEFAULT_TIME_WINDOW } = require('./constants');

const parseArguments = () => {
    return yargs(hideBin(process.argv))
        .option('a', {
            alias: 'apiToken',
            describe: 'Cloudflare API token',
            type: 'string',
            default: process.env.CLOUDFLARE_API_TOKEN
        })
        .option('z', {
            alias: 'zoneId',
            describe: 'Cloudflare Zone ID',
            type: 'string'
        })
        .option('h', {
            alias: 'host',
            describe: 'Host to check',
            type: 'string'
        })
        .option('f', {
            alias: 'filePath',
            describe: 'Path to CSV file containing sites',
            type: 'string'
        })
        .option('t', {
            alias: 'timeWindow',
            describe: 'Time window for statistics',
            type: 'string',
            choices: Object.keys(TIME_WINDOWS),
            default: DEFAULT_TIME_WINDOW
        })
        .option('o', {
            alias: 'outputFile',
            describe: 'Save results to CSV file',
            type: 'string'
        })
        .check((argv) => {
            if (!argv.apiToken) {
                throw new Error('API token is required. Provide it via -a option or CLOUDFLARE_API_TOKEN environment variable.');
            }
            if (!argv.filePath && (!argv.zoneId || !argv.host)) {
                throw new Error('Either provide a file path (-f) or both zone ID (-z) and host (-h)');
            }
            return true;
        })
        .argv;
};

module.exports = {
    parseArguments,
};
