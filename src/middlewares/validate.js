import { ZodError } from 'zod';
import { ValidationError } from '../errors/ValidationError.js';

function formatDetails(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

export function validate(schemas) {
  return (request, response, next) => {
    try {
      const validated = {};

      for (const source of ['body', 'params', 'query']) {
        if (schemas[source]) {
          validated[source] = schemas[source].parse(request[source]);
        }
      }

      request.validated = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError(
            'Переданы некорректные данные.',
            formatDetails(error)
          )
        );
        return;
      }

      next(error);
    }
  };
}
