import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(4)
  newPassword!: string;

  // opcional: obligar cambio al próximo login
  forceChange?: boolean;
}
