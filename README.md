# CaseLab JavaScript / Full-Stack

Учебный репозиторий CaseLab с двумя связанными проектами на современном JavaScript и Node.js.

## Cases

- **Case 1 — Weather CLI:** консольная утилита для получения, форматирования и кэширования прогноза Open-Meteo.
- **Case 2 — Maintenance REST API:** Express API для оборудования, заявок на обслуживание и проверки погодных условий для наружных работ.

## Требования

- Node.js 20 или новее;
- npm.

HTTP-запросы к Open-Meteo выполняются встроенной функцией `fetch`. API key не требуется.

## Установка

```bash
git clone https://github.com/SmokyRM/caselab-js.git
cd caselab-js
npm ci
```

После клонирования предпочтительно использовать `npm ci`: команда устанавливает зависимости точно по существующему `package-lock.json`. Для обычной локальной разработки также доступен `npm install`.

# Case 1 — Weather CLI

Консольная Node.js-утилита получает прогноз погоды через Open-Meteo для одного или нескольких городов.

Основные возможности:

- поиск координат города через Open-Meteo Geocoding API;
- получение прогноза погоды на срок от 1 до 7 дней;
- параллельная обработка нескольких городов через `Promise.allSettled`;
- читаемый табличный вывод в консоль;
- сохранение успешных результатов в JSON;
- использование подходящего отчёта за текущий день как кэша;
- принудительное обновление данных с флагом `--no-cache`;
- обработка ошибок аргументов, HTTP, сети, JSON и превышения времени ожидания;
- настройка API, тайм-аута, каталога отчётов и единиц измерения через переменные окружения.

## Запуск Weather CLI

Прогноз для одного города:

```bash
npm run weather -- --city Москва --days 3
```

Прогноз для нескольких городов:

```bash
npm run weather -- --city "Москва,Казань" --days 3
```

Принудительное получение свежих данных без чтения кэша:

```bash
npm run weather -- --city Москва --days 3 --no-cache
```

## CLI-параметры

| Параметр     | Обязательный | Описание                                                |
| ------------ | ------------ | ------------------------------------------------------- |
| `--city`     | Да           | Город или список городов через запятую.                 |
| `--days`     | Нет          | Количество дней прогноза от 1 до 7. По умолчанию — `3`. |
| `--no-cache` | Нет          | Игнорирует сегодняшний кэш и выполняет новый запрос.    |

Примеры:

```bash
npm run weather -- --city "Нижний Новгород"
npm run weather -- --city "Москва,Казань,Нижний Новгород" --days 5
npm run weather -- --city Москва --days 1 --no-cache
```

## Переменные окружения Weather CLI

| Переменная           | Значение по умолчанию                            | Назначение                                               |
| -------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `GEOCODING_API_URL`  | `https://geocoding-api.open-meteo.com/v1/search` | URL API поиска координат города.                         |
| `FORECAST_API_URL`   | `https://api.open-meteo.com/v1/forecast`         | URL API прогноза погоды.                                 |
| `REQUEST_TIMEOUT_MS` | `5000`                                           | Максимальное время ожидания HTTP-ответа в миллисекундах. |
| `REPORTS_DIR`        | `reports`                                        | Каталог для отчётов и кэша.                              |
| `TEMPERATURE_UNIT`   | `celsius`                                        | Единица температуры: `celsius` или `fahrenheit`.         |
| `PRECIPITATION_UNIT` | `mm`                                             | Единица осадков: `mm` или `inch`.                        |

Обычный npm script не читает файл `.env` автоматически, потому что пакет `dotenv` не используется. Переменную можно передать для одного запуска:

```bash
TEMPERATURE_UNIT=fahrenheit npm run weather -- --city Москва --days 1 --no-cache
```

Либо можно создать `.env` из примера и использовать встроенный параметр Node.js:

```bash
cp .env.example .env
node --env-file=.env src/index.js --city Москва --days 3
```

Файл `.env` предназначен для локальных настроек и не коммитится.

## Пример вывода CLI

```text
Москва, Россия
Координаты: 55.75204, 37.61781

Дата         Мин.       Макс.      Осадки
2026-09-11   11.6 °C    17.6 °C    8.2 мм
Отчёт сохранён: reports/Москва-2026-09-11.json
```

## Кэш и отчёты

По умолчанию успешные результаты сохраняются в каталоге `reports/`:

```text
reports/{город}-{YYYY-MM-DD}.json
```

