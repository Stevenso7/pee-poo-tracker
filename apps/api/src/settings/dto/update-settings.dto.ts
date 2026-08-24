import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { MAX_REMINDER_SLOTS } from '@pee-poo/shared';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_REMINDER_SLOTS)
  @IsString({ each: true })
  @Matches(/^\d{2}:\d{2}$/, { each: true })
  reminderTimes?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  photoRetentionDays?: number;
}
