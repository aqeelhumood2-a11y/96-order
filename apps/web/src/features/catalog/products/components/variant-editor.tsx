"use client";

import type { ProductStatus } from "@/core/catalog/entities";
import { PRODUCT_STATUSES } from "@/core/catalog/entities";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { Select } from "@/ui/primitives/select";

export interface VariantAttributePair {
  key: string;
  value: string;
}

export interface VariantFormState {
  id?: string;
  sku: string;
  barcode: string;
  priceOverride: string;
  compareAtPriceOverride: string;
  costOverride: string;
  weightGramsOverride: string;
  attributeSelections: VariantAttributePair[];
  status: ProductStatus;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold: string;
}

export function emptyVariant(): VariantFormState {
  return {
    sku: "",
    barcode: "",
    priceOverride: "",
    compareAtPriceOverride: "",
    costOverride: "",
    weightGramsOverride: "",
    attributeSelections: [{ key: "", value: "" }],
    status: "active",
    trackInventory: true,
    allowBackorder: false,
    lowStockThreshold: "",
  };
}

interface VariantEditorProps {
  variants: VariantFormState[];
  onChange: (variants: VariantFormState[]) => void;
  disabled?: boolean;
}

/**
 * Attribute selections (e.g. "Bag size" -> "500g") are edited as free-form
 * key/value pairs rather than a fixed dropdown of attribute names — the
 * catalog is meant to stay configurable for product families beyond the
 * ones this phase ships with (see the README's product/variant model
 * section), so hardcoding a closed set of attribute names here would
 * undercut that.
 */
export function VariantEditor({ variants, onChange, disabled }: VariantEditorProps) {
  function updateVariant(index: number, patch: Partial<VariantFormState>) {
    onChange(variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  }

  function updateAttribute(variantIndex: number, attrIndex: number, patch: Partial<VariantAttributePair>) {
    const variant = variants[variantIndex]!;
    const nextAttributes = variant.attributeSelections.map((attr, i) => (i === attrIndex ? { ...attr, ...patch } : attr));
    updateVariant(variantIndex, { attributeSelections: nextAttributes });
  }

  function addAttribute(variantIndex: number) {
    const variant = variants[variantIndex]!;
    updateVariant(variantIndex, { attributeSelections: [...variant.attributeSelections, { key: "", value: "" }] });
  }

  function removeAttribute(variantIndex: number, attrIndex: number) {
    const variant = variants[variantIndex]!;
    updateVariant(variantIndex, { attributeSelections: variant.attributeSelections.filter((_, i) => i !== attrIndex) });
  }

  function addVariant() {
    onChange([...variants, emptyVariant()]);
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      {variants.map((variant, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-md border border-brand-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Variant {index + 1}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => removeVariant(index)} disabled={disabled}>
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <Label>SKU</Label>
              <Input value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} disabled={disabled} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Barcode</Label>
              <Input value={variant.barcode} onChange={(event) => updateVariant(index, { barcode: event.target.value })} disabled={disabled} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Price override</Label>
              <Input type="number" value={variant.priceOverride} onChange={(event) => updateVariant(index, { priceOverride: event.target.value })} disabled={disabled} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Compare-at override</Label>
              <Input
                type="number"
                value={variant.compareAtPriceOverride}
                onChange={(event) => updateVariant(index, { compareAtPriceOverride: event.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Cost override</Label>
              <Input type="number" value={variant.costOverride} onChange={(event) => updateVariant(index, { costOverride: event.target.value })} disabled={disabled} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Weight override (g)</Label>
              <Input
                type="number"
                value={variant.weightGramsOverride}
                onChange={(event) => updateVariant(index, { weightGramsOverride: event.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Status</Label>
              <Select value={variant.status} onChange={(event) => updateVariant(index, { status: event.target.value as ProductStatus })} disabled={disabled}>
                {PRODUCT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Low-stock threshold</Label>
              <Input
                type="number"
                value={variant.lowStockThreshold}
                onChange={(event) => updateVariant(index, { lowStockThreshold: event.target.value })}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={variant.trackInventory} onChange={(event) => updateVariant(index, { trackInventory: event.target.checked })} disabled={disabled} />
              Track inventory
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={variant.allowBackorder} onChange={(event) => updateVariant(index, { allowBackorder: event.target.checked })} disabled={disabled} />
              Allow backorder
            </label>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium text-foreground/60">Attribute selections (e.g. Bag size = 500g)</legend>
            {variant.attributeSelections.map((attr, attrIndex) => (
              <div key={attrIndex} className="flex items-center gap-2">
                <Input placeholder="Attribute" value={attr.key} onChange={(event) => updateAttribute(index, attrIndex, { key: event.target.value })} disabled={disabled} />
                <Input placeholder="Value" value={attr.value} onChange={(event) => updateAttribute(index, attrIndex, { value: event.target.value })} disabled={disabled} />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeAttribute(index, attrIndex)} disabled={disabled}>
                  &times;
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => addAttribute(index)} disabled={disabled}>
              Add attribute
            </Button>
          </fieldset>
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" className="w-fit" onClick={addVariant} disabled={disabled}>
        Add variant
      </Button>
    </div>
  );
}
