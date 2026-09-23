import { QueryTypes } from 'sequelize';
import { Site, sequelize } from '../db/models/index.js';

const siteSummarySql = `
  WITH terminal_transitions AS (
    SELECT
      request_id,
      MIN(created_at) AS closed_at
    FROM request_status_history
    WHERE new_status IN ('done', 'rejected')
    GROUP BY request_id
  ),
  site_requests AS (
    SELECT
      requests.id,
      requests.status,
      requests.priority,
      requests.created_at,
      terminal_transitions.closed_at
    FROM equipment
    INNER JOIN maintenance_requests AS requests
      ON requests.equipment_id = equipment.id
    LEFT JOIN terminal_transitions
      ON terminal_transitions.request_id = requests.id
    WHERE equipment.site_id = $siteId
  )
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'new') AS new_count,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
    COUNT(*) FILTER (WHERE status = 'done') AS done_count,
    COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
    COUNT(*) FILTER (WHERE priority = 'low') AS low_count,
    COUNT(*) FILTER (WHERE priority = 'medium') AS medium_count,
    COUNT(*) FILTER (WHERE priority = 'high') AS high_count,
    COUNT(*) FILTER (WHERE priority = 'critical') AS critical_count,
    AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 3600)
      FILTER (WHERE closed_at IS NOT NULL) AS average_close_hours
  FROM site_requests
`;

const equipmentLoadSql = `
  WITH filtered_requests AS (
    SELECT
      id,
      equipment_id,
      status
    FROM maintenance_requests
    WHERE (CAST($from AS timestamptz) IS NULL OR created_at >= $from)
      AND (CAST($to AS timestamptz) IS NULL OR created_at <= $to)
  ),
  request_labor AS (
    SELECT
      assignments.request_id,
      SUM(assignments.hours) AS planned_hours
    FROM request_assignees AS assignments
    INNER JOIN filtered_requests
      ON filtered_requests.id = assignments.request_id
    GROUP BY assignments.request_id
  ),
  request_done_times AS (
    SELECT
      history.request_id,
      MIN(history.created_at) FILTER (WHERE history.new_status = 'done') AS done_at
    FROM request_status_history AS history
    INNER JOIN filtered_requests
      ON filtered_requests.id = history.request_id
    GROUP BY history.request_id
  )
  SELECT
    equipment.id AS equipment_id,
    equipment.name AS equipment_name,
    equipment.serial_number,
    COUNT(filtered_requests.id) AS request_count,
    COUNT(filtered_requests.id)
      FILTER (WHERE filtered_requests.status IN ('done', 'rejected'))
      AS closed_request_count,
    COALESCE(SUM(request_labor.planned_hours), 0) AS total_planned_hours,
    MAX(request_done_times.done_at) AS last_maintenance_at
  FROM equipment
  LEFT JOIN filtered_requests
    ON filtered_requests.equipment_id = equipment.id
  LEFT JOIN request_labor
    ON request_labor.request_id = filtered_requests.id
  LEFT JOIN request_done_times
    ON request_done_times.request_id = filtered_requests.id
  GROUP BY equipment.id, equipment.name, equipment.serial_number
  HAVING COUNT(filtered_requests.id) >= $minRequests
  ORDER BY equipment.name ASC, equipment.id ASC
  LIMIT $limit
  OFFSET $offset
`;

function toIsoString(value) {
  return value ? new Date(value).toISOString() : null;
}

function mapSite(site) {
  if (!site) return null;

  const plainSite = site.get({ plain: true });
  return {
    id: plainSite.id,
    name: plainSite.name,
    code: plainSite.code,
    region: plainSite.region,
  };
}

function mapSiteRequestSummary(row) {
  return {
    total: Number(row.total),
    byStatus: {
      new: Number(row.new_count),
      in_progress: Number(row.in_progress_count),
      done: Number(row.done_count),
      rejected: Number(row.rejected_count),
    },
    byPriority: {
      low: Number(row.low_count),
      medium: Number(row.medium_count),
      high: Number(row.high_count),
      critical: Number(row.critical_count),
    },
    averageCloseHours:
      row.average_close_hours === null ? null : Number(row.average_close_hours),
  };
}

function mapEquipmentLoad(row) {
  return {
    equipmentId: row.equipment_id,
    equipmentName: row.equipment_name,
    serialNumber: row.serial_number,
    requestCount: Number(row.request_count),
    closedRequestCount: Number(row.closed_request_count),
    totalPlannedHours: Number(row.total_planned_hours),
    lastMaintenanceAt: toIsoString(row.last_maintenance_at),
  };
}

export async function findSiteById(id) {
  const site = await Site.findByPk(id, {
    attributes: ['id', 'name', 'code', 'region'],
  });

  return mapSite(site);
}

export async function getSiteRequestSummary(siteId) {
  const [row] = await sequelize.query(siteSummarySql, {
    bind: { siteId },
    type: QueryTypes.SELECT,
  });

  return mapSiteRequestSummary(row);
}

export async function getEquipmentLoad(options) {
  const rows = await sequelize.query(equipmentLoadSql, {
    bind: {
      from: options.from ?? null,
      to: options.to ?? null,
      minRequests: options.minRequests,
      limit: options.limit,
      offset: options.offset,
    },
    type: QueryTypes.SELECT,
  });

  return rows.map(mapEquipmentLoad);
}
