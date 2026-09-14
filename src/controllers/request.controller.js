import * as requestService from '../services/request.service.js';

function sendList(response, items, total, query) {
  response.status(200).json({
    data: items,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
    },
  });
}

export async function listRequests(request, response) {
  const query = request.validated.query;
  const { items, total } = await requestService.listRequests(query);
  sendList(response, items, total, query);
}

export async function getRequest(request, response) {
  const maintenanceRequest = await requestService.getRequest(
    request.validated.params.id
  );
  response.status(200).json({ data: maintenanceRequest });
}

export async function createRequest(request, response) {
  const maintenanceRequest = await requestService.createRequest(
    request.validated.body
  );

  response
    .location(`/api/requests/${maintenanceRequest.id}`)
    .status(201)
    .json({ data: maintenanceRequest });
}

export async function updateRequest(request, response) {
  const maintenanceRequest = await requestService.updateRequest(
    request.validated.params.id,
    request.validated.body
  );
  response.status(200).json({ data: maintenanceRequest });
}

export async function changeRequestStatus(request, response) {
  const maintenanceRequest = await requestService.changeRequestStatus(
    request.validated.params.id,
    request.validated.body.status
  );
  response.status(200).json({ data: maintenanceRequest });
}

export async function deleteRequest(request, response) {
  await requestService.deleteRequest(request.validated.params.id);
  response.status(204).send();
}

export async function listEquipmentRequests(request, response) {
  const query = request.validated.query;
  const { items, total } = await requestService.listRequestsForEquipment(
    request.validated.params.id,
    query
  );
  sendList(response, items, total, query);
}
