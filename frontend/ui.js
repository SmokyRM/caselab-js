function element(tag, options = {}) {
  const node = document.createElement(tag);

  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = String(options.text);
  if (options.type) node.type = options.type;
  if (options.action) node.dataset.action = options.action;

  return node;
}

function append(parent, ...children) {
  parent.append(...children.filter(Boolean));
  return parent;
}

function formatDate(value, includeTime = false) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' } : {}),
  }).format(date);
}

function formatLabel(value) {
  return value ? String(value).replaceAll('_', ' ') : '—';
}

function badge(value, kind) {
  const normalized = String(value || 'unknown').replaceAll('_', '-');
  return element('span', {
    className: `${kind}-badge ${kind}-${normalized}`,
    text: formatLabel(value),
  });
}

function field(label, value) {
  const wrapper = element('div');
  append(
    wrapper,
    element('span', { className: 'field-label', text: label }),
    element('span', { className: 'field-value', text: value ?? '—' })
  );
  return wrapper;
}

function pageHeader(title, description, actionButton) {
  const copy = element('div');
  append(
    copy,
    element('h2', { text: title }),
    element('p', { className: 'muted', text: description })
  );
  return append(
    element('header', { className: 'page-header' }),
    copy,
    actionButton
  );
}

function actionButton(text, action) {
  return element('button', {
    className: 'primary-button',
    text,
    type: 'button',
    action,
  });
}

function backButton(view) {
  const button = element('button', {
    className: 'back-button',
    text: '← Back to list',
    type: 'button',
    action: 'back-to-list',
  });
  button.dataset.view = view;
  return button;
}

export function showLoginView(refs, message = '') {
  refs.applicationView.classList.add('hidden');
  refs.loginView.classList.remove('hidden');
  refs.loginForm.reset();
  refs.loginEmail.focus();

  if (message) showAlert(refs.loginError, { message });
  else refs.loginError.classList.add('hidden');
}

export function showApplicationView(refs, user) {
  refs.loginView.classList.add('hidden');
  refs.applicationView.classList.remove('hidden');
  refs.currentUserEmail.textContent = user.email;
  refs.currentUserRole.textContent = user.role;
  refs.currentUserRole.className = 'role-badge';
}

export function showAlert(target, error, success = false) {
  target.replaceChildren();
  target.className = `alert ${success ? 'alert-success' : 'alert-error'}`;
  append(
    target,
    element('span', {
      className: 'alert-title',
      text: success ? 'Success' : error.code || 'Request failed',
    }),
    element('span', { text: error.message || String(error) }),
    error.requestId
      ? element('span', {
          className: 'alert-meta',
          text: `Request ID: ${error.requestId}`,
        })
      : null
  );
}

export function clearAlert(target) {
  target.classList.add('hidden');
  target.replaceChildren();
}

export function renderLoading(content) {
  content.replaceChildren(
    element('div', { className: 'loading-state', text: 'Loading…' })
  );
}

export function renderEquipmentList(content, equipment, user) {
  const canCreate = user.role === 'admin';
  const header = pageHeader(
    'Equipment',
    `${equipment.length} item${equipment.length === 1 ? '' : 's'} available`,
    canCreate ? actionButton('Create equipment', 'create-equipment') : null
  );

  if (!equipment.length) {
    content.replaceChildren(
      header,
      element('div', {
        className: 'empty-state',
        text: 'No equipment found.',
      })
    );
    return;
  }

  const grid = element('div', { className: 'data-grid' });
  for (const item of equipment) {
    const card = element('button', {
      className: 'data-card',
      type: 'button',
      action: 'equipment-details',
    });
    card.dataset.id = item.id;

    const title = element('div', { className: 'card-title-row' });
    append(
      title,
      append(
        element('div'),
        element('h3', { text: item.name }),
        element('span', { className: 'metadata', text: item.serialNumber })
      ),
      badge(item.status, 'status')
    );

    const fields = element('div', { className: 'card-fields' });
    append(
      fields,
      field('Type', formatLabel(item.type)),
      field('Installed', formatDate(item.installedAt)),
      field('Latitude', item.location?.lat),
      field('Longitude', item.location?.lon)
    );
    append(card, title, fields);
    grid.append(card);
  }

  content.replaceChildren(header, grid);
}

