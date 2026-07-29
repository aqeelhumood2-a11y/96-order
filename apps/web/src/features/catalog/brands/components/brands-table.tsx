import type { Brand } from "@/core/catalog/entities";
import { DeleteBrandButton } from "./delete-brand-button";

export function BrandsTable({
  brands,
  canManage,
  onEdit,
}: {
  brands: Brand[];
  canManage: boolean;
  onEdit: (brand: Brand) => void;
}) {
  if (brands.length === 0) {
    return <p className="text-sm text-foreground/60">No brands yet.</p>;
  }

  return (
    <ul className="flex flex-col">
      {brands.map((brand) => (
        <li key={brand.id} className="flex items-center justify-between gap-4 border-b border-brand-100 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {brand.name} {!brand.isActive && <span className="text-xs text-foreground/50">(inactive)</span>}
            </span>
            <span className="text-xs text-foreground/50">/{brand.slug}</span>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onEdit(brand)} className="text-sm text-brand-700 hover:underline">
                Edit
              </button>
              <DeleteBrandButton brandId={brand.id} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
