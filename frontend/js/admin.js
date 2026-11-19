
let adminStats = null;
let adminCompanies = [];
let adminStudents = [];
let adminDrives = [];
let studentSearch = '';

let branchChartInstance = null;
let companyChartInstance = null;
let trendChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await fetchAllAdminData();
});

function setupEventListeners() {
  const searchInput = document.getElementById('studentSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      studentSearch = e.target.value.toLowerCase().trim();
      renderStudentsTable();
    });
  }
}

async function fetchAllAdminData() {
  try {
    const results = await Promise.allSettled([
      api.get('/admin/stats'),
      api.get('/admin/companies'),
      api.get('/admin/students'),
      api.get('/admin/drives')
    ]);

    const [statsRes, compRes, studRes, driveRes] = results;

    if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
      adminStats = statsRes.value;
      renderKPIs(adminStats.summary);
      renderCharts(adminStats);
    }

    if (compRes.status === 'fulfilled' && compRes.value?.success) {
      adminCompanies = compRes.value.data || [];
      document.getElementById('badgeAdminCompanies').textContent = adminCompanies.length;
      renderCompaniesTable();
    }

    if (studRes.status === 'fulfilled' && studRes.value?.success) {
      adminStudents = studRes.value.data || [];
      document.getElementById('badgeAdminStudents').textContent = adminStudents.length;
      renderStudentsTable();
    }

    if (driveRes.status === 'fulfilled' && driveRes.value?.success) {
      adminDrives = driveRes.value.data || [];
      document.getElementById('badgeAdminDrives').textContent = adminDrives.length;
      renderAdminDrives();
    }

  } catch (err) {
    showToast('Failed to load dashboard data.', 'error');
  }
}

function renderKPIs(summary) {
  if (!summary) return;

  const totalStud = document.getElementById('kpiTotalStudents');
  const placedStud = document.getElementById('kpiPlacedStudents');
  const rateElem = document.getElementById('kpiPlacementRate');
  const activeDrives = document.getElementById('kpiActiveDrives');
  const totalComp = document.getElementById('kpiTotalCompanies');
  const approvedComp = document.getElementById('kpiApprovedCompanies');
  const pendingComp = document.getElementById('kpiPendingCompanies');

  if (totalStud) totalStud.textContent = summary.total_students || 0;
  if (placedStud) placedStud.textContent = summary.total_placed || 0;
  if (rateElem) rateElem.textContent = `${summary.placement_rate_pct || 0}% Placement Rate`;
  if (activeDrives) activeDrives.textContent = summary.active_drives || 0;
  if (totalComp) totalComp.textContent = summary.total_companies || 0;
  if (approvedComp) approvedComp.textContent = `${summary.approved_companies || 0} approved`;
  if (pendingComp) {
    pendingComp.textContent = summary.pending_companies || 0;
    if (summary.pending_companies > 0) {
      pendingComp.style.color = 'var(--warning-600)';
    }
  }
}

function renderCharts(stats) {
  const branchStats = stats?.charts?.branch_stats || [];
  const companyStats = stats?.charts?.company_stats || [];
  const summary = stats?.summary || {};

  const emeraldColors = [
    '#10b981', '#059669', '#047857', '#065f46', '#34d399', '#6ee7b7'
  ];

  const branchLabels = branchStats.map(b => b.branch);
  const branchCounts = branchStats.map(b => b.placed_students);

  const doughnutCanvas = document.getElementById('branchDoughnutChart');
  if (doughnutCanvas && typeof Chart !== 'undefined') {
    if (branchChartInstance) branchChartInstance.destroy();
    branchChartInstance = new Chart(doughnutCanvas, {
      type: 'doughnut',
      data: {
        labels: branchLabels.length > 0 ? branchLabels : ['CSE', 'IT', 'ECE'],
        datasets: [{
          data: branchCounts.length > 0 ? branchCounts : [3, 2, 1],
          backgroundColor: emeraldColors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11, family: 'Inter' } }
          }
        }
      }
    });
  }

  const compLabels = companyStats.map(c => c.company_name);
  const compCounts = companyStats.map(c => c.total_hires);

  const barCanvas = document.getElementById('companyBarChart');
  if (barCanvas && typeof Chart !== 'undefined') {
    if (companyChartInstance) companyChartInstance.destroy();
    companyChartInstance = new Chart(barCanvas, {
      type: 'bar',
      data: {
        labels: compLabels.length > 0 ? compLabels : ['Google India', 'Infosys BPM'],
        datasets: [{
          label: 'Students Hired',
          data: compCounts.length > 0 ? compCounts : [2, 1],
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 10 } },
            grid: { color: 'rgba(148,163,184,0.1)' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 } }
          }
        }
      }
    });
  }

  const lineCanvas = document.getElementById('monthlyTrendChart');
  if (lineCanvas && typeof Chart !== 'undefined') {
    if (trendChartInstance) trendChartInstance.destroy();
    trendChartInstance = new Chart(lineCanvas, {
      type: 'line',
      data: {
        labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        datasets: [
          {
            label: 'Students Placed',
            data: [0, 0, 0, summary.total_placed || 1, 0, 0, 0, 0],
            fill: true,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: '#10b981',
            borderWidth: 2.5,
            pointBackgroundColor: '#059669',
            pointRadius: 4,
            tension: 0.35
          },
          {
            label: 'Applications Received',
            data: [0, 0, 0, summary.total_drives ? summary.total_drives * 2 : 3, 0, 0, 0, 0],
            fill: false,
            borderColor: '#047857',
            borderWidth: 2,
            borderDash: [4, 4],
            pointBackgroundColor: '#047857',
            pointRadius: 4,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 11, family: 'Inter' } }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 10 } },
            grid: { color: 'rgba(148,163,184,0.1)' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 } }
          }
        }
      }
    });
  }
}

