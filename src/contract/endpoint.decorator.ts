import { applyDecorators, Delete, Get, Patch, Post, Put, SetMetadata } from '@nestjs/common';
import { CONTRACT_ROUTES, EndpointId } from './generated/routes';

export const CONTRACT_ENDPOINT_KEY = 'CONTRACT_ENDPOINT_KEY';

/**
 * Binds a NestJS controller handler directly to its definition in api-contract.json.
 * Automatically wires the correct HTTP method and path from the contract.
 */
export function Endpoint(endpointId: EndpointId) {
  const route = CONTRACT_ROUTES[endpointId];
  if (!route) {
    throw new Error(`Invalid EndpointId: "${endpointId}". Not found in CONTRACT_ROUTES.`);
  }

  // Contract paths start with e.g. "/auth/login".
  // Remove leading slash if controller has base path, or strip /api/v1 if included.
  const cleanPath = route.path.replace(/^\//, '');

  let methodDecorator: MethodDecorator;
  switch (route.method) {
    case 'GET':
      methodDecorator = Get(cleanPath);
      break;
    case 'POST':
      methodDecorator = Post(cleanPath);
      break;
    case 'PUT':
      methodDecorator = Put(cleanPath);
      break;
    case 'PATCH':
      methodDecorator = Patch(cleanPath);
      break;
    case 'DELETE':
      methodDecorator = Delete(cleanPath);
      break;
    default:
      throw new Error(`Unsupported method: ${route.method} for endpoint: ${endpointId}`);
  }

  return applyDecorators(
    SetMetadata(CONTRACT_ENDPOINT_KEY, endpointId),
    methodDecorator,
  );
}

