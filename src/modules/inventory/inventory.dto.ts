import {
  IsUUID,
  IsIn,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  Min,
  MaxLength,
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";

export class GetInventoryItemsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsIn(["PRODUCT", "INGREDIENT", "PACKAGING"])
  type?: string;

  @IsOptional()
  @IsIn(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["name", "currentQuantity", "costPerUnit", "createdAt", "updatedAt"])
  sortBy?: string;

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC";
}

export class CreateInventoryItemDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsIn(["PRODUCT", "INGREDIENT", "PACKAGING"])
  type!: string;

  @IsIn(["PCS", "KG", "G", "L", "ML", "BOX", "PACK"])
  unit!: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  currentQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @IsOptional()
  @IsBoolean()
  trackExpiry?: boolean;
}

export class AdjustStockDto {
  @IsUUID()
  inventoryItemId!: string;

  @IsIn(["add", "remove"])
  type!: "add" | "remove";

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GetStockMovementsQueryDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsOptional()
  @IsIn([
    "OPENING_STOCK",
    "SALE",
    "PURCHASE",
    "RETURN",
    "DAMAGE",
    "WASTAGE",
    "EXPIRED",
    "MANUAL_ADJUSTMENT",
    "STOCK_CORRECTION",
    "RECIPE_DEDUCTION",
  ])
  type?: string;

  @IsOptional()
  @IsIn(["ORDER", "PURCHASE_ORDER", "MANUAL", "SYSTEM", "WASTE"])
  referenceType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

export class RecordWasteDto {
  @IsUUID()
  inventoryItemId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsIn(["DAMAGED", "EXPIRED", "SPILLED", "BURNED", "SPOILED", "OTHER"])
  reason!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
