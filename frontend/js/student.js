
let allDrives = [];
let applications = [];
let currentProfile = null;
let activeBranchFilter = 'ALL';
let activeSort = 'newest';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  renderBranchFilterButtons();
  setupEventListeners();
  await fetchStudentData();
});

function setupEventListeners() {
  const searchInput = document.getElementById('driveSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderDrives();
    });
  }

  const sortSelect = document.getElementById('driveSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      renderDrives();
    });
  }

  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileSubmit);
  }

  const resumeInput = document.getElementById('resumeFileInput');
  if (resumeInput) {
    resumeInput.addEventListener('change', handleResumeUpload);
  }
}

async function fetchStudentData() {
  try {
    const [profileRes, drivesRes, appsRes] = await Promise.all([
      api.get('/students/me'),
      api.get('/drives/eligible'),
      api.get('/students/applications')
    ]);

    if (profileRes.success) {
      currentProfile = profileRes.data;
      renderProfileHeader(currentProfile);
      populateProfileForm(currentProfile);
    }

    if (drivesRes.success) {
      allDrives = drivesRes.all_open_drives || [];
      renderDrives();
    }

    if (appsRes.success) {
      applications = appsRes.data || [];
      renderApplications();
      document.getElementById('badgeAppsCount').textContent = applications.length;
    }

    updateCounts();

  } catch (err) {
    showToast('Failed to load portal data. Please refresh.', 'error');
  }
}

function renderProfileHeader(p) {
  const welcomeHeading = document.getElementById('welcomeHeading');
  const metaEnrollment = document.getElementById('metaEnrollment');
  const metaBranch = document.getElementById('metaBranch');
  const metaCgpa = document.getElementById('metaCgpa');
  const metaBacklogs = document.getElementById('metaBacklogs');
  const resumeStatusHeader = document.getElementById('resumeStatusHeader');
  const resumeStatusBox = document.getElementById('resumeStatusBox');

  if (welcomeHeading) welcomeHeading.textContent = `Welcome, ${p.name || 'Student'}`;
  if (metaEnrollment) metaEnrollment.textContent = p.enrollment_no;
  if (metaBranch) metaBranch.textContent = p.branch;
  if (metaCgpa) metaCgpa.textContent = `CGPA ${p.cgpa}`;
  if (metaBacklogs) {
    metaBacklogs.textContent = `${p.backlogs} Backlog${p.backlogs !== 1 ? 's' : ''}`;
    metaBacklogs.style.color = p.backlogs > 0 ? 'var(--danger-600)' : 'var(--primary-600)';
  }

  const resumeHtml = p.resume_url ? `
    <a href="${p.resume_url}" target="_blank" class="btn btn-ghost btn-sm" style="font-weight:600;">
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <span>View Resume</span>
    </a>
  ` : `
    <span class="badge badge-warning">
      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      No Resume
    </span>
  `;

  if (resumeStatusHeader) resumeStatusHeader.innerHTML = resumeHtml;

  if (resumeStatusBox) {
    resumeStatusBox.innerHTML = p.resume_url ? `
      <div style="padding: 0.85rem; border-radius: var(--radius-md); background: var(--primary-50); border: 1px solid var(--primary-200);">
        <div class="flex items-center justify-between mb-1">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary-800); display: flex; align-items: center; gap: 0.35rem;">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Active Resume
          </span>
          <a href="${p.resume_url}" target="_blank" style="font-size: 0.75rem; font-weight: 700; text-decoration: underline;">
            View PDF
          </a>
        </div>
        <p style="font-size: 0.7rem; color: var(--slate-500); word-break: break-all;">${p.resume_url}</p>
      </div>
    ` : `
      <div class="alert alert-warning" style="font-size: 0.78rem;">
        No resume uploaded yet. Upload a PDF to maximize shortlisting opportunities.
      </div>
    `;
  }
}

function renderBranchFilterButtons() {
  const container = document.getElementById('branchFilters');
  if (!container) return;

  const branches = ['ALL', 'CSE', 'IT', 'ECE', 'EE', 'MECH', 'CIVIL'];
  container.innerHTML = branches.map(b => `
    <button type="button" class="btn btn-sm ${activeBranchFilter === b ? 'btn-primary' : 'btn-secondary'}" onclick="setBranchFilter('${b}')">
      ${b}
    </button>
  `).join('');
}

function setBranchFilter(branch) {
  activeBranchFilter = branch;
  renderBranchFilterButtons();
  renderDrives();
}

