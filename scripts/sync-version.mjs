import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// 1. Get version from root package.json
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = pkg.version;

console.log(`Syncing version: ${version}`);

// 2. Update Shared package VERSION constant
const sharedIndexPath = path.join(rootDir, 'packages/shared/src/index.ts');
let sharedIndex = fs.readFileSync(sharedIndexPath, 'utf8');
sharedIndex = sharedIndex.replace(/export const VERSION = '.*'/, `export const VERSION = '${version}'`);
fs.writeFileSync(sharedIndexPath, sharedIndex);
console.log('✓ Updated packages/shared/src/index.ts');

// 3. Update all package.json files
const packages = [
  'packages/client',
  'packages/server',
  'packages/shared',
  'apps/demo'
];

packages.forEach(pkgDir => {
  const ppath = path.join(rootDir, pkgDir, 'package.json');
  if (fs.existsSync(ppath)) {
    const p = JSON.parse(fs.readFileSync(ppath, 'utf8'));
    p.version = version;
    fs.writeFileSync(ppath, JSON.stringify(p, null, 2) + '\n');
    console.log(`✓ Updated ${pkgDir}/package.json`);
  }
});

// 4. Update HTML docs
const docs = ['docs/index.html', 'docs/docs.html'];
docs.forEach(docPath => {
  const dpath = path.join(rootDir, docPath);
  if (fs.existsSync(dpath)) {
    let content = fs.readFileSync(dpath, 'utf8');
    
    // Replace <!-- NEEV_VERSION -->...<!-- /NEEV_VERSION -->
    // We handle both vX.Y.Z and Version X.Y.Z patterns
    content = content.replace(
      /(<!-- NEEV_VERSION -->)(.*?)(<!-- \/NEEV_VERSION -->)/g,
      (match, p1, p2, p3) => {
        if (p2.includes('Version')) return `${p1}Version ${version}${p3}`;
        return `${p1}v${version}${p3}`;
      }
    );
    
    fs.writeFileSync(dpath, content);
    console.log(`✓ Updated ${docPath}`);
  }
});

// 5. Update README.md
const readmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, 'utf8');
  readme = readme.replace(
    /(<code.*?>)v.*?(\/code>)/,
    `$1v${version}$2`
  );
  fs.writeFileSync(readmePath, readme);
  console.log('✓ Updated README.md');
}

console.log('\n🚀 Version sync complete!');
