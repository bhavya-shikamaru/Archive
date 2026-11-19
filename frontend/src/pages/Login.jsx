import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      addToast(`Welcome back, ${user?.profile?.name || user?.email}`, 'success');
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'company') navigate('/company');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (e, p) => {
    setEmail(e);
    setPassword(p);
    setError('');
  };

  const demoCreds = [
    { label: 'TPO Admin', email: 'admin@college.edu', password: 'admin123' },
    { label: 'Student', email: 'rahul.sharma@college.edu', password: 'student123' },
    { label: 'Recruiter', email: 'recruiter@google.com', password: 'company123' },
  ];

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
        <div className="w-full max-w-md animate-fade-in-up">

          <div className="lg:hidden flex items-center gap-3 mb-10 pb-6 border-b border-slate-200">
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

          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-950 tracking-tight mb-2">Welcome back</h2>
            <p className="text-slate-500 text-sm">Sign in to access your placement portal</p>
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
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="input"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-100"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Quick Demo Access
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            {demoCreds.map((d) => (
              <button
                type="button"
                onClick={() => handleQuickFill(d.email, d.password)}
                className="group flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow transition-all duration-150 text-left"
              >
                <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700 uppercase tracking-wider">
                  {d.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{d.email}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            Click a role to auto-fill credentials, then click Sign In.
          </p>

          <p className="text-center text-sm text-slate-600 mt-8">
            New to CPMS?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors duration-100">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;