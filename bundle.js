const fs = require('fs');
const path = require('path');

// 1. Settings: What to ignore
const IGNORE_DIRS = ['node_modules', '.git', '.idea', 'dist', 'build', 'coverage'];
const IGNORE_FILES = ['package-lock.json', 'yarn.lock', 'bundle.js', '.DS_Store', '.env'];
const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.ico', '.pdf', '.zip'];

// 2. Output file name
const OUTPUT_FILE = 'project_code.txt';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    
    // Skip ignored directories and files
    if (IGNORE_DIRS.includes(file) || IGNORE_FILES.includes(file)) {
        return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Skip ignored extensions
      if (!IGNORE_EXTENSIONS.includes(path.extname(file))) {
          arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(__dirname);
let outputContent = `Project Structure for: ${path.basename(__dirname)}\n\n`;

console.log(`Scanning ${allFiles.length} files...`);

allFiles.forEach(file => {
    // Read file content
    try {
        const content = fs.readFileSync(file, 'utf8');
        // Make the path relative for cleaner reading
        const relativePath = path.relative(__dirname, file);
        
        outputContent += `\n================================================\n`;
        outputContent += `FILE: ${relativePath}\n`;
        outputContent += `================================================\n`;
        outputContent += `${content}\n\n`;
    } catch (err) {
        console.log(`Skipping binary or unreadable file: ${file}`);
    }
});

fs.writeFileSync(OUTPUT_FILE, outputContent);
console.log(`\n✅ Success! All code saved to: ${OUTPUT_FILE}`);