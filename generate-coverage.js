const fs = require('fs').promises;
const path = require('path');
const v8toIstanbul = require('v8-to-istanbul');
const reports = require('istanbul-reports');
const { createContext } = require('istanbul-lib-report');
const { createCoverageMap } = require('istanbul-lib-coverage');

const coverageDir = path.join(process.cwd(), 'coverage/temp'); // Playwright v8 coverage
const istanbulCoverageDir = path.join(process.cwd(), 'coverage/frontend'); // Final report output
const TARGET_URL_SUFFIX = '/js/Benjamin.js';

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
}

convertCoverage();