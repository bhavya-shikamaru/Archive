
const auth = {
  getToken() {
    return localStorage.getItem('cpms_token');
  },

  getUser() {
    try {
      const user = localStorage.getItem('cpms_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  setSession(token, user) {
    localStorage.setItem('cpms_token', token);
    localStorage.setItem('cpms_user', JSON.stringify(user));
  },

  updateUserProfile(updatedProfile) {
    const user = this.getUser();
    if (user) {
      user.profile = { ...(user.profile || {}), ...updatedProfile };
      localStorage.setItem('cpms_user', JSON.stringify(user));
    }
  },

  clearSession() {
    localStorage.removeItem('cpms_token');
    localStorage.removeItem('cpms_user');
  },

  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  checkAuth(allowedRoles = []) {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      window.location.href = 'login.html';
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      if (user.role === 'admin') window.location.href = 'admin.html';
      else if (user.role === 'company') window.location.href = 'company.html';
      else window.location.href = 'student.html';
      return false;
    }

    return true;
  },

  async verifySession() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const res = await api.get('/auth/me');
      if (res && res.user) {
        this.setSession(token, res.user);
        return true;
      }
    } catch (err) {
      console.warn('Session verification failed, logging out');
      this.clearSession();
      if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
        window.location.href = 'login.html';
      }
      return false;
    }
    return false;
  },

  logout() {
    this.clearSession();
    window.location.href = 'login.html';
  }
};