function renderCompaniesTable() {
  const tbody = document.getElementById('companiesTableBody');
  if (!tbody) return;

  if (adminCompanies.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--slate-500);">No partner companies registered yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminCompanies.map(c => {
    let statusBadge = '';
    if (c.approved === 1) statusBadge = '<span class="badge badge-success">Approved</span>';
    else if (c.approved === 0) statusBadge = '<span class="badge badge-warning">Pending Approval</span>';
    else statusBadge = '<span class="badge badge-danger">Rejected</span>';

    return `
      <tr>
        <td>
          <strong style="color:var(--slate-900);">${escapeHtml(c.name)}</strong>
          ${c.website ? `
            <div>
              <a href="${c.website}" target="_blank" style="font-size:0.75rem; color:var(--primary-600); text-decoration:underline;">
                ${escapeHtml(c.website)}
              </a>
            </div>
          ` : ''}
        </td>
        <td style="color:var(--slate-700); font-weight:500;">${escapeHtml(c.industry || 'General IT')}</td>
        <td style="color:var(--slate-500);">${escapeHtml(c.email)}</td>
        <td>${statusBadge}</td>
        <td class="text-right">
          <div class="flex items-center justify-end gap-2">
            ${c.approved !== 1 ? `
              <button class="btn btn-ghost btn-sm" style="color:var(--primary-600);" onclick="handleCompanyDecision(${c.id}, 1)">
                ✓ Approve
              </button>
            ` : ''}
            ${c.approved !== 2 ? `
              <button class="btn btn-ghost btn-sm" style="color:var(--danger-600);" onclick="handleCompanyDecision(${c.id}, 2)">
                ✕ Reject
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function handleCompanyDecision(companyId, approvedStatus) {
  try {
    const res = await api.put(`/admin/companies/${companyId}/approve`, { approved: approvedStatus });
    showToast(res.message || 'Company status updated.', 'success');
    await fetchAllAdminData();
  } catch (err) {
    showToast(err.response?.data?.message || 'Action failed.', 'error');
  }
}

function renderStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  const countText = document.getElementById('studentsCountText');
  if (!tbody) return;

  const filtered = adminStudents.filter(s => {
    if (!studentSearch) return true;
    return (
      s.name.toLowerCase().includes(studentSearch) ||
      s.enrollment_no.toLowerCase().includes(studentSearch) ||
      s.branch.toLowerCase().includes(studentSearch)
    );
  });

  if (countText) countText.textContent = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--slate-500);">No students match your search criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    let placementBadge = '';
    if (s.placement_status === 'Placed') {
      placementBadge = `
        <div>
          <span class="badge badge-success">Placed (${escapeHtml(s.placed_company || 'Corporate')})</span>
          <span style="font-size:0.75rem; color:var(--primary-600); font-weight:700; display:block; margin-top:0.15rem;">₹${s.placed_package} LPA</span>
        </div>
      `;
    } else if (s.placement_status === 'In Process') {
      placementBadge = '<span class="badge badge-info">In Process</span>';
    } else {
      placementBadge = '<span class="badge badge-neutral">Not Applied</span>';
    }

    const resumeLink = s.resume_url ? `
      <a href="${s.resume_url}" target="_blank" style="font-weight:600; color:var(--primary-600); text-decoration:underline;">
        PDF
      </a>
    ` : `<span style="color:var(--slate-400); font-style:italic;">—</span>`;

    return `
      <tr>
        <td>
          <strong style="color:var(--slate-900); display:block;">${escapeHtml(s.name)}</strong>
          <span style="font-size:0.75rem; color:var(--slate-400);">${escapeHtml(s.email)}</span>
        </td>
        <td style="font-weight:600; color:var(--slate-800);">${escapeHtml(s.enrollment_no)}</td>
        <td><span class="badge badge-success">${escapeHtml(s.branch)}</span></td>
        <td style="font-weight:700; color:var(--primary-600);">${s.cgpa}</td>
        <td>
          <span class="badge ${s.backlogs > 0 ? 'badge-danger' : 'badge-success'}">
            ${s.backlogs}
          </span>
        </td>
        <td>${placementBadge}</td>
        <td class="text-right">${resumeLink}</td>
      </tr>
    `;
  }).join('');
}

