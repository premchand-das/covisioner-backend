import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be under 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be under 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z.object({
  body: z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(["talent", "startup"]),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
});

export const verifyEmailCodeSchema = z.object({
  body: z.object({
    email: emailSchema,
    code: z
      .string()
      .trim()
      .length(6, "Verification code must be 6 digits")
      .regex(/^\d+$/, "Verification code must contain only numbers"),
  }),
});

export const setUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(["talent", "startup"]),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string().trim().min(20, "Invalid reset token"),
  }),

  body: z.object({
    password: passwordSchema,
  }),
});