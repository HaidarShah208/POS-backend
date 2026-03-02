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

  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsNumber()
  @Min(0)
  tax!: number;

  @IsNumber()
  @Min(0)
  discount!: number;

  @IsNumber()
  @Min(0)
  grandTotal!: number;

  @IsIn(["dine-in", "takeaway", "delivery"])
  orderType!: "dine-in" | "takeaway" | "delivery";

  @IsIn(["cash", "card", "mobile", "other"])
  paymentMethod!: "cash" | "card" | "mobile" | "other";
}
