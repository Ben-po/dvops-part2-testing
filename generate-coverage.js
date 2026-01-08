const fs = require('fs').promises;
const path = require('path');
const v8toIstanbul = require('v8-to-istanbul');
const reports = require('istanbul-reports');
const { createContext } = require('istanbul-lib-report');
const { createCoverageMap } = require('istanbul-lib-coverage');

const coverageDir = path.join(process.cwd(), 'coverage/temp'); // Playwright v8 coverage
const istanbulCoverageDir = path.join(process.cwd(), 'coverage/frontend'); // Final report output
// Only target the frontend script Benjamin.js
const TARGET_URL_SUFFIX = '/js/Benjamin.js'; // how the browser sees it
const TARGET_FILE = path.join(process.cwd(), 'public', 'js', 'Benjamin.js'); // on-disk path

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

      // Derive the URL pathname so we can match /js/Benjamin.js regardless of host
      let pathname;
      try {
        pathname = entry.url.startsWith('http') || entry.url.startsWith('file://')
          ? new URL(entry.url).pathname
          : entry.url;
      } catch {
        pathname = entry.url;
      }

      // Only process coverage for Benjamin.js
      if (!pathname.endsWith(TARGET_URL_SUFFIX)) continue;

      try {
        const converter = v8toIstanbul(TARGET_FILE, 0, { source: entry.source });
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

  console.log(`Coverage report generated in ${istanbulCoverageDir}`);
}

convertCoverage();