Подходящий отчёт за текущий день используется как кэш. Город и дата определяются именем файла, а объект `cacheInfo` внутри JSON хранит:

- `days`;
- `temperatureUnit`;
- `precipitationUnit`.

Если `cacheInfo` отсутствует или его параметры не совпадают с текущим запросом, файл считается cache miss и приложение обращается к Open-Meteo. Флаг `--no-cache` всегда пропускает чтение существующего кэша.

Каталог `reports/` добавлен в `.gitignore` и не попадает в репозиторий.

## Ошибки и exit codes CLI

CLI обрабатывает следующие случаи:

- отсутствует обязательный параметр `--city`;
- значение `--days` не является целым числом от 1 до 7;
- передан неизвестный аргумент;
- город не найден;
- Open-Meteo вернул HTTP 4xx или HTTP 5xx;
- произошла сетевая ошибка;
- превышено время ожидания ответа;
- API вернул некорректный JSON;
- JSON-файл кэша повреждён.

Города обрабатываются через `Promise.allSettled`, поэтому ошибка одного города не останавливает получение и вывод данных для остальных.

- `0` — все запрошенные города обработаны успешно;
- `1` — произошла ошибка аргументов или хотя бы один город завершился ошибкой.

## Как работает Weather CLI

```text
CLI
 ↓
проверка кэша
 ├─ cache hit  → готовые данные без обращения к API
 └─ cache miss → Geocoding API → Forecast API → готовые данные
 ↓
JSON report
 ↓
вывод в консоль
```

Запросы разных городов запускаются параллельно. Внутри обработки одного города геокодинг и запрос прогноза выполняются последовательно, потому что для прогноза сначала нужны координаты.

Основные модули Weather CLI:

- `src/index.js` — точка входа, запуск CLI, вывод результатов и установка exit code;
- `src/config.js` — чтение, проверка и значения по умолчанию для переменных окружения;
- `src/cli/arguments.js` — разбор и валидация аргументов командной строки;
- `src/api/openMeteo.js` — HTTP-запросы геокодинга и прогноза к Open-Meteo;
- `src/services/weatherService.js` — проверка кэша и обработка одного или нескольких городов;
- `src/storage/reportStorage.js` — чтение и сохранение JSON-отчётов;
- `src/format/consoleFormatter.js` — преобразование прогноза в строку для консоли.

## Postman Case 1

Коллекция находится по пути:

```text
docs/postman/CaseLab Weather Digest.postman_collection.json
```

Postman Collection v2.1 содержит запросы Geocoding и Forecast, переменные коллекции, а также сохранённые примеры успешных ответов, города без результата и HTTP 400 для некорректных параметров.

# Case 2 — Maintenance REST API

REST API предназначен для учёта оборудования, заявок на техническое обслуживание, состояния заявок и погодных условий для наружных работ.

Week 2 использует **in-memory repositories**. Оборудование и заявки хранятся только в памяти процесса и сбрасываются после перезапуска сервера. Доступ к данным из business logic выполняется через repository layer, поэтому способ хранения можно заменить без переноса бизнес-правил в controllers.

## Запуск REST API

```bash
npm start
```

По умолчанию сервер доступен по адресу `http://localhost:3000`.

Проверка состояния:

```http
GET http://localhost:3000/api/health
```

Успешный ответ:

```json
{
  "status": "ok"
}
```

Case 1 при этом остаётся доступен отдельной командой:

```bash
npm run weather -- --city Москва --days 3
```

## Переменные окружения

Все поддерживаемые переменные перечислены в `.env.example` и обрабатываются в `src/config.js`.

| Variable                    | Description                                          | Default / Example                                |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| `PORT`                      | Порт Express API.                                    | `3000`                                           |
| `NODE_ENV`                  | Название окружения, отображаемое при старте сервера. | `development`                                    |
| `GEOCODING_API_URL`         | URL геокодинга Open-Meteo для Case 1.                | `https://geocoding-api.open-meteo.com/v1/search` |
| `FORECAST_API_URL`          | URL прогноза Open-Meteo для обоих кейсов.            | `https://api.open-meteo.com/v1/forecast`         |
| `REQUEST_TIMEOUT_MS`        | Timeout запросов к Open-Meteo, мс.                   | `5000`                                           |
| `REPORTS_DIR`               | Каталог отчётов и кэша Weather CLI.                  | `reports`                                        |
| `TEMPERATURE_UNIT`          | Единица температуры: `celsius` или `fahrenheit`.     | `celsius`                                        |
| `PRECIPITATION_UNIT`        | Единица осадков Weather CLI: `mm` или `inch`.        | `mm`                                             |
| `OUTDOOR_MAX_PRECIPITATION` | Максимальные осадки для наружных работ.              | `0` мм                                           |
| `OUTDOOR_MAX_WIND_SPEED`    | Максимальная скорость ветра для наружных работ.      | `36` км/ч                                        |
| `CORS_ORIGINS`              | Разрешённые Origin через запятую.                    | `http://localhost:3000,http://localhost:5173`    |
| `RATE_LIMIT_WINDOW_MS`      | Размер окна rate limit, мс.                          | `60000`                                          |
| `RATE_LIMIT_MAX`            | Максимум запросов к `/api` в одном окне.             | `100`                                            |
| `LOG_LEVEL`                 | Уровень логирования Pino.                            | `info`                                           |

