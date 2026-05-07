import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId');

export const roleSchema = z.string().min(1, 'Role is required');
export const cattleTypeSchema = z.enum(['COW', 'BUFFALO', 'CALF']);

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or User ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createFarmSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  address: z.string().optional(),
  location: z.string().optional(),
});

export const createTagSchema = z.object({
  farmId: objectIdSchema,
  code: z.string().min(1, 'Code is required'),
  type: cattleTypeSchema,
});

export const createShedSchema = z.object({
  farmId: objectIdSchema,
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  lines: z.number().int().nonnegative().optional(),
  capacity: z.number().int().nonnegative().optional(),
  remarks: z.string().optional(),
});

export const createCattleSchema = z.object({
  farmId: objectIdSchema,
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  tagId: objectIdSchema,
  type: cattleTypeSchema,
  shedId: objectIdSchema,
});

export const createUserSchema = z
  .object({
    userId: z.string().min(1, 'User ID is required'),
    name: z.string().min(1, 'Name is required'),
    email: z.email(),
    department: z.string().min(1, 'Department is required'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: roleSchema,
    farmId: objectIdSchema.nullish(),
  })
  .superRefine((value, ctx) => {
    if (value.role !== 'SUPER_ADMIN' && !value.farmId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'farmId is required for non SUPER_ADMIN users',
        path: ['farmId'],
      });
    }
  });

export const updateUserSchema = z
  .object({
    userId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    email: z.email().optional(),
    department: z.string().min(1).optional(),
    phone: z.string().optional(),
    role: roleSchema.optional(),
    farmId: objectIdSchema.nullish(),
    status: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.role && value.role !== 'SUPER_ADMIN' && !('farmId' in value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'farmId is required when changing role to non SUPER_ADMIN',
        path: ['farmId'],
      });
    }
  });

export const updateFarmSchema = z
  .object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    address: z.string().optional(),
    location: z.string().optional(),
  })
  .strict();

export const getValidationError = (message: string) => message;
