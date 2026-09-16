import { z } from 'zod';

const equipmentTypes = ['turbine', 'inverter', 'sensor', 'substation'];
const equipmentStatuses = [
  'operational',
  'maintenance',
  'fault',
  'decommissioned',
];
const sortableFields = [
  'name',
  'type',
  'serialNumber',
  'status',
  'installedAt',
];

function getLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isRealIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

const isoDateSchema = z
  .string()
  .refine(isRealIsoDate, 'Дата должна иметь формат YYYY-MM-DD.');

const installedAtSchema = isoDateSchema.refine(
  (value) => value <= getLocalDate(),
  'Дата установки не может быть в будущем.'
);

const equipmentFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Название должно содержать минимум 3 символа.')
    .max(100, 'Название должно содержать не более 100 символов.'),
  type: z.enum(equipmentTypes, {
    error: 'Передан неизвестный тип оборудования.',
  }),
  serialNumber: z.string().trim().min(1, 'Укажите серийный номер.'),
  location: z.object({
    lat: z
      .number()
      .min(-90, 'Широта должна быть не меньше -90.')
      .max(90, 'Широта должна быть не больше 90.'),
    lon: z
      .number()
      .min(-180, 'Долгота должна быть не меньше -180.')
      .max(180, 'Долгота должна быть не больше 180.'),
  }),
  status: z.enum(equipmentStatuses, {
    error: 'Передан неизвестный статус оборудования.',
  }),
  installedAt: installedAtSchema,
});

export const createEquipmentSchema = equipmentFieldsSchema;

export const updateEquipmentSchema = equipmentFieldsSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Укажите хотя бы одно поле для изменения.'
  );

export const equipmentIdSchema = z.object({
  id: z.uuid('Некорректный идентификатор оборудования.'),
});

export const equipmentListQuerySchema = z
  .object({
    status: z
      .enum(equipmentStatuses, {
        error: 'Передан неизвестный статус оборудования.',
      })
      .optional(),
    type: z
      .enum(equipmentTypes, {
        error: 'Передан неизвестный тип оборудования.',
      })
      .optional(),
    installedFrom: isoDateSchema.optional(),
    installedTo: isoDateSchema.optional(),
    sortBy: z.enum(sortableFields).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine(
    (query) =>
      !query.installedFrom ||
      !query.installedTo ||
      query.installedFrom <= query.installedTo,
    {
      message: 'Дата installedFrom не может быть позже installedTo.',
      path: ['installedFrom'],
    }
  );
