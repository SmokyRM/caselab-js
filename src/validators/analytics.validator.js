import { z } from 'zod';

const isoDateTimeSchema = z.iso.datetime({ offset: true });

function isRealIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function isIsoDateTime(value) {
  return isoDateTimeSchema.safeParse(value).success;
}

function createDateFilterSchema(endOfDay = false) {
  return z
    .string()
    .refine(
      (value) => isRealIsoDate(value) || isIsoDateTime(value),
      'Укажите корректную дату или ISO date-time.'
    )
    .transform((value) => {
      if (isRealIsoDate(value)) {
        return `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`;
      }

      return new Date(value).toISOString();
    });
}

export const siteIdSchema = z.object({
  id: z.uuid('Некорректный идентификатор площадки.'),
});

export const equipmentLoadQuerySchema = z
  .object({
    from: createDateFilterSchema().optional(),
    to: createDateFilterSchema(true).optional(),
    minRequests: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().default(50),
    offset: z.coerce.number().int().default(0),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'Дата from не может быть позже to.',
    path: ['from'],
  });
