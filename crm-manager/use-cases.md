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

## Mappers

Mappers are responsible for the transformation between domain entities and DTOs. They follow several important principles:

1. **Single Responsibility**: Each mapper class is responsible for transforming one domain entity.
2. **Dependency Injection**: Mappers should be injectable services.
3. **Method Naming**: Mapper methods should be named with `to[TypeName]` format (e.g., `toDto`, `toCompactDto`).
4. **Location**: Mappers are located in the `domain/mappers` directory.

### Mapper Usage in Use Cases

Use cases should delegate the mapping responsibility to mappers instead of containing the mapping logic directly. This approach:

1. Reduces code duplication across use cases
2. Centralizes mapping logic in dedicated classes
3. Makes use cases more focused on business logic
4. Improves maintainability when entity or DTO structures change

```typescript
@Injectable()
export class GetRentalByIdQuery extends IGetRentalByIdQuery {
  constructor(private readonly rentalMapper: RentalMapper) {
    super();
  }

  async implementation(): Promise<CompactRentalDto> {
    const { rentalId } = this._input;
    const rental = await this._dbContext.rentalsRepository.findById(rentalId);

    if (!rental) {
      throw new Error('Rental not found');
    }

    return this.rentalMapper.toCompactDto(rental);
  }
}
```

### Specialized Mapper Methods

When an entity needs to be mapped to different DTO types, create specialized mapper methods:

```typescript
@Injectable()
export class RentalMapper {
  public toCompactDto(rental: Rental): CompactRentalDto {
    // Map to compact representation
  }

  public toDetailedDto(rental: Rental): DetailedRentalDto {
    // Map to detailed representation
  }

  public toSpecificInfoDto(rental: Rental): SpecificInfoDto {
    // Map to specific information representation
  }
}
```

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
