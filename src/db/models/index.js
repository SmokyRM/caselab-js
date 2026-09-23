import { sequelize } from '../sequelize.js';
import { Equipment } from './Equipment.js';
import { EquipmentPassport } from './EquipmentPassport.js';
import { MaintenanceRequest } from './MaintenanceRequest.js';
import { RequestAssignee } from './RequestAssignee.js';
import { RequestStatusHistory } from './RequestStatusHistory.js';
import { Site } from './Site.js';
import { Technician } from './Technician.js';

Site.hasMany(Equipment, {
  foreignKey: 'site_id',
  as: 'equipment',
});

Equipment.belongsTo(Site, {
  foreignKey: 'site_id',
  as: 'site',
});

Equipment.hasOne(EquipmentPassport, {
  foreignKey: 'equipment_id',
  as: 'passport',
});

EquipmentPassport.belongsTo(Equipment, {
  foreignKey: 'equipment_id',
  as: 'equipment',
});

Equipment.hasMany(MaintenanceRequest, {
  foreignKey: 'equipment_id',
  as: 'requests',
});

MaintenanceRequest.belongsTo(Equipment, {
  foreignKey: 'equipment_id',
  as: 'equipment',
});

MaintenanceRequest.hasMany(RequestStatusHistory, {
  foreignKey: 'request_id',
  as: 'history',
});

RequestStatusHistory.belongsTo(MaintenanceRequest, {
  foreignKey: 'request_id',
  as: 'request',
});

MaintenanceRequest.belongsToMany(Technician, {
  through: RequestAssignee,
  foreignKey: 'request_id',
  otherKey: 'technician_id',
  as: 'technicians',
});

Technician.belongsToMany(MaintenanceRequest, {
  through: RequestAssignee,
  foreignKey: 'technician_id',
  otherKey: 'request_id',
  as: 'requests',
});

MaintenanceRequest.hasMany(RequestAssignee, {
  foreignKey: 'request_id',
  as: 'assignments',
});

RequestAssignee.belongsTo(MaintenanceRequest, {
  foreignKey: 'request_id',
  as: 'request',
});

Technician.hasMany(RequestAssignee, {
  foreignKey: 'technician_id',
  as: 'assignments',
});

RequestAssignee.belongsTo(Technician, {
  foreignKey: 'technician_id',
  as: 'technician',
});

export {
  Equipment,
  EquipmentPassport,
  MaintenanceRequest,
  RequestAssignee,
  RequestStatusHistory,
  Site,
  Technician,
  sequelize,
};
