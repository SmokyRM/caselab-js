import { commonResponses, errorResponse, examples } from './components.js';

const { uuidExample, requestUuidExample, technicianUuidExample } = examples;

const bearerSecurity = [{ bearerAuth: [] }];

const jsonContent = (schema) => ({
  'application/json': { schema },
});

const jsonResponse = (description, schema) => ({
  description,
  content: jsonContent(schema),
});

const dataResponse = (description, schemaRef) =>
  jsonResponse(description, {
    type: 'object',
    required: ['data'],
    properties: { data: { $ref: schemaRef } },
  });

const arrayDataResponse = (description, schemaRef) =>
  jsonResponse(description, {
    type: 'object',
    required: ['data'],
    properties: {
      data: { type: 'array', items: { $ref: schemaRef } },
    },
  });

const requestBody = (schemaRef, description) => ({
  required: true,
  description,
  content: jsonContent({ $ref: schemaRef }),
});

const idParameter = (name, description, example = uuidExample) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', format: 'uuid' },
  example,
});

const queryParameter = (name, schema, description) => ({
  name,
  in: 'query',
  required: false,
  description,
  schema,
});

const protectedResponses = {
  401: commonResponses.unauthorized,
  429: commonResponses.rateLimited,
};

const restrictedResponses = {
  ...protectedResponses,
  403: commonResponses.forbidden,
};

const bodyResponses = {
  400: commonResponses.invalidJson,
  413: commonResponses.payloadTooLarge,
  422: commonResponses.validation,
};

