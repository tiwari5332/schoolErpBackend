import fs from 'fs';
import path from 'path';

interface Endpoint {
  id: string;
  method: string;
  path: string;
  auth?: boolean;
  permission?: string;
  summary?: string;
  request?: {
    headers?: Record<string, any>;
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: any;
  };
  response: {
    status: number;
    data?: any;
    contentType?: string;
  };
  errors?: string[];
}

interface Module {
  name: string;
  endpoints: Endpoint[];
}

interface ApiContract {
  meta: any;
  errorCodes: string[];
  enums: Record<string, string[]>;
  permissions: { keys: string[] };
  components: {
    entities: Record<string, any>;
    pagination?: any;
  };
  modules: Module[];
}

const contractPath = path.resolve(__dirname, '../api-contract.json');
const contract: ApiContract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

const outDir = path.resolve(__dirname, '../src/contract/generated');
fs.mkdirSync(outDir, { recursive: true });

console.log(`Generating artefacts from api-contract.json (${contract.modules.length} modules)...`);

// 1. Generate enums and routes
const allEndpoints: Endpoint[] = [];
for (const mod of contract.modules) {
  for (const ep of mod.endpoints) {
    allEndpoints.push(ep);
  }
}

// Write routes.ts
const routeEntries = allEndpoints.map((ep) => {
  return `  ${JSON.stringify(ep.id)}: {
    id: ${JSON.stringify(ep.id)},
    method: ${JSON.stringify(ep.method)},
    path: ${JSON.stringify(ep.path)},
    auth: ${ep.auth !== false},
    permission: ${ep.permission ? JSON.stringify(ep.permission) : 'null'},
    summary: ${JSON.stringify(ep.summary || '')},
    errors: ${JSON.stringify(ep.errors || [])},
  },`;
}).join('\n');

const routesTs = `// AUTO-GENERATED FROM api-contract.json - DO NOT EDIT MANUALLY
export type EndpointId =
${allEndpoints.map((ep) => `  | ${JSON.stringify(ep.id)}`).join('\n')};

export interface RouteMeta {
  id: EndpointId;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  auth: boolean;
  permission: string | null;
  summary: string;
  errors: string[];
}

export const CONTRACT_ROUTES: Record<EndpointId, RouteMeta> = {
${routeEntries}
};

export const ALL_ENDPOINT_IDS: EndpointId[] = Object.keys(CONTRACT_ROUTES) as EndpointId[];
`;

fs.writeFileSync(path.join(outDir, 'routes.ts'), routesTs, 'utf8');
console.log(`- Created routes.ts (${allEndpoints.length} endpoints)`);

// 2. Generate enums.ts
const enumsTs = `// AUTO-GENERATED FROM api-contract.json - DO NOT EDIT MANUALLY
export const ContractEnums = ${JSON.stringify(contract.enums, null, 2)} as const;

export const ErrorCodes = ${JSON.stringify(contract.errorCodes, null, 2)} as const;
export type ErrorCode = typeof ErrorCodes[number];

export const PermissionKeys = ${JSON.stringify(contract.permissions.keys, null, 2)} as const;
export type PermissionKey = typeof PermissionKeys[number];

${Object.entries(contract.enums).map(([name, values]) => {
  const typeName = name.charAt(0).toUpperCase() + name.slice(1);
  return `export type ${typeName} = typeof ContractEnums[${JSON.stringify(name)}][number];`;
}).join('\n')}
`;

fs.writeFileSync(path.join(outDir, 'enums.ts'), enumsTs, 'utf8');
console.log(`- Created enums.ts`);

// 3. Generate fixtures.ts
const fixtures: Record<string, { request?: any; response?: any }> = {};
for (const ep of allEndpoints) {
  fixtures[ep.id] = {
    request: ep.request,
    response: ep.response,
  };
}

const fixturesTs = `// AUTO-GENERATED FROM api-contract.json - DO NOT EDIT MANUALLY
export const CONTRACT_FIXTURES = ${JSON.stringify(fixtures, null, 2)} as const;
`;

fs.writeFileSync(path.join(outDir, 'fixtures.ts'), fixturesTs, 'utf8');
console.log(`- Created fixtures.ts`);

// 4. Generate OpenAPI 3.1 specification (openapi.json)
const openApiDoc = {
  openapi: '3.1.0',
  info: {
    title: contract.meta.name,
    version: contract.meta.version,
    description: contract.meta.description,
  },
  servers: [{ url: contract.meta.baseUrl }],
  paths: {} as Record<string, any>,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: contract.components.entities,
  },
};

for (const ep of allEndpoints) {
  const openApiPath = ep.path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
  if (!openApiDoc.paths[openApiPath]) {
    openApiDoc.paths[openApiPath] = {};
  }
  const method = ep.method.toLowerCase();
  openApiDoc.paths[openApiPath][method] = {
    operationId: ep.id,
    summary: ep.summary,
    security: ep.auth === false ? [] : [{ bearerAuth: [] }],
    responses: {
      [ep.response.status]: {
        description: 'Successful response',
        content: {
          'application/json': {
            example: ep.response.data,
          },
        },
      },
    },
  };
}

fs.writeFileSync(path.join(outDir, 'openapi.json'), JSON.stringify(openApiDoc, null, 2), 'utf8');
console.log(`- Created openapi.json (OpenAPI 3.1)`);

// 5. Generate schemas.ts with Zod definitions
const schemasTs = `// AUTO-GENERATED FROM api-contract.json - DO NOT EDIT MANUALLY
import { z } from 'zod';
import { ContractEnums, ErrorCodes } from './enums';

export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.enum(ErrorCodes as unknown as [string, ...string[]]),
    message: z.string(),
    details: z.array(z.object({
      field: z.string().optional(),
      message: z.string(),
    })).optional(),
  }),
  requestId: z.string(),
});

export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export function createSuccessEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: PaginationMetaSchema.optional(),
    requestId: z.string(),
  });
}
`;

fs.writeFileSync(path.join(outDir, 'schemas.ts'), schemasTs, 'utf8');
console.log(`- Created schemas.ts`);

console.log('✅ All contract artefacts generated successfully!');

