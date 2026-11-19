
document.addEventListener('DOMContentLoaded', () => {
  let activeRole = 'student';

  const roleStudentBtn = document.getElementById('roleStudentBtn');
  const roleCompanyBtn = document.getElementById('roleCompanyBtn');
  const studentFields = document.getElementById('studentFields');
  const companyFields = document.getElementById('companyFields');
  const registerForm = document.getElementById('registerForm');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitBtn');

  roleStudentBtn.addEventListener('click', () => {
    activeRole = 'student';
    roleStudentBtn.classList.add('active');
    roleCompanyBtn.classList.remove('active');
    studentFields.style.display = 'block';
    companyFields.style.display = 'none';
    errorAlert.style.display = 'none';
  });

  roleCompanyBtn.addEventListener('click', () => {
    activeRole = 'company';
    roleCompanyBtn.classList.add('active');
    roleStudentBtn.classList.remove('active');
    studentFields.style.display = 'none';
    companyFields.style.display = 'block';
    errorAlert.style.display = 'none';
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';

    try {
      let payload = {};

      if (activeRole === 'student') {
        const name = document.getElementById('sName').value.trim();
        const enrollment_no = document.getElementById('sEnrollment').value.trim().toUpperCase();
        const email = document.getElementById('sEmail').value.trim();
        const password = document.getElementById('sPassword').value;
        const branch = document.getElementById('sBranch').value;
        const cgpaVal = parseFloat(document.getElementById('sCgpa').value);
        const backlogsVal = parseInt(document.getElementById('sBacklogs').value, 10) || 0;
        const skills = document.getElementById('sSkills').value.trim();

        if (!name || !enrollment_no || !email || !password || isNaN(cgpaVal)) {
          showError('Please complete all required fields (*).');
          return;
        }

        if (cgpaVal < 0 || cgpaVal > 10) {
          showError('CGPA must be a valid number between 0.00 and 10.00.');
          return;
        }

        if (password.length < 6) {
          showError('Password must be at least 6 characters.');
          return;
        }

        payload = {
          role: 'student',
          name,
          enrollment_no,
          email,
          password,
          branch,
          cgpa: cgpaVal,
          backlogs: backlogsVal,
          skills
        };
      } else {
        const name = document.getElementById('cName').value.trim();
        const email = document.getElementById('cEmail').value.trim();
        const password = document.getElementById('cPassword').value;
        const industry = document.getElementById('cIndustry').value.trim();
        const website = document.getElementById('cWebsite').value.trim();

        if (!name || !email || !password) {
          showError('Please complete all required fields (*).');
          return;
        }

        if (password.length < 6) {
          showError('Password must be at least 6 characters.');
          return;
        }

        payload = {
          role: 'company',
          name,
          email,
          password,
          industry,
          website
        };
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <div style="width:16px;height:16px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
        <span>Creating Account...</span>
      `;

      const res = await api.post('/auth/register', payload);
      const { token, user } = res;

      auth.setSession(token, user);

      if (activeRole === 'student') {
        showToast(`Welcome, ${user.profile?.name || user.email}! Your student account is ready.`, 'success');
        setTimeout(() => window.location.href = 'student.html', 500);
      } else {
        showToast(`Welcome, ${user.profile?.name || user.email}! Account created (pending approval).`, 'info');
        setTimeout(() => window.location.href = 'company.html', 500);
      }

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your details.';
      showError(msg);
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Complete Registration</span>`;
    }
  });

  function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.style.display = 'flex';
  }
});
