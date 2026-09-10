import { z } from 'zod';

export const signupSchema = z
  .object({
    username: z.string().min(2, 'Username is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const personalizationSchema = z.object({
  ageGroup: z.string().min(1, 'Select an age group'),
  dietaryPreference: z.string().min(1, 'Select a dietary preference'),
  healthPreferences: z.array(z.string()).min(1, 'Select at least one health preference'),
  allergies: z.array(z.string()).default([]),
  nutritionGoals: z.array(z.string()).min(1, 'Select at least one nutrition goal'),
  otherPreferences: z.string().max(500).optional().default(''),
});
