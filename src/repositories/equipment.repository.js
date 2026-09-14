const equipmentItems = [];

function copyEquipment(equipment) {
  return structuredClone(equipment);
}

export async function findAll(options) {
  const {
    status,
    type,
    installedFrom,
    installedTo,
    sortBy,
    sortOrder,
    page,
    limit,
  } = options;

  let filteredItems = equipmentItems.filter((equipment) => {
    if (status && equipment.status !== status) return false;
    if (type && equipment.type !== type) return false;
    if (installedFrom && equipment.installedAt < installedFrom) return false;
    if (installedTo && equipment.installedAt > installedTo) return false;

    return true;
  });

  filteredItems = [...filteredItems].sort((first, second) => {
    const comparison = first[sortBy].localeCompare(second[sortBy], 'ru');
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const total = filteredItems.length;
  const startIndex = (page - 1) * limit;
  const items = filteredItems
    .slice(startIndex, startIndex + limit)
    .map(copyEquipment);

  return { items, total };
}

export async function findById(id) {
  const equipment = equipmentItems.find((item) => item.id === id);
  return equipment ? copyEquipment(equipment) : null;
}

export async function findBySerialNumber(serialNumber) {
  const equipment = equipmentItems.find(
    (item) => item.serialNumber === serialNumber
  );
  return equipment ? copyEquipment(equipment) : null;
}

export async function create(data) {
  const equipment = copyEquipment(data);
  equipmentItems.push(equipment);
  return copyEquipment(equipment);
}

export async function update(id, changes) {
  const index = equipmentItems.findIndex((item) => item.id === id);

  if (index === -1) return null;

  equipmentItems[index] = {
    ...equipmentItems[index],
    ...copyEquipment(changes),
  };

  return copyEquipment(equipmentItems[index]);
}

export async function remove(id) {
  const index = equipmentItems.findIndex((item) => item.id === id);

  if (index === -1) return false;

  equipmentItems.splice(index, 1);
  return true;
}
