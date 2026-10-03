import { apiRequest, ApiError } from './api.js';
import {
  getCurrentUser,
  handleSessionLost,
  restoreSession,
  signIn,
  signOut,
} from './auth.js';
import {
  clearAlert,
  createEquipmentForm,
  createRequestForm,
  renderEquipmentDetails,
  renderEquipmentList,
  renderLoading,
  renderRequestDetails,
  renderRequestList,
  showAlert,
  showApplicationView,
  showLoginView,
} from './ui.js';

const refs = {
  loginView: document.querySelector('#login-view'),
  applicationView: document.querySelector('#application-view'),
  loginForm: document.querySelector('#login-form'),
  loginEmail: document.querySelector('#login-email'),
  loginError: document.querySelector('#login-error'),
  currentUserEmail: document.querySelector('#current-user-email'),
  currentUserRole: document.querySelector('#current-user-role'),
  logoutButton: document.querySelector('#logout-button'),
  pageAlert: document.querySelector('#page-alert'),
  content: document.querySelector('#content'),
  dialog: document.querySelector('#form-dialog'),
  dialogTitle: document.querySelector('#dialog-title'),
  dialogBody: document.querySelector('#dialog-body'),
  dialogClose: document.querySelector('#dialog-close'),
};

function setActiveNavigation(view) {
  for (const button of document.querySelectorAll('[data-view]')) {
    button.classList.toggle('active', button.dataset.view === view);
  }
}

