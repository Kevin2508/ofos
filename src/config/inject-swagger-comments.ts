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
  let modified = false;

  const validateRegex = /validate\(([a-zA-Z0-9_]+)\)(,?)(?!\s*\/\* #swagger\.requestBody)/g;
  content = content.replace(validateRegex, (match, schemaName, comma) => {
    modified = true;
    return `validate(${schemaName})${comma} /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: { $ref: "#/components/schemas/${schemaName}" }
                }
            }
        } */`;
  });

  const validateQueryRegex = /validateQuery\(([a-zA-Z0-9_]+)\)(,?)(?!\s*\/\* #swagger\.parameters)/g;
  content = content.replace(validateQueryRegex, (match, schemaName, comma) => {
    modified = true;
    return `validateQuery(${schemaName})${comma} /* #swagger.parameters['query_${schemaName}'] = {
            in: 'query',
            schema: { $ref: "#/components/schemas/${schemaName}" }
        } */`;
  });

  const validateParamsRegex = /validateParams\(([a-zA-Z0-9_]+)\)(,?)(?!\s*\/\* #swagger\.parameters)/g;
  content = content.replace(validateParamsRegex, (match, schemaName, comma) => {
    modified = true;
    return `validateParams(${schemaName})${comma} /* #swagger.parameters['params_${schemaName}'] = {
            in: 'path',
            schema: { $ref: "#/components/schemas/${schemaName}" }
        } */`;
  });

  if (modified) {
    fs.writeFileSync(file, content);
  }
}
console.log('Successfully injected swagger comments into route files.');