export function renderEquipmentDetails(content, equipment) {
  const section = element('section', { className: 'detail-section' });
  const title = element('div', { className: 'detail-title-row' });
  append(
    title,
    element('h2', { text: equipment.name }),
    badge(equipment.status, 'status')
  );

  const details = element('div', { className: 'detail-grid' });
  append(
    details,
    field('Type', formatLabel(equipment.type)),
    field('Serial number', equipment.serialNumber),
    field('Installed', formatDate(equipment.installedAt)),
    field(
      'Location',
      equipment.location
        ? `${equipment.location.lat}, ${equipment.location.lon}`
        : '—'
    )
  );
  append(section, title, details);

  const layout = element('div', { className: 'detail-layout' });
  append(layout, backButton('equipment'), section);

  if (equipment.passport) {
    const passport = element('section', { className: 'detail-section' });
    const passportGrid = element('div', { className: 'detail-grid' });
    append(
      passportGrid,
      field('Manufacturer', equipment.passport.manufacturer),
      field('Model', equipment.passport.model),
      field('Rated power', equipment.passport.ratedPower),
      field(
        'Last verification',
        formatDate(equipment.passport.lastVerificationAt, true)
      )
    );
    append(
      passport,
      element('h3', { text: 'Equipment passport' }),
      passportGrid
    );
    layout.append(passport);
  }

  content.replaceChildren(layout);
}

export function renderRequestList(content, requests, user) {
  const canCreate = ['technician', 'admin'].includes(user.role);
  const header = pageHeader(
    'Maintenance requests',
    `${requests.length} request${requests.length === 1 ? '' : 's'} available`,
    canCreate ? actionButton('New request', 'create-request') : null
  );

  if (!requests.length) {
    content.replaceChildren(
      header,
      element('div', {
        className: 'empty-state',
        text: 'No requests found.',
      })
    );
    return;
  }

  const grid = element('div', { className: 'data-grid' });
  for (const item of requests) {
    const card = element('button', {
      className: 'data-card',
      type: 'button',
      action: 'request-details',
    });
    card.dataset.id = item.id;

    const title = element('div', { className: 'card-title-row' });
    append(
      title,
      element('h3', { text: item.title }),
      badge(item.status, 'status')
    );
    const fields = element('div', { className: 'card-fields' });
    append(
      fields,
      field('Priority', formatLabel(item.priority)),
      field('Equipment', item.equipmentId),
      field('Planned', formatDate(item.plannedAt, true)),
      field('Updated', formatDate(item.updatedAt, true))
    );
    append(card, title, fields);
    grid.append(card);
  }

  content.replaceChildren(header, grid);
}

function renderAssignees(assignees = []) {
  const section = element('section', { className: 'detail-section' });
  section.append(element('h3', { text: 'Assignees' }));

  if (!assignees.length) {
    section.append(element('p', { className: 'muted', text: 'No assignees.' }));
    return section;
  }

  const list = element('ul', { className: 'assignee-list' });
  for (const assignee of assignees) {
    const item = element('li', { className: 'assignee-item' });
    append(
      item,
      element('strong', { text: assignee.fullName }),
      element('div', {
        className: 'metadata',
        text: `${formatLabel(assignee.role)} · ${assignee.specialization} · ${assignee.hours} h`,
      })
    );
    list.append(item);
  }
  section.append(list);
  return section;
}

function renderHistory(history = []) {
  const section = element('section', { className: 'detail-section' });
  section.append(element('h3', { text: 'Status history' }));

  if (!history.length) {
    section.append(
      element('p', { className: 'muted', text: 'No status history yet.' })
    );
    return section;
  }

  const list = element('ol', { className: 'timeline' });
  for (const entry of history) {
    const item = element('li', { className: 'timeline-item' });
    append(
      item,
      element('strong', {
        text: `${formatLabel(entry.oldStatus || 'created')} → ${formatLabel(entry.newStatus)}`,
      }),
      element('span', {
        className: 'metadata',
        text: `${formatDate(entry.createdAt, true)} · ${entry.author}`,
      }),
      entry.comment ? element('p', { text: entry.comment }) : null
    );
    list.append(item);
  }
  section.append(list);
  return section;
}

const nextStatuses = {
  new: ['in_progress', 'rejected'],
  in_progress: ['done', 'rejected'],
  done: [],
  rejected: [],
};

