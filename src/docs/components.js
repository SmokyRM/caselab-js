const uuidExample = '11111111-1111-4111-8111-111111111111';
const requestUuidExample = '22222222-2222-4222-8222-222222222222';
const technicianUuidExample = '33333333-3333-4333-8333-333333333333';

const errorExample = (code, message) => ({
  error: {
    code,
    message,
    details: [],
    requestId: 'req-7f52d9e7',
  },
});

export function errorResponse(description, code, message) {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: errorExample(code, message),
      },
    },
  };
}

export const commonResponses = {
  unauthorized: errorResponse(
    'Access token is missing or invalid. Error code: `AUTHENTICATION_REQUIRED` or `INVALID_ACCESS_TOKEN`.',
    'AUTHENTICATION_REQUIRED',
    'Требуется аутентификация.'
  ),
  forbidden: errorResponse(
    'The authenticated user does not have permission. Error code: `FORBIDDEN`.',
    'FORBIDDEN',
    'Недостаточно прав для выполнения операции.'
  ),
  validation: errorResponse(
    'Request validation failed. Error code: `VALIDATION_ERROR`. Field errors are returned in `details`.',
    'VALIDATION_ERROR',
    'Переданы некорректные данные.'
  ),
  invalidJson: errorResponse(
    'The JSON body is malformed. Error code: `INVALID_JSON`.',
    'INVALID_JSON',
    'Тело запроса содержит некорректный JSON.'
  ),
  payloadTooLarge: errorResponse(
    'JSON body exceeds the 100 KB limit. Error code: `PAYLOAD_TOO_LARGE`.',
    'PAYLOAD_TOO_LARGE',
    'Размер тела запроса превышает допустимый лимит.'
  ),
  rateLimited: errorResponse(
    'The configurable API rate limit was exceeded. Error code: `RATE_LIMIT_EXCEEDED`.',
    'RATE_LIMIT_EXCEEDED',
    'Слишком много запросов. Повторите позже.'
  ),
};

const locationSchema = {
  type: 'object',
  required: ['lat', 'lon'],
  properties: {
    lat: { type: 'number', minimum: -90, maximum: 90, example: 55.7558 },
    lon: { type: 'number', minimum: -180, maximum: 180, example: 37.6173 },
  },
};

const paginationMetaSchema = {
  type: 'object',
  required: ['total', 'page', 'limit'],
  properties: {
    total: { type: 'integer', minimum: 0, example: 12 },
    page: { type: 'integer', minimum: 1, example: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, example: 10 },
  },
};

const equipmentProperties = {
  name: {
    type: 'string',
    minLength: 3,
    maxLength: 100,
    example: 'Wind turbine T-01',
  },
  type: {
    type: 'string',
    enum: ['turbine', 'inverter', 'sensor', 'substation'],
    example: 'turbine',
  },
  serialNumber: { type: 'string', minLength: 1, example: 'WT-2026-001' },
  location: locationSchema,
  status: {
    type: 'string',
    enum: ['operational', 'maintenance', 'fault', 'decommissioned'],
    example: 'operational',
  },
  installedAt: { type: 'string', format: 'date', example: '2025-05-12' },
};

const requestEditableProperties = {
  equipmentId: { type: 'string', format: 'uuid', example: uuidExample },
  title: {
    type: 'string',
    minLength: 5,
    maxLength: 120,
    example: 'Inspect turbine gearbox',
  },
  description: {
    type: 'string',
    maxLength: 2000,
    example: 'Check vibration and oil level.',
  },
  priority: {
    type: 'string',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'high',
  },
  plannedAt: {
    type: 'string',
    format: 'date-time',
    example: '2026-10-10T08:00:00.000Z',
  },
};

