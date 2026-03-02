import {
  IsArray,
  IsNumber,
  IsString,
  IsIn,
  ValidateNested,
  Min,
  IsOptional,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";

export class OrderItemDto {
  @IsString()
  id!: string;

  @IsUUID()
  productId!: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  modifiers?: { id: string; name: string; price: number }[];
}

export class PlaceOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  grandTotal?: number;

  @IsIn(["dine-in", "takeaway", "delivery"])
  orderType!: "dine-in" | "takeaway" | "delivery";

  @IsIn(["cash", "card", "mobile", "other"])
  paymentMethod!: "cash" | "card" | "mobile" | "other";
}

export class GetOrdersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsIn(["pending", "accepted", "preparing", "ready", "completed", "cancelled"])
  status?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  dateTo?: string; // YYYY-MM-DD
}

export class UpdateOrderStatusDto {
  @IsIn(["pending", "accepted", "preparing", "ready", "completed", "cancelled"])
  status!: string;
}
