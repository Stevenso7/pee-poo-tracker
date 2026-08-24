import { IsBoolean, IsOptional } from 'class-validator';

export class AnalyzeDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
