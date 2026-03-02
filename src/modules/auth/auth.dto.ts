import { IsEmail, IsString, MinLength, IsIn } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password!: string;

  @IsIn(["admin", "cashier", "kitchen"])
  role!: "admin" | "cashier" | "kitchen";

  @IsString()
  branchId!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
