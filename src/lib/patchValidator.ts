import type { PatchReviewState, PatchValidationResult } from "../types/patches";
import type { ReduxProject } from "../types/project";
import { validatePatches as validatePatchesCommand } from "./tauriApi";

export async function validatePatchReviews(project: ReduxProject, reviews: PatchReviewState[]) {
  if (!reviews.length) return [];
  return validatePatchesCommand(project, reviews);
}

export function applyValidationResults(reviews: PatchReviewState[], results: PatchValidationResult[]) {
  const byId = new Map(results.map((result) => [result.id, result]));
  return reviews.map((review) => {
    const validation = byId.get(review.id);
    if (!validation) return review;
    return {
      ...review,
      validation,
      reviewStatus: validation.canApply ? "validated" : validation.status === "already_applied" ? "applied" : "failed"
    } satisfies PatchReviewState;
  });
}
