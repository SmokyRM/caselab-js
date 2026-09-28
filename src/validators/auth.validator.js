import { z } from 'zod';

const credentialsSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Укажите корректный email.')
      .max(254, 'Email должен содержать не более 254 символов.'),
    password: z.string().min(8, 'Пароль должен содержать минимум 8 символов.'),
  })
  .strict();

export const registerSchema = credentialsSchema;
export const loginSchema = credentialsSchema;
