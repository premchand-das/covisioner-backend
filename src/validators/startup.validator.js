import { z } from "zod";

const currentYear = new Date().getFullYear();

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid user id")
  .optional();

const urlSchema = z
  .string()
  .trim()
  .url("Invalid URL")
  .or(z.literal(""))
  .optional()
  .default("");

const optionalUrlSchema = z
  .string()
  .trim()
  .url("Invalid URL")
  .or(z.literal(""))
  .optional();

const optionalText = (max, message) =>
  z.string().trim().max(max, message).optional().default("");

const teamMemberSchema = z.object({
  user: objectIdSchema,

  name: optionalText(100, "Team member name cannot exceed 100 characters"),

  role: optionalText(100, "Team member role cannot exceed 100 characters"),

  avatar: urlSchema,

  bio: optionalText(500, "Team member bio cannot exceed 500 characters"),

  linkedin: urlSchema,
  twitter: urlSchema,
  github: urlSchema,

  isFounder: z.boolean().optional().default(false),
});

const updateTeamMemberSchema = z.object({
  user: objectIdSchema,

  name: z.string().trim().max(100).optional(),

  role: z.string().trim().max(100).optional(),

  avatar: optionalUrlSchema,

  bio: z.string().trim().max(500).optional(),

  linkedin: optionalUrlSchema,
  twitter: optionalUrlSchema,
  github: optionalUrlSchema,

  isFounder: z.boolean().optional(),
});

const achievementSchema = z.object({
  title: z.string().trim().min(1).max(120),
  issuer: optionalText(120, "Issuer cannot exceed 120 characters"),
  year: z.string().trim().max(20).optional().default(""),
  description: optionalText(
    500,
    "Achievement description cannot exceed 500 characters"
  ),
});

const updateAchievementSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  issuer: z.string().trim().max(120).optional(),
  year: z.string().trim().max(20).optional(),
  description: z.string().trim().max(500).optional(),
});

const milestoneSchema = z.object({
  title: z.string().trim().min(1).max(120),
  date: z.string().optional(),
  description: optionalText(
    500,
    "Milestone description cannot exceed 500 characters"
  ),
});

const updateMilestoneSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  date: z.string().optional(),
  description: z.string().trim().max(500).optional(),
});

export const createStartupSchema = z.object({
  startupName: z
    .string()
    .trim()
    .min(2, "Startup name must be at least 2 characters")
    .max(80, "Startup name cannot exceed 80 characters"),

  logo: urlSchema,
  coverImage: urlSchema,
  website: urlSchema,

  tagline: optionalText(160, "Tagline cannot exceed 160 characters"),

  vision: optionalText(300, "Vision cannot exceed 300 characters"),

  bio: optionalText(3000, "Bio cannot exceed 3000 characters"),

  mission: optionalText(1000, "Mission cannot exceed 1000 characters"),

  problemStatement: optionalText(
    1500,
    "Problem statement cannot exceed 1500 characters"
  ),

  whyJoinUs: optionalText(1500, "Why join us cannot exceed 1500 characters"),

  industry: z.string().trim().max(100).optional().default(""),

  fundingStage: z
    .enum([
      "idea",
      "bootstrapped",
      "pre-seed",
      "seed",
      "series-a",
      "series-b",
      "series-c",
      "profitable",
    ])
    .optional()
    .default("idea"),

  teamSize: z
    .enum(["1-5", "6-10", "11-50", "51-100", "100+"])
    .optional()
    .default("1-5"),

  foundedYear: z
    .number()
    .int("Founded year must be a valid year")
    .min(1900, "Founded year cannot be before 1900")
    .max(currentYear, "Founded year cannot be in the future")
    .optional(),

  technologies: z
    .array(z.string().trim().min(1).max(50))
    .max(30, "You can add up to 30 technologies")
    .optional()
    .default([]),

  achievements: z
    .array(achievementSchema)
    .max(20, "You can add up to 20 achievements")
    .optional()
    .default([]),

  milestones: z
    .array(milestoneSchema)
    .max(30, "You can add up to 30 milestones")
    .optional()
    .default([]),

  team: z
    .array(teamMemberSchema)
    .max(30, "You can add up to 30 team members")
    .optional()
    .default([]),

  location: z.string().trim().max(120).optional().default(""),

  socialLinks: z
    .object({
      linkedin: urlSchema,
      twitter: urlSchema,
      github: urlSchema,
      crunchbase: urlSchema,
    })
    .optional()
    .default({
      linkedin: "",
      twitter: "",
      github: "",
      crunchbase: "",
    }),
});

export const updateStartupSchema = z.object({
  startupName: z
    .string()
    .trim()
    .min(2, "Startup name must be at least 2 characters")
    .max(80, "Startup name cannot exceed 80 characters")
    .optional(),

  logo: optionalUrlSchema,
  coverImage: optionalUrlSchema,
  website: optionalUrlSchema,

  tagline: z
    .string()
    .trim()
    .max(160, "Tagline cannot exceed 160 characters")
    .optional(),

  vision: z
    .string()
    .trim()
    .max(300, "Vision cannot exceed 300 characters")
    .optional(),

  bio: z
    .string()
    .trim()
    .max(3000, "Bio cannot exceed 3000 characters")
    .optional(),

  mission: z
    .string()
    .trim()
    .max(1000, "Mission cannot exceed 1000 characters")
    .optional(),

  problemStatement: z
    .string()
    .trim()
    .max(1500, "Problem statement cannot exceed 1500 characters")
    .optional(),

  whyJoinUs: z
    .string()
    .trim()
    .max(1500, "Why join us cannot exceed 1500 characters")
    .optional(),

  industry: z.string().trim().max(100).optional(),

  fundingStage: z
    .enum([
      "idea",
      "bootstrapped",
      "pre-seed",
      "seed",
      "series-a",
      "series-b",
      "series-c",
      "profitable",
    ])
    .optional(),

  teamSize: z.enum(["1-5", "6-10", "11-50", "51-100", "100+"]).optional(),

  foundedYear: z
    .number()
    .int("Founded year must be a valid year")
    .min(1900, "Founded year cannot be before 1900")
    .max(currentYear, "Founded year cannot be in the future")
    .optional(),

  technologies: z
    .array(z.string().trim().min(1).max(50))
    .max(30, "You can add up to 30 technologies")
    .optional(),

  achievements: z
    .array(updateAchievementSchema)
    .max(20, "You can add up to 20 achievements")
    .optional(),

  milestones: z
    .array(updateMilestoneSchema)
    .max(30, "You can add up to 30 milestones")
    .optional(),

  team: z
    .array(updateTeamMemberSchema)
    .max(30, "You can add up to 30 team members")
    .optional(),

  location: z.string().trim().max(120).optional(),

  socialLinks: z
    .object({
      linkedin: optionalUrlSchema,
      twitter: optionalUrlSchema,
      github: optionalUrlSchema,
      crunchbase: optionalUrlSchema,
    })
    .optional(),
});

export default {
  createStartupSchema,
  updateStartupSchema,
};