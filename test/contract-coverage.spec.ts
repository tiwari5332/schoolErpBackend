import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else if (file.endsWith('.controller.ts')) {
      results.push(file);
    }
  });
  return results;
}

describe('Contract Coverage Spec: 100% Endpoint Fidelity', () => {
  it('should implement all 175 endpoints defined in the API contract routes', () => {
    const files = getFiles('src/modules');
    const implementedEndpoints = new Set<string>();

    files.forEach((f) => {
      const content = fs.readFileSync(f, 'utf8');
      const matches = content.matchAll(/@Endpoint\(['"]([^'"]+)['"]\)/g);
      for (const m of matches) {
        implementedEndpoints.add(m[1]);
      }
    });

    const routesContent = fs.readFileSync('src/contract/generated/routes.ts', 'utf8');
    const allEndpoints: string[] = [];
    const rMatch = routesContent.matchAll(/"([A-Z0-9_]+)":\s*\{\s*id:/g);
    for (const match of rMatch) {
      allEndpoints.push(match[1]);
    }

    const missing = allEndpoints.filter((e) => !implementedEndpoints.has(e));

    expect(allEndpoints.length).toBe(175);
    expect(implementedEndpoints.size).toBe(175);
    expect(missing).toEqual([]);
  });
});

