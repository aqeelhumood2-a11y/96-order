"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/ui/primitives";
import { MIN_SEARCH_QUERY_LENGTH } from "@/core/storefront/schemas";

const DEBOUNCE_MS = 350;

export interface SearchInputProps {
  initialQuery: string;
}

/**
 * A plain GET form underneath (works without JavaScript — pressing Enter
 * submits it normally) with a debounced auto-navigate layered on top: once
 * JavaScript is available, typing updates the URL after a short pause
 * instead of waiting for an explicit submit. Below `MIN_SEARCH_QUERY_LENGTH`
 * characters, the `q` param is dropped entirely rather than firing a query
 * that would always be rejected.
 */
export function SearchInput({ initialQuery }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = next.trim();
      if (trimmed.length >= MIN_SEARCH_QUERY_LENGTH) {
        router.replace(`${pathname}?q=${encodeURIComponent(trimmed)}`);
      } else {
        router.replace(pathname);
      }
    }, DEBOUNCE_MS);
  }

  return (
    <form
      action={pathname}
      method="get"
      role="search"
      onSubmit={() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      }}
    >
      <label htmlFor="search-q" className="sr-only">
        Search products
      </label>
      <Input
        id="search-q"
        name="q"
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Search coffee, brewers, brands…"
        minLength={MIN_SEARCH_QUERY_LENGTH}
        autoComplete="off"
      />
    </form>
  );
}
