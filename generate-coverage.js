const fs = require('fs').promises;
const path = require('path');
const v8toIstanbul = require('v8-to-istanbul');
const reports = require('istanbul-reports');
const { createContext } = require('istanbul-lib-report');
const { createCoverageMap } = require('istanbul-lib-coverage');
const https = require('https');

const coverageDir = path.join(process.cwd(), 'coverage/temp'); // Playwright v8 coverage
const istanbulCoverageDir = path.join(process.cwd(), 'coverage/frontend'); // Final report output
const TARGET_URL_SUFFIX = '/js/Benjamin.js';
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1460000406850506752/yUykevcvMmpQzqNFHTIH8HatoYNo7FQsyg-_uLk41WgY3PBpUES92za8MWxauD7My3T7';

/**
 * Send coverage report to Discord webhook
 */
async function sendToDiscord(summary, belowThreshold) {
  const color = belowThreshold.length > 0 ? 15158332 : 3066993; // Red if failed, green if passed
  const title = belowThreshold.length > 0 ? 'Frontend Coverage Report - FAILED' : 'Frontend Coverage Report - PASSED';
  
  const fields = [
    { name: 'Lines', value: `${summary.lines.pct}%`, inline: true },
    { name: 'Statements', value: `${summary.statements.pct}%`, inline: true },
    { name: 'Functions', value: `${summary.functions.pct}%`, inline: true },
    { name: 'Branches', value: `${summary.branches.pct}%`, inline: true }
  ];

  if (belowThreshold.length > 0) {
    fields.push({
      name: '⚠️ Below Threshold',
      value: belowThreshold.join('\n'),
      inline: false
    });
  }

  const payload = JSON.stringify({
    embeds: [{
      title,
      color,
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: 'Frontend Coverage Report' }
    }]
  });

  return new Promise((resolve, reject) => {
    const url = new URL(DISCORD_WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✓ Coverage report sent to Discord');
        resolve();
      } else {
        console.error(`Failed to send to Discord: ${res.statusCode}`);
        reject(new Error(`Discord webhook failed with status ${res.statusCode}`));
      }
    });

    req.on('error', (error) => {
      console.error('Error sending to Discord:', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
} //end of discord webhook function


async function convertCoverage() {
  // Exit if no coverage data exists
  try {
    await fs.access(coverageDir);
  } catch {
    console.log('No coverage data found.');
    return;
  }

  const coverageMap = createCoverageMap();
  const files = await fs.readdir(coverageDir);

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const v8Coverage = JSON.parse(await fs.readFile(path.join(coverageDir, file), 'utf-8'));

    for (const entry of v8Coverage) {
      if (!entry.url || !entry.source) continue;

      // Skip non-JS files, node_modules, or external URLs (except localhost)
      let pathname;
      try {
        pathname = entry.url.startsWith('http') || entry.url.startsWith('file://')
          ? new URL(entry.url).pathname
          : entry.url;
      } catch {
        pathname = entry.url;
      }

      if (!pathname.endsWith('.js') ||
          (entry.url.startsWith('http') && !entry.url.includes('localhost')) ||
          entry.url.includes('node_modules') ||
          !pathname.includes(TARGET_URL_SUFFIX)) {
        console.warn(`Skipping file: ${entry.url}`);
        continue;
      }

      // Handle Windows file paths
      const filePath = entry.url.startsWith('file://')
        ? pathname.replace(/^\/([a-zA-Z]:)/, '$1') // /C:/path -> C:/path
        : pathname;

      try {
        const converter = v8toIstanbul("public/" + filePath, 0, { source: entry.source });
        await converter.load();
        converter.applyCoverage(entry.functions);
        coverageMap.merge(converter.toIstanbul());
      } catch (err) {
        console.warn(`Skipping coverage for ${entry.url}: ${err.message}`);
      }
    }
  }

  if (!Object.keys(coverageMap.data).length) {
    console.log('No coverage data was converted.');
    return;
  }

  // Ensure output directory exists
  try {
    await fs.access(istanbulCoverageDir);
  } catch {
    await fs.mkdir(istanbulCoverageDir, { recursive: true });
  }

  // Generate HTML and lcov reports
  const context = createContext({ dir: istanbulCoverageDir, coverageMap });
  ['html', 'lcovonly'].forEach(type => reports.create(type).execute(context));

  // Retrieve overall coverage summary data from the coverage map
  const summary = coverageMap.getCoverageSummary().data;

  // Define minimum acceptable coverage thresholds for each metric (in percentage)
  const thresholds = {
    lines: 90, // Minimum 90% of lines must be covered
    statements: 90, // Minimum 90% of statements must be covered
    functions: 90, // Minimum 90% of functions must be covered
    branches: 90 // Minimum 90% of branches must be covered
  };

  // Array to store any metrics that do not meet the defined threshold
  let belowThreshold = [];

  // Loop through each coverage metric (lines, statements, functions, branches)
  for (const [metric, threshold] of Object.entries(thresholds)) {
    const covered = summary[metric].pct; // Get the coverage percentage for this metric

    // Check if the actual coverage is below the threshold
    if (covered < threshold) {
      // Add a message to the belowThreshold array for reporting later
      belowThreshold.push(`${metric}: ${covered}% (below ${threshold}%)`);
    }
  }

  // If any metrics fall below the required threshold
  if (belowThreshold.length > 0) {
    console.error('\nX Coverage threshold NOT met:');
    // Print each failing metric and its coverage percentage
    belowThreshold.forEach(msg => console.error(` - ${msg}`));
    // Set exit code to 1 to indicate failure (useful for CI/CD pipelines)
    process.exitCode = 1;
  } else {
    // If all thresholds are met, display a success message
    console.log('\n✓ All coverage thresholds met.');
  }

  console.log(`Coverage report generated in ${istanbulCoverageDir}`);

  // Send coverage report to Discord
  try {
    await sendToDiscord(summary, belowThreshold);
  } catch (error) {
    console.warn('Failed to send Discord notification:', error.message);
  }
}

convertCoverage();