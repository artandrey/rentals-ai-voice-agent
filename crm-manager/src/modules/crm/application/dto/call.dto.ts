import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { Call, CallType } from '~modules/crm/domain/entities/call';
import { SpeakerRole, Transcript } from '~modules/crm/domain/value-objects/transcript.value';

export class TranscriptReplicaDto {
  text: string;
  role: SpeakerRole;
}

export class TranscriptDto {
  replicas: TranscriptReplicaDto[];
}

export class CallDto {
  id: string;
  callerPhoneNumber: string;
  type: CallType | null;
  clientId: string | null;
  associatedRentalId: string | null;
  transcript: TranscriptDto;
}

export class CreateCallDto {
  @IsString()
  @IsNotEmpty()
  callerPhoneNumber: string;

  @IsEnum(CallType)
  @IsOptional()
  type?: CallType;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  associatedRentalId?: string;

  @ValidateNested()
  @Type(() => TranscriptDto)
  @IsNotEmpty()
  transcript: TranscriptDto;

  @IsString()
  @IsOptional()
  audioFileId?: string;

  @IsString()
  @IsOptional()
  summary?: string;
}
