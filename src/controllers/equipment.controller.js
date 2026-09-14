import * as equipmentService from '../services/equipment.service.js';

export async function listEquipment(request, response) {
  const query = request.validated.query;
  const { items, total } = await equipmentService.listEquipment(query);

  response.status(200).json({
    data: items,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
    },
  });
}

export async function getEquipment(request, response) {
  const equipment = await equipmentService.getEquipment(
    request.validated.params.id
  );
  response.status(200).json({ data: equipment });
}

export async function createEquipment(request, response) {
  const equipment = await equipmentService.createEquipment(
    request.validated.body
  );

  response
    .location(`/api/equipment/${equipment.id}`)
    .status(201)
    .json({ data: equipment });
}

export async function updateEquipment(request, response) {
  const equipment = await equipmentService.updateEquipment(
    request.validated.params.id,
    request.validated.body
  );
  response.status(200).json({ data: equipment });
}

export async function deleteEquipment(request, response) {
  await equipmentService.deleteEquipment(request.validated.params.id);
  response.status(204).send();
}