Файл `.env` не загружается автоматически: проект не использует `dotenv`. Для запуска API с файлом окружения используйте встроенную поддержку Node.js:

```bash
cp .env.example .env
node --env-file=.env src/server.js
```

Для одной переменной достаточно shell-синтаксиса:

```bash
PORT=4000 npm start
```

Не добавляйте локальный `.env` в Git.

## Архитектура

Основной путь HTTP-запроса:

```text
routes
  → validation middleware
  → controllers
  → services
  → repositories
```

- **Routes** связывают HTTP method и URL с middleware и controller.
- **Controllers** получают проверенные данные запроса и формируют HTTP response.
- **Services** содержат бизнес-правила и координируют операции.
- **Repositories** предоставляют абстракцию доступа к in-memory данным.
- **Validators** описывают Zod-схемы для body, params и query.
- **Middlewares** реализуют общие HTTP-задачи: request ID, logging, Helmet, CORS, rate limit, JSON parsing, validation и обработку ошибок.
- **Errors** задают типы ошибок приложения, HTTP statuses и стабильные error codes.

## Структура проекта

```text
src/
├── api/
│   └── openMeteo.js
├── cli/
│   └── arguments.js
├── controllers/
│   ├── equipment.controller.js
│   ├── equipmentWeather.controller.js
│   └── request.controller.js
├── errors/
├── format/
│   └── consoleFormatter.js
├── middlewares/
├── repositories/
│   ├── equipment.repository.js
│   └── request.repository.js
├── routes/
│   ├── equipment.routes.js
│   ├── health.routes.js
│   └── request.routes.js
├── services/
│   ├── equipment.service.js
│   ├── equipmentWeather.service.js
│   ├── request.service.js
│   └── weatherService.js
├── storage/
│   └── reportStorage.js
├── validators/
├── app.js
├── config.js
├── index.js
├── logger.js
└── server.js
docs/
└── postman/
    ├── CaseLab Maintenance API.postman_collection.json
    ├── CaseLab Maintenance API.postman_environment.json
    └── CaseLab Weather Digest.postman_collection.json
.env.example
package.json
README.md
```

## Equipment model

| Поле           | Описание                                                           |
| -------------- | ------------------------------------------------------------------ |
| `id`           | UUID, генерируется сервером.                                       |
| `name`         | Название длиной от 3 до 100 символов.                              |
| `type`         | Тип оборудования.                                                  |
| `serialNumber` | Непустой уникальный серийный номер.                                |
| `location`     | Координаты `{ lat, lon }`: lat от -90 до 90, lon от -180 до 180.   |
| `status`       | Текущее состояние оборудования.                                    |
| `installedAt`  | Реальная дата `YYYY-MM-DD`, которая не может находиться в будущем. |

Допустимые значения `type`: `turbine`, `inverter`, `sensor`, `substation`.

Допустимые значения `status`: `operational`, `maintenance`, `fault`, `decommissioned`.

`serialNumber` должен быть уникальным. Попытка создать или обновить оборудование с уже существующим серийным номером возвращает `409 Conflict` с кодом `EQUIPMENT_SERIAL_CONFLICT`.

## Maintenance Request model

| Поле          | Описание                                             |
| ------------- | ---------------------------------------------------- |
| `id`          | UUID, генерируется сервером.                         |
| `equipmentId` | UUID существующего оборудования.                     |
| `title`       | Название заявки длиной от 5 до 120 символов.         |
| `description` | Необязательное описание длиной до 2000 символов.     |
| `priority`    | Приоритет заявки.                                    |
| `status`      | При создании сервер устанавливает `new`.             |
| `plannedAt`   | Необязательная дата и время в формате ISO date-time. |
| `createdAt`   | ISO date-time, генерируется сервером.                |
| `updatedAt`   | ISO date-time, генерируется и обновляется сервером.  |

