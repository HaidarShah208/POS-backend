import { IsEmail, IsString, MinLength, IsIn, IsOptional } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password!: string;

  @IsIn(["admin", "manager", "cashier", "kitchen"])
  role!: "admin" | "manager" | "cashier" | "kitchen";

  @IsString()
  branchId!: string;
}

export class RegisterOrgDto {
  @IsString()
  @MinLength(2)
  restaurantName!: string;

  @IsString()
  @MinLength(2)
  ownerName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
