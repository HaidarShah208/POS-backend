import {
  IsUUID,
  IsIn,
  IsInt,
  IsString,
  Min,
  MaxLength,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";

export class AdjustStockDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  branchId!: string;

  @IsIn(["add", "remove"])
  type!: "add" | "remove";

  @IsInt()
  @Type(() => Number)
  @Min(1)
  quantity!: number;

  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class GetInventoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 100;

  @IsOptional()
  @Type(() => Boolean)
  lowStockOnly?: boolean;
}
