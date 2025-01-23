const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
    TIME_WINDOWS,
    DEFAULT_TIME_WINDOW,
    DEFAULT_INCLUDE_CACHE_STATUSES,
    DEFAULT_EXCLUDE_CACHE_STATUSES,
} = require('./constants');

const parseArguments = () => {
    const argv = yargs(hideBin(process.argv))
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
            conflicts: ['since', 'until']
        })
        .option('s', {
            alias: 'since',
            describe: 'Start date in ISO format (e.g., 2024-01-01T00:00:00Z)',
            type: 'string',
            implies: 'until'
        })
        .option('u', {
            alias: 'until',
            describe: 'End date in ISO format (e.g., 2024-01-31T23:59:59Z)',
            type: 'string',
            implies: 'since'
        })
        .option('o', {
            alias: 'outputFile',
            describe: 'Save results to CSV file',
            type: 'string'
        })
        .option('i', {
            alias: 'includeStatuses',
            describe: 'Cache statuses to include in calculation (comma-separated)',
            type: 'string',
            default: DEFAULT_INCLUDE_CACHE_STATUSES.join(',')
        })
        .option('e', {
            alias: 'excludeStatuses',
            describe: 'Cache statuses to exclude from total requests (comma-separated)',
            type: 'string',
            default: DEFAULT_EXCLUDE_CACHE_STATUSES.join(',')
        })
        .check((argv) => {
            if (!argv.apiToken) {
                throw new Error('API token is required. Provide it via -a option or CLOUDFLARE_API_TOKEN environment variable.');
            }
            if (!argv.filePath && (!argv.zoneId || !argv.host)) {
                throw new Error('Either provide a file path (-f) or both zone ID (-z) and host (-h)');
            }
            if (argv.since && argv.until) {
                let sinceDate;
                try {
                    sinceDate = new Date(argv.since);
                } catch (error) {
                    throw new Error('Invalid since date format. Use ISO format (e.g., 2024-01-01T00:00:00Z)');
                }

                let untilDate;
                try {
                    untilDate = new Date(argv.until);
                } catch (error) {
                    throw new Error('Invalid until date format. Use ISO format (e.g., 2024-01-01T00:00:00Z)');
                }

                if (sinceDate >= untilDate) {
                    throw new Error('Start date must be before end date');
                }
            }
            if (!argv.timeWindow && !argv.since && !argv.until) {
                argv.timeWindow = DEFAULT_TIME_WINDOW;
            }

            // Parse cache statuses
            argv.includeStatuses = argv.includeStatuses.split(',').map(s => s.trim());
            argv.excludeStatuses = argv.excludeStatuses.split(',').map(s => s.trim());

            return true;
        })
        .argv;

    return argv;
};

module.exports = {
    parseArguments,
};
