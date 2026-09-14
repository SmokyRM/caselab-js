import { z } from 'zod';

const requestPriorities = ['low', 'medium', 'high', 'critical'];
const requestStatuses = ['new', 'in_progress', 'done', 'rejected'];
const sortableFields = [
  'title',
  'priority',
  'status',
  'plannedAt',
  'createdAt',
  'updatedAt',
];
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

const plannedAtSchema = z
  .string()
  .refine(isIsoDateTime, 'plannedAt должен быть корректным ISO date-time.');

const requestFieldsSchema = z.object({
  equipmentId: z.uuid('Некорректный идентификатор оборудования.'),
  title: z
    .string()
    .trim()
    .min(5, 'Название заявки должно содержать минимум 5 символов.')
    .max(120, 'Название заявки должно содержать не более 120 символов.'),
  description: z
    .string()
    .trim()
    .max(2000, 'Описание должно содержать не более 2000 символов.')
    .optional(),
  priority: z.enum(requestPriorities, {
    error: 'Передан неизвестный приоритет заявки.',
  }),
  plannedAt: plannedAtSchema.optional(),
});

export const createRequestSchema = requestFieldsSchema;

export const updateRequestSchema = requestFieldsSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Укажите хотя бы одно поле для изменения.'
  );

export const requestIdSchema = z.object({
  id: z.uuid('Некорректный идентификатор заявки.'),
});

export const requestStatusSchema = z.object({
  status: z.enum(requestStatuses, {
    error: 'Передан неизвестный статус заявки.',
  }),
});

export const requestListQuerySchema = z
  .object({
    status: z
      .enum(requestStatuses, {
        error: 'Передан неизвестный статус заявки.',
      })
      .optional(),
    priority: z
      .enum(requestPriorities, {
        error: 'Передан неизвестный приоритет заявки.',
      })
      .optional(),
    equipmentId: z.uuid('Некорректный идентификатор оборудования.').optional(),
    createdFrom: createDateFilterSchema().optional(),
    createdTo: createDateFilterSchema(true).optional(),
    sortBy: z.enum(sortableFields).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine(
    (query) =>
      !query.createdFrom ||
      !query.createdTo ||
      query.createdFrom <= query.createdTo,
    {
      message: 'Дата createdFrom не может быть позже createdTo.',
      path: ['createdFrom'],
    }
  );
