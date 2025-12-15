import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() username!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString() nombres!: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsString()
  @MinLength(4)
  password!: string;
}