Допустимые значения `priority`: `low`, `medium`, `high`, `critical`.

Допустимые значения `status`: `new`, `in_progress`, `done`, `rejected`.

`equipmentId` должен ссылаться на существующее оборудование. Если оборудование не найдено, создание или перенос заявки возвращает `404 Not Found` с кодом `EQUIPMENT_NOT_FOUND`.

## Переходы статусов заявок

```text
new
├──> in_progress
│      ├──> done
│      └──> rejected
└──> rejected
```

Разрешены только следующие переходы:

- `new` → `in_progress`;
- `new` → `rejected`;
- `in_progress` → `done`;
- `in_progress` → `rejected`.

Запрещены:

- `new` → `done`;
- любые переходы из `done`;
- любые переходы из `rejected`;
- повторная установка текущего статуса.

Любой недопустимый переход возвращает `409 Conflict` с кодом `INVALID_REQUEST_STATUS_TRANSITION`.

Статус изменяется только через отдельный endpoint, а не через обычный PATCH заявки:

```http
PATCH /api/requests/:id/status
```

```json
{
  "status": "in_progress"
}
```

## API endpoints

### Health

| Method | Endpoint      | Description                 | Success status |
| ------ | ------------- | --------------------------- | -------------- |
| GET    | `/api/health` | Проверить состояние сервиса | `200`          |

### Equipment

| Method | Endpoint                      | Description                             | Success status |
| ------ | ----------------------------- | --------------------------------------- | -------------- |
| GET    | `/api/equipment`              | Получить список оборудования            | `200`          |
| POST   | `/api/equipment`              | Создать оборудование                    | `201`          |
| GET    | `/api/equipment/:id`          | Получить оборудование по UUID           | `200`          |
| PATCH  | `/api/equipment/:id`          | Частично изменить оборудование          | `200`          |
| DELETE | `/api/equipment/:id`          | Удалить оборудование                    | `204`          |
| GET    | `/api/equipment/:id/requests` | Получить заявки выбранного оборудования | `200`          |
| GET    | `/api/equipment/:id/weather`  | Получить прогноз для оборудования       | `200`          |

### Maintenance Requests

| Method | Endpoint                   | Description                          | Success status |
| ------ | -------------------------- | ------------------------------------ | -------------- |
| GET    | `/api/requests`            | Получить список заявок               | `200`          |
| POST   | `/api/requests`            | Создать заявку                       | `201`          |
| GET    | `/api/requests/:id`        | Получить заявку по UUID              | `200`          |
| PATCH  | `/api/requests/:id`        | Частично изменить поля заявки        | `200`          |
| PATCH  | `/api/requests/:id/status` | Выполнить допустимый переход статуса | `200`          |
| DELETE | `/api/requests/:id`        | Удалить заявку                       | `204`          |

## Фильтрация, сортировка и пагинация

### Equipment query parameters

| Параметр        | Значения / формат                                       | Default |
| --------------- | ------------------------------------------------------- | ------- |
| `status`        | `operational`, `maintenance`, `fault`, `decommissioned` | —       |
| `type`          | `turbine`, `inverter`, `sensor`, `substation`           | —       |
| `installedFrom` | Дата `YYYY-MM-DD` включительно                          | —       |
| `installedTo`   | Дата `YYYY-MM-DD` включительно                          | —       |
| `sortBy`        | `name`, `type`, `serialNumber`, `status`, `installedAt` | `name`  |
| `sortOrder`     | `asc`, `desc`                                           | `asc`   |
| `page`          | Целое число от 1                                        | `1`     |
| `limit`         | Целое число от 1 до 100                                 | `10`    |

```http
GET /api/equipment?type=turbine&status=operational&page=1&limit=10
```

### Request query parameters

Параметры применяются к `/api/requests` и `/api/equipment/:id/requests`.

| Параметр      | Значения / формат                                                    | Default     |
| ------------- | -------------------------------------------------------------------- | ----------- |
| `status`      | `new`, `in_progress`, `done`, `rejected`                             | —           |
| `priority`    | `low`, `medium`, `high`, `critical`                                  | —           |
| `equipmentId` | UUID оборудования                                                    | —           |
| `createdFrom` | `YYYY-MM-DD` или ISO date-time                                       | —           |
| `createdTo`   | `YYYY-MM-DD` или ISO date-time                                       | —           |
| `sortBy`      | `title`, `priority`, `status`, `plannedAt`, `createdAt`, `updatedAt` | `createdAt` |
| `sortOrder`   | `asc`, `desc`                                                        | `desc`      |
| `page`        | Целое число от 1                                                     | `1`         |
| `limit`       | Целое число от 1 до 100                                              | `10`        |

