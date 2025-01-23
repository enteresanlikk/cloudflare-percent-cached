const {
    DEFAULT_INCLUDE_CACHE_STATUSES,
    DEFAULT_EXCLUDE_CACHE_STATUSES,
} = require('./constants');

const getPercentCached = async ({ 
    apiToken, 
    zoneId, 
    host, 
    sinceTime, 
    untilTime,
    includeStatuses = DEFAULT_INCLUDE_CACHE_STATUSES,
    excludeStatuses = DEFAULT_EXCLUDE_CACHE_STATUSES
}) => {
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

    let totalRequests = 0;
    let cachedRequests = 0;

    if (includeStatuses) {
        excludeStatuses = excludeStatuses.filter(status => !includeStatuses.includes(status));
    }

    if (excludeStatuses) {
        includeStatuses = includeStatuses.filter(status => !excludeStatuses.includes(status));
    }

    for (const curr of data) {
        if (includeStatuses.includes(curr.dimensions.cacheStatus)) {
            cachedRequests += curr.count;
        }

        if (!excludeStatuses.includes(curr.dimensions.cacheStatus)) {
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
        totalRequests: Number(totalRequests),
        cachedRequests: Number(cachedRequests),
    };
};

module.exports = {
    getPercentCached,
};
