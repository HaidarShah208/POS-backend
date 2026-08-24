import {
  IsUUID,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";

export class PurchaseOrderItemDto {
  @IsUUID()
  inventoryItemId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  orderedQuantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost!: number;
}

export class CreatePurchaseOrderDto {
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  expectedDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

export class ReceiveItemDto {
  @IsUUID()
  purchaseOrderItemId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  receivedQuantity!: number;
}

export class ReceiveItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items!: ReceiveItemDto[];
}

export class GetPurchaseOrdersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  @IsIn(["DRAFT", "SENT", "PARTIAL", "RECEIVED", "CANCELLED"])
  status?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;
}
