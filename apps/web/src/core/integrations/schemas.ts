import { z } from "zod";

export const posIntegrationInputSchema = z.object({
  webhookUrl: z.string().trim().url("Enter a valid URL.").or(z.literal("")),
  apiKey: z.string().trim(),
});
export type PosIntegrationInput = z.infer<typeof posIntegrationInputSchema>;