const equipmentListParameters = [
  queryParameter(
    'status',
    {
      type: 'string',
      enum: ['operational', 'maintenance', 'fault', 'decommissioned'],
    },
    'Filter by equipment status.'
  ),
  queryParameter(
    'type',
    {
      type: 'string',
      enum: ['turbine', 'inverter', 'sensor', 'substation'],
    },
    'Filter by equipment type.'
  ),
  queryParameter(
    'installedFrom',
    { type: 'string', format: 'date' },
    'Include equipment installed on or after this date.'
  ),
  queryParameter(
    'installedTo',
    { type: 'string', format: 'date' },
    'Include equipment installed on or before this date.'
  ),
  queryParameter(
    'sortBy',
    {
      type: 'string',
      enum: ['name', 'type', 'serialNumber', 'status', 'installedAt'],
      default: 'name',
    },
    'Sort field.'
  ),
  queryParameter(
    'sortOrder',
    { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
    'Sort direction.'
  ),
  queryParameter(
    'page',
    { type: 'integer', minimum: 1, default: 1 },
    'Page number.'
  ),
  queryParameter(
    'limit',
    { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    'Items per page.'
  ),
];

const requestListParameters = [
  queryParameter(
    'status',
    { type: 'string', enum: ['new', 'in_progress', 'done', 'rejected'] },
    'Filter by request status.'
  ),
  queryParameter(
    'priority',
    { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    'Filter by priority.'
  ),
  queryParameter(
    'equipmentId',
    { type: 'string', format: 'uuid' },
    'Filter by equipment identifier.'
  ),
  queryParameter(
    'createdFrom',
    { type: 'string', description: 'ISO date or date-time.' },
    'Include requests created on or after this date/time.'
  ),
  queryParameter(
    'createdTo',
    { type: 'string', description: 'ISO date or date-time.' },
    'Include requests created on or before this date/time.'
  ),
  queryParameter(
    'sortBy',
    {
      type: 'string',
      enum: [
        'title',
        'priority',
        'status',
        'plannedAt',
        'createdAt',
        'updatedAt',
      ],
      default: 'createdAt',
    },
    'Sort field.'
  ),
  queryParameter(
    'sortOrder',
    { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
    'Sort direction.'
  ),
  queryParameter(
    'page',
    { type: 'integer', minimum: 1, default: 1 },
    'Page number.'
  ),
  queryParameter(
    'limit',
    { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    'Items per page.'
  ),
];

const refreshCookieParameter = {
  name: 'refresh_token',
  in: 'cookie',
  required: false,
  description:
    'Opaque refresh token stored in an HttpOnly cookie. The cookie name is configurable.',
  schema: { type: 'string', writeOnly: true },
};

const authCookieHeader = {
  description:
    'Rotated opaque refresh token cookie. It is HttpOnly, Secure in production, and uses the configured SameSite policy (production default: Lax).',
  schema: { type: 'string' },
};

export const paths = {
  '/api/health': {
    get: {
      tags: ['Health'],
      operationId: 'getHealth',
      summary: 'Basic service health',
      security: [],
      responses: {
        200: jsonResponse('Service is running.', {
          $ref: '#/components/schemas/HealthResponse',
        }),
        429: commonResponses.rateLimited,
      },
    },
  },
  '/api/health/live': {
    get: {
      tags: ['Health'],
      operationId: 'getLiveness',
      summary: 'Process liveness probe',
      security: [],
      responses: {
        200: jsonResponse('Process is alive.', {
          $ref: '#/components/schemas/HealthResponse',
        }),
        429: commonResponses.rateLimited,
      },
    },
  },
  '/api/health/ready': {
    get: {
      tags: ['Health'],
      operationId: 'getReadiness',
      summary: 'PostgreSQL readiness probe',
      description: 'Checks that the service can query PostgreSQL.',
      security: [],
      responses: {
        200: jsonResponse('Service and database are ready.', {
          $ref: '#/components/schemas/ReadyResponse',
        }),
        503: errorResponse(
          'PostgreSQL is unavailable. Error code: `SERVICE_NOT_READY`.',
          'SERVICE_NOT_READY',
          'Сервис временно не готов.'
        ),
        429: commonResponses.rateLimited,
      },
    },
  },
  '/api/auth/register': {
    post: {
      tags: ['Authentication'],
      operationId: 'registerUser',
      summary: 'Register a viewer account',
      description:
        'Creates a user with role `viewer`. Passwords and refresh tokens are never returned.',
      security: [],
      requestBody: requestBody(
        '#/components/schemas/Credentials',
        'Email and password. A role cannot be supplied.'
      ),
      responses: {
        201: jsonResponse('User created.', {
          type: 'object',
          required: ['user'],
          properties: { user: { $ref: '#/components/schemas/User' } },
        }),
        409: errorResponse(
          'Email is already registered. Error code: `EMAIL_ALREADY_EXISTS`.',
          'EMAIL_ALREADY_EXISTS',
          'Пользователь с таким email уже существует.'
        ),
        429: commonResponses.rateLimited,
        ...bodyResponses,
      },
    },
  },
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      operationId: 'loginUser',
      summary: 'Authenticate and create a session',
      description:
        'Unknown email and wrong password intentionally return the same public error. The opaque refresh token is returned only as an HttpOnly cookie.',
      security: [],
      requestBody: requestBody(
        '#/components/schemas/Credentials',
        'Login credentials.'
      ),
      responses: {
        200: {
          ...jsonResponse('Authenticated.', {
            $ref: '#/components/schemas/AuthResponse',
          }),
          headers: { 'Set-Cookie': authCookieHeader },
        },
        401: errorResponse(
          'Credentials are invalid. Error code: `INVALID_CREDENTIALS`.',
          'INVALID_CREDENTIALS',
          'Неверный email или пароль.'
        ),
        429: errorResponse(
          'The configurable login or general API rate limit was exceeded. Error code: `AUTH_RATE_LIMIT_EXCEEDED` or `RATE_LIMIT_EXCEEDED`.',
          'AUTH_RATE_LIMIT_EXCEEDED',
          'Слишком много попыток входа. Повторите позже.'
        ),
        ...bodyResponses,
      },
    },
  },
  '/api/auth/refresh': {
    post: {
      tags: ['Authentication'],
      operationId: 'refreshSession',
      summary: 'Rotate the refresh session',
      description:
        'Uses the opaque HttpOnly refresh cookie, rotates it, and returns a new access token. The refresh token is not a Bearer JWT and is never returned in JSON.',
      security: [],
      parameters: [refreshCookieParameter],
      responses: {
        200: {
          ...jsonResponse('Session refreshed.', {
            $ref: '#/components/schemas/AuthResponse',
          }),
          headers: { 'Set-Cookie': authCookieHeader },
        },
        401: errorResponse(
          'Refresh cookie is missing, expired, revoked, or already rotated. Error code: `INVALID_REFRESH_TOKEN`.',
          'INVALID_REFRESH_TOKEN',
          'Недействительный refresh token.'
        ),
        429: commonResponses.rateLimited,
      },
    },
  },
  '/api/auth/logout': {
    post: {
      tags: ['Authentication'],
      operationId: 'logoutUser',
      summary: 'Revoke the refresh session',
      description:
        'Revokes the current refresh session when present and clears the refresh cookie. An access token is not required.',
      security: [],
      parameters: [refreshCookieParameter],
      responses: {
        204: {
          description: 'Session revoked and refresh cookie cleared.',
          headers: { 'Set-Cookie': authCookieHeader },
        },
        429: commonResponses.rateLimited,
      },
    },
  },
  '/api/auth/me': {
    get: {
      tags: ['Authentication'],
      operationId: 'getCurrentUser',
      summary: 'Get current user',
      security: bearerSecurity,
      responses: {
        200: jsonResponse('Current user.', {
          type: 'object',
          required: ['user'],
          properties: { user: { $ref: '#/components/schemas/User' } },
        }),
        ...protectedResponses,
      },
    },
  },
  '/api/equipment': {
    get: {
      tags: ['Equipment'],
      operationId: 'listEquipment',
      summary: 'List equipment',
      description: 'Available to viewer, technician, and admin roles.',
      security: bearerSecurity,
      parameters: equipmentListParameters,
      responses: {
        200: jsonResponse('Paginated equipment.', {
          $ref: '#/components/schemas/EquipmentListResponse',
        }),
        422: commonResponses.validation,
        ...protectedResponses,
      },
    },
    post: {
      tags: ['Equipment'],
      operationId: 'createEquipment',
      summary: 'Create equipment',
      description: 'Admin only.',
      security: bearerSecurity,
      requestBody: requestBody(
        '#/components/schemas/CreateEquipment',
        'Equipment data.'
      ),
      responses: {
        201: {
          ...dataResponse(
            'Equipment created.',
            '#/components/schemas/Equipment'
          ),
          headers: {
            Location: {
              description: 'URI of the created equipment.',
              schema: {
                type: 'string',
                example: `/api/equipment/${uuidExample}`,
              },
            },
          },
        },
        409: errorResponse(
          'Serial number already exists. Error code: `EQUIPMENT_SERIAL_CONFLICT`.',
          'EQUIPMENT_SERIAL_CONFLICT',
          'Оборудование с таким серийным номером уже существует.'
        ),
        ...restrictedResponses,
        ...bodyResponses,
      },
    },
  },
  '/api/equipment/{id}': {
    parameters: [idParameter('id', 'Equipment identifier.')],
    get: {
      tags: ['Equipment'],
      operationId: 'getEquipment',
      summary: 'Get equipment',
      security: bearerSecurity,
      responses: {
        200: dataResponse('Equipment found.', '#/components/schemas/Equipment'),
        404: errorResponse(
          'Equipment was not found. Error code: `EQUIPMENT_NOT_FOUND`.',
          'EQUIPMENT_NOT_FOUND',
          'Оборудование не найдено.'
        ),
        422: commonResponses.validation,
        ...protectedResponses,
      },
    },
    patch: {
      tags: ['Equipment'],
      operationId: 'updateEquipment',
      summary: 'Update equipment',
      description: 'Admin only. At least one field is required.',
      security: bearerSecurity,
      requestBody: requestBody(
        '#/components/schemas/UpdateEquipment',
        'Fields to update.'
      ),
      responses: {
        200: dataResponse(
          'Equipment updated.',
          '#/components/schemas/Equipment'
        ),
        404: errorResponse(
          'Equipment was not found. Error code: `EQUIPMENT_NOT_FOUND`.',
          'EQUIPMENT_NOT_FOUND',
          'Оборудование не найдено.'
        ),
        409: errorResponse(
          'Serial number already exists. Error code: `EQUIPMENT_SERIAL_CONFLICT`.',
          'EQUIPMENT_SERIAL_CONFLICT',
          'Оборудование с таким серийным номером уже существует.'
        ),
        ...restrictedResponses,
        ...bodyResponses,
      },
    },
    delete: {
      tags: ['Equipment'],
      operationId: 'deleteEquipment',
      summary: 'Delete equipment',
      description:
        'Admin only. Equipment with open requests cannot be deleted; database-linked closed requests also prevent deletion.',
      security: bearerSecurity,
      responses: {
        204: { description: 'Equipment deleted.' },
        404: errorResponse(
          'Equipment was not found. Error code: `EQUIPMENT_NOT_FOUND`.',
          'EQUIPMENT_NOT_FOUND',
          'Оборудование не найдено.'
        ),
        409: errorResponse(
          'Equipment is linked to requests. Error code: `EQUIPMENT_HAS_OPEN_REQUESTS` or `EQUIPMENT_HAS_REQUESTS`.',
          'EQUIPMENT_HAS_OPEN_REQUESTS',
          'Нельзя удалить оборудование с открытыми заявками.'
        ),
        ...restrictedResponses,
        422: commonResponses.validation,
      },
    },
  },
  '/api/equipment/{id}/requests': {
    get: {
      tags: ['Equipment', 'Maintenance Requests'],
      operationId: 'listEquipmentRequests',
      summary: 'List requests for equipment',
      security: bearerSecurity,
      parameters: [
        idParameter('id', 'Equipment identifier.'),
        ...requestListParameters.filter(
          (parameter) => parameter.name !== 'equipmentId'
        ),
      ],
      responses: {
        200: jsonResponse('Paginated requests for the equipment.', {
          $ref: '#/components/schemas/MaintenanceRequestListResponse',
        }),
        404: errorResponse(
          'Equipment was not found. Error code: `EQUIPMENT_NOT_FOUND`.',
          'EQUIPMENT_NOT_FOUND',
          'Оборудование не найдено.'
        ),
        422: commonResponses.validation,
        ...protectedResponses,
      },
    },
  },
  '/api/equipment/{id}/weather': {
    get: {
      tags: ['Equipment'],
      operationId: 'getEquipmentWeather',
      summary: 'Get equipment weather forecast',
      description:
        'Returns outdoor-work suitability using configured precipitation and wind rules.',
      security: bearerSecurity,
      parameters: [
        idParameter('id', 'Equipment identifier.'),
        queryParameter(
          'days',
          { type: 'integer', minimum: 1, maximum: 7, default: 3 },
          'Forecast length.'
        ),
      ],
      responses: {
        200: dataResponse(
          'Weather forecast and suitability result.',
          '#/components/schemas/EquipmentWeather'
        ),
        404: errorResponse(
          'Equipment was not found. Error code: `EQUIPMENT_NOT_FOUND`.',
          'EQUIPMENT_NOT_FOUND',
          'Оборудование не найдено.'
        ),
        502: errorResponse(
          'Open-Meteo request failed. Error code: `WEATHER_API_ERROR`.',
          'WEATHER_API_ERROR',
          'Не удалось получить данные Open-Meteo.'
        ),
        504: errorResponse(
          'Open-Meteo request timed out. Error code: `WEATHER_API_TIMEOUT`.',
          'WEATHER_API_TIMEOUT',
          'Превышено время ожидания ответа Open-Meteo.'
        ),
        422: commonResponses.validation,
        ...protectedResponses,
      },
    },
  },
  '/api/requests': {
    get: {
      tags: ['Maintenance Requests'],
      operationId: 'listMaintenanceRequests',
      summary: 'List maintenance requests',
      description: 'Available to viewer, technician, and admin roles.',
      security: bearerSecurity,
      parameters: requestListParameters,
      responses: {
        200: jsonResponse('Paginated maintenance requests.', {
          $ref: '#/components/schemas/MaintenanceRequestListResponse',
        }),
        422: commonResponses.validation,
        ...protectedResponses,
      },
    },
    post: {
      tags: ['Maintenance Requests'],
      operationId: 'createMaintenanceRequest',
      summary: 'Create a maintenance request',
      description: 'Technician or admin. The initial status is always `new`.',
      security: bearerSecurity,
      requestBody: requestBody(
        '#/components/schemas/CreateMaintenanceRequest',
        'Maintenance request data.'
      ),
      responses: {
        201: {
          ...dataResponse(
            'Maintenance request created.',
            '#/components/schemas/MaintenanceRequest'
          ),
          headers: {
            Location: {
              description: 'URI of the created request.',
              schema: {
                type: 'string',
                example: `/api/requests/${requestUuidExample}`,
              },
            },
          },
        },
        404: errorResponse(
          'Equipment was not found. Error code: `EQUIPMENT_NOT_FOUND`.',
          'EQUIPMENT_NOT_FOUND',
          'Оборудование не найдено.'
        ),
        ...restrictedResponses,
        ...bodyResponses,
      },
    },
  },
  '/api/requests/{id}': {
    parameters: [
      idParameter('id', 'Maintenance request identifier.', requestUuidExample),
    ],
    get: {
      tags: ['Maintenance Requests'],
      operationId: 'getMaintenanceRequest',
      summary: 'Get a maintenance request',
      security: bearerSecurity,
      responses: {
        200: dataResponse(
          'Maintenance request found.',
          '#/components/schemas/MaintenanceRequest'
        ),
        404: errorResponse(
          'Request was not found. Error code: `REQUEST_NOT_FOUND`.',
          'REQUEST_NOT_FOUND',
          'Заявка не найдена.'
        ),
        422: commonResponses.validation,
        ...protectedResponses,
      },
    },
    patch: {
      tags: ['Maintenance Requests'],
      operationId: 'updateMaintenanceRequest',
      summary: 'Update a maintenance request',
      description:
        'Technician or admin. The current route does not require the technician to be assigned. At least one field is required.',
      security: bearerSecurity,
      requestBody: requestBody(
        '#/components/schemas/UpdateMaintenanceRequest',
        'Fields to update.'
      ),
      responses: {
        200: dataResponse(
          'Maintenance request updated.',
          '#/components/schemas/MaintenanceRequest'
        ),
        404: errorResponse(
          'Request or referenced equipment was not found. Error code: `REQUEST_NOT_FOUND` or `EQUIPMENT_NOT_FOUND`.',
          'REQUEST_NOT_FOUND',
          'Заявка не найдена.'
        ),
        ...restrictedResponses,
        ...bodyResponses,
      },
    },
    delete: {
      tags: ['Maintenance Requests'],
      operationId: 'deleteMaintenanceRequest',
      summary: 'Delete a maintenance request',
      description: 'Admin only.',
      security: bearerSecurity,
      responses: {
        204: { description: 'Maintenance request deleted.' },
        404: errorResponse(
          'Request was not found. Error code: `REQUEST_NOT_FOUND`.',
          'REQUEST_NOT_FOUND',
          'Заявка не найдена.'
        ),
        422: commonResponses.validation,
        ...restrictedResponses,
      },
    },
  },
  '/api/requests/{id}/status': {
    patch: {
      tags: ['Maintenance Requests'],
      operationId: 'changeRequestStatus',
      summary: 'Change request status',
      description:
        'Technician or admin. A technician must be assigned to this request. Allowed transitions: new -> in_progress or rejected; in_progress -> done or rejected. Done and rejected are terminal. Entering in_progress requires at least one assignee.',
      security: bearerSecurity,
      parameters: [
        idParameter(
          'id',
          'Maintenance request identifier.',
          requestUuidExample
        ),
      ],
      requestBody: requestBody(
        '#/components/schemas/RequestStatusInput',
        'New request status.'
      ),
      responses: {
        200: dataResponse(
          'Status changed.',
          '#/components/schemas/MaintenanceRequest'
        ),
        404: errorResponse(
          'Request was not found. Error code: `REQUEST_NOT_FOUND`.',
          'REQUEST_NOT_FOUND',
          'Заявка не найдена.'
        ),
        409: errorResponse(
          'Transition is forbidden or in_progress has no assignees. Error code: `INVALID_REQUEST_STATUS_TRANSITION` or `REQUEST_REQUIRES_ASSIGNEES`.',
          'INVALID_REQUEST_STATUS_TRANSITION',
          'Переход статуса запрещён.'
        ),
        ...restrictedResponses,
        ...bodyResponses,
      },
    },
  },
  '/api/requests/{id}/history': {
    get: {
      tags: ['Maintenance Requests'],
      operationId: 'getRequestStatusHistory',
      summary: 'Get request status history',
      security: bearerSecurity,
      parameters: [
        idParameter(
          'id',
          'Maintenance request identifier.',
          requestUuidExample
        ),
      ],
      responses: {
        200: arrayDataResponse(
          'Ordered status history.',
          '#/components/schemas/RequestStatusHistory'
        ),
        404: errorResponse(
          'Request was not found. Error code: `REQUEST_NOT_FOUND`.',
          'REQUEST_NOT_FOUND',
          'Заявка не найдена.'
        ),
        422: commonResponses.validation,
        ...protectedResponses,
      },
    },
  },
  '/api/requests/{id}/assignees': {
    post: {
      tags: ['Maintenance Requests'],
      operationId: 'replaceRequestAssignees',
      summary: 'Replace the request team',
      description:
        'Admin only. Replaces the entire team transactionally. The team must contain exactly one lead and unique technicians.',
      security: bearerSecurity,
      parameters: [
        idParameter(
          'id',
          'Maintenance request identifier.',
          requestUuidExample
        ),
      ],
      requestBody: requestBody(
        '#/components/schemas/RequestTeamInput',
        'Complete replacement team.'
      ),
      responses: {
        200: arrayDataResponse(
          'Current request team.',
          '#/components/schemas/RequestAssignee'
        ),
        404: errorResponse(
          'Request or technician was not found. Error code: `REQUEST_NOT_FOUND` or `TECHNICIAN_NOT_FOUND`.',
          'TECHNICIAN_NOT_FOUND',
          'Специалист не найден.'
        ),
        409: errorResponse(
          'A technician occurs more than once. Error code: `REQUEST_ASSIGNEE_CONFLICT`.',
          'REQUEST_ASSIGNEE_CONFLICT',
          'Специалист не может быть дважды назначен на одну заявку.'
        ),
        ...restrictedResponses,
        ...bodyResponses,
      },
    },
  },
  '/api/requests/{id}/assignees/{userId}': {
    delete: {
      tags: ['Maintenance Requests'],
      operationId: 'removeRequestAssignee',
      summary: 'Remove a technician from the request team',
      description:
        'Admin only. `userId` is the technician identifier used by the current API route. A lead cannot be removed while other assignees remain.',
      security: bearerSecurity,
      parameters: [
        idParameter(
          'id',
          'Maintenance request identifier.',
          requestUuidExample
        ),
        idParameter(
          'userId',
          'Technician identifier used by the current route.',
          technicianUuidExample
        ),
      ],
      responses: {
        204: { description: 'Technician removed from the team.' },
        404: errorResponse(
          'Request or assignment was not found. Error code: `REQUEST_NOT_FOUND` or `REQUEST_ASSIGNEE_NOT_FOUND`.',
          'REQUEST_ASSIGNEE_NOT_FOUND',
          'Специалист не назначен на эту заявку.'
        ),
        422: errorResponse(
          'Removing the lead would leave a non-empty team without a lead. Error code: `REQUEST_TEAM_REQUIRES_LEAD`, or path validation failed with `VALIDATION_ERROR`.',
          'REQUEST_TEAM_REQUIRES_LEAD',
          'В команде должен остаться lead.'
        ),
        ...restrictedResponses,
      },
    },
  },
  '/api/sites/{id}/summary': {
    get: {
      tags: ['Analytics'],
      operationId: 'getSiteSummary',
      summary: 'Get site maintenance summary',
      security: bearerSecurity,
      parameters: [idParameter('id', 'Site identifier.')],
      responses: {
        200: dataResponse('Site summary.', '#/components/schemas/SiteSummary'),
        404: errorResponse(
          'Site was not found. Error code: `SITE_NOT_FOUND`.',
          'SITE_NOT_FOUND',
          'Площадка не найдена.'
        ),
        422: commonResponses.validation,
        ...protectedResponses,
      },
    },
  },
  '/api/reports/equipment-load': {
    get: {
      tags: ['Analytics'],
      operationId: 'getEquipmentLoadReport',
      summary: 'Get equipment maintenance load report',
      description:
        'Aggregates request count, closed requests, planned labor and last maintenance in PostgreSQL using raw SQL, GROUP BY and HAVING with bound parameters.',
      security: bearerSecurity,
      parameters: [
        queryParameter(
          'from',
          { type: 'string', description: 'ISO date or date-time.' },
          'Start of request creation interval.'
        ),
        queryParameter(
          'to',
          { type: 'string', description: 'ISO date or date-time.' },
          'End of request creation interval.'
        ),
        queryParameter(
          'minRequests',
          { type: 'integer', minimum: 0, default: 0 },
          'Minimum request count included by HAVING.'
        ),
        queryParameter(
          'limit',
          { type: 'integer', default: 50 },
          'Row limit. The service accepts 1 through 100.'
        ),
        queryParameter(
          'offset',
          { type: 'integer', default: 0 },
          'Row offset. The service accepts 0 through 10000.'
        ),
      ],
      responses: {
        200: jsonResponse('Equipment load report.', {
          type: 'object',
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/EquipmentLoadRow' },
            },
            meta: { $ref: '#/components/schemas/EquipmentLoadMeta' },
          },
        }),
        400: errorResponse(
          'Pagination is outside the service limits. Error code: `INVALID_PAGINATION`.',
          'INVALID_PAGINATION',
          'Параметры limit или offset вне допустимого диапазона.'
        ),
        422: commonResponses.validation,
        ...protectedResponses,
      },
    },
  },
};
