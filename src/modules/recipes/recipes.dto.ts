import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsNumber,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class RecipeIngredientDto {
  @IsUUID()
  inventoryItemId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsString()
  @MaxLength(20)
  unit!: string;
}

export class CreateRecipeDto {
  @IsUUID()
  productId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients!: RecipeIngredientDto[];
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients?: RecipeIngredientDto[];
}
