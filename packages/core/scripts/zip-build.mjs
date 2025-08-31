import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiverPkg from 'archiver';

const archiver = archiverPkg.default ?? archiverPkg; // CJS interop

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const root       = path.resolve(__dirname, '..');
const buildDir   = path.join(root, 'build');
const releaseDir = path.join(root, 'release');

// ensure build exists
await fs.access(buildDir).catch(() => {
  throw new Error('Missing build/. Run: npm run build');
});

// read version from build/manifest.json
const manifestPath = path.join(buildDir, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
if (!manifest.version) throw new Error('manifest.json is missing "version"');

// PRUNE: nuke release/ entirely, then recreate it
await fs.rm(releaseDir, { recursive: true, force: true });
await fs.mkdir(releaseDir, { recursive: true });

const outZip = path.join(releaseDir, `scryhub-core-${manifest.version}.zip`);

await new Promise((resolve, reject) => {
  const output = createWriteStream(outZip);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', resolve);
  output.on('error', reject);
  archive.on('error', reject);

  archive.pipe(output);
  // add the *contents* of build/ to the zip root
  archive.directory(buildDir + path.sep, false);
  archive.finalize();
});

console.log('✅ Packed:', outZip);
