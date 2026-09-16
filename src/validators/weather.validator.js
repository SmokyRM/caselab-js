import { z } from 'zod';

export const equipmentWeatherQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(7).default(3),
});
