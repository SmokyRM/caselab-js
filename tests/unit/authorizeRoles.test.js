import { describe, expect, it, jest } from '@jest/globals';
import { authorizeRoles } from '../../src/middlewares/authorizeRoles.js';

function runMiddleware(allowedRoles, user) {
  const next = jest.fn();
  const request = { user };

  authorizeRoles(...allowedRoles)(request, {}, next);

  return next;
}

describe('authorizeRoles', () => {
  it('passes a 403 error when user is absent', () => {
    const next = runMiddleware(['viewer'], undefined);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('allows viewer when viewer role is allowed', () => {
    const next = runMiddleware(['viewer'], { role: 'viewer' });

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects viewer on an admin-only operation', () => {
    const next = runMiddleware(['admin'], { role: 'viewer' });

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('allows admin when admin role is allowed', () => {
    const next = runMiddleware(['admin'], { role: 'admin' });

    expect(next).toHaveBeenCalledWith();
  });

  it('allows technician when technician or admin is allowed', () => {
    const next = runMiddleware(['technician', 'admin'], {
      role: 'technician',
    });

    expect(next).toHaveBeenCalledWith();
  });
});
