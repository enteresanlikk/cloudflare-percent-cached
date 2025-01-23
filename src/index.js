require('dotenv').config();
const { getTimeRange } = require('./constants');
const { getPercentCached } = require('./cloudflare');
const { readSitesFromCSV, saveToCSV } = require('./csv-utils');
const { parseArguments } = require('./cli');

const run = async () => {
    const argv = parseArguments();
    const { sinceTime, untilTime } = getTimeRange({
        timeWindow: argv.timeWindow,
        since: argv.since,
        until: argv.until
    });

    let results;
    if (argv.filePath) {
        const sites = await readSitesFromCSV(argv.filePath);
        results = await Promise.all(sites.map(site => getPercentCached({
            apiToken: argv.apiToken,
            zoneId: site.zoneId,
            host: site.host,
            sinceTime: sinceTime.toISOString(),
            untilTime: untilTime.toISOString(),
            includeStatuses: argv.includeStatuses,
            excludeStatuses: argv.excludeStatuses,
        })));
    } else {
        const result = await getPercentCached({
            apiToken: argv.apiToken,
            zoneId: argv.zoneId,
            host: argv.host,
            sinceTime: sinceTime.toISOString(),
            untilTime: untilTime.toISOString(),
            includeStatuses: argv.includeStatuses,
            excludeStatuses: argv.excludeStatuses,
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