function renderAdminDrives() {
  const container = document.getElementById('adminDrivesGrid');
  if (!container) return;

  if (adminDrives.length === 0) {
    container.innerHTML = `
      <div style="grid-column: span 2; padding: 3rem; text-align: center; border: 1px solid var(--slate-200); border-radius: var(--radius-lg); background: #ffffff;">
        <p style="color: var(--slate-500);">No placement drives registered yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = adminDrives.map(d => `
    <div class="card flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary-600); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.2rem;">
              ${escapeHtml(d.company_name)}
            </span>
            <h3 style="font-size: 1.15rem;">${escapeHtml(d.title)}</h3>
          </div>
          <span style="font-size: 0.9rem; font-weight: 800; color: var(--primary-700); background: var(--primary-50); border: 1px solid var(--primary-200); padding: 0.25rem 0.6rem; border-radius: var(--radius-sm); white-space: nowrap;">
            ₹${d.package_lpa} LPA
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2" style="background: var(--slate-50); border: 1px solid var(--slate-100); border-radius: var(--radius-md); padding: 0.65rem; font-size: 0.75rem; margin: 0.75rem 0;">
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
            <span style="font-weight: 700; color: var(--primary-600);">${d.selected_count || 0} placed</span>
          </div>
        </div>
      </div>

      <div class="border-top" style="font-size: 0.75rem; color: var(--slate-400); margin-top: 0.5rem;">
        Deadline: ${new Date(d.deadline).toLocaleString()}
      </div>
    </div>
  `).join('');
}

async function handleExportExcel() {
  try {
    const filename = `Placed_Students_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    await api.download('/admin/export-placed', filename);
    showToast('Excel report downloaded successfully!', 'success');
  } catch (err) {
    showToast('Failed to download Excel report.', 'error');
  }
}

function switchAdminTab(tabKey) {
  const secOverview = document.getElementById('tabSecOverview');
  const secCompanies = document.getElementById('tabSecCompanies');
  const secStudents = document.getElementById('tabSecStudents');
  const secDrives = document.getElementById('tabSecDrives');

  const btnOverview = document.getElementById('tabBtnOverview');
  const btnCompanies = document.getElementById('tabBtnCompanies');
  const btnStudents = document.getElementById('tabBtnStudents');
  const btnDrives = document.getElementById('tabBtnDrives');

  if (secOverview) secOverview.style.display = tabKey === 'overview' ? 'block' : 'none';
  if (secCompanies) secCompanies.style.display = tabKey === 'companies' ? 'block' : 'none';
  if (secStudents) secStudents.style.display = tabKey === 'students' ? 'block' : 'none';
  if (secDrives) secDrives.style.display = tabKey === 'drives' ? 'block' : 'none';

  if (btnOverview) btnOverview.classList.toggle('active', tabKey === 'overview');
  if (btnCompanies) btnCompanies.classList.toggle('active', tabKey === 'companies');
  if (btnStudents) btnStudents.classList.toggle('active', tabKey === 'students');
  if (btnDrives) btnDrives.classList.toggle('active', tabKey === 'drives');
}
