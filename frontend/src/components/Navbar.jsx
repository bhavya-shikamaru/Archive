import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, User, Briefcase, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin';
    if (role === 'company') return '/company';
    return '/student';
  };

  const getRoleBadge = () => {
    if (role === 'admin') {
      return (
        <span className="badge badge-success">
          <ShieldCheck className="w-3.5 h-3.5" /> TPO Admin
        </span>
      );
    }
    if (role === 'company') {
      return (
        <span className="badge badge-success">
          <Briefcase className="w-3.5 h-3.5" /> Recruiter
        </span>
      );
    }
    return (
      <span className="badge badge-success">
        <GraduationCap className="w-3.5 h-3.5" /> Student
      </span>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={isAuthenticated ? getDashboardLink() : '/login'} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold text-slate-950 block leading-tight">CPMS Portal</span>
            <span className="text-xs text-slate-500 font-medium">Placement Management System</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    {user?.profile?.name || user?.email}
                  </div>
                  <div className="flex justify-end mt-0.5">
                    {getRoleBadge()}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn-ghost text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-slate-700 hover:bg-slate-100">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;