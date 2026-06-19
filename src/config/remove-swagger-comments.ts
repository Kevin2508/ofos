import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modulesDir = path.join(__dirname, '../modules');

const findFiles = (dir: string): string[] => {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(file));
    } else if (file.endsWith('.routes.ts')) {
      results.push(file);
    }
  });
  return results;
};

const routeFiles = findFiles(modulesDir);

for (const file of routeFiles) {
  let content = fs.readFileSync(file, 'utf8');
  
  const originalContent = content;
  content = content.replace(/\s*\/\* #swagger\.(requestBody|parameters)[\s\S]*?\*\//g, '');
  
  if (originalContent !== content) {
    fs.writeFileSync(file, content);
  }
}
console.log('Successfully removed swagger comments from route files.');
