import type { ReportRepository } from "@/core/interfaces/report-repository";
import { FirestoreReportRepository } from "@/infrastructure/firebase/repositories/firestore-report-repository";

export interface ReportDeps {
  reports: ReportRepository;
}

export const defaultReportDeps: ReportDeps = {
  reports: new FirestoreReportRepository(),
};

/** Hard cap on how many orders a single report call scans — see `core/interfaces/report-repository.ts`'s doc comment for the volume assumption this relies on, and README's Known limitations. */
export const REPORT_SCAN_LIMIT = 5000;
