import { AppError } from '../errors/AppError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import * as analyticsRepository from '../repositories/analytics.repository.js';

function createSiteNotFoundError() {
  return new NotFoundError('Площадка не найдена.', 'SITE_NOT_FOUND');
}

function validatePagination(limit, offset) {
  if (limit < 1 || limit > 100 || offset < 0 || offset > 10000) {
    throw new AppError(
      'Параметры limit или offset вне допустимого диапазона.',
      400,
      'INVALID_PAGINATION'
    );
  }
}

export async function getSiteSummary(id) {
  const site = await analyticsRepository.findSiteById(id);

  if (!site) throw createSiteNotFoundError();

  const requests = await analyticsRepository.getSiteRequestSummary(id);
  return { site, requests };
}

export async function getEquipmentLoad(query) {
  validatePagination(query.limit, query.offset);
  return analyticsRepository.getEquipmentLoad(query);
}
