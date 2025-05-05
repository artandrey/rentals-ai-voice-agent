import { Call, CallId } from '../entities/call';

export abstract class ICallsRepository {
  abstract findById(id: CallId): Promise<Call | null>;
  abstract save(entity: Call): Promise<CallId>;
  abstract delete(id: CallId): Promise<void>;
  abstract findAll(): Promise<Call[]>;
}
