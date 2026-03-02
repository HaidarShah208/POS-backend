import { AppDataSource } from "../../config/data-source.js";
import { Products } from "../../models/Products.js";
import { Categories } from "../../models/Categories.js";

const productRepo = () => AppDataSource.getRepository(Products);
const categoryRepo = () => AppDataSource.getRepository(Categories);

// Categories
export async function getCategories() {
  return categoryRepo().find({ order: { sortOrder: "ASC", name: "ASC" } });
}

export async function getCategoryById(id: string) {
  return categoryRepo().findOne({ where: { id } });
}

export async function createCategory(data: { name: string; slug: string; sortOrder?: number }) {
  const cat = categoryRepo().create({
    ...data,
    sortOrder: data.sortOrder ?? 0,
  });
  return categoryRepo().save(cat);
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; slug: string; sortOrder: number }>
) {
  await categoryRepo().update(id, data as object);
  return categoryRepo().findOneOrFail({ where: { id } });
}

export async function deleteCategory(id: string) {
  const r = await categoryRepo().delete(id);
  return (r.affected ?? 0) > 0;
}

// Products
export async function getProducts(branchId?: string) {
  return productRepo().find({
    relations: ["category"],
    order: { name: "ASC" },
  });
}

export async function getProductById(id: string) {
  return productRepo().findOne({
    where: { id },
    relations: ["category"],
  });
}

export async function createProduct(data: {
  categoryId: string;
  name: string;
  price: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  image?: string;
  description?: string;
  status?: string;
  modifiers?: { id: string; name: string; price: number }[];
}) {
  const product = productRepo().create({
    ...data,
    status: data.status ?? "active",
  });
  return productRepo().save(product);
}

export async function updateProduct(
  id: string,
  data: Partial<{
    categoryId: string;
    name: string;
    price: number;
    cost: number;
    sku: string;
    barcode: string;
    image: string;
    description: string;
    status: string;
    modifiers: { id: string; name: string; price: number }[];
  }>
) {
  await productRepo().update(id, data as object);
  return productRepo().findOneOrFail({ where: { id }, relations: ["category"] });
}

export async function deleteProduct(id: string) {
  const r = await productRepo().delete(id);
  return (r.affected ?? 0) > 0;
}
