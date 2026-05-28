import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId');

export const roleSchema = z.string().min(1, 'Role is required');
export const cattleTypeSchema = z.enum(['COW', 'BUFFALO', 'CALF']);

export const loginSchema = z.object({
  identifier: z
    .string({ error: 'Email or User ID is required' })
    .min(1, 'Email or User ID is required'),
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
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
  farmId: z.string().optional().nullable(),
  name: z.string().optional(),
  code: z.string().optional(),
  tag: z.string().min(1, 'Tag is required'),
  cattleType: z.string().min(1, 'Cattle Type is required'),
  shed: z.string().min(1, 'Shed is required'),
}).passthrough(); // passthrough because frontend sends dynamic fields

export const createUserSchema = z
  .object({
    userId: z.string().min(1, 'User ID is required'),
    name: z.string().min(1, 'Name is required'),
    email: z.union([z.literal(''), z.string().email()]).optional(),
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
    password: z.string().min(6).optional(),
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

export function sanitizeCattleInput(body: any) {
  if (!body || typeof body !== 'object') return;

  const dateFields = ['dateOfBirth', 'purchaseDate', 'date'];
  const numberFields = ['calvings', 'production', 'milkCollection', 'weight', 'purchasePrice', 'lineNo'];
  const stringFields = [
    'name', 'code', 'breed', 'gender', 'age', 'dameId', 'dameBreed', 
    'sireId', 'sireBreed', 'farmBorn', 'color', 'purchaseFrom', 'purchaseBy', 
    'purchaseRemarks', 'remarks'
  ];

  for (const field of dateFields) {
    if (body[field] === '' || body[field] === null || body[field] === undefined || body[field] === '-' || body[field] === 'dd/mm/yyyy') {
      delete body[field];
    } else if (typeof body[field] === 'string') {
      const cleaned = body[field].trim();
      if (!cleaned || cleaned === '-' || cleaned === 'dd/mm/yyyy') {
        delete body[field];
      } else {
        const parsed = new Date(cleaned);
        if (isNaN(parsed.getTime())) {
          delete body[field];
        } else {
          body[field] = parsed;
        }
      }
    }
  }

  for (const field of numberFields) {
    if (body[field] === '' || body[field] === null || body[field] === undefined || body[field] === '-' || String(body[field]).trim() === '') {
      delete body[field];
    } else {
      const parsed = Number(String(body[field]).trim());
      if (isNaN(parsed)) {
        delete body[field];
      } else {
        body[field] = parsed;
      }
    }
  }

  for (const field of stringFields) {
    if (body[field] !== undefined) {
      if (body[field] === null) {
        body[field] = '';
      } else {
        const cleaned = String(body[field]).trim();
        if (cleaned === '' || cleaned === '-') {
          body[field] = '';
        } else {
          body[field] = cleaned;
        }
      }
    }
  }
}
