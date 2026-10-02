import SwaggerParser from '@apidevtools/swagger-parser';
import openapiDocument from '../src/docs/openapi.js';

await SwaggerParser.validate(openapiDocument);

const operations = Object.values(openapiDocument.paths).reduce(
  (total, pathItem) =>
    total +
    Object.keys(pathItem).filter((key) =>
      ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(key)
    ).length,
  0
);

console.log(
  `OpenAPI ${openapiDocument.openapi} is valid: ` +
    `${Object.keys(openapiDocument.paths).length} paths, ` +
    `${operations} operations, ` +
    `${Object.keys(openapiDocument.components.schemas).length} schemas.`
);
