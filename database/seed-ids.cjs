function createId(group, index) {
  return `${group}0000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

module.exports = {
  siteIds: [createId(1, 1), createId(1, 2)],
  equipmentIds: Array.from({ length: 6 }, (_, index) => createId(2, index + 1)),
  passportIds: Array.from({ length: 6 }, (_, index) => createId(3, index + 1)),
  technicianIds: Array.from({ length: 5 }, (_, index) =>
    createId(4, index + 1)
  ),
  requestIds: Array.from({ length: 20 }, (_, index) => createId(5, index + 1)),
  createHistoryId: (index) => createId(6, index),
};