function displayError(error, context = '') {
  const normalized =
    error instanceof ApiError
      ? error
      : { code: 'UI_ERROR', message: error.message || String(error) };

  if (
    context === 'status-change' &&
    normalized.status === 403 &&
    getCurrentUser()?.role === 'technician'
  ) {
    normalized.message = 'Вы не назначены на эту заявку.';
  }

  showAlert(refs.pageAlert, normalized);
  refs.pageAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function loadEquipment() {
  setActiveNavigation('equipment');
  clearAlert(refs.pageAlert);
  renderLoading(refs.content);

  try {
    const response = await apiRequest('/api/equipment?page=1&limit=50');
    renderEquipmentList(refs.content, response.data, getCurrentUser());
  } catch (error) {
    displayError(error);
  }
}

async function loadEquipmentDetails(id) {
  clearAlert(refs.pageAlert);
  renderLoading(refs.content);

  try {
    const response = await apiRequest(`/api/equipment/${id}`);
    renderEquipmentDetails(refs.content, response.data);
  } catch (error) {
    displayError(error);
  }
}

async function loadRequests() {
  setActiveNavigation('requests');
  clearAlert(refs.pageAlert);
  renderLoading(refs.content);

  try {
    const [requestsResponse, equipmentResponse] = await Promise.all([
      apiRequest('/api/requests?page=1&limit=50'),
      apiRequest('/api/equipment?page=1&limit=100'),
    ]);
    const equipmentById = new Map(
      equipmentResponse.data.map((item) => [item.id, item])
    );
    renderRequestList(
      refs.content,
      requestsResponse.data,
      getCurrentUser(),
      equipmentById
    );
  } catch (error) {
    displayError(error);
  }
}

async function loadRequestDetails(id) {
  clearAlert(refs.pageAlert);
  renderLoading(refs.content);

  try {
    const [requestResponse, historyResponse] = await Promise.all([
      apiRequest(`/api/requests/${id}`),
      apiRequest(`/api/requests/${id}/history`),
    ]);
    const equipmentResponse = await apiRequest(
      `/api/equipment/${requestResponse.data.equipmentId}`
    );
    renderRequestDetails(
      refs.content,
      requestResponse.data,
      historyResponse.data,
      getCurrentUser(),
      equipmentResponse.data
    );
  } catch (error) {
    displayError(error);
  }
}

function openDialog(title, form) {
  refs.dialogTitle.textContent = title;
  refs.dialogBody.replaceChildren(form);
  refs.dialog.showModal();
}

function closeDialog() {
  refs.dialog.close();
  refs.dialogBody.replaceChildren();
}

async function openRequestForm() {
  try {
    const response = await apiRequest('/api/equipment?page=1&limit=100');
    if (!response.data.length) {
      throw new Error('Сначала создайте оборудование.');
    }
    openDialog('Новая заявка', createRequestForm(response.data));
  } catch (error) {
    displayError(error);
  }
}

function openEquipmentForm() {
  openDialog('Новое оборудование', createEquipmentForm());
}

async function submitRequestForm(form) {
  const data = new FormData(form);
  const body = {
    equipmentId: data.get('equipmentId'),
    title: data.get('title'),
    description: data.get('description') || undefined,
    priority: data.get('priority'),
  };
  const plannedAt = data.get('plannedAt');
  if (plannedAt) body.plannedAt = new Date(plannedAt).toISOString();

  await apiRequest('/api/requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  closeDialog();
  await loadRequests();
  showAlert(refs.pageAlert, { message: 'Заявка создана.' }, true);
}

async function submitEquipmentForm(form) {
  const data = new FormData(form);
  const body = {
    name: data.get('name'),
    type: data.get('type'),
    serialNumber: data.get('serialNumber'),
    location: {
      lat: Number(data.get('latitude')),
      lon: Number(data.get('longitude')),
    },
    status: data.get('status'),
    installedAt: data.get('installedAt'),
  };

  await apiRequest('/api/equipment', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  closeDialog();
  await loadEquipment();
  showAlert(refs.pageAlert, { message: 'Оборудование создано.' }, true);
}

async function changeStatus(id, status) {
  clearAlert(refs.pageAlert);

  try {
    await apiRequest(`/api/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadRequestDetails(id);
    showAlert(refs.pageAlert, { message: 'Статус заявки изменён.' }, true);
  } catch (error) {
    displayError(error, 'status-change');
  }
}

async function enterApplication(user) {
  showApplicationView(refs, user);
  await loadEquipment();
}

refs.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  refs.loginError.classList.add('hidden');
  const submitButton = refs.loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Вход…';

  try {
    const data = new FormData(refs.loginForm);
    const user = await signIn(data.get('email'), data.get('password'));
    await enterApplication(user);
  } catch (error) {
    showAlert(refs.loginError, error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Войти';
  }
});

refs.logoutButton.addEventListener('click', async () => {
  refs.logoutButton.disabled = true;
  try {
    await signOut();
    showLoginView(refs);
  } catch (error) {
    displayError(error);
  } finally {
    refs.logoutButton.disabled = false;
  }
});

document.querySelector('.sidebar').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  if (button.dataset.view === 'equipment') void loadEquipment();
  if (button.dataset.view === 'requests') void loadRequests();
});

refs.content.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const actions = {
    'equipment-details': () => loadEquipmentDetails(target.dataset.id),
    'request-details': () => loadRequestDetails(target.dataset.id),
    'back-to-list': () =>
      target.dataset.view === 'equipment' ? loadEquipment() : loadRequests(),
    'create-request': openRequestForm,
    'create-equipment': openEquipmentForm,
    'change-status': () =>
      changeStatus(target.dataset.id, target.dataset.status),
  };

  const action = actions[target.dataset.action];
  if (action) void action();
});

refs.dialogBody.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action="close-dialog"]');
  if (target) closeDialog();
});

refs.dialogBody.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    if (form.dataset.form === 'create-request') await submitRequestForm(form);
    if (form.dataset.form === 'create-equipment') {
      await submitEquipmentForm(form);
    }
  } catch (error) {
    closeDialog();
    displayError(error);
  } finally {
    submitButton.disabled = false;
  }
});

refs.dialogClose.addEventListener('click', closeDialog);
refs.dialog.addEventListener('click', (event) => {
  if (event.target === refs.dialog) closeDialog();
});

handleSessionLost(() => {
  showLoginView(refs, 'Сессия истекла. Войдите снова.');
});

renderLoading(refs.content);
const restoredUser = await restoreSession();
if (restoredUser) await enterApplication(restoredUser);
else showLoginView(refs);