export const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'Access token returned by POST /api/auth/login or POST /api/auth/refresh.',
    },
  },
  schemas: {
    ErrorDetail: {
      type: 'object',
      required: ['field', 'message'],
      properties: {
        field: { type: 'string', example: 'body.email' },
        message: { type: 'string', example: 'Укажите корректный email.' },
      },
    },
    ErrorResponse: {
      type: 'object',
      required: ['error'],
      properties: {
        error: {
          type: 'object',
          required: ['code', 'message', 'details', 'requestId'],
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: {
              type: 'string',
              example: 'Переданы некорректные данные.',
            },
            details: {
              type: 'array',
              items: { $ref: '#/components/schemas/ErrorDetail' },
            },
            requestId: { type: 'string', example: 'req-7f52d9e7' },
          },
        },
      },
    },
    User: {
      type: 'object',
      required: [
        'id',
        'email',
        'role',
        'technicianId',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        id: { type: 'string', format: 'uuid', example: uuidExample },
        email: {
          type: 'string',
          format: 'email',
          example: 'viewer@example.com',
        },
        role: { type: 'string', enum: ['viewer', 'technician', 'admin'] },
        technicianId: {
          type: 'string',
          format: 'uuid',
          nullable: true,
          example: technicianUuidExample,
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    Credentials: {
      type: 'object',
      additionalProperties: false,
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', maxLength: 254 },
        password: { type: 'string', format: 'password', minLength: 8 },
      },
      example: { email: 'viewer@example.com', password: 'example-password' },
    },
    AuthResponse: {
      type: 'object',
      required: ['user', 'accessToken', 'expiresIn'],
      properties: {
        user: { $ref: '#/components/schemas/User' },
        accessToken: { type: 'string', example: 'eyJ...example' },
        expiresIn: { type: 'integer', minimum: 1, example: 900 },
      },
    },
    Location: locationSchema,
    EquipmentPassport: {
      type: 'object',
      nullable: true,
      required: [
        'id',
        'equipmentId',
        'manufacturer',
        'model',
        'ratedPower',
        'lastVerificationAt',
      ],
      properties: {
        id: { type: 'string', format: 'uuid' },
        equipmentId: { type: 'string', format: 'uuid' },
        manufacturer: { type: 'string' },
        model: { type: 'string' },
        ratedPower: { type: 'number', nullable: true },
        lastVerificationAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
      },
    },
    Equipment: {
      type: 'object',
      required: ['id', ...Object.keys(equipmentProperties)],
      properties: {
        id: { type: 'string', format: 'uuid', example: uuidExample },
        ...equipmentProperties,
        passport: { $ref: '#/components/schemas/EquipmentPassport' },
      },
    },
    CreateEquipment: {
      type: 'object',
      required: Object.keys(equipmentProperties),
      properties: equipmentProperties,
    },
    UpdateEquipment: {
      type: 'object',
      minProperties: 1,
      properties: equipmentProperties,
    },
    PaginationMeta: paginationMetaSchema,
    EquipmentListResponse: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Equipment' },
        },
        meta: { $ref: '#/components/schemas/PaginationMeta' },
      },
    },
    RequestAssignee: {
      type: 'object',
      required: [
        'technicianId',
        'fullName',
        'specialization',
        'employeeNumber',
        'role',
        'hours',
      ],
      properties: {
        technicianId: {
          type: 'string',
          format: 'uuid',
          example: technicianUuidExample,
        },
        fullName: { type: 'string', example: 'Alex Technician' },
        specialization: { type: 'string', example: 'Wind turbines' },
        employeeNumber: { type: 'string', example: 'TECH-001' },
        role: { type: 'string', enum: ['lead', 'member'] },
        hours: {
          type: 'number',
          exclusiveMinimum: true,
          maximum: 1000,
          example: 8,
        },
      },
    },
    RequestAssigneeInput: {
      type: 'object',
      required: ['technicianId', 'role', 'hours'],
      properties: {
        technicianId: {
          type: 'string',
          format: 'uuid',
          example: technicianUuidExample,
        },
        role: { type: 'string', enum: ['lead', 'member'] },
        hours: {
          type: 'number',
          exclusiveMinimum: true,
          maximum: 1000,
          example: 8,
        },
      },
    },
    RequestTeamInput: {
      type: 'object',
      required: ['assignees'],
      properties: {
        assignees: {
          type: 'array',
          minItems: 1,
          description: 'The team must contain exactly one lead.',
          items: { $ref: '#/components/schemas/RequestAssigneeInput' },
        },
      },
    },
    MaintenanceRequest: {
      type: 'object',
      required: [
        'id',
        'equipmentId',
        'title',
        'description',
        'priority',
        'status',
        'plannedAt',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        id: { type: 'string', format: 'uuid', example: requestUuidExample },
        ...requestEditableProperties,
        description: {
          ...requestEditableProperties.description,
          nullable: true,
        },
        plannedAt: { ...requestEditableProperties.plannedAt, nullable: true },
        status: {
          type: 'string',
          enum: ['new', 'in_progress', 'done', 'rejected'],
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        assignees: {
          type: 'array',
          items: { $ref: '#/components/schemas/RequestAssignee' },
        },
      },
    },
    CreateMaintenanceRequest: {
      type: 'object',
      required: ['equipmentId', 'title', 'priority'],
      properties: requestEditableProperties,
    },
    UpdateMaintenanceRequest: {
      type: 'object',
      minProperties: 1,
      properties: requestEditableProperties,
    },
    MaintenanceRequestListResponse: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/MaintenanceRequest' },
        },
        meta: { $ref: '#/components/schemas/PaginationMeta' },
      },
    },
    RequestStatusInput: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['new', 'in_progress', 'done', 'rejected'],
        },
      },
    },
    RequestStatusHistory: {
      type: 'object',
      required: [
        'id',
        'requestId',
        'oldStatus',
        'newStatus',
        'author',
        'comment',
        'createdAt',
      ],
      properties: {
        id: { type: 'string', format: 'uuid' },
        requestId: { type: 'string', format: 'uuid' },
        oldStatus: {
          type: 'string',
          enum: ['new', 'in_progress', 'done', 'rejected'],
          nullable: true,
        },
        newStatus: {
          type: 'string',
          enum: ['new', 'in_progress', 'done', 'rejected'],
        },
        author: { type: 'string', example: 'api' },
        comment: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    HealthResponse: {
      type: 'object',
      required: ['status'],
      properties: { status: { type: 'string', enum: ['ok'] } },
    },
    ReadyResponse: {
      type: 'object',
      required: ['status'],
      properties: { status: { type: 'string', enum: ['ready'] } },
    },
    WeatherDay: {
      type: 'object',
      required: [
        'date',
        'minTemperature',
        'maxTemperature',
        'precipitation',
        'maxWindSpeed',
        'suitableForOutdoorWork',
      ],
      properties: {
        date: { type: 'string', format: 'date' },
        minTemperature: { type: 'number', example: 5.2 },
        maxTemperature: { type: 'number', example: 12.8 },
        precipitation: { type: 'number', example: 0 },
        maxWindSpeed: { type: 'number', example: 18.4 },
        suitableForOutdoorWork: { type: 'boolean' },
      },
    },
    EquipmentWeather: {
      type: 'object',
      required: [
        'equipmentId',
        'location',
        'rules',
        'outdoorWorkSuitable',
        'forecast',
      ],
      properties: {
        equipmentId: { type: 'string', format: 'uuid' },
        location: { $ref: '#/components/schemas/Location' },
        rules: {
          type: 'object',
          required: [
            'maxPrecipitation',
            'maxWindSpeed',
            'precipitationUnit',
            'windSpeedUnit',
          ],
          properties: {
            maxPrecipitation: { type: 'number' },
            maxWindSpeed: { type: 'number' },
            precipitationUnit: { type: 'string', enum: ['mm'] },
            windSpeedUnit: { type: 'string', enum: ['km/h'] },
          },
        },
        outdoorWorkSuitable: { type: 'boolean' },
        forecast: {
          type: 'array',
          items: { $ref: '#/components/schemas/WeatherDay' },
        },
      },
    },
    Site: {
      type: 'object',
      required: ['id', 'name', 'code', 'region'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        code: { type: 'string' },
        region: { type: 'string' },
      },
    },
    SiteSummary: {
      type: 'object',
      required: ['site', 'requests'],
      properties: {
        site: { $ref: '#/components/schemas/Site' },
        requests: {
          type: 'object',
          required: ['total', 'byStatus', 'byPriority', 'averageCloseHours'],
          properties: {
            total: { type: 'integer', minimum: 0 },
            byStatus: {
              type: 'object',
              required: ['new', 'in_progress', 'done', 'rejected'],
              properties: {
                new: { type: 'integer', minimum: 0 },
                in_progress: { type: 'integer', minimum: 0 },
                done: { type: 'integer', minimum: 0 },
                rejected: { type: 'integer', minimum: 0 },
              },
            },
            byPriority: {
              type: 'object',
              required: ['low', 'medium', 'high', 'critical'],
              properties: {
                low: { type: 'integer', minimum: 0 },
                medium: { type: 'integer', minimum: 0 },
                high: { type: 'integer', minimum: 0 },
                critical: { type: 'integer', minimum: 0 },
              },
            },
            averageCloseHours: { type: 'number', nullable: true },
          },
        },
      },
    },
    EquipmentLoadRow: {
      type: 'object',
      required: [
        'equipmentId',
        'equipmentName',
        'serialNumber',
        'requestCount',
        'closedRequestCount',
        'totalPlannedHours',
        'lastMaintenanceAt',
      ],
      properties: {
        equipmentId: { type: 'string', format: 'uuid' },
        equipmentName: { type: 'string' },
        serialNumber: { type: 'string' },
        requestCount: { type: 'integer', minimum: 0 },
        closedRequestCount: { type: 'integer', minimum: 0 },
        totalPlannedHours: { type: 'number', minimum: 0 },
        lastMaintenanceAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
      },
    },
    EquipmentLoadMeta: {
      type: 'object',
      required: ['minRequests', 'limit', 'offset'],
      properties: {
        from: { type: 'string', format: 'date-time' },
        to: { type: 'string', format: 'date-time' },
        minRequests: { type: 'integer', minimum: 0 },
        limit: { type: 'integer' },
        offset: { type: 'integer' },
      },
    },
  },
};

export const examples = {
  uuidExample,
  requestUuidExample,
  technicianUuidExample,
};
