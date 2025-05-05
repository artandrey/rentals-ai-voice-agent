# Use Cases - Design Patterns and Conventions

## Overview

Use cases in the CRM module follow a consistent pattern based on the Command Query Responsibility Segregation (CQRS) pattern. Each use case is designed with a clear separation between the interface (contract) and the implementation.

## Structure

1. **Abstract Class**: Defines the contract that all implementations must adhere to.
2. **Concrete Class**: Implements the business logic required to fulfill the contract.
3. **Payload Interface**: Defines the shape of data required by the use case.

## Naming Conventions

- Abstract classes are prefixed with `I` (e.g., `IUpdateClientNameUseCase`)
- Concrete classes have no prefix (e.g., `UpdateClientNameUseCase`)
- Command use cases are named with verbs (e.g., `UpdateClientNameUseCase`)
- Query use cases are named with nouns (e.g., `GetClientByIdQuery`)

## Data Transfer Objects (DTOs)

- DTOs should be defined in the `dto` folder, not in the use case files
- DTOs that represent actions should include the action in their name:
  - `CreateClientDto` for creation
  - `UpdateClientNameDto` for updates
  - `ClientDto` for responses

## Payload Pattern

Use cases that modify data should follow this payload pattern:

```typescript
// In the DTO file
export class UpdateClientNameDto {
  firstName: string;
  lastName: string;
  middleName?: string;
}

// In the use case file
export interface UpdateClientNamePayload {
  clientId: ClientId;
  updates: UpdateClientNameDto;
}
```

This separation allows:

1. Reuse of DTOs across different use cases
2. Clear separation between identifiers and the data to be updated
3. Type-safe payloads that are explicit about their structure

## Example Implementation

```typescript
import { Injectable } from '@nestjs/common';

import { ClientId } from '~modules/crm/domain/entities/client';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { UpdateClientNameDto } from '../dto/client.dto';

// Payload interface (not a DTO)
export interface UpdateClientNamePayload {
  clientId: ClientId;
  updates: UpdateClientNameDto;
}

// Abstract class (contract)
export abstract class IUpdateClientNameUseCase
  extends Command<UpdateClientNamePayload, void>
  implements IUseCase<UpdateClientNamePayload, void> {}

// Concrete implementation
@Injectable()
export class UpdateClientNameUseCase extends IUpdateClientNameUseCase {
  constructor() {
    super();
  }

  async implementation(): Promise<void> {
    const { clientId, updates } = this._input;
    const { firstName, lastName, middleName } = updates;

    const client = await this._dbContext.clientsRepository.findById(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    client.setFirstName(firstName);
    client.setLastName(lastName);
    client.setMiddleName(middleName || null);

    await this._dbContext.clientsRepository.save(client);
  }
}
```

## Dependency Injection

When registering use cases in the module:

```typescript
@Module({
  providers: [
    { provide: IUpdateClientNameUseCase, useClass: UpdateClientNameUseCase },
  ],
})
```

This allows injecting the abstract class and getting the concrete implementation.
