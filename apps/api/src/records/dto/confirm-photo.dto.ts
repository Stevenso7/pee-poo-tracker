import { IsInt, IsString, Min } from 'class-validator';

export class ConfirmPhotoDto {
  @IsString()
  storagePath: string;

  @IsString()
  contentType: string;

  @IsInt()
  @Min(0)
  sizeBytes: number;
}
