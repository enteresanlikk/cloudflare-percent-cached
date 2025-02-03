const fs = require('fs');
const csvtojson = require('csvtojson');
const { Parser } = require('json2csv');

const readSitesFromCSV = async (filePath) => {
    return await csvtojson().fromFile(filePath);
};

const saveToCSV = (data, outputFile) => {
    const parser = new Parser({
        fields: [
            'zoneId',
            'host',
            'sinceTime',
            'untilTime',
            'percentCached',
            'percentNoneCached',
            'totalRequests',
            'cachedRequests',
            'noneCachedRequests'
        ],
        transforms: [
            (item) => ({
                ...item,
                totalRequests: Number(item.totalRequests),
                cachedRequests: Number(item.cachedRequests),
                noneCachedRequests: Number(item.noneCachedRequests)
            })
        ]
    });
    const csv = parser.parse(data);
    fs.writeFileSync(outputFile, csv);
    console.log(`Results saved to ${outputFile}`);
};

module.exports = {
    readSitesFromCSV,
    saveToCSV,
};
