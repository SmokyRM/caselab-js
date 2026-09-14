const requestItems = [];

function copyRequest(request) {
  return structuredClone(request);
}

function compareValues(firstValue, secondValue) {
  if (firstValue === secondValue) return 0;
  if (firstValue === undefined) return 1;
  if (secondValue === undefined) return -1;

  return firstValue.localeCompare(secondValue, 'ru');
}

export async function findAll(options) {
  const {
    status,
    priority,
    equipmentId,
    createdFrom,
    createdTo,
    sortBy,
    sortOrder,
    page,
    limit,
  } = options;

  let filteredItems = requestItems.filter((request) => {
    if (status && request.status !== status) return false;
    if (priority && request.priority !== priority) return false;
    if (equipmentId && request.equipmentId !== equipmentId) return false;
    if (createdFrom && request.createdAt < createdFrom) return false;
    if (createdTo && request.createdAt > createdTo) return false;

    return true;
  });

  filteredItems = [...filteredItems].sort((first, second) => {
    const comparison = compareValues(first[sortBy], second[sortBy]);
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const total = filteredItems.length;
  const startIndex = (page - 1) * limit;
  const items = filteredItems
    .slice(startIndex, startIndex + limit)
    .map(copyRequest);

  return { items, total };
}

export async function findById(id) {
  const request = requestItems.find((item) => item.id === id);
  return request ? copyRequest(request) : null;
}

export async function findByEquipmentId(equipmentId, options) {
  return findAll({ ...options, equipmentId });
}

export async function create(data) {
  const request = copyRequest(data);
  requestItems.push(request);
  return copyRequest(request);
}

export async function update(id, changes) {
  const index = requestItems.findIndex((item) => item.id === id);

  if (index === -1) return null;

  requestItems[index] = {
    ...requestItems[index],
    ...copyRequest(changes),
  };

  return copyRequest(requestItems[index]);
}

export async function remove(id) {
  const index = requestItems.findIndex((item) => item.id === id);

  if (index === -1) return false;

  requestItems.splice(index, 1);
  return true;
}

export async function hasOpenByEquipmentId(equipmentId) {
  return requestItems.some(
    (request) =>
      request.equipmentId === equipmentId &&
      (request.status === 'new' || request.status === 'in_progress')
  );
}
