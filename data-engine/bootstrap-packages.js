/**
 * bootstrap-packages.js
 * Downloads and extracts the youtube-transcript npm package
 * without needing npm (uses only Node built-ins: https, zlib, fs).
 * Run: node bootstrap-packages.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PACKAGE_NAME = 'youtube-transcript';
const PACKAGE_VERSION = '1.2.1';
const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}/${PACKAGE_VERSION}`;

function get(url) {
  return new Promise((resolve, reject) => {
    function request(url) {
      https.get(url, { headers: { 'User-Agent': 'node-bootstrap/1.0' } }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          request(res.headers.location);
          return;
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    }
    request(url);
  });
}

/**
 * Custom minimal TAR extractor — handles ustar format used by npm tarballs.
 */
function extractTar(buffer, destDir) {
  let offset = 0;
  while (offset + 512 <= buffer.length) {
    // Read header block
    const header = buffer.slice(offset, offset + 512);
    offset += 512;

    // Name field (100 bytes null-terminated)
    let name = '';
    for (let i = 0; i < 100 && header[i] !== 0; i++) name += String.fromCharCode(header[i]);
    if (!name) break; // end of archive

    // Prefix field (ustar, offset 345, 155 bytes)
    let prefix = '';
    for (let i = 345; i < 500 && header[i] !== 0; i++) prefix += String.fromCharCode(header[i]);
    const fullName = prefix ? `${prefix}/${name}` : name;

    // File size (octal, offset 124, 12 bytes)
    const sizeStr = header.slice(124, 136).toString('ascii').trim().replace(/\0/g, '');
    const size = parseInt(sizeStr, 8) || 0;

    // Type flag (offset 156)
    const typeFlag = String.fromCharCode(header[156]);

    if (typeFlag === '0' || typeFlag === '' || typeFlag === '\0') {
      // Regular file — strip leading "package/" prefix from npm tarballs
      const relPath = fullName.replace(/^package\//, `${PACKAGE_NAME}/`);
      const outPath = path.join(destDir, relPath);
      const outDir = path.dirname(outPath);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const fileData = buffer.slice(offset, offset + size);
      fs.writeFileSync(outPath, fileData);
    } else if (typeFlag === '5') {
      // Directory
      const relPath = fullName.replace(/^package\//, `${PACKAGE_NAME}/`);
      const outPath = path.join(destDir, relPath);
      if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, { recursive: true });
    }

    // Move to next 512-byte boundary
    offset += Math.ceil(size / 512) * 512;
  }
}

async function main() {
  const nodeModulesDir = path.join(__dirname, 'node_modules');
  const pkgDir = path.join(nodeModulesDir, PACKAGE_NAME);

  if (fs.existsSync(path.join(pkgDir, 'package.json'))) {
    console.log(`✅  ${PACKAGE_NAME} is already installed.`);
    console.log(`\nVerifying it loads...`);
    try {
      require(pkgDir);
      console.log(`✅  ${PACKAGE_NAME} loads successfully!`);
    } catch(e) {
      console.log(`⚠️  Package exists but failed to load: ${e.message}`);
    }
    return;
  }

  console.log(`📡  Fetching package metadata for ${PACKAGE_NAME}@${PACKAGE_VERSION}...`);
  const meta = JSON.parse((await get(REGISTRY_URL)).toString());
  const tarballUrl = meta.dist.tarball;
  console.log(`📦  Downloading tarball: ${tarballUrl}`);

  const tgzBuffer = await get(tarballUrl);
  console.log(`🗜️  Extracting (${tgzBuffer.length} bytes) → node_modules/${PACKAGE_NAME}/...`);

  const tarBuffer = zlib.gunzipSync(tgzBuffer);
  extractTar(tarBuffer, nodeModulesDir);

  console.log(`✅  ${PACKAGE_NAME}@${PACKAGE_VERSION} installed successfully!`);

  console.log(`\n🔍  Verifying it loads...`);
  const mod = require(pkgDir);
  const keys = Object.keys(mod || {});
  console.log(`✅  Package exported: [${keys.join(', ')}]`);
}

main().catch(err => {
  console.error(`❌  Failed: ${err.message}`);
  process.exit(1);
});