```http
GET /api/requests?priority=high&status=new&sortBy=createdAt&sortOrder=desc
```

Оба списка возвращают единый paginated response: элементы находятся в `data`, а общее количество и текущие параметры пагинации — в `meta`.

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 10
  }
}
```

## Создание оборудования

```http
POST /api/equipment
Content-Type: application/json
```

```json
{
  "name": "Турбина №1",
  "type": "turbine",
  "serialNumber": "WT-2026-001",
  "location": {
    "lat": 55.75,
    "lon": 37.61
  },
  "status": "operational",
  "installedAt": "2024-05-20"
}
```

Ответ `201 Created` содержит созданный объект и header `Location: /api/equipment/<id>`:

```json
{
  "data": {
    "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "name": "Турбина №1",
    "type": "turbine",
    "serialNumber": "WT-2026-001",
    "location": {
      "lat": 55.75,
      "lon": 37.61
    },
    "status": "operational",
    "installedAt": "2024-05-20"
  }
}
```

## Создание заявки

`equipmentId` должен ссылаться на существующее оборудование.

```http
POST /api/requests
Content-Type: application/json
```

```json
{
  "equipmentId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "title": "Плановое обслуживание турбины",
  "description": "Проверить основные узлы",
  "priority": "high",
  "plannedAt": "2026-10-01T10:00:00.000Z"
}
```

Ответ `201 Created` получает header `Location: /api/requests/<id>`. Сервер добавляет `id`, начальный статус и timestamps:

```json
{
  "data": {
    "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "equipmentId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "title": "Плановое обслуживание турбины",
    "description": "Проверить основные узлы",
    "priority": "high",
    "plannedAt": "2026-10-01T10:00:00.000Z",
    "status": "new",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "updatedAt": "2026-09-15T10:00:00.000Z"
  }
}
```

## Правило удаления оборудования

`DELETE /api/equipment/:id` запрещён, если у оборудования существует хотя бы одна открытая заявка со статусом `new` или `in_progress`.

В этом случае API возвращает `409 Conflict` и код `EQUIPMENT_HAS_OPEN_REQUESTS`. Если все связанные заявки имеют статус `done` или `rejected`, оборудование можно удалить.

## Погода и пригодность наружных работ

```http
GET /api/equipment/:id/weather?days=3
```

`days` — целое число от 1 до 7, значение по умолчанию — `3`. Координаты берутся из `equipment.location`, поэтому отдельный геокодинг не требуется. Endpoint переиспользует Open-Meteo client из Case 1 и добавляет к прогнозу максимальную скорость ветра.

Сокращённый ответ:

```json
{
  "data": {
    "equipmentId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "location": {
      "lat": 55.75,
      "lon": 37.61
    },
    "rules": {
      "maxPrecipitation": 0,
      "maxWindSpeed": 36,
      "precipitationUnit": "mm",
      "windSpeedUnit": "km/h"
    },
    "outdoorWorkSuitable": true,
    "forecast": [
      {
        "date": "2026-09-15",
        "minTemperature": 8.4,
        "maxTemperature": 16.1,
        "precipitation": 0,
        "maxWindSpeed": 18.2,
        "suitableForOutdoorWork": true
      }
    ]
  }
}
```

Каждый день подходит для наружных работ, только если одновременно выполняются условия:

```text
precipitation <= OUTDOOR_MAX_PRECIPITATION
AND
maxWindSpeed <= OUTDOOR_MAX_WIND_SPEED
```

Поле `suitableForOutdoorWork` содержит результат для одного дня. `outdoorWorkSuitable` равно `true`, только если подходят **все** дни прогноза. Defaults: `0` мм осадков и `36` км/ч ветра.

Ошибка внешнего погодного API преобразуется в контролируемый ответ и не останавливает REST server:

- `502 WEATHER_API_ERROR` — Open-Meteo недоступен или вернул некорректный ответ;
- `504 WEATHER_API_TIMEOUT` — превышен `REQUEST_TIMEOUT_MS`.

## Формат ошибок

Все контролируемые ошибки возвращаются в едином формате:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Переданы некорректные данные.",
    "details": [],
    "requestId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
  }
}
```

