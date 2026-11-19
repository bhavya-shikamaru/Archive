import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GraduationCap, Briefcase, AlertCircle, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: '',
    enrollment_no: '',
    branch: 'CSE',
    cgpa: '',
    backlogs: '0',
    skills: ''
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    password: '',
    industry: '',
    website: ''
  });

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleStudentChange = (e) => {
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };

  const handleCompanyChange = (e) => {
    setCompanyForm({ ...companyForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      if (role === 'student') {
        const cgpaNum = parseFloat(studentForm.cgpa);
        if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
          setError('CGPA must be a valid number between 0.00 and 10.00.');
          setLoading(false);
          return;
        }

        const user = await register({
          ...studentForm,
          role: 'student',
          cgpa: cgpaNum,
          backlogs: parseInt(studentForm.backlogs, 10) || 0
        });
        addToast(`Welcome, ${user?.profile?.name || user?.email}! Your student account is ready.`, 'success');
        navigate('/student');
      } else {
        const user = await register({
          ...companyForm,
          role: 'company'
        });
        addToast(`Welcome, ${user?.profile?.name || user?.email}! Your company account is pending admin approval.`, 'info');
        navigate('/company');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 xl:p-16 border-r border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-950 tracking-tight">CPMS Portal</p>
            <p className="text-xs text-slate-500 font-medium">College Placement Management System</p>
          </div>
        </div>

        <div className="max-w-sm">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-950 leading-tight tracking-tight mb-6">
            One platform for campus hiring
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed mb-10">
            Students apply to drives. Recruiters manage candidates. The placement cell oversees it all.
          </p>

          <ul className="space-y-3 text-slate-700">
            {[
              'Real-time eligibility matching',
              'JWT-secured role-based access',
              'Live placement analytics with Excel export',
              'PDF resume upload and management',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">ADWT PBL Project</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-2xl animate-fade-in-up">

          <div className="lg:hidden flex items-center gap-3 mb-8 pb-6 border-b border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-base font-black text-slate-950 tracking-tight">CPMS Portal</p>
              <p className="text-xs text-slate-500">Placement Management System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-950 tracking-tight mb-2">Create your account</h2>
            <p className="text-slate-500 text-sm">Select your role and fill in the details to get started</p>
          </div>

          {/* Role Toggle Selector */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => { setRole('student'); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                role === 'student'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Student
            </button>
            <button
              type="button"
              onClick={() => { setRole('company'); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                role === 'company'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Recruiter
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2 animate-slide-in-right">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {role === 'student' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <input
                      type="text"
                      required
                      name="name"
                      value={studentForm.name}
                      onChange={handleStudentChange}
                      placeholder="e.g. Rahul Sharma"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Enrollment No *</label>
                    <input
                      type="text"
                      required
                      name="enrollment_no"
                      value={studentForm.enrollment_no}
                      onChange={handleStudentChange}
                      placeholder="e.g. 0801CS211001"
                      className="input uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email Address *</label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={studentForm.email}
                      onChange={handleStudentChange}
                      placeholder="student@college.edu"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Password (Min 6) *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      name="password"
                      value={studentForm.password}
                      onChange={handleStudentChange}
                      placeholder="••••••••"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Branch *</label>
                    <select
                      name="branch"
                      value={studentForm.branch}
                      onChange={handleStudentChange}
                      className="input"
                    >
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EE">EE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Current CGPA *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      required
                      name="cgpa"
                      value={studentForm.cgpa}
                      onChange={handleStudentChange}
                      placeholder="e.g. 8.50"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Active Backlogs</label>
                    <input
                      type="number"
                      min="0"
                      required
                      name="backlogs"
                      value={studentForm.backlogs}
                      onChange={handleStudentChange}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Technical Skills (Comma separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={studentForm.skills}
                    onChange={handleStudentChange}
                    placeholder="e.g. React, Node.js, Python, MySQL, Git"
                    className="input"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">Company / Organization Name *</label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={companyForm.name}
                    onChange={handleCompanyChange}
                    placeholder="e.g. Google India Pvt Ltd"
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Official Email *</label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={companyForm.email}
                      onChange={handleCompanyChange}
                      placeholder="recruiter@company.com"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Password (Min 6) *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      name="password"
                      value={companyForm.password}
                      onChange={handleCompanyChange}
                      placeholder="••••••••"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Industry Domain</label>
                    <input
                      type="text"
                      name="industry"
                      value={companyForm.industry}
                      onChange={handleCompanyChange}
                      placeholder="e.g. Information Technology / Fintech"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Company Website</label>
                    <input
                      type="url"
                      name="website"
                      value={companyForm.website}
                      onChange={handleCompanyChange}
                      placeholder="https://company.com"
                      className="input"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-semibold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Recruiter Notice
                  </div>
                  Newly registered company accounts require TPO admin approval before posting placement drives.
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account…
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Already have an account?
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-slate-600">
            <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors duration-100">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;