import { z } from "zod";

const urlSchema = z
  .string()
  .trim()
  .url("Invalid URL")
  .optional()
  .or(z.literal(""));

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid user id")
  .optional();

const skillSchema = z
  .string()
  .trim()
  .min(1, "Skill cannot be empty")
  .max(40, "Skill must be under 40 characters")
  .transform((v) => v.toLowerCase());

const experienceSchema = z.object({
  title: z.string().trim().max(80).optional().or(z.literal("")),
  company: z.string().trim().max(80).optional().or(z.literal("")),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

const projectSchema = z.object({
  title: z.string().trim().max(100).optional().or(z.literal("")),
  description: z.string().trim().max(700).optional().or(z.literal("")),
  techStack: z.array(skillSchema).max(20).optional().default([]),
  projectUrl: urlSchema,
  githubUrl: urlSchema,
});

const socialLinksSchema = z.object({
  linkedin: urlSchema,
  github: urlSchema,
  twitter: urlSchema,
  portfolio: urlSchema,
});

export const createTalentProfileSchema = z.object({
  body: z.object({
    user: objectIdSchema,

    fullname: z
      .string()
      .trim()
      .min(3, "Full name must be at least 3 characters")
      .max(80, "Full name must be under 80 characters"),

    headline: z.string().trim().max(120).optional().or(z.literal("")),

    avatar: urlSchema,

    bio: z.string().trim().max(1000).optional().or(z.literal("")),

    skills: z.array(skillSchema).max(30).optional().default([]),

    experience: z.array(experienceSchema).max(20).optional().default([]),

    projects: z.array(projectSchema).max(20).optional().default([]),

    socialLinks: socialLinksSchema.optional().default({}),

    availability: z.enum(["open", "not-looking"]).optional(),

    verifiedBadge: z.boolean().optional(),
  }),
});

export const updateTalentProfileSchema = z.object({
  body: createTalentProfileSchema.shape.body.partial().refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required to update",
    }
  ),
});

export const getTalentProfileByUserIdSchema = z.object({
  params: z.object({
    userId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid user id"),
  }),
});

export default {
  createTalentProfileSchema,
  updateTalentProfileSchema,
  getTalentProfileByUserIdSchema,
};