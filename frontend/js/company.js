
let companyDrives = [];
let selectedDriveId = null;
let currentApplicants = [];
let currentRounds = [];
let isApproved = 1;

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await fetchCompanyDrives();
});

function setupEventListeners() {
  const driveSelector = document.getElementById('applicantsDriveSelector');
  if (driveSelector) {
    driveSelector.addEventListener('change', (e) => {
      selectedDriveId = parseInt(e.target.value, 10);
      fetchApplicants(selectedDriveId);
      
      const roundTarget = document.getElementById('roundTargetDriveSelect');
      if (roundTarget) roundTarget.value = selectedDriveId;
    });
  }

  const roundTargetSelect = document.getElementById('roundTargetDriveSelect');
  if (roundTargetSelect) {
    roundTargetSelect.addEventListener('change', (e) => {
      selectedDriveId = parseInt(e.target.value, 10);
      fetchApplicants(selectedDriveId);
      if (driveSelector) driveSelector.value = selectedDriveId;
    });
  }

  const createForm = document.getElementById('createDriveForm');
  if (createForm) {
    createForm.addEventListener('submit', handleCreateDrive);
  }

  const addRoundForm = document.getElementById('addRoundForm');
  if (addRoundForm) {
    addRoundForm.addEventListener('submit', handleAddRound);
  }
}

async function fetchCompanyDrives() {
  try {
    const res = await api.get('/companies/drives');
    if (res.success) {
      companyDrives = res.data || [];
      isApproved = res.company_approved ?? 1;

      renderCompanyHeader();
      renderKPIs();
      populateDriveSelectors();
      renderCompanyDrives();

      if (companyDrives.length > 0 && !selectedDriveId) {
        selectedDriveId = companyDrives[0].id;
      }

      if (selectedDriveId) {
        await fetchApplicants(selectedDriveId);
      }
    }
  } catch (err) {
    showToast('Failed to load company drives.', 'error');
  }
}

function renderCompanyHeader() {
  const user = auth.getUser();
  const nameHeading = document.getElementById('companyNameHeading');
  const industryText = document.getElementById('companyIndustryText');
  const approvalBadge = document.getElementById('companyApprovalBadge');
  const banner = document.getElementById('pendingApprovalBanner');
  const createAction = document.getElementById('createDriveAction');

  if (nameHeading) nameHeading.textContent = user?.profile?.name || user?.email || 'Recruiter';
  if (industryText) industryText.textContent = user?.profile?.industry || 'Technology';

  if (approvalBadge) {
    if (isApproved === 1) {
      approvalBadge.innerHTML = `<span class="badge badge-success">Verified Recruiter</span>`;
    } else {
      approvalBadge.innerHTML = `<span class="badge badge-warning">Pending TPO Approval</span>`;
    }
  }

  if (banner) {
    banner.style.display = isApproved === 0 ? 'flex' : 'none';
  }

  if (createAction) {
    createAction.style.display = isApproved === 1 ? 'block' : 'none';
  }
}

function renderKPIs() {
  const kpiDrives = document.getElementById('kpiDrivesCount');
  const kpiApps = document.getElementById('kpiApplicantsCount');
  const kpiSelected = document.getElementById('kpiSelectedCount');

  const totalApps = companyDrives.reduce((sum, d) => sum + (parseInt(d.total_applicants, 10) || 0), 0);
  const totalSelected = companyDrives.reduce((sum, d) => sum + (parseInt(d.selected_count, 10) || 0), 0);

  if (kpiDrives) kpiDrives.textContent = companyDrives.length;
  if (kpiApps) kpiApps.textContent = totalApps;
  if (kpiSelected) kpiSelected.textContent = totalSelected;

  document.getElementById('badgeMyDrives').textContent = companyDrives.length;
}

