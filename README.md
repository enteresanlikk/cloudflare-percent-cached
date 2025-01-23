# Cloudflare Percent Cached

A command-line tool to check the cache hit ratio for Cloudflare zones. It can analyze single domains or multiple domains using a CSV file.

## Features

- Check cache statistics for a single domain
- Analyze multiple domains using a CSV file
- Configurable time windows (30 minutes to 30 days)
- Environment variable support for API token
- Detailed statistics including total requests and cached requests

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Configuration

You can provide your Cloudflare API token in two ways:
1. As a command-line argument using `-a` or `--apiToken`
2. Through environment variables by creating a `.env` file:
```
CLOUDFLARE_API_TOKEN=your_api_token_here
```

## Usage

### Single Domain Analysis
```bash
# Using environment variable for API token
node percent-cached.js -z="zone-id" -h="example.com" -t="24 hours"

# Using explicit API token
node percent-cached.js -a="api-token" -z="zone-id" -h="example.com" -t="24 hours"
```

### Multiple Domains Analysis
Create a CSV file (e.g., `sites.csv`) with the following format:
```csv
zoneId,host
1234567890,www.google.com
1234567890,www.facebook.com
```

Then run:
```bash
node percent-cached.js -a="api-token" -f="sites.csv" -t="24 hours"
```

### Command Line Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--apiToken` | `-a` | Cloudflare API token | `CLOUDFLARE_API_TOKEN` env variable |
| `--zoneId` | `-z` | Cloudflare Zone ID | - |
| `--host` | `-h` | Host to check | - |
| `--filePath` | `-f` | Path to CSV file containing sites | - |
| `--timeWindow` | `-t` | Time window for statistics | "24 hours" |

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

## Output

The tool outputs a table with the following information for each domain:
- Zone ID
- Host
- Time window (start and end time)
- Cache hit ratio percentage
- Total requests
- Cached requests