| HTTP status | Пример причины                   | Реальные error codes                                                                            |
| ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `400`       | Некорректный JSON                | `INVALID_JSON`                                                                                  |
| `403`       | Origin запрещён CORS             | `CORS_ORIGIN_DENIED`                                                                            |
| `404`       | Ресурс или маршрут не найден     | `EQUIPMENT_NOT_FOUND`, `REQUEST_NOT_FOUND`, `ROUTE_NOT_FOUND`                                   |
| `409`       | Конфликт бизнес-правил           | `EQUIPMENT_SERIAL_CONFLICT`, `EQUIPMENT_HAS_OPEN_REQUESTS`, `INVALID_REQUEST_STATUS_TRANSITION` |
| `413`       | JSON body больше 100kb           | `PAYLOAD_TOO_LARGE`                                                                             |
| `422`       | Ошибка body, params или query    | `VALIDATION_ERROR`                                                                              |
| `429`       | Превышен rate limit              | `RATE_LIMIT_EXCEEDED`                                                                           |
| `500`       | Непредвиденная внутренняя ошибка | `INTERNAL_ERROR`                                                                                |
| `502`       | Ошибка внешнего погодного API    | `WEATHER_API_ERROR`                                                                             |
| `504`       | Timeout внешнего погодного API   | `WEATHER_API_TIMEOUT`                                                                           |

## Request ID и logging

Каждый HTTP response получает header `X-Request-Id`. Если клиент прислал непустой `X-Request-Id`, сервер переиспользует его; иначе генерирует UUID. Тот же идентификатор присутствует в error JSON и структурированных логах.

Логирование выполняется через Pino. Для каждого завершённого HTTP request записываются:

- `requestId`;
- `method`;
- `path`;
- `status`;
- `durationMs`.

Уровни логирования:

- `info` — HTTP 2xx и 3xx;
- `warn` — HTTP 4xx;
- `error` — HTTP 5xx.

Тело запроса автоматически не логируется.

## Security

### CORS

Сервер использует явный allowlist из `CORS_ORIGINS`; wildcard `*` не применяется. Запросы без header `Origin` разрешены. Запрещённый Origin получает `403 CORS_ORIGIN_DENIED`.

### Rate limit

Rate limit действует на `/api` и настраивается через `RATE_LIMIT_WINDOW_MS` и `RATE_LIMIT_MAX`. При превышении лимита API возвращает `429 RATE_LIMIT_EXCEEDED` и стандартные `RateLimit` headers.

### Helmet

Helmet добавляет защитные HTTP headers ко всем ответам.

### Ограничение размера body

JSON body ограничен значением `100kb`. Превышение возвращает `413 PAYLOAD_TOO_LARGE`.

## Postman Case 2

Файлы:

```text
docs/postman/CaseLab Maintenance API.postman_collection.json
docs/postman/CaseLab Maintenance API.postman_environment.json
```

Порядок запуска:

1. Импортировать collection.
2. Импортировать environment.
3. Запустить `npm start`.
4. Выбрать environment `CaseLab Maintenance API`.
5. Выполнять папки collection сверху вниз.

Collection автоматически сохраняет runtime IDs оборудования и заявок в environment. Она содержит success flow, negative scenarios, security-проверки и cleanup.

Для отдельного rate limit scenario сначала остановите обычный сервер и запустите:

```bash
RATE_LIMIT_MAX=2 npm start
```

Затем выполните три запроса специальной подпапки по порядку: первые два должны вернуть `200`, третий — `429`. Обычный default `RATE_LIMIT_MAX=100` ради теста не изменяется.

## In-memory storage

Данные Week 2 не записываются в файлы или базу данных. После каждого перезапуска процесса списки оборудования и заявок очищаются — это ожидаемое поведение текущей реализации.

Repository abstraction отделяет хранение от services и позволит заменить in-memory repositories на другой источник данных без переноса business rules в controllers.

## NPM scripts

| Команда                              | Назначение                                        |
| ------------------------------------ | ------------------------------------------------- |
| `npm start`                          | Запускает Express API через `node src/server.js`. |
| `npm run weather -- <CLI-аргументы>` | Запускает Weather CLI через `node src/index.js`.  |
| `npm run lint`                       | Проверяет проект с помощью ESLint.                |
| `npm run format`                     | Форматирует проект с помощью Prettier.            |
| `npm run format:check`               | Проверяет форматирование без изменения файлов.    |