function populateDriveSelectors() {
  const selector = document.getElementById('applicantsDriveSelector');
  const roundSelector = document.getElementById('roundTargetDriveSelect');

  const optionsHtml = companyDrives.map(d => `
    <option value="${d.id}">${escapeHtml(d.title)} (₹${d.package_lpa} LPA)</option>
  `).join('');

  if (selector) selector.innerHTML = optionsHtml;
  if (roundSelector) roundSelector.innerHTML = optionsHtml;

  if (selectedDriveId) {
    if (selector) selector.value = selectedDriveId;
    if (roundSelector) roundSelector.value = selectedDriveId;
  }
}

function renderCompanyDrives() {
  const container = document.getElementById('companyDrivesGrid');
  if (!container) return;

  if (companyDrives.length === 0) {
    container.innerHTML = `
      <div style="grid-column: span 2; padding: 3rem; text-align: center; border: 1px solid var(--slate-200); border-radius: var(--radius-lg); background: #ffffff;">
        <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" style="margin: 0 auto 0.75rem; color: var(--slate-300);">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
        <h3 style="font-size: 1.1rem; color: var(--slate-800);">No placement drives yet</h3>
        <p style="font-size: 0.85rem; color: var(--slate-500); margin-top: 0.25rem;">
          ${isApproved === 1 ? 'Click "Post New Placement Drive" above to publish your first hiring opening.' : 'Drives can be posted once your recruiter account is approved.'}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = companyDrives.map(d => `
    <div class="card flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between gap-3 mb-2">
          <h3 style="font-size: 1.15rem;">${escapeHtml(d.title)}</h3>
          <span style="font-size: 0.9rem; font-weight: 800; color: var(--primary-700); background: var(--primary-50); border: 1px solid var(--primary-200); padding: 0.25rem 0.6rem; border-radius: var(--radius-sm); white-space: nowrap;">
            ₹${d.package_lpa} LPA
          </span>
        </div>

        <p class="line-clamp-2" style="font-size: 0.85rem; color: var(--slate-600); margin-bottom: 1rem;">
          ${escapeHtml(d.description || 'No detailed role description provided.')}
        </p>

        <div class="grid grid-cols-2 gap-2" style="background: var(--slate-50); border: 1px solid var(--slate-100); border-radius: var(--radius-md); padding: 0.65rem; font-size: 0.75rem; margin-bottom: 0.75rem;">
          <div>
            <span style="color: var(--slate-400); display: block; font-weight: 500;">Eligible Branches</span>
            <span style="font-weight: 700; color: var(--slate-800);">${escapeHtml(d.allowed_branches)}</span>
          </div>
          <div>
            <span style="color: var(--slate-400); display: block; font-weight: 500;">Min CGPA</span>
            <span style="font-weight: 700; color: var(--slate-800);">${d.min_cgpa}</span>
          </div>
          <div>
            <span style="color: var(--slate-400); display: block; font-weight: 500;">Applicants</span>
            <span style="font-weight: 700; color: var(--primary-600);">${d.total_applicants || 0} applied</span>
          </div>
          <div>
            <span style="color: var(--slate-400); display: block; font-weight: 500;">Selected</span>
            <span style="font-weight: 700; color: var(--primary-600);">${d.selected_count || 0} offered</span>
          </div>
        </div>
      </div>

      <div class="border-top flex items-center justify-between" style="margin-top: 0.75rem;">
        <span style="font-size: 0.75rem; color: var(--slate-400);">
          Deadline: ${new Date(d.deadline).toLocaleDateString()}
        </span>
        <button type="button" class="btn btn-ghost btn-sm" onclick="viewDriveCandidates(${d.id})" style="color: var(--primary-600); font-weight: 600;">
          <span>View Candidates</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function viewDriveCandidates(driveId) {
  selectedDriveId = driveId;
  const selector = document.getElementById('applicantsDriveSelector');
  if (selector) selector.value = driveId;
  const roundSelector = document.getElementById('roundTargetDriveSelect');
  if (roundSelector) roundSelector.value = driveId;

  switchCompanyTab('applicants');
  fetchApplicants(driveId);
}

async function fetchApplicants(driveId) {
  if (!driveId) return;
  try {
    const res = await api.get(`/companies/drives/${driveId}/applicants`);
    if (res.success) {
      currentApplicants = res.data || [];
      currentRounds = res.rounds || [];

      document.getElementById('selectedDriveApplicantCount').textContent = currentApplicants.length;
      document.getElementById('badgeApplicants').textContent = currentApplicants.length;
      document.getElementById('badgeRounds').textContent = currentRounds.length;
      document.getElementById('roundsCountText').textContent = currentRounds.length;

      renderApplicantsTable();
      renderRoundsList();
    }
  } catch (err) {
    showToast('Failed to load drive candidates.', 'error');
  }
}

function renderApplicantsTable() {
  const tbody = document.getElementById('applicantsTableBody');
  if (!tbody) return;

  if (currentApplicants.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="padding: 3rem; text-align: center; color: var(--slate-500);">
          No students have applied to this placement drive yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = currentApplicants.map(c => {
    let statusBadge = '';
    if (c.application_status === 'selected') {
      statusBadge = '<span class="badge badge-success">SELECTED</span>';
    } else if (c.application_status === 'shortlisted') {
      statusBadge = '<span class="badge badge-info">SHORTLISTED</span>';
    } else if (c.application_status === 'rejected') {
      statusBadge = '<span class="badge badge-danger">REJECTED</span>';
    } else {
      statusBadge = '<span class="badge badge-warning">APPLIED</span>';
    }

    const resumeLink = c.resume_url ? `
      <a href="${c.resume_url}" target="_blank" style="font-weight: 600; color: var(--primary-600); text-decoration: underline; display: inline-flex; align-items: center; gap: 0.25rem;">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        PDF
      </a>
    ` : `<span style="color: var(--slate-400); font-style: italic;">No resume</span>`;

    return `
      <tr>
        <td>
          <strong style="color: var(--slate-900); display: block;">${escapeHtml(c.student_name)}</strong>
          <span style="font-size: 0.75rem; color: var(--slate-400);">${escapeHtml(c.student_email)}</span>
        </td>
        <td>
          <span style="font-weight: 600; color: var(--slate-800); display: block;">${escapeHtml(c.enrollment_no)}</span>
          <span class="badge badge-neutral" style="margin-top: 0.15rem;">${escapeHtml(c.branch)}</span>
        </td>
        <td>
          <strong style="color: var(--primary-600); display: block;">${c.cgpa} CGPA</strong>
          <span style="font-size: 0.75rem; color: ${c.backlogs > 0 ? 'var(--danger-600)' : 'var(--slate-400)'};">
            ${c.backlogs} Backlog${c.backlogs !== 1 ? 's' : ''}
          </span>
        </td>
        <td>${resumeLink}</td>
        <td>${statusBadge}</td>
        <td class="text-right">
          <div class="flex items-center justify-end gap-1">
            <button class="btn btn-ghost btn-sm" style="color: var(--info-600);" onclick="updateStatus(${c.application_id}, 'shortlisted')">
              Shortlist
            </button>
            <button class="btn btn-ghost btn-sm" style="color: var(--primary-600);" onclick="updateStatus(${c.application_id}, 'selected')">
              Select
            </button>
            <button class="btn btn-ghost btn-sm" style="color: var(--danger-600);" onclick="updateStatus(${c.application_id}, 'rejected')">
              Reject
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateStatus(applicationId, status) {
  try {
    const res = await api.put(`/companies/applications/${applicationId}/status`, { status });
    showToast(res.message || `Application marked as ${status}`, 'success');
    await fetchApplicants(selectedDriveId);
    await fetchCompanyDrives();
  } catch (err) {
    showToast(err.response?.data?.message || 'Status update failed.', 'error');
  }
}

function renderRoundsList() {
  const container = document.getElementById('roundsListContainer');
  if (!container) return;

  if (currentRounds.length === 0) {
    container.innerHTML = `
      <p style="font-size: 0.85rem; color: var(--slate-500); font-style: italic; padding: 1rem 0;">
        No hiring rounds configured for this drive yet.
      </p>
    `;
    return;
  }

  container.innerHTML = currentRounds.map(r => `
    <div style="padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--slate-200); background: var(--slate-50); display: flex; align-items: center; justify-content: space-between;">
      <div>
        <span style="font-size: 0.7rem; font-weight: 700; color: var(--primary-600); text-transform: uppercase;">
          Round ${r.round_no}
        </span>
        <h4 style="font-size: 0.95rem; margin-top: 0.15rem;">${escapeHtml(r.round_name)}</h4>
        ${r.round_date ? `
          <p style="font-size: 0.75rem; color: var(--slate-500); margin-top: 0.25rem;">
            Scheduled: ${new Date(r.round_date).toLocaleString()}
          </p>
        ` : ''}
      </div>
      <span class="badge badge-success">Active</span>
    </div>
  `).join('');
}

async function handleAddRound(e) {
  e.preventDefault();
  const driveId = selectedDriveId || parseInt(document.getElementById('roundTargetDriveSelect').value, 10);
  const round_name = document.getElementById('roundNameInput').value.trim();
  const round_date = document.getElementById('roundDateInput').value;

  if (!driveId || !round_name) {
    showToast('Please specify round name and target drive.', 'error');
    return;
  }

  try {
    await api.post(`/companies/drives/${driveId}/rounds`, { round_name, round_date });
    showToast('Hiring round added successfully!', 'success');
    document.getElementById('roundNameInput').value = '';
    document.getElementById('roundDateInput').value = '';
    await fetchApplicants(driveId);
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to add round.', 'error');
  }
}

function openCreateModal() {
  const modal = document.getElementById('createDriveModal');
  if (modal) modal.classList.remove('hidden');
}

function closeCreateModal() {
  const modal = document.getElementById('createDriveModal');
  if (modal) modal.classList.add('hidden');
}

async function handleCreateDrive(e) {
  e.preventDefault();
  const btn = document.getElementById('saveDriveBtn');

  const title = document.getElementById('dTitle').value.trim();
  const description = document.getElementById('dDescription').value.trim();
  const package_lpa = parseFloat(document.getElementById('dPackage').value);
  const min_cgpa = parseFloat(document.getElementById('dMinCgpa').value);
  const allowed_branches = document.getElementById('dAllowedBranches').value.trim();
  const max_backlogs = parseInt(document.getElementById('dMaxBacklogs').value, 10) || 0;
  const deadline = document.getElementById('dDeadline').value;

  if (!title || isNaN(package_lpa) || !allowed_branches || !deadline) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = 'Publishing...';

    await api.post('/drives', {
      title,
      description,
      package_lpa,
      min_cgpa,
      allowed_branches,
      max_backlogs,
      deadline
    });

    showToast('Placement drive published successfully!', 'success');
    closeCreateModal();
    document.getElementById('createDriveForm').reset();
    await fetchCompanyDrives();
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to post drive.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publish Placement Drive';
  }
}

function switchCompanyTab(tabKey) {
  const secDrives = document.getElementById('tabSecDrives');
  const secApplicants = document.getElementById('tabSecApplicants');
  const secRounds = document.getElementById('tabSecRounds');

  const btnDrives = document.getElementById('tabBtnDrives');
  const btnApps = document.getElementById('tabBtnApplicants');
  const btnRounds = document.getElementById('tabBtnRounds');

  if (secDrives) secDrives.style.display = tabKey === 'drives' ? 'block' : 'none';
  if (secApplicants) secApplicants.style.display = tabKey === 'applicants' ? 'block' : 'none';
  if (secRounds) secRounds.style.display = tabKey === 'rounds' ? 'block' : 'none';

  if (btnDrives) btnDrives.classList.toggle('active', tabKey === 'drives');
  if (btnApps) btnApps.classList.toggle('active', tabKey === 'applicants');
  if (btnRounds) btnRounds.classList.toggle('active', tabKey === 'rounds');
}
