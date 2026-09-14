import { NextResponse } from "next/server";
import { hasPermission } from "@/core/auth/permissions";
import { toErrorResponse } from "@/core/errors";
import { listOrdersQuerySchema } from "@/core/orders/schemas";
import { requireSession } from "@/services/auth/session";
import { listOrders } from "@/services/orders/list-orders";
import { adminListQuestions } from "@/services/questions/list-questions";
import { adminListReviews } from "@/services/reviews/admin-list-reviews";

export const dynamic = "force-dynamic";

/**
 * Polled by `AdminNav` to light up a small badge on Orders/Questions/Reviews
 * whenever something in that section needs staff attention — an order not
 * yet accepted, a question not yet answered, a review not yet moderated.
 * Each check is skipped (and reported as "nothing pending") for a resource
 * the signed-in staff member can't view, rather than 403ing the whole
 * response — a staff member with only `orders:view`, say, still gets their
 * orders badge instead of an error breaking the entire nav.
 */
export async function GET() {
  try {
    const actor = await requireSession();

    const [ordersPage, questionsPage, reviewsPage] = await Promise.all([
      hasPermission(actor, "orders:view")
        ? listOrders(actor, listOrdersQuerySchema.parse({ limit: 1, status: "confirmed" }))
        : Promise.resolve({ items: [], nextCursor: null }),
      hasPermission(actor, "questions:view")
        ? adminListQuestions(actor, { limit: 1, status: "pending" })
        : Promise.resolve({ items: [], nextCursor: null }),
      hasPermission(actor, "reviews:view")
        ? adminListReviews(actor, { limit: 1, status: "pending" })
        : Promise.resolve({ items: [], nextCursor: null }),
    ]);

    return NextResponse.json({
      orders: ordersPage.items.length > 0,
      questions: questionsPage.items.length > 0,
      reviews: reviewsPage.items.length > 0,
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
