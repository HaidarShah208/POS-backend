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

  @IsIn(["admin", "manager", "cashier", "kitchen"])
  role!: "admin" | "manager" | "cashier" | "kitchen";

  @IsString()
  branchId!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
