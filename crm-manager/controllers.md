# Controllers - Design Patterns and Conventions

## Overview

Controllers in the CRM module follow RESTful principles and are responsible for handling HTTP requests. They delegate business logic to use cases, following a clean architecture approach.

## Structure

Controllers should:

1. Handle HTTP requests and responses
2. Validate input data
3. Call appropriate use cases
4. Return appropriate HTTP responses

## Location Convention

Controllers are located in the infrastructure layer:

- `src/modules/crm/infrastructure/http/controllers/`

## Naming Convention

- Controller names should be plural nouns that represent the resource they manage
- Suffix with `Controller` (e.g., `ClientsController`)

## Endpoint Design

- Use plural resource names (`/clients` not `/client`)
- Use resource identifiers for specific items (`/clients/:id`)
- Use nested resources for relationships (`/clients/:id/preferences`)
- Use HTTP methods appropriately:
  - `GET`: Retrieve resources
  - `POST`: Create resources
  - `PUT`: Update resources
  - `DELETE`: Remove resources

## Use Case Integration

Controllers should:

1. Inject abstract use case classes (e.g., `IUpdateClientNameUseCase`)
2. Use type-safe DTOs for request and response bodies
3. Map route parameters to use case payloads

## Example Implementation

```typescript
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';

import { ClientDto, CreateClientDto, UpdateClientNameDto } from '~modules/crm/application/dto/client.dto';
import { ICreateClientUseCase } from '~modules/crm/application/use-cases/create-client.use-case';
import { IUpdateClientNameUseCase } from '~modules/crm/application/use-cases/update-client-name.use-case';
import { ClientId } from '~modules/crm/domain/entities/client';

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly createClientUseCase: ICreateClientUseCase,
    private readonly updateClientNameUseCase: IUpdateClientNameUseCase,
  ) {}

  @Post()
  async createClient(@Body() createClientDto: CreateClientDto): Promise<ClientDto> {
    return this.createClientUseCase.execute(createClientDto);
  }

  @Put(':id/name')
  async updateClientName(@Param('id') id: string, @Body() body: UpdateClientNameDto): Promise<void> {
    await this.updateClientNameUseCase.execute({
      clientId: id as ClientId,
      updates: body,
    });
  }
}
```

## Payload Pattern for Updates

When updating resources, pass the HTTP body as the `updates` property of the use case payload:

```typescript
// In the controller
@Put(':id/preferences')
async updateClientPreferences(
  @Param('id') id: string,
  @Body() body: UpdateClientPreferencesDto,
): Promise<void> {
  await this.updateClientPreferencesUseCase.execute({
    clientId: id as ClientId,
    updates: body,
  });
}
```

## Module Registration

Register controllers in the module declaration:

```typescript
@Module({
  controllers: [ClientsController],
  providers: [
    { provide: ICreateClientUseCase, useClass: CreateClientUseCase },
    { provide: IUpdateClientNameUseCase, useClass: UpdateClientNameUseCase },
  ],
})
export class CrmModule {}
```
