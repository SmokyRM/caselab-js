import { QueryTypes } from 'sequelize';
import { sequelize } from '../db/models/index.js';

const requestMetricsSql = `
  WITH terminal_transitions AS (
    SELECT
      request_id,
      MIN(created_at) AS closed_at
    FROM request_status_history
    WHERE new_status IN ('done', 'rejected')
    GROUP BY request_id
  )
  SELECT
    COUNT(*) FILTER (WHERE requests.status = 'new') AS new_count,
    COUNT(*) FILTER (WHERE requests.status = 'in_progress') AS in_progress_count,
    COUNT(*) FILTER (WHERE requests.status = 'done') AS done_count,
    COUNT(*) FILTER (WHERE requests.status = 'rejected') AS rejected_count,
    COUNT(*) FILTER (WHERE requests.priority = 'low') AS low_count,
    COUNT(*) FILTER (WHERE requests.priority = 'medium') AS medium_count,
    COUNT(*) FILTER (WHERE requests.priority = 'high') AS high_count,
    COUNT(*) FILTER (WHERE requests.priority = 'critical') AS critical_count,
    AVG(EXTRACT(EPOCH FROM (terminal_transitions.closed_at - requests.created_at)) / 3600)
      FILTER (WHERE terminal_transitions.closed_at IS NOT NULL)
      AS average_close_hours,
    COUNT(*) FILTER (
      WHERE requests.planned_at IS NOT NULL
        AND requests.planned_at < NOW()
        AND requests.status NOT IN ('done', 'rejected')
    ) AS overdue_count
  FROM maintenance_requests AS requests
  LEFT JOIN terminal_transitions
    ON terminal_transitions.request_id = requests.id
`;

const equipmentMetricsSql = `
  WITH request_labor AS (
    SELECT
      request_id,
      SUM(hours) AS planned_hours
    FROM request_assignees
    GROUP BY request_id
  )
  SELECT
    equipment.id AS equipment_id,
    COUNT(requests.id) AS request_count,
    COALESCE(SUM(request_labor.planned_hours), 0) AS planned_hours
  FROM equipment
  LEFT JOIN maintenance_requests AS requests
    ON requests.equipment_id = equipment.id
  LEFT JOIN request_labor
    ON request_labor.request_id = requests.id
  GROUP BY equipment.id
  ORDER BY equipment.id
`;

export async function getRequestMetrics() {
  const [row] = await sequelize.query(requestMetricsSql, {
    type: QueryTypes.SELECT,
  });

  return {
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
      row.average_close_hours === null ? 0 : Number(row.average_close_hours),
    overdueCount: Number(row.overdue_count),
  };
}

export async function getEquipmentMetrics() {
  const rows = await sequelize.query(equipmentMetricsSql, {
    type: QueryTypes.SELECT,
  });

  return rows.map((row) => ({
    equipmentId: row.equipment_id,
    requestCount: Number(row.request_count),
    plannedHours: Number(row.planned_hours),
  }));
}
