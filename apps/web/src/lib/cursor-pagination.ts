/**
 * A generic version of `features/storefront/listing/query-utils.ts`'s
 * cursor-history approach, usable by any admin list page (orders,
 * customers, …) instead of one tied to a single query schema — the
 * caller supplies the already-built "everything except cursor/cursors"
 * query string, and this only ever adds/removes those two cursor params.
 * See that file's doc comment for why "Previous" needs a cursor history
 * at all: Firestore cursor pagination has no way to page backward on its
 * own, so the visited cursors are threaded through the URL instead.
 */
export interface CursorState {
  cursor?: string;
  history: string[];
}

export function parseCursorState(cursor: string | undefined, cursorsParam: string | undefined): CursorState {
  return { cursor, history: cursorsParam ? cursorsParam.split(",").filter(Boolean) : [] };
}

export function nextPageHref(basePath: string, baseQueryString: string, state: CursorState, nextCursor: string): string {
  const params = new URLSearchParams(baseQueryString);
  const history = state.cursor !== undefined ? [...state.history, state.cursor] : state.history;
  if (history.length > 0) params.set("cursors", history.join(","));
  params.set("cursor", nextCursor);
  return `${basePath}?${params.toString()}`;
}

export function prevPageHref(basePath: string, baseQueryString: string, state: CursorState): string {
  const params = new URLSearchParams(baseQueryString);
  const history = [...state.history];
  const prevCursor = history.pop();
  if (history.length > 0) params.set("cursors", history.join(","));
  if (prevCursor !== undefined) params.set("cursor", prevCursor);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
