import { z } from "zod";

export const aiSectionSchema = z.enum(["timecycle", "tracers", "hit_effects", "kill_effect", "optimization", "textures"]);
export const aiRiskSchema = z.enum(["low", "medium", "high"]);
export const aiChangeTypeSchema = z.enum(["find_replace", "manual_instruction", "report_only"]);

export const aiSuggestionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    reason: z.string().min(1),
    risk: aiRiskSchema,
    targetFilePath: z.string().min(1),
    changeType: aiChangeTypeSchema,
    patch: z
      .object({
        find: z.string(),
        replace: z.string()
      })
      .optional(),
    manualSteps: z.array(z.string()).optional(),
    testingNotes: z.array(z.string()).optional()
  })
  .superRefine((value, ctx) => {
    if (value.changeType === "find_replace" && (!value.patch?.find || value.patch.replace === undefined)) {
      ctx.addIssue({
        code: "custom",
        message: "find_replace suggestions must include patch.find and patch.replace.",
        path: ["patch"]
      });
    }

    if (value.changeType === "manual_instruction" && (!value.manualSteps || value.manualSteps.length === 0)) {
      ctx.addIssue({
        code: "custom",
        message: "manual_instruction suggestions must include manualSteps.",
        path: ["manualSteps"]
      });
    }
  });

export const aiResponseSchema = z.object({
  summary: z.string().min(1),
  section: aiSectionSchema,
  suggestions: z.array(aiSuggestionSchema),
  warnings: z.array(z.string()),
  testingChecklist: z.array(z.string())
});
