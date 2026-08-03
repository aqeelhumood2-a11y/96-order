import { vi } from "vitest";
import type { ReportDeps } from "@/services/reports/dependencies";

export function createMockReportDeps(): ReportDeps {
  return {
    reports: {
      getDashboardCounts: vi.fn(),
      listOrdersForReport: vi.fn().mockResolvedValue([]),
      listOrderLinesForReport: vi.fn().mockResolvedValue([]),
    },
  };
}
