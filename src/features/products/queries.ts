"use server";

import { productFormSchema } from "@/features/products/validations";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { Result } from "@/types/action";
import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import sharp from "sharp";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const WEBP_QUALITY = 80;

function parseProductInput(formData: FormData) {
  return productFormSchema.safeParse({
    name: formData.get("name") as string,
    sku: (formData.get("sku") as string) || undefined,
    barcode: (formData.get("barcode") as string) || undefined,
    price: Number.parseFloat(formData.get("price") as string),
    costPrice: formData.get("costPrice")
      ? Number.parseFloat(formData.get("costPrice") as string)
      : undefined,
    stockQty: Number.parseInt(formData.get("stockQty") as string, 10),
    lowStockAt: Number.parseInt(formData.get("lowStockAt") as string, 10),
    unit: (formData.get("unit") as string) || "pc",
    categoryId: (formData.get("categoryId") as string) || undefined,
  });
}

function getImageInput(formData: FormData): Result<{
  imageFile: File | null;
  removeImage: boolean;
}> {
  const fileValue = formData.get("imageFile");
  const imageFile =
    fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  const removeImage = formData.get("removeImage") === "on";

  if (imageFile && !imageFile.type.startsWith("image/")) {
    return { ok: false, error: "Please upload a valid image file." };
  }

  if (imageFile && imageFile.size > MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, error: "Image must be 5MB or smaller." };
  }

  return { ok: true, data: { imageFile, removeImage } };
}

