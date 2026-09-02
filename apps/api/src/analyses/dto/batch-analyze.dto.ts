import { IsEnum, IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum RecordType {
  PEE = 'PEE',
  POO = 'POO',
}

export class BatchAnalyzeDto {
  @IsEnum(RecordType)
  type: RecordType;

  @IsInt()
  @Min(1)
  @Max(7)
  days: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  force?: boolean;
}