import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PEE_COLORS,
  PEE_FOAMS,
  PEE_VOLUMES,
  POO_COLORS,
  RECORD_TYPES,
} from '@pee-poo/shared';

export class CreateRecordDto {
  @IsIn(RECORD_TYPES)
  type: 'PEE' | 'POO';

  @IsDateString()
  recordedAt: string;

  @IsOptional()
  @IsIn(PEE_COLORS)
  peeColor?: string;

  @IsOptional()
  @IsIn(PEE_FOAMS)
  peeFoam?: string;

  @IsOptional()
  @IsIn(PEE_VOLUMES)
  peeVolume?: string;

  @IsOptional()
  @IsIn(POO_COLORS)
  pooColor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  pooConsistency?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  needsPhotoUpload?: boolean;
}