function renderDrives() {
  const container = document.getElementById('drivesGrid');
  const summaryText = document.getElementById('drivesSummaryText');
  const eligibleNotice = document.getElementById('drivesEligibleNotice');
  if (!container) return;

  let list = [...allDrives];

  if (searchQuery) {
    list = list.filter(d =>
      d.title.toLowerCase().includes(searchQuery) ||
      d.company_name.toLowerCase().includes(searchQuery) ||
      d.allowed_branches.toLowerCase().includes(searchQuery)
    );
  }

  if (activeBranchFilter !== 'ALL') {
    list = list.filter(d => {
      const allowed = d.allowed_branches.toUpperCase().split(',').map(b => b.trim());
      return allowed.includes(activeBranchFilter);
    });
  }

  if (activeSort === 'package_high') {
    list.sort((a, b) => b.package_lpa - a.package_lpa);
  } else if (activeSort === 'package_low') {
    list.sort((a, b) => a.package_lpa - b.package_lpa);
  } else if (activeSort === 'deadline') {
    list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  } else {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const eligibleCount = allDrives.filter(d => d.is_eligible).length;
  if (summaryText) summaryText.textContent = `${list.length} drive${list.length !== 1 ? 's' : ''} shown`;
  if (eligibleNotice) eligibleNotice.textContent = `${eligibleCount} eligible for you`;

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: span 2; padding: 3rem; text-align: center; border: 1px solid var(--slate-200); border-radius: var(--radius-lg); background: #ffffff;">
        <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" style="margin: 0 auto 0.75rem; color: var(--slate-300);">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        <h3 style="font-size: 1rem; color: var(--slate-800);">No drives match your search</h3>
        <p style="font-size: 0.85rem; color: var(--slate-500); margin-top: 0.25rem;">Try adjusting your branch filter or search term.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(d => {
    const reasonsHtml = (!d.is_eligible && d.eligibility_reasons?.length > 0) ? `
      <div class="alert alert-danger" style="margin: 0.75rem 0; padding: 0.6rem 0.8rem; font-size: 0.75rem;">
        <div style="font-weight: 700; margin-bottom: 0.2rem;">Why you are ineligible:</div>
        ${d.eligibility_reasons.map(r => `<div>• ${escapeHtml(r)}</div>`).join('')}
      </div>
    ` : '';

    return `
      <div class="card flex flex-col justify-between" style="${d.is_eligible ? '' : 'opacity: 0.85;'}">
        <div>
          <div class="flex items-start justify-between gap-3 mb-2">
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary-600); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.2rem;">
                ${escapeHtml(d.company_name)}
              </span>
              <h3 style="font-size: 1.1rem;">${escapeHtml(d.title)}</h3>
            </div>
            <span style="font-size: 0.9rem; font-weight: 800; color: var(--primary-700); background: var(--primary-50); border: 1px solid var(--primary-200); padding: 0.25rem 0.6rem; border-radius: var(--radius-sm); white-space: nowrap;">
              ₹${d.package_lpa} LPA
            </span>
          </div>

          ${d.description ? `
            <p class="line-clamp-2" style="font-size: 0.8rem; color: var(--slate-500); margin-bottom: 0.75rem;">
              ${escapeHtml(d.description)}
            </p>
          ` : ''}

          <!-- Criteria Grid -->
          <div class="grid grid-cols-2 gap-2" style="background: var(--slate-50); border: 1px solid var(--slate-100); border-radius: var(--radius-md); padding: 0.65rem; font-size: 0.75rem; margin-bottom: 0.5rem;">
            <div>
              <span style="color: var(--slate-400); display: block; font-weight: 500;">Branches</span>
              <span style="font-weight: 700; color: var(--slate-800);">${escapeHtml(d.allowed_branches)}</span>
            </div>
            <div>
              <span style="color: var(--slate-400); display: block; font-weight: 500;">Min CGPA</span>
              <span style="font-weight: 700; color: var(--slate-800);">${d.min_cgpa}</span>
            </div>
            <div>
              <span style="color: var(--slate-400); display: block; font-weight: 500;">Max Backlogs</span>
              <span style="font-weight: 700; color: var(--slate-800);">${d.max_backlogs}</span>
            </div>
            <div>
              <span style="color: var(--slate-400); display: block; font-weight: 500;">Deadline</span>
              <span style="font-weight: 700; color: var(--slate-800);">${new Date(d.deadline).toLocaleDateString()}</span>
            </div>
          </div>

          ${reasonsHtml}
        </div>

        <div class="border-top flex items-center justify-between" style="margin-top: 0.75rem;">
          <span style="font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.35rem; color: ${d.is_eligible ? 'var(--primary-600)' : 'var(--slate-400)'};">
            ${d.is_eligible ? `
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              Eligible
            ` : `
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              Not eligible
            `}
          </span>

          ${d.has_applied ? `
            <span class="badge badge-info">Applied</span>
          ` : `
            <button class="btn btn-primary btn-sm" ${!d.is_eligible ? 'disabled' : ''} onclick="applyToDrive(${d.id}, '${escapeHtml(d.title)}')">
              Apply Now
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

async function applyToDrive(driveId, title) {
  try {
    const res = await api.post(`/drives/${driveId}/apply`);
    showToast(`Successfully applied to ${title}!`, 'success');
    await fetchStudentData();
  } catch (err) {
    const reasons = err.response?.data?.reasons;
    const msg = reasons ? reasons[0] : (err.response?.data?.message || 'Failed to apply.');
    showToast(msg, 'error');
  }
}

function renderApplications() {
  const container = document.getElementById('applicationsList');
  if (!container) return;

  if (applications.length === 0) {
    container.innerHTML = `
      <div style="padding: 3.5rem; text-align: center; border: 1px solid var(--slate-200); border-radius: var(--radius-lg); background: #ffffff;">
        <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" style="margin: 0 auto 0.75rem; color: var(--slate-300);">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h3 style="font-size: 1.1rem; color: var(--slate-800);">No applications yet</h3>
        <p style="font-size: 0.85rem; color: var(--slate-500); margin-top: 0.25rem;">
          Go to Placement Drives tab and apply to eligible campus openings.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = applications.map(app => {
    let statusBadge = '';
    if (app.application_status === 'selected') {
      statusBadge = '<span class="badge badge-success">Selected (Offered)</span>';
    } else if (app.application_status === 'shortlisted') {
      statusBadge = '<span class="badge badge-info">Shortlisted</span>';
    } else if (app.application_status === 'rejected') {
      statusBadge = '<span class="badge badge-danger">Not Shortlisted</span>';
    } else {
      statusBadge = '<span class="badge badge-warning">Under Review</span>';
    }

    const orderMap = { applied: 0, shortlisted: 1, rejected: -1, selected: 2 };
    const curOrder = orderMap[app.application_status] ?? 0;

    let timelineHtml = '';
    if (app.application_status === 'rejected') {
      timelineHtml = `
        <div class="alert alert-danger" style="margin-top: 1rem; margin-bottom: 0; font-size: 0.8rem;">
          Not shortlisted for this drive.
        </div>
      `;
    } else {
      const steps = [
        { label: 'Applied', num: 1 },
        { label: 'Shortlisted', num: 2 },
        { label: 'Offered', num: 3 }
      ];

      timelineHtml = `
        <div class="timeline-wrapper">
          ${steps.map((st, i) => {
            const isDone = i <= curOrder;
            const isActive = i === curOrder;
            const isLast = i === steps.length - 1;
            return `
              <div class="timeline-step">
                <div class="timeline-circle ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}">
                  ${isDone ? '✓' : st.num}
                </div>
                <span class="timeline-label ${isDone ? 'done' : ''}">${st.label}</span>
              </div>
              ${!isLast ? `<div class="timeline-line ${i < curOrder ? 'done' : ''}"></div>` : ''}
            `;
          }).join('')}
        </div>
      `;
    }

    const roundsHtml = (app.rounds && app.rounds.length > 0) ? `
      <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--slate-100);">
        <p style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--slate-400); margin-bottom: 0.75rem;">
          Interview Stages
        </p>
        <div class="grid grid-cols-3 gap-3">
          ${app.rounds.map(r => `
            <div style="padding: 0.75rem; border: 1px solid var(--slate-200); border-radius: var(--radius-md); background: var(--slate-50); display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span style="font-size: 0.68rem; font-weight: 700; color: var(--slate-400); text-transform: uppercase; display: block;">Round ${r.round_no}</span>
                <span style="font-size: 0.85rem; font-weight: 700; color: var(--slate-800); display: block; margin-top: 0.15rem;">${escapeHtml(r.round_name)}</span>
                ${r.feedback ? `<p style="font-size: 0.72rem; color: var(--slate-500); font-style: italic; margin-top: 0.35rem;">"${escapeHtml(r.feedback)}"</p>` : ''}
              </div>
              <span class="badge ${r.result === 'pass' ? 'badge-success' : r.result === 'fail' ? 'badge-danger' : 'badge-neutral'}">
                ${(r.result || 'PENDING').toUpperCase()}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    return `
      <div class="card">
        <div class="flex items-start justify-between gap-4">
          <div>
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary-600); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.2rem;">
              ${escapeHtml(app.company_name)}
            </span>
            <h3 style="font-size: 1.2rem;">${escapeHtml(app.drive_title)}</h3>
            <p style="font-size: 0.8rem; color: var(--slate-500); margin-top: 0.3rem;">
              Applied on ${new Date(app.applied_at).toLocaleDateString()} · Package: <strong style="color:var(--primary-700);">₹${app.package_lpa} LPA</strong>
            </p>
          </div>
          <div>${statusBadge}</div>
        </div>

        <div style="margin-top: 1rem;">
          <p style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--slate-400); margin-bottom: 0.5rem;">
            Application Journey
          </p>
          ${timelineHtml}
        </div>

        ${roundsHtml}
      </div>
    `;
  }).join('');
}

function populateProfileForm(p) {
  const profName = document.getElementById('profName');
  const profEnrollment = document.getElementById('profEnrollment');
  const profBranch = document.getElementById('profBranch');
  const profCgpa = document.getElementById('profCgpa');
  const profBacklogs = document.getElementById('profBacklogs');
  const profSkills = document.getElementById('profSkills');

  if (profName) profName.value = p.name || '';
  if (profEnrollment) profEnrollment.value = p.enrollment_no || '';
  if (profBranch) profBranch.value = p.branch || 'CSE';
  if (profCgpa) profCgpa.value = p.cgpa || '';
  if (profBacklogs) profBacklogs.value = p.backlogs || 0;
  if (profSkills) profSkills.value = p.skills || '';
}

async function handleProfileSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('saveProfileBtn');

  const name = document.getElementById('profName').value.trim();
  const branch = document.getElementById('profBranch').value;
  const cgpa = parseFloat(document.getElementById('profCgpa').value);
  const backlogs = parseInt(document.getElementById('profBacklogs').value, 10) || 0;
  const skills = document.getElementById('profSkills').value.trim();

  if (!name || isNaN(cgpa)) {
    showToast('Please provide valid name and CGPA.', 'error');
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = 'Saving changes...';

    await api.put('/students/me', { name, branch, cgpa, backlogs, skills });
    showToast('Academic profile updated successfully!', 'success');
    await fetchStudentData();
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Profile Changes';
  }
}

async function handleResumeUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type !== 'application/pdf') {
    showToast('Only PDF files are permitted.', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('Resume file size cannot exceed 5 MB.', 'error');
    return;
  }

  const statusText = document.getElementById('uploadStatusText');
  const uploadIcon = document.getElementById('uploadIcon');

  try {
    if (statusText) statusText.textContent = 'Uploading resume...';
    if (uploadIcon) uploadIcon.style.animation = 'pulse 1s infinite';

    const formData = new FormData();
    formData.append('resume', file);

    const res = await api.post('/students/resume', formData);
    showToast('PDF Resume uploaded successfully!', 'success');

    auth.updateUserProfile({ resume_url: res.resume_url });
    await fetchStudentData();

  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to upload resume.', 'error');
  } finally {
    if (statusText) statusText.textContent = 'Click to Upload PDF Resume';
    if (uploadIcon) uploadIcon.style.animation = '';
    e.target.value = '';
  }
}

function switchTab(tabKey) {
  const tabDrives = document.getElementById('tabDrives');
  const tabApps = document.getElementById('tabApplications');
  const tabProf = document.getElementById('tabProfile');

  const tabBtnDrives = document.getElementById('tabBtnDrives');
  const tabBtnApps = document.getElementById('tabBtnApps');
  const tabBtnProfile = document.getElementById('tabBtnProfile');

  if (tabDrives) tabDrives.style.display = tabKey === 'drives' ? 'block' : 'none';
  if (tabApps) tabApps.style.display = tabKey === 'applications' ? 'block' : 'none';
  if (tabProf) tabProf.style.display = tabKey === 'profile' ? 'block' : 'none';

  if (tabBtnDrives) tabBtnDrives.classList.toggle('active', tabKey === 'drives');
  if (tabBtnApps) tabBtnApps.classList.toggle('active', tabKey === 'applications');
  if (tabBtnProfile) tabBtnProfile.classList.toggle('active', tabKey === 'profile');
}

function updateCounts() {
  const badgeEligible = document.getElementById('badgeEligibleCount');
  if (badgeEligible) {
    const eligibleCount = allDrives.filter(d => d.is_eligible).length;
    badgeEligible.textContent = eligibleCount;
  }
}
