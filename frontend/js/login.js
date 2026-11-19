
document.addEventListener('DOMContentLoaded', () => {
  
  if (auth.isAuthenticated()) {
    const role = auth.getRole();
    if (role === 'admin') window.location.href = 'admin.html';
    else if (role === 'company') window.location.href = 'company.html';
    else window.location.href = 'student.html';
    return;
  }

  if (window.innerWidth < 1024) {
    const mobileHeader = document.getElementById('mobileHeader');
    if (mobileHeader) mobileHeader.style.display = 'flex';
  }

  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitBtn');

  let showPassword = false;
  togglePasswordBtn.addEventListener('click', () => {
    showPassword = !showPassword;
    passwordInput.type = showPassword ? 'text' : 'password';
    togglePasswordBtn.innerHTML = showPassword
      ? `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
        </svg>`
      : `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>`;
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <div style="width:16px;height:16px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
        <span>Signing in...</span>
      `;

      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res;

      auth.setSession(token, user);
      showToast(`Welcome back, ${user.profile?.name || user.email}!`, 'success');

      setTimeout(() => {
        if (user.role === 'admin') window.location.href = 'admin.html';
        else if (user.role === 'company') window.location.href = 'company.html';
        else window.location.href = 'student.html';
      }, 400);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials. Please try again.';
      showError(msg);
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Sign In</span>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
        </svg>
      `;
    }
  });

  function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.style.display = 'flex';
  }
});

function quickFill(email, password) {
  document.getElementById('email').value = email;
  document.getElementById('password').value = password;
  const errorAlert = document.getElementById('errorAlert');
  if (errorAlert) errorAlert.style.display = 'none';
}
