# Cloudflare Percent Cached

A command-line tool to check the cache hit ratio for Cloudflare zones. It can analyze single domains or multiple domains using a CSV file.

## Features

- Check cache statistics for a single domain
- Analyze multiple domains using a CSV file
- Configurable time windows (30 minutes to 30 days)
- Custom date range support with ISO format dates
- Environment variable support for API token
- Detailed statistics including total requests and cached requests
- Export results to CSV file

## Installation

### Local Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/cloudflare-percent-cached.git
cd cloudflare-percent-cached

# Install dependencies
npm install

# Link the package globally
npm link
```

### Global Installation (when published)
```bash
npm install -g cloudflare-percent-cached
```

## Configuration

You can provide your Cloudflare API token in two ways:
1. As a command-line argument using `-a` or `--apiToken`
2. Through environment variables by creating a `.env` file:
```
CLOUDFLARE_API_TOKEN=your_api_token_here
```

## Usage

You can use either the full command `cloudflare-percent-cached` or the short alias `cfpc`.

### Single Domain Analysis
```bash
# Using predefined time window
cfpc -z="zone-id" -h="example.com" -t="24 hours"

# Using custom date range
cfpc -z="zone-id" -h="example.com" -s="2024-01-01T00:00:00Z" -u="2024-01-31T23:59:59Z"

# Using explicit API token
cfpc -a="api-token" -z="zone-id" -h="example.com" -t="24 hours"

# Save results to CSV file
cfpc -a="api-token" -z="zone-id" -h="example.com" -t="24 hours" -o="results.csv"
```

### Multiple Domains Analysis
Create a CSV file (e.g., `sites.csv`) with the following format:
```csv
zoneId,host
your-zone-id-1,example1.com
your-zone-id-2,example2.com
```

Then run:
```bash
# Using predefined time window
cfpc -a="api-token" -f="sites.csv" -t="24 hours"

# Using custom date range
cfpc -a="api-token" -f="sites.csv" -s="2024-01-01T00:00:00Z" -u="2024-01-31T23:59:59Z"

# Save results to CSV file
cfpc -a="api-token" -f="sites.csv" -t="24 hours" -o="results.csv"
```

### Command Line Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--apiToken` | `-a` | Cloudflare API token | `CLOUDFLARE_API_TOKEN` env variable |
| `--zoneId` | `-z` | Cloudflare Zone ID | - |
| `--host` | `-h` | Host to check | - |
| `--filePath` | `-f` | Path to CSV file containing sites | - |
| `--timeWindow` | `-t` | Time window for statistics | "24 hours" |
| `--since` | `-s` | Start date in ISO format | - |
| `--until` | `-u` | End date in ISO format | - |
| `--outputFile` | `-o` | Save results to CSV file | - |

Note: You can either use `--timeWindow` or the combination of `--since` and `--until`, but not both at the same time.

### Available Time Windows

- "30 minutes"
- "6 hours"
- "12 hours"
- "24 hours"
- "48 hours"
- "7 days"
- "14 days"
- "21 days"
- "30 days"

### Custom Date Range Format

When using custom date range with `-s` and `-u` options, dates should be in ISO format:
- Example start date: `2024-01-01T00:00:00Z`
- Example end date: `2024-01-31T23:59:59Z`

## Output

The tool outputs a table with the following information for each domain:
- Zone ID
- Host
- Time window (start and end time)
- Cache hit ratio percentage
- Total requests
- Cached requests

When using the `-o` option, these results will also be saved to a CSV file.
