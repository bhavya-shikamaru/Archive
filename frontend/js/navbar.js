
function renderNavbar() {
  const navContainer = document.getElementById('navbar');
  if (!navContainer) return;

  const isAuth = auth.isAuthenticated();
  const user = auth.getUser();
  const role = user ? user.role : null;

  let dashboardHref = 'login.html';
  let roleBadgeHtml = '';

  if (role === 'admin') {
    dashboardHref = 'admin.html';
    roleBadgeHtml = `<span class="badge badge-success">
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>
      TPO Admin
    </span>`;
  } else if (role === 'company') {
    dashboardHref = 'company.html';
    roleBadgeHtml = `<span class="badge badge-success">
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
      Recruiter
    </span>`;
  } else if (role === 'student') {
    dashboardHref = 'student.html';
    roleBadgeHtml = `<span class="badge badge-success">
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/>
      </svg>
      Student
    </span>`;
  }

  const displayName = user?.profile?.name || user?.email || 'User';

  navContainer.className = 'navbar';
  navContainer.innerHTML = `
    <div class="container navbar-inner">
      <a href="${isAuth ? dashboardHref : 'login.html'}" class="brand-link">
        <div class="brand-icon">
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
        <div>
          <span class="brand-title">CPMS Portal</span>
          <span class="brand-sub" style="display:block;">Placement Management System</span>
        </div>
      </a>

      <div class="nav-actions">
        ${isAuth ? `
          <div class="user-profile-badge">
            <div>
              <div class="user-name">${escapeHtml(displayName)}</div>
              <div class="flex justify-end mt-1">${roleBadgeHtml}</div>
            </div>
          </div>
          <button id="logoutBtn" class="btn btn-ghost" style="color: var(--danger-600);" title="Logout">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span class="hidden sm:inline">Logout</span>
          </button>
        ` : `
          <a href="login.html" class="btn btn-ghost">Sign In</a>
          <a href="register.html" class="btn btn-primary">Register</a>
        `}
      </div>
    </div>
  `;

  if (isAuth) {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => auth.logout());
    }
  }
}

document.addEventListener('DOMContentLoaded', renderNavbar);