async function uploadProductImage(
  supabase: SupabaseClient<Database>,
  storeId: string,
  imageFile: File,
): Promise<Result<{ bucket: string; objectPath: string; publicUrl: string }>> {
  const bucket = process.env.SUPABASE_ASSETS_BUCKET ?? "app-assets";
  const safeBaseName = imageFile.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-]/g, "_");
  const objectPath = `stores/${storeId}/products/${Date.now()}-${safeBaseName}.webp`;

  let webpBuffer: Buffer;

  try {
    const inputBuffer = Buffer.from(await imageFile.arrayBuffer());
    webpBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    return {
      ok: false,
      error: "Failed to optimize image. Please try another file.",
    };
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, webpBuffer, {
      upsert: false,
      contentType: "image/webp",
    });

  if (uploadError) {
    if (/bucket.*not found/i.test(uploadError.message)) {
      return {
        ok: false,
        error:
          `Storage bucket "${bucket}" was not found. ` +
          "Create it in Supabase Storage, then retry.",
      };
    }
    return { ok: false, error: `Image upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  if (!publicUrl) {
    return { ok: false, error: "Unable to get uploaded image URL." };
  }

  return { ok: true, data: { bucket, objectPath, publicUrl } };
}

function getObjectPathFromPublicUrl(publicUrl: string, bucket: string) {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) return null;

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

async function removeImageByPublicUrl(
  supabase: SupabaseClient<Database>,
  publicUrl: string,
) {
  const bucket = process.env.SUPABASE_ASSETS_BUCKET ?? "app-assets";
  const objectPath = getObjectPathFromPublicUrl(publicUrl, bucket);
  if (!objectPath) return;
  await supabase.storage.from(bucket).remove([objectPath]);
}

export async function createProductAction(
  storeId: string,
  formData: FormData,
): Promise<Result<{ productId: string }>> {
  const parsed = parseProductInput(formData);
  if (!parsed.success) {
    return { ok: false, error: "Please check product details and try again." };
  }

  const imageInput = getImageInput(formData);
  if (!imageInput.ok) return imageInput;
  const { imageFile } = imageInput.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in again." };
  }

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return {
      ok: false,
      error: "You do not have permission to create products.",
    };
  }

  let uploadedImage: {
    bucket: string;
    objectPath: string;
    publicUrl: string;
  } | null = null;

  if (imageFile) {
    const uploadResult = await uploadProductImage(supabase, storeId, imageFile);
    if (!uploadResult.ok) return uploadResult;
    uploadedImage = uploadResult.data;
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      store_id: storeId,
      category_id: parsed.data.categoryId || null,
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      barcode: parsed.data.barcode || null,
      price: parsed.data.price,
      cost_price: parsed.data.costPrice || null,
      stock_qty: parsed.data.stockQty,
      low_stock_at: parsed.data.lowStockAt,
      unit: parsed.data.unit,
      image_url: uploadedImage?.publicUrl ?? null,
    })
    .select("id")
    .single();

  if (error || !product) {
    if (uploadedImage) {
      await supabase.storage
        .from(uploadedImage.bucket)
        .remove([uploadedImage.objectPath]);
    }
    return { ok: false, error: error?.message ?? "Failed to create product." };
  }

  if (parsed.data.stockQty > 0) {
    await supabase.from("purchase_lots").insert({
      store_id: storeId,
      product_id: product.id,
      received_qty: parsed.data.stockQty,
      remaining_qty: parsed.data.stockQty,
      unit_cost: parsed.data.costPrice ?? 0,
      source_ref: "initial-balance",
      created_by: user.id,
    });
  }

  revalidatePath(`/dashboard/store/${storeId}/inventory`);
  return { ok: true, data: { productId: product.id } };
}

export async function updateProductAction(
  productId: string,
  formData: FormData,
): Promise<Result<{ productId: string }>> {
  const parsed = parseProductInput(formData);
  if (!parsed.success) {
    return { ok: false, error: "Please check product details and try again." };
  }

  const imageInput = getImageInput(formData);
  if (!imageInput.ok) return imageInput;
  const { imageFile, removeImage } = imageInput.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in again." };
  }

  const { data: product } = await supabase
    .from("products")
    .select("store_id, image_url")
    .eq("id", productId)
    .single();

  if (!product) {
    return { ok: false, error: "Product not found." };
  }

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", product.store_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return {
      ok: false,
      error: "You do not have permission to edit this product.",
    };
  }

  let uploadedImage: {
    bucket: string;
    objectPath: string;
    publicUrl: string;
  } | null = null;

  if (imageFile) {
    const uploadResult = await uploadProductImage(
      supabase,
      product.store_id,
      imageFile,
    );
    if (!uploadResult.ok) return uploadResult;
    uploadedImage = uploadResult.data;
  }

  const currentImageUrl = product.image_url;
  const nextImageUrl = uploadedImage
    ? uploadedImage.publicUrl
    : removeImage
      ? null
      : currentImageUrl;

  const { error } = await supabase
    .from("products")
    .update({
      category_id: parsed.data.categoryId || null,
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      barcode: parsed.data.barcode || null,
      price: parsed.data.price,
      cost_price: parsed.data.costPrice || null,
      low_stock_at: parsed.data.lowStockAt,
      unit: parsed.data.unit,
      image_url: nextImageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    if (uploadedImage) {
      await supabase.storage
        .from(uploadedImage.bucket)
        .remove([uploadedImage.objectPath]);
    }
    return { ok: false, error: error.message };
  }

  const shouldDeleteCurrentImage =
    Boolean(currentImageUrl) && (Boolean(uploadedImage) || removeImage);
  if (shouldDeleteCurrentImage && currentImageUrl) {
    await removeImageByPublicUrl(supabase, currentImageUrl);
  }

  revalidatePath(`/dashboard/store/${product.store_id}/inventory`);
  return { ok: true, data: { productId } };
}

export async function removeProductImageAction(
  productId: string,
): Promise<Result<{ productId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in again." };
  }

  const { data: product } = await supabase
    .from("products")
    .select("store_id, image_url")
    .eq("id", productId)
    .single();

  if (!product) {
    return { ok: false, error: "Product not found." };
  }

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", product.store_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return {
      ok: false,
      error: "You do not have permission to edit this product.",
    };
  }

  if (!product.image_url) {
    return { ok: true, data: { productId } };
  }

  const { error } = await supabase
    .from("products")
    .update({ image_url: null, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await removeImageByPublicUrl(supabase, product.image_url);
  revalidatePath(`/dashboard/store/${product.store_id}/inventory`);
  return { ok: true, data: { productId } };
}

export async function deleteProductAction(productId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in again." };
  }

  const { data: product } = await supabase
    .from("products")
    .select("store_id, image_url")
    .eq("id", productId)
    .single();

  if (!product) {
    return { ok: false, error: "Product not found." };
  }

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", product.store_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return {
      ok: false,
      error: "You do not have permission to delete this product.",
    };
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return { ok: false, error: error.message };
  }

  if (product.image_url) {
    await removeImageByPublicUrl(supabase, product.image_url);
  }

  revalidatePath(`/dashboard/store/${product.store_id}/inventory`);
  return { ok: true };
}
