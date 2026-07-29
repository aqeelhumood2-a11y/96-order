import { Container } from "./container";

/**
 * Foundation-phase placeholder. CMS-driven footer links (About, Privacy
 * Policy, Terms, etc.) are added once the CMS module exists, so this only
 * needs a home for the copyright line until then.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-100 bg-background">
      <Container className="flex h-16 items-center text-sm text-foreground/60">
        <p>© {new Date().getFullYear()} 96 Order. All rights reserved.</p>
      </Container>
    </footer>
  );
}
