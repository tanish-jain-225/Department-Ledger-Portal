const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const resPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        walkDir(resPath, callback);
      } else {
        callback(resPath);
      }
    }
  } catch (e) {}
}

try {
  const nodeModulesDir = path.join(process.cwd(), 'node_modules');
  const targetMinimatchCode = "const _be = require('brace-expansion'); const expand = typeof _be === 'function' ? _be : (_be.expand || _be.default);";
  const targetExcludeCode = "const _mm = require('minimatch'); const minimatch = typeof _mm === 'function' ? _mm : (_mm.minimatch || _mm.default);";

  walkDir(nodeModulesDir, (filePath) => {
    const fileName = path.basename(filePath);
    if (fileName === 'minimatch.js') {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes("const expand = require('brace-expansion')")) {
          content = content.replace("const expand = require('brace-expansion')", targetMinimatchCode);
          fs.writeFileSync(filePath, content);
        }
      } catch (e) {}
    } else if (filePath.includes('test-exclude') && (fileName === 'index.js' || fileName === 'is-outside-dir-win32.js')) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes("const minimatch = require('minimatch');")) {
          content = content.replace("const minimatch = require('minimatch');", targetExcludeCode);
          fs.writeFileSync(filePath, content);
        }
      } catch (e) {}
    }
  });
} catch (e) {
  // Silently ignore if node_modules not present yet
}
