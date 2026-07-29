import { Container } from "@/ui/layout/container";

/**
 * Foundation-phase placeholder for the home feature slice. The real
 * homepage (banners, offers, featured products) is admin-configurable and
 * lands once the CMS/admin and catalog modules exist; this only proves the
 * layout shell, design tokens, and feature-slice wiring end to end.
 */
export function ComingSoon() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-700">
        Foundation phase
      </span>
      <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">
        96 Order
      </h1>
      <p className="max-w-md text-base text-foreground/70">
        A premium coffee and equipment store is being built here. This page
        will become the storefront once the catalog and admin modules ship.
      </p>
    </Container>
  );
}
