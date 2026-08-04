"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Brand, Category, Product } from "@/core/catalog/entities";
import { PRODUCT_STATUSES, PRODUCT_VISIBILITIES } from "@/core/catalog/entities";
import { createProductAction, updateProductAction } from "@/features/catalog/products/actions";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { Select } from "@/ui/primitives/select";
import { Textarea } from "@/ui/primitives/textarea";
import { emptyVariant, VariantEditor, type VariantFormState } from "./variant-editor";

function toVariantFormState(product: Product): VariantFormState[] {
  return product.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    barcode: variant.barcode ?? "",
    priceOverride: variant.priceOverride?.toString() ?? "",
    compareAtPriceOverride: variant.compareAtPriceOverride?.toString() ?? "",
    costOverride: variant.costOverride?.toString() ?? "",
    weightGramsOverride: variant.weightGramsOverride?.toString() ?? "",
    attributeSelections: Object.entries(variant.attributeSelections).map(([key, value]) => ({ key, value })),
    status: variant.status,
    trackInventory: variant.trackInventory,
    allowBackorder: variant.allowBackorder,
    lowStockThreshold: variant.lowStockThreshold?.toString() ?? "",
  }));
}

function numberOrUndefined(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function ProductForm({ product, categories, brands }: { product?: Product; categories: Category[]; brands: Brand[] }) {
  const router = useRouter();
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [fullDescription, setFullDescription] = useState(product?.fullDescription ?? "");
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [primaryCategoryId, setPrimaryCategoryId] = useState(product?.primaryCategoryId ?? categories[0]?.id ?? "");
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>(product?.additionalCategoryIds ?? []);
  const [productType, setProductType] = useState(product?.productType ?? "");
  const [status, setStatus] = useState(product?.status ?? "draft");
  const [visibility, setVisibility] = useState(product?.visibility ?? "hidden");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [sku, setSku] = useState(product?.sku ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [basePrice, setBasePrice] = useState(product?.basePrice?.toString() ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice?.toString() ?? "");
  const [costPrice, setCostPrice] = useState(product?.costPrice?.toString() ?? "");
  const [taxClass, setTaxClass] = useState(product?.taxClass ?? "");
  const [trackInventory, setTrackInventory] = useState(product?.trackInventory ?? true);
  const [allowBackorder, setAllowBackorder] = useState(product?.allowBackorder ?? false);
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold?.toString() ?? "");
  const [weightGrams, setWeightGrams] = useState(product?.weightGrams?.toString() ?? "");
  const [lengthCm, setLengthCm] = useState(product?.dimensions?.lengthCm?.toString() ?? "");
  const [widthCm, setWidthCm] = useState(product?.dimensions?.widthCm?.toString() ?? "");
  const [heightCm, setHeightCm] = useState(product?.dimensions?.heightCm?.toString() ?? "");
  const [tags, setTags] = useState(product?.tags?.join(", ") ?? "");
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription ?? "");
  const [hasVariants, setHasVariants] = useState(product?.hasVariants ?? false);
  const [variants, setVariants] = useState<VariantFormState[]>(product ? toVariantFormState(product) : [emptyVariant()]);

  const [beanType, setBeanType] = useState(product?.attributes?.coffee?.beanType ?? "");
  const [roastLevel, setRoastLevel] = useState(product?.attributes?.coffee?.roastLevel ?? "");
  const [originCountry, setOriginCountry] = useState(product?.attributes?.coffee?.originCountry ?? "");
  const [region, setRegion] = useState(product?.attributes?.coffee?.region ?? "");
  const [farmOrProducer, setFarmOrProducer] = useState(product?.attributes?.coffee?.farmOrProducer ?? "");
  const [processingMethod, setProcessingMethod] = useState(product?.attributes?.coffee?.processingMethod ?? "");
  const [variety, setVariety] = useState(product?.attributes?.coffee?.variety ?? "");
  const [grindType, setGrindType] = useState(product?.attributes?.coffee?.grindType ?? "");
  const [tastingNotes, setTastingNotes] = useState(product?.attributes?.coffee?.tastingNotes?.join(", ") ?? "");

  const [manufacturer, setManufacturer] = useState(product?.attributes?.equipment?.manufacturer ?? "");
  const [model, setModel] = useState(product?.attributes?.equipment?.model ?? "");
  const [material, setMaterial] = useState(product?.attributes?.equipment?.material ?? "");
  const [color, setColor] = useState(product?.attributes?.equipment?.color ?? "");
  const [capacity, setCapacity] = useState(product?.attributes?.equipment?.capacity ?? "");
  const [voltage, setVoltage] = useState(product?.attributes?.equipment?.voltage ?? "");
  const [warrantyPeriod, setWarrantyPeriod] = useState(product?.attributes?.equipment?.warrantyPeriod ?? "");

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleAdditionalCategory(categoryId: string) {
    setAdditionalCategoryIds((current) => (current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!name.trim() || !sku.trim() || !primaryCategoryId) {
      setFormError("Name, SKU, and a primary category are required.");
      return;
    }

    const basePriceNumber = numberOrUndefined(basePrice);
    if (basePriceNumber === undefined) {
      setFormError("Base price is required.");
      return;
    }

    const hasDimensions = lengthCm.trim() || widthCm.trim() || heightCm.trim();

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      shortDescription: shortDescription.trim() || undefined,
      fullDescription: fullDescription.trim() || undefined,
      brandId: brandId || null,
      primaryCategoryId,
      additionalCategoryIds,
      productType: productType.trim(),
      status,
      visibility,
      featured,
      sku: sku.trim(),
      barcode: barcode.trim() || undefined,
      basePrice: basePriceNumber,
      compareAtPrice: numberOrUndefined(compareAtPrice),
      costPrice: numberOrUndefined(costPrice),
      taxClass: taxClass.trim() || undefined,
      trackInventory,
      allowBackorder,
      lowStockThreshold: numberOrUndefined(lowStockThreshold),
      weightGrams: numberOrUndefined(weightGrams),
      dimensions: hasDimensions
        ? { lengthCm: Number(lengthCm) || 0, widthCm: Number(widthCm) || 0, heightCm: Number(heightCm) || 0 }
        : undefined,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      hasVariants,
      variants: hasVariants
        ? variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku.trim(),
            barcode: variant.barcode.trim() || undefined,
            priceOverride: numberOrUndefined(variant.priceOverride),
            compareAtPriceOverride: numberOrUndefined(variant.compareAtPriceOverride),
            costOverride: numberOrUndefined(variant.costOverride),
            weightGramsOverride: numberOrUndefined(variant.weightGramsOverride),
            attributeSelections: Object.fromEntries(
              variant.attributeSelections.filter((attr) => attr.key.trim() && attr.value.trim()).map((attr) => [attr.key.trim(), attr.value.trim()]),
            ),
            status: variant.status,
            trackInventory: variant.trackInventory,
            allowBackorder: variant.allowBackorder,
            lowStockThreshold: numberOrUndefined(variant.lowStockThreshold),
          }))
        : [],
      attributes: {
        coffee:
          beanType || roastLevel || originCountry || region || farmOrProducer || processingMethod || variety || grindType || tastingNotes
            ? {
                beanType: beanType.trim() || undefined,
                roastLevel: roastLevel.trim() || undefined,
                originCountry: originCountry.trim() || undefined,
                region: region.trim() || undefined,
                farmOrProducer: farmOrProducer.trim() || undefined,
                processingMethod: processingMethod.trim() || undefined,
                variety: variety.trim() || undefined,
                grindType: grindType.trim() || undefined,
                tastingNotes: tastingNotes.split(",").map((note) => note.trim()).filter(Boolean),
              }
            : undefined,
        equipment:
          manufacturer || model || material || color || capacity || voltage || warrantyPeriod
            ? {
                manufacturer: manufacturer.trim() || undefined,
                model: model.trim() || undefined,
                material: material.trim() || undefined,
                color: color.trim() || undefined,
                capacity: capacity.trim() || undefined,
                voltage: voltage.trim() || undefined,
                warrantyPeriod: warrantyPeriod.trim() || undefined,
              }
            : undefined,
      },
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const result = await updateProductAction(product!.id, { ...payload, version: product!.version });
        if (!result.ok) {
          setFormError(result.message);
          return;
        }
        setSuccessMessage("Product saved.");
        router.refresh();
        return;
      }

      const result = await createProductAction(payload);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      setSuccessMessage("Product created.");
      router.push(`/admin/products/${result.data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-lg border border-surface-border bg-background p-6">
        <h2 className="text-lg font-semibold text-brand-950">Basics</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-name">Name</Label>
          <Input id="product-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-slug">Slug (optional — derived from name if left blank)</Label>
          <Input id="product-slug" value={slug} onChange={(event) => setSlug(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-type">Product type (e.g. coffee_beans, grinder)</Label>
          <Input id="product-type" value={productType} onChange={(event) => setProductType(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-short-description">Short description</Label>
          <Textarea id="product-short-description" value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-full-description">Full description</Label>
          <Textarea id="product-full-description" className="min-h-40" value={fullDescription} onChange={(event) => setFullDescription(event.target.value)} disabled={isSubmitting} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-brand">Brand</Label>
            <Select id="product-brand" value={brandId} onChange={(event) => setBrandId(event.target.value)} disabled={isSubmitting}>
              <option value="">No brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-primary-category">Primary category</Label>
            <Select id="product-primary-category" value={primaryCategoryId} onChange={(event) => setPrimaryCategoryId(event.target.value)} disabled={isSubmitting}>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium text-foreground">Additional categories</legend>
          <div className="flex flex-wrap gap-3">
            {categories
              .filter((category) => category.id !== primaryCategoryId)
              .map((category) => (
                <label key={category.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={additionalCategoryIds.includes(category.id)} onChange={() => toggleAdditionalCategory(category.id)} disabled={isSubmitting} />
                  {category.name}
                </label>
              ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-status">Status</Label>
            <Select id="product-status" value={status} onChange={(event) => setStatus(event.target.value as (typeof PRODUCT_STATUSES)[number])} disabled={isSubmitting}>
              {PRODUCT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-visibility">Visibility</Label>
            <Select id="product-visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as (typeof PRODUCT_VISIBILITIES)[number])} disabled={isSubmitting}>
              {PRODUCT_VISIBILITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} disabled={isSubmitting} />
            Featured
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-tags">Tags (comma-separated)</Label>
          <Input id="product-tags" value={tags} onChange={(event) => setTags(event.target.value)} disabled={isSubmitting} />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-surface-border bg-background p-6">
        <h2 className="text-lg font-semibold text-brand-950">SEO</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-seo-title">SEO title</Label>
          <Input id="product-seo-title" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-seo-description">SEO description</Label>
          <Textarea id="product-seo-description" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} disabled={isSubmitting} />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-surface-border bg-background p-6">
        <h2 className="text-lg font-semibold text-brand-950">Identifiers &amp; pricing</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-sku">SKU</Label>
            <Input id="product-sku" value={sku} onChange={(event) => setSku(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-barcode">Barcode (optional)</Label>
            <Input id="product-barcode" value={barcode} onChange={(event) => setBarcode(event.target.value)} disabled={isSubmitting} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-base-price">Base price</Label>
            <Input id="product-base-price" type="number" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-compare-price">Compare-at price</Label>
            <Input id="product-compare-price" type="number" value={compareAtPrice} onChange={(event) => setCompareAtPrice(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-cost-price">Cost price</Label>
            <Input id="product-cost-price" type="number" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} disabled={isSubmitting} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-tax-class">Tax classification (for your records)</Label>
          <Input id="product-tax-class" value={taxClass} onChange={(event) => setTaxClass(event.target.value)} disabled={isSubmitting} />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-surface-border bg-background p-6">
        <h2 className="text-lg font-semibold text-brand-950">Inventory</h2>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={trackInventory} onChange={(event) => setTrackInventory(event.target.checked)} disabled={isSubmitting} />
            Track inventory
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allowBackorder} onChange={(event) => setAllowBackorder(event.target.checked)} disabled={isSubmitting} />
            Allow backorder
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-low-stock">Low-stock threshold</Label>
          <Input id="product-low-stock" type="number" value={lowStockThreshold} onChange={(event) => setLowStockThreshold(event.target.value)} disabled={isSubmitting} className="max-w-40" />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-surface-border bg-background p-6">
        <h2 className="text-lg font-semibold text-brand-950">Shipping</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-weight">Weight (g)</Label>
            <Input id="product-weight" type="number" value={weightGrams} onChange={(event) => setWeightGrams(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-length">Length (cm)</Label>
            <Input id="product-length" type="number" value={lengthCm} onChange={(event) => setLengthCm(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-width">Width (cm)</Label>
            <Input id="product-width" type="number" value={widthCm} onChange={(event) => setWidthCm(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-height">Height (cm)</Label>
            <Input id="product-height" type="number" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} disabled={isSubmitting} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-surface-border bg-background p-6">
        <h2 className="text-lg font-semibold text-brand-950">Coffee attributes (optional)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Bean type</Label>
            <Input value={beanType} onChange={(event) => setBeanType(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Roast level</Label>
            <Input value={roastLevel} onChange={(event) => setRoastLevel(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Origin country</Label>
            <Input value={originCountry} onChange={(event) => setOriginCountry(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Region</Label>
            <Input value={region} onChange={(event) => setRegion(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Farm or producer</Label>
            <Input value={farmOrProducer} onChange={(event) => setFarmOrProducer(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Processing method</Label>
            <Input value={processingMethod} onChange={(event) => setProcessingMethod(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Variety</Label>
            <Input value={variety} onChange={(event) => setVariety(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Grind type</Label>
            <Input value={grindType} onChange={(event) => setGrindType(event.target.value)} disabled={isSubmitting} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tasting notes (comma-separated)</Label>
          <Input value={tastingNotes} onChange={(event) => setTastingNotes(event.target.value)} disabled={isSubmitting} />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-surface-border bg-background p-6">
        <h2 className="text-lg font-semibold text-brand-950">Equipment attributes (optional)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Manufacturer</Label>
            <Input value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Model</Label>
            <Input value={model} onChange={(event) => setModel(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Material</Label>
            <Input value={material} onChange={(event) => setMaterial(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <Input value={color} onChange={(event) => setColor(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Capacity</Label>
            <Input value={capacity} onChange={(event) => setCapacity(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Voltage</Label>
            <Input value={voltage} onChange={(event) => setVoltage(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Warranty period</Label>
            <Input value={warrantyPeriod} onChange={(event) => setWarrantyPeriod(event.target.value)} disabled={isSubmitting} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-surface-border bg-background p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-950">Variants</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasVariants} onChange={(event) => setHasVariants(event.target.checked)} disabled={isSubmitting} />
            This product has variants
          </label>
        </div>
        {hasVariants && <VariantEditor variants={variants} onChange={setVariants} disabled={isSubmitting} />}
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-brand-100 bg-background/95 px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] backdrop-blur sm:-mx-6 sm:px-6">
        {formError && (
          <p role="alert" className="text-sm text-danger-600">
            {formError}
          </p>
        )}
        {successMessage && (
          <p role="status" className="text-sm text-success-700">
            {successMessage}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