export function renderRequestDetails(content, request, history, user) {
  const section = element('section', { className: 'detail-section' });
  const title = element('div', { className: 'detail-title-row' });
  append(
    title,
    append(
      element('div'),
      element('h2', { text: request.title }),
      badge(request.priority, 'priority')
    ),
    badge(request.status, 'status')
  );

  const details = element('div', { className: 'detail-grid' });
  append(
    details,
    field('Equipment', request.equipmentId),
    field('Planned', formatDate(request.plannedAt, true)),
    field('Created', formatDate(request.createdAt, true)),
    field('Updated', formatDate(request.updatedAt, true))
  );
  append(
    section,
    title,
    request.description
      ? element('p', { text: request.description })
      : element('p', { className: 'muted', text: 'No description.' }),
    details
  );

  if (['technician', 'admin'].includes(user.role)) {
    const statuses = nextStatuses[request.status] || [];
    if (statuses.length) {
      const actions = element('div', { className: 'status-actions' });
      for (const status of statuses) {
        const button = element('button', {
          className: 'status-button',
          text: `Set ${formatLabel(status)}`,
          type: 'button',
          action: 'change-status',
        });
        button.dataset.id = request.id;
        button.dataset.status = status;
        actions.append(button);
      }
      section.append(actions);
    }
  }

  content.replaceChildren(
    append(
      element('div', { className: 'detail-layout' }),
      backButton('requests'),
      section,
      renderAssignees(request.assignees),
      renderHistory(history)
    )
  );
}

function formField(labelText, input) {
  const label = element('label', { text: labelText });
  label.htmlFor = input.id;
  return [label, input];
}

function input(name, type = 'text', required = true) {
  const control = element('input');
  control.id = `field-${name}`;
  control.name = name;
  control.type = type;
  control.required = required;
  return control;
}

function select(name, options) {
  const control = element('select');
  control.id = `field-${name}`;
  control.name = name;
  control.required = true;
  for (const optionData of options) {
    const option = element('option', {
      text: optionData.label,
    });
    option.value = optionData.value;
    control.append(option);
  }
  return control;
}

function formActions() {
  return append(
    element('div', { className: 'form-actions' }),
    element('button', {
      className: 'secondary-button',
      text: 'Cancel',
      type: 'button',
      action: 'close-dialog',
    }),
    element('button', {
      className: 'primary-button',
      text: 'Save',
      type: 'submit',
    })
  );
}

export function createRequestForm(equipment) {
  const form = element('form', { className: 'stack-form' });
  form.dataset.form = 'create-request';

  const equipmentSelect = select(
    'equipmentId',
    equipment.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.serialNumber})`,
    }))
  );
  const title = input('title');
  title.minLength = 5;
  title.maxLength = 120;
  const description = element('textarea');
  description.id = 'field-description';
  description.name = 'description';
  description.maxLength = 2000;
  const priority = select(
    'priority',
    ['low', 'medium', 'high', 'critical'].map((value) => ({
      value,
      label: formatLabel(value),
    }))
  );
  const plannedAt = input('plannedAt', 'datetime-local', false);

  append(
    form,
    ...formField('Equipment', equipmentSelect),
    ...formField('Title', title),
    ...formField('Description', description),
    ...formField('Priority', priority),
    ...formField('Planned time', plannedAt),
    formActions()
  );
  return form;
}

export function createEquipmentForm() {
  const form = element('form', { className: 'stack-form' });
  form.dataset.form = 'create-equipment';

  const name = input('name');
  name.minLength = 3;
  name.maxLength = 100;
  const type = select(
    'type',
    ['turbine', 'inverter', 'sensor', 'substation'].map((value) => ({
      value,
      label: formatLabel(value),
    }))
  );
  const serialNumber = input('serialNumber');
  const latitude = input('latitude', 'number');
  latitude.step = 'any';
  latitude.min = '-90';
  latitude.max = '90';
  const longitude = input('longitude', 'number');
  longitude.step = 'any';
  longitude.min = '-180';
  longitude.max = '180';
  const status = select(
    'status',
    ['operational', 'maintenance', 'fault', 'decommissioned'].map((value) => ({
      value,
      label: formatLabel(value),
    }))
  );
  const installedAt = input('installedAt', 'date');

  append(
    form,
    ...formField('Name', name),
    ...formField('Type', type),
    ...formField('Serial number', serialNumber),
    ...formField('Latitude', latitude),
    ...formField('Longitude', longitude),
    ...formField('Status', status),
    ...formField('Installed date', installedAt),
    formActions()
  );
  return form;
}
