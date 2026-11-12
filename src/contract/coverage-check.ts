import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { ALL_ENDPOINT_IDS, EndpointId } from './generated/routes';
import { CONTRACT_ENDPOINT_KEY } from './endpoint.decorator';

@Injectable()
export class ContractCoverageChecker implements OnApplicationBootstrap {
  private readonly logger = new Logger(ContractCoverageChecker.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onApplicationBootstrap() {
    const implementedEndpoints = new Set<EndpointId>();
    const controllers = this.discoveryService.getControllers();

    for (const controllerWrapper of controllers) {
      const { instance } = controllerWrapper;
      if (!instance) continue;

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const handler = prototype[methodName];
        const endpointId = this.reflector.get<EndpointId>(CONTRACT_ENDPOINT_KEY, handler);

        if (endpointId) {
          if (implementedEndpoints.has(endpointId)) {
            this.logger.warn(`Duplicate handler found for endpoint: ${endpointId}`);
          }
          implementedEndpoints.add(endpointId);
        }
      }
    }

    const missingEndpoints: EndpointId[] = [];
    for (const id of ALL_ENDPOINT_IDS) {
      if (!implementedEndpoints.has(id)) {
        missingEndpoints.push(id);
      }
    }

    this.logger.log(
      `Contract Coverage: ${implementedEndpoints.size}/${ALL_ENDPOINT_IDS.length} endpoints implemented.`,
    );

    // In production or strict test mode, fail startup if endpoints are missing
    if (process.env.ENFORCE_CONTRACT_COVERAGE === 'true' && missingEndpoints.length > 0) {
      throw new Error(
        `Contract Coverage Check Failed! Missing ${missingEndpoints.length} endpoints:\n` +
          missingEndpoints.map((e) => ` - ${e}`).join('\n'),
      );
    }
  }
}

