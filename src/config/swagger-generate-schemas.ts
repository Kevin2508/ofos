import fs from 'fs';
import path from 'path';
import j2s from 'joi-to-swagger';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateSchemas() {
  const schemas: Record<string, any> = {};
  
  const modulesDir = path.join(__dirname, '../modules');
  
  const findFiles = (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        results = results.concat(findFiles(file));
      } else if (file.endsWith('.validation.ts')) {
        results.push(file);
      }
    });
    return results;
  };

  const validationFiles = findFiles(modulesDir);

  for (const file of validationFiles) {
    const mod = await import('file://' + file);
    for (const key of Object.keys(mod)) {
      if (key.endsWith('Schema') && mod[key] && mod[key].type) {
        try {
          const { swagger } = (j2s as any)(mod[key]);
          schemas[key] = swagger;
        } catch (e) {
          console.error(`Failed to parse schema ${key} in ${file}`);
        }
      }
    }
  }

  return schemas;
}
