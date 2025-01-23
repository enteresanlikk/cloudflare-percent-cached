require('dotenv').config();
const csvtojson = require('csvtojson');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
const { Parser } = require('json2csv');

const CACHE_STATUSES = [
    {
        isIncludeCalculation: true,
        value: 'hit', // Served from cache
    },
    {
        isIncludeCalculation: true,
        value: 'none', // Not served from cache or origin. Response generated by Cloudflare.
    },
];

const DEFAULT_TIME_WINDOW = '24 hours';
const TIME_WINDOWS = {
    '30 minutes': () => {
        const sinceTime = new Date();
        sinceTime.setMinutes(sinceTime.getMinutes() - 30);
        return sinceTime;
    },
    '6 hours': () => {
        const sinceTime = new Date();
        sinceTime.setHours(sinceTime.getHours() - 6);
        return sinceTime;
    },
    '12 hours': () => {
        const sinceTime = new Date();
        sinceTime.setHours(sinceTime.getHours() - 12);
        return sinceTime;
    },
    '24 hours': () => {
        const sinceTime = new Date();
        sinceTime.setHours(sinceTime.getHours() - 24);
        return sinceTime;
    },
    '48 hours': () => {
        const sinceTime = new Date();
        sinceTime.setHours(sinceTime.getHours() - 48);
        return sinceTime;
    },
    '7 days': () => {
        const sinceTime = new Date();
        sinceTime.setDate(sinceTime.getDate() - 7);
        return sinceTime;
    },
    '14 days': () => {
        const sinceTime = new Date();
        sinceTime.setDate(sinceTime.getDate() - 14);
        return sinceTime;
    },
    '21 days': () => {
        const sinceTime = new Date();
        sinceTime.setDate(sinceTime.getDate() - 21);
        return sinceTime;
    },
    '30 days': () => {
        const sinceTime = new Date();
        sinceTime.setDate(sinceTime.getDate() - 30);
        return sinceTime;
    },
};

const getPercentCached = async ({ apiToken, zoneId, host, sinceTime, untilTime }) => {
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'query': `
                query GetCachePerHost(
                    $zoneTag: string
                    $host: string
                    $sinceTime: Time
                    $untilTime: Time
                ) {
                    viewer {
                        zones(filter: { zoneTag: $zoneTag }) {
                            httpRequestsAdaptiveGroups(
                                limit: 10000
                                filter: {
                                    AND: [
                                        { datetime_geq: $sinceTime, datetime_leq: $untilTime }
                                        { requestSource: "eyeball" }
                                        { clientRequestHTTPHost: $host }
                                    ]
                                }
                            ) {
                                dimensions {
                                    cacheStatus
                                }
                                count
                            }
                        }
                    }
                }
            `,
            'variables': {
                'zoneTag': zoneId,
                'host': host,
                'sinceTime': sinceTime,
                'untilTime': untilTime
            }
        }),
    });

    const responseData = await response.json();

    if (responseData.errors) {
        throw new Error(responseData.errors[0].message);
    }

    const data = responseData.data.viewer.zones[0].httpRequestsAdaptiveGroups;

    const includeCalculationStatuses = CACHE_STATUSES
        .filter(status => status.isIncludeCalculation)
        .map(status => status.value);

    const excludeCalculationStatuses = CACHE_STATUSES
        .filter(status => !status.isIncludeCalculation)
        .map(status => status.value);

    let totalRequests = 0;
    let cachedRequests = 0;

    for (const curr of data) {
        if (includeCalculationStatuses.includes(curr.dimensions.cacheStatus)) {
            cachedRequests += curr.count;
        }

        if (!excludeCalculationStatuses.includes(curr.dimensions.cacheStatus)) {
            totalRequests += curr.count;
        }
    }

    const percentCached = ((cachedRequests / totalRequests) * 100).toFixed(2) + '%';

    return {
        zoneId,
        host,
        sinceTime,
        untilTime,
        percentCached,
        totalRequests,
        cachedRequests,
    };
};

const saveToCSV = (data, outputFile) => {
    const parser = new Parser({
        fields: ['zoneId', 'host', 'sinceTime', 'untilTime', 'percentCached', 'totalRequests', 'cachedRequests'],
    });
    const csv = parser.parse(data);
    fs.writeFileSync(outputFile, csv);
    console.log(`Results saved to ${outputFile}`);
};

const run = async () => {
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

    const sinceTime = (TIME_WINDOWS[argv.timeWindow])();
    const untilTime = new Date();

    let results;
    if (argv.filePath) {
        const sites = await csvtojson().fromFile(argv.filePath);
        results = await Promise.all(sites.map(site => getPercentCached({
            apiToken: argv.apiToken,
            zoneId: site.zoneId,
            host: site.host,
            sinceTime: sinceTime.toISOString(),
            untilTime: untilTime.toISOString(),
        })));
    } else {
        const result = await getPercentCached({
            apiToken: argv.apiToken,
            zoneId: argv.zoneId,
            host: argv.host,
            sinceTime: sinceTime.toISOString(),
            untilTime: untilTime.toISOString(),
        });
        results = [result];
    }

    console.table(results);

    if (argv.outputFile) {
        saveToCSV(results, argv.outputFile);
    }
};

run().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
});
