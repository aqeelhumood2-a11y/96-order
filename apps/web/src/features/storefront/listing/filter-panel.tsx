import type { PublicBrand, PublicCategory } from "@/core/storefront/dto";
import type { ParsedListProductsQuery } from "@/core/storefront/schemas";
import { Button, Input, Label } from "@/ui/primitives";

export interface FilterPanelProps {
  basePath: string;
  query: ParsedListProductsQuery;
  /** Omitted entirely (not just empty) when the current route already scopes to one category — e.g. `/categories/[slug]`. */
  categories?: PublicCategory[];
  /** Omitted entirely when the current route already scopes to one brand — e.g. `/brands/[slug]`. */
  brands?: PublicBrand[];
}

const MINOR_UNITS_PER_MAJOR = 100;

/**
 * A plain GET form — works without JavaScript, and produces a shareable,
 * bookmarkable URL for any combination of filters (the same
 * progressive-enhancement approach as the header search box). Changing any
 * filter resets pagination to page one by simply not including a `cursor`
 * field.
 *
 * `minPriceUsd`/`maxPriceUsd` are user-facing dollar amounts, not the
 * `minPrice`/`maxPrice` query keys `listProductsQuerySchema` expects
 * (minor units/cents, matching how prices are stored) — the page route
 * converts between the two before parsing, keeping this form's inputs in
 * the unit a shopper actually thinks in.
 */
export function FilterPanel({ basePath, query, categories, brands }: FilterPanelProps) {
  return (
    <form action={basePath} method="get" className="flex flex-col gap-5">
      {categories && categories.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-category">Category</Label>
          <select
            id="filter-category"
            name="category"
            defaultValue={query.category ?? ""}
            className="h-10 rounded-md border border-brand-300 bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {brands && brands.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-brand">Brand</Label>
          <select
            id="filter-brand"
            name="brand"
            defaultValue={query.brand ?? ""}
            className="h-10 rounded-md border border-brand-300 bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-product-type">Product type</Label>
        <Input id="filter-product-type" name="productType" defaultValue={query.productType ?? ""} placeholder="coffee, equipment…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-min-price">Min price (USD)</Label>
          <Input
            id="filter-min-price"
            name="minPriceUsd"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            defaultValue={query.minPrice !== undefined ? query.minPrice / MINOR_UNITS_PER_MAJOR : undefined}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-max-price">Max price (USD)</Label>
          <Input
            id="filter-max-price"
            name="maxPriceUsd"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            defaultValue={query.maxPrice !== undefined ? query.maxPrice / MINOR_UNITS_PER_MAJOR : undefined}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-availability">Availability</Label>
        <select
          id="filter-availability"
          name="availability"
          defaultValue={query.availability ?? "all"}
          className="h-10 rounded-md border border-brand-300 bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <option value="all">All items</option>
          <option value="in_stock">In stock only</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="filter-featured"
          name="featured"
          type="checkbox"
          value="true"
          defaultChecked={query.featured === true}
          className="h-4 w-4 rounded border-brand-300 text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
        <Label htmlFor="filter-featured" className="font-normal">
          Featured only
        </Label>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-sort">Sort by</Label>
        <select
          id="filter-sort"
          name="sort"
          defaultValue={query.sort}
          className="h-10 rounded-md border border-brand-300 bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <option value="newest">Newest</option>
          <option value="name">Name (A–Z)</option>
          <option value="price_asc">Price (low to high)</option>
          <option value="price_desc">Price (high to low)</option>
        </select>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit">Apply filters</Button>
        <a href={basePath} className="text-sm font-medium text-brand-700 hover:text-brand-900 hover:underline">
          Clear all
        </a>
      </div>
    </form>
  );
}
