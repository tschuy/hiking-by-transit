import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = path.resolve(packageRoot, '../..');
const budgets = JSON.parse(await readFile(path.join(packageRoot, 'performance-budgets.json'), 'utf8'));

const bundle = await readFile(path.join(packageRoot, 'dist/index.js'));
const bundleGzipBytes = gzipSync(bundle).byteLength;
const trailheadDirectory = path.join(appRoot, 'public/assets/kml');
const trailheadFiles = (await readdir(trailheadDirectory)).filter((name) => name.endsWith('.kml'));
const trailheadSizes = await Promise.all(trailheadFiles.map(async (name) => (await stat(path.join(trailheadDirectory, name))).size));
const initialTrailheadBytes = trailheadSizes.reduce((total, size) => total + size, 0);

const failures = [];
if (bundleGzipBytes > budgets.bundleGzipBytes) {
  failures.push(`library gzip ${bundleGzipBytes} exceeds ${budgets.bundleGzipBytes} bytes`);
}
if (initialTrailheadBytes > budgets.initialTrailheadBytes) {
  failures.push(`initial trailhead assets ${initialTrailheadBytes} exceed ${budgets.initialTrailheadBytes} bytes`);
}

console.log(`Performance budgets: library gzip ${bundleGzipBytes}/${budgets.bundleGzipBytes} bytes; trailheads ${initialTrailheadBytes}/${budgets.initialTrailheadBytes} bytes.`);
if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
}
