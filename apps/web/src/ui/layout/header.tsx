import Link from "next/link";
import { Container } from "./container";

/**
 * Foundation-phase placeholder: brand mark and nothing else. Navigation,
 * search, cart, and account entry points are added once those features
 * exist, so this never has to be redesigned — only extended.
 */
export function Header() {
  return (
    <header className="border-b border-brand-100 bg-background">
      <Container className="flex h-16 items-center">
        <Link href="/" className="text-lg font-semibold tracking-tight text-brand-900">
          96 Order
        </Link>
      </Container>
    </header>
  );
}
