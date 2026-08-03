import { NextResponse } from "next/server";
import { toErrorResponse } from "@/core/errors";
import { getCustomerSession } from "@/services/customer-auth/session";
import { listMyWishlistKeys } from "@/services/wishlist/wishlist";

/**
 * Signed-in customers only — returns an empty list for guests rather than
 * a 401, since the client-side wishlist provider calls this unconditionally
 * on mount and treats "no keys" and "not signed in" the same way (it falls
 * back to the `localStorage` guest list either way).
 */
export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ keys: [] });
    }
    const keys = await listMyWishlistKeys(session);
    return NextResponse.json({ keys });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
