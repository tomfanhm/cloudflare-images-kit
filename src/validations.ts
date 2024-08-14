import { z } from "zod";

const ResponseItemSchema = z.object({
  code: z.number().int().min(1000),
  message: z.string(),
});

type ResponseItemSchema = z.infer<typeof ResponseItemSchema>;

const MetadataSchema = z.record(z.string(), z.any());

type MetadataSchema = z.infer<typeof MetadataSchema>;

export const ImageResultSchema = z.object({
  id: z.string(),
  filename: z.string(),
  meta: MetadataSchema.optional(),
  uploaded: z.string(),
  requireSignedURLs: z.boolean().optional(),
  variants: z.array(z.string()),
});

export type ImageResultSchema = z.infer<typeof ImageResultSchema>;

export const UploadImageResponseSchema = z.object({
  result: ImageResultSchema,
  success: z.boolean(),
  errors: ResponseItemSchema.array(),
  messages: ResponseItemSchema.array(),
});

export type UploadImageResponseSchema = z.infer<
  typeof UploadImageResponseSchema
>;

const BatchTokenResultSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
});

type BatchTokenResultSchema = z.infer<typeof BatchTokenResultSchema>;

export const RefreshBatchTokenResponseSchema = z.object({
  result: BatchTokenResultSchema,
  success: z.boolean(),
  errors: ResponseItemSchema.array(),
  messages: ResponseItemSchema.array(),
});

export type RefreshBatchTokenResponseSchema = z.infer<
  typeof RefreshBatchTokenResponseSchema
>;

export const ListImagesResponseSchema = z.object({
  result: z.object({
    images: z.array(ImageResultSchema),
  }),
  success: z.boolean(),
  errors: ResponseItemSchema.array(),
  messages: ResponseItemSchema.array(),
});

export type ListImagesResponseSchema = z.infer<typeof ListImagesResponseSchema>;

export const DeleteImageResponseSchema = z.object({
  result: z.object({}),
  success: z.boolean(),
  errors: ResponseItemSchema.array(),
  messages: ResponseItemSchema.array(),
});

export type DeleteImageResponseSchema = z.infer<
  typeof DeleteImageResponseSchema
>;

export const GetImageDetailsResponseSchema = z.object({
  result: ImageResultSchema,
  success: z.boolean(),
  errors: ResponseItemSchema.array(),
  messages: ResponseItemSchema.array(),
});

export type GetImageDetailsResponseSchema = z.infer<
  typeof GetImageDetailsResponseSchema
>;

export const GetUsageStatsResponseSchema = z.object({
  result: z.object({
    count: z.object({
      allowed: z.number(),
      current: z.number(),
    }),
  }),
  success: z.boolean(),
  errors: ResponseItemSchema.array(),
  messages: ResponseItemSchema.array(),
});

export type GetUsageStatsResponseSchema = z.infer<
  typeof GetUsageStatsResponseSchema
>;

export const UpdateImageResponseSchema = z.object({
  result: ImageResultSchema,
  success: z.boolean(),
  errors: ResponseItemSchema.array(),
  messages: ResponseItemSchema.array(),
});

export type UpdateImageResponseSchema = z.infer<
  typeof UpdateImageResponseSchema
>;
