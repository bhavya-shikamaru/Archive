import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CardSkeleton, ApplicationSkeleton } from '../components/Skeletons';
import {
  Briefcase, FileText, User, CheckCircle2, XCircle, Clock,
  Upload, AlertTriangle, Building, Search, ExternalLink,
  ChevronRight, ArrowUpDown, SlidersHorizontal, GraduationCap,
  Calendar, Award
} from 'lucide-react';

const ApplicationTimeline = ({ status }) => {
  const steps = [
    { key: 'applied', label: 'Applied', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'shortlisted', label: 'Shortlisted', icon: <Award className="w-4 h-4" /> },
    { key: 'selected', label: 'Offered', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const orderMap = { applied: 0, shortlisted: 1, rejected: -1, selected: 2 };
  const currentOrder = orderMap[status] ?? 0;

  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 mt-3">
        <span className="badge badge-danger">
          <XCircle className="w-3.5 h-3.5" /> Not shortlisted for this drive
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center mt-3 w-full">
      {steps.map((step, i) => {
        const done = i <= currentOrder;
        const active = i === currentOrder;
        const last = i === steps.length - 1;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all ${
                done
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white border-slate-300 text-slate-400'
              } ${active ? 'ring-4 ring-emerald-100 scale-110' : ''}`}>
                {done ? step.icon : <span className="text-slate-300 text-xs font-bold">{i + 1}</span>}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 text-center whitespace-nowrap ${
                done ? 'text-emerald-700' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
            {!last && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded transition-all ${
                i < currentOrder ? 'bg-emerald-500' : 'bg-slate-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const StudentDashboard = () => {
  const { user, updateUserProfile } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('drives');

  const [allDrives, setAllDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [applyingDriveId, setApplyingDriveId] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: '', branch: '', cgpa: '', backlogs: 0, skills: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, drivesRes, appsRes] = await Promise.all([
        api.get('/students/me'),
        api.get('/drives/eligible'),
        api.get('/students/applications'),
      ]);
      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
        const p = profileRes.data.data;
        setProfileForm({ name: p.name||'', branch: p.branch||'CSE', cgpa: p.cgpa||'', backlogs: p.backlogs||0, skills: p.skills||'' });
      }
      if (drivesRes.data.success) setAllDrives(drivesRes.data.all_open_drives || []);
      if (appsRes.data.success) setApplications(appsRes.data.data || []);
    } catch (err) {
      addToast('Failed to load your data. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDrives = useMemo(() => {
    let list = [...allDrives];

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.company_name.toLowerCase().includes(q) ||
        d.allowed_branches.toLowerCase().includes(q)
      );
    }

    if (filterBranch !== 'ALL') {
      list = list.filter(d =>
        d.allowed_branches.toUpperCase().split(',').map(b => b.trim()).includes(filterBranch)
      );
    }

    switch (sortBy) {
      case 'package_high': list.sort((a, b) => b.package_lpa - a.package_lpa); break;
      case 'package_low':  list.sort((a, b) => a.package_lpa - b.package_lpa); break;
      case 'deadline':     list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)); break;
      default:             list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
    }

    return list;
  }, [allDrives, searchQuery, filterBranch, sortBy]);

  const eligibleCount = allDrives.filter(d => d.is_eligible).length;

  const handleApply = async (driveId, driveTitle) => {
    setApplyingDriveId(driveId);
    try {
      const res = await api.post(`/drives/${driveId}/apply`);
      addToast(`Successfully applied to ${driveTitle}!`, 'success');
      await fetchData();
    } catch (err) {
      const reasons = err.response?.data?.reasons;
      const msg = reasons ? reasons[0] : (err.response?.data?.message || 'Failed to apply.');
      addToast(msg, 'error');
    } finally {
      setApplyingDriveId(null);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { addToast('Only PDF files are allowed.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { addToast('Resume cannot exceed 5 MB.', 'error'); return; }

    const formData = new FormData();
    formData.append('resume', file);
    try {
      setUploadingResume(true);
      const res = await api.post('/students/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast('Resume uploaded successfully!', 'success');
      updateUserProfile({ resume_url: res.data.resume_url });
      await fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Upload failed.', 'error');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/students/me', profileForm);
      addToast('Profile saved successfully!', 'success');
      await fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Update failed.', 'error');
    }
  };

  const branches = ['ALL', 'CSE', 'IT', 'ECE', 'EE', 'MECH', 'CIVIL'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Welcome Section */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Student Portal</p>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">
              Welcome, {profile?.name || user?.email}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{profile?.enrollment_no}</span>
              <span className="text-slate-300">|</span>
              <span className="badge badge-success">{profile?.branch}</span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-emerald-600">CGPA {profile?.cgpa}</span>
              <span className="text-slate-300">|</span>
              <span className={profile?.backlogs > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                {profile?.backlogs} Backlog{profile?.backlogs !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {profile?.resume_url ? (
              <a
                href={profile.resume_url}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost text-sm"
              >
                <FileText className="w-3.5 h-3.5" /> View Resume
              </a>
            ) : (
              <span className="badge badge-warning">
                <AlertTriangle className="w-3.5 h-3.5" /> No Resume
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 mb-6 animate-fade-in-up stagger-1">
        {[
          { key: 'drives', icon: <Briefcase className="w-4 h-4" />, label: 'Placement Drives', count: eligibleCount },
          { key: 'applications', icon: <Clock className="w-4 h-4" />, label: 'My Applications', count: applications.length },
          { key: 'profile', icon: <User className="w-4 h-4" />, label: 'Profile & Resume', count: null },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== null && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: DRIVES */}
      {activeTab === 'drives' && (
        <div className="animate-fade-in-up stagger-2">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 pb-4 border-b border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by company, role, or branch..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {branches.map(b => (
                <button
                  key={b}
                  onClick={() => setFilterBranch(b)}
                  className={`shrink-0 px-3 py-2 rounded-md text-xs font-bold transition-colors ${
                    filterBranch === b
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="relative shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="input pl-8 pr-8 appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="package_high">Package: High to Low</option>
                <option value="package_low">Package: Low to High</option>
                <option value="deadline">Deadline: Soonest</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
            <span>{filteredDrives.length} drive{filteredDrives.length !== 1 ? 's' : ''} shown</span>
            <span className="font-semibold text-emerald-600">{eligibleCount} eligible for you</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : filteredDrives.length === 0 ? (
            <div className="py-12 text-center border border-slate-200 rounded-lg">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No drives match your search</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDrives.map((drive, idx) => (
                <div
                  key={drive.id}
                  className={`border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors animate-fade-in-up ${
                    drive.is_eligible ? '' : 'opacity-80'
                  }`}
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">{drive.company_name}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{drive.title}</h3>
                    </div>
                    <span className="shrink-0 font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-sm">
                      ₹{drive.package_lpa} LPA
                    </span>
                  </div>

                  {drive.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{drive.description}</p>
                  )}

                  {/* Criteria Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100 mb-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Branches</span>
                      <span className="font-bold text-slate-700">{drive.allowed_branches}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Min CGPA</span>
                      <span className="font-bold text-slate-700">{drive.min_cgpa}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Max Backlogs</span>
                      <span className="font-bold text-slate-700">{drive.max_backlogs}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Deadline</span>
                      <span className="font-bold text-slate-700">{new Date(drive.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Ineligible reasons */}
                  {!drive.is_eligible && drive.eligibility_reasons?.length > 0 && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-700 mb-3 space-y-0.5">
                      <div className="font-bold flex items-center gap-1 mb-1">
                        <XCircle className="w-3.5 h-3.5" /> Why you are ineligible:
                      </div>
                      {drive.eligibility_reasons.map((r, i) => <div key={i}>• {r}</div>)}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className={`flex items-center gap-1 text-xs font-semibold ${drive.is_eligible ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {drive.is_eligible ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Eligible</>
                      ) : (
                        <><XCircle className="w-3.5 h-3.5" /> Not eligible</>
                      )}
                    </span>

                    {drive.has_applied ? (
                      <span className="badge badge-info">Applied</span>
                    ) : (
                      <button
                        onClick={() => handleApply(drive.id, drive.title)}
                        disabled={!drive.is_eligible || applyingDriveId === drive.id}
                        className="btn-primary text-xs px-4 py-1.5"
                      >
                        {applyingDriveId === drive.id ? 'Applying…' : 'Apply Now'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4 animate-fade-in-up stagger-2">
          {loading ? (
            [1, 2].map(i => <ApplicationSkeleton key={i} />)
          ) : applications.length === 0 ? (
            <div className="py-12 text-center border border-slate-200 rounded-lg">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No applications yet</h3>
              <p className="text-sm text-slate-500 mt-1">Go to Placement Drives and apply to eligible openings.</p>
            </div>
          ) : (
            applications.map(app => (
              <div key={app.application_id} className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors">
                {/* Header Row */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">{app.company_name}</span>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{app.drive_title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Applied {new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      &nbsp;·&nbsp;Package: <span className="font-semibold text-emerald-600">₹{app.package_lpa} LPA</span>
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0">
                    {app.application_status === 'selected' && (
                      <span className="badge badge-success">
                        <Award className="w-3 h-3 mr-1" /> Selected
                      </span>
                    )}
                    {app.application_status === 'shortlisted' && (
                      <span className="badge badge-info">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Shortlisted
                      </span>
                    )}
                    {app.application_status === 'applied' && (
                      <span className="badge badge-warning">
                        <Clock className="w-3 h-3 mr-1" /> Under Review
                      </span>
                    )}
                    {app.application_status === 'rejected' && (
                      <span className="badge badge-danger">
                        <XCircle className="w-3 h-3 mr-1" /> Not Shortlisted
                      </span>
                    )}
                  </div>
                </div>

                {/* Application Timeline */}
                <div className="p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Application Journey</p>
                  <ApplicationTimeline status={app.application_status} />
                </div>

                {/* Round Results */}
                {app.rounds && app.rounds.length > 0 && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Interview Stages</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {app.rounds.map(round => (
                        <div key={round.round_no} className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Round {round.round_no}</span>
                            <span className="text-xs font-semibold text-slate-800 block mt-0.5">{round.round_name}</span>
                            {round.feedback && <p className="text-[10px] text-slate-400 italic mt-1">"{round.feedback}"</p>}
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                            round.result === 'pass' ? 'badge-success' :
                            round.result === 'fail' ? 'badge-danger' :
                            'badge-neutral'
                          }`}>
                            {(round.result || 'PENDING').toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: PROFILE & RESUME */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up stagger-2">
          {/* Edit Form */}
          <div className="lg:col-span-2 border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-black text-slate-900 mb-5">Academic Profile</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input type="text" required value={profileForm.name}
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                    className="input" />
                </div>
                <div>
                  <label className="label">Enrollment No (Readonly)</label>
                  <input type="text" disabled value={profile?.enrollment_no || ''}
                    className="input bg-slate-50 text-slate-500 cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Branch</label>
                  <select value={profileForm.branch}
                    onChange={e => setProfileForm({...profileForm, branch: e.target.value})}
                    className="input">
                    {['CSE','IT','ECE','EE','MECH','CIVIL'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">CGPA</label>
                  <input type="number" step="0.01" min="0" max="10" required value={profileForm.cgpa}
                    onChange={e => setProfileForm({...profileForm, cgpa: e.target.value})}
                    className="input" />
                </div>
                <div>
                  <label className="label">Backlogs</label>
                  <input type="number" min="0" required value={profileForm.backlogs}
                    onChange={e => setProfileForm({...profileForm, backlogs: e.target.value})}
                    className="input" />
                </div>
              </div>

              <div>
                <label className="label">Technical Skills</label>
                <textarea rows={3} value={profileForm.skills}
                  onChange={e => setProfileForm({...profileForm, skills: e.target.value})}
                  placeholder="React.js, Express, MySQL, Python, Git..."
                  className="input resize-none" />
              </div>

              <button type="submit" className="btn-primary">
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Resume Upload */}
          <div className="border border-slate-200 rounded-lg p-6 flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Resume Document</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your latest CV as a PDF (max 5MB). Visible to all recruiters who review your application.
              </p>
            </div>

            {profile?.resume_url ? (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Active Resume
                  </span>
                  <a href={profile.resume_url} target="_blank" rel="noreferrer"
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-0.5">
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-500 break-all">{profile.resume_url}</p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                No resume uploaded yet. Upload a PDF to maximize shortlisting opportunities.
              </div>
            )}

            <label className="block w-full cursor-pointer">
              <input type="file" accept="application/pdf"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
                className="hidden" />
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 rounded-lg p-6 text-center transition-colors bg-slate-50 cursor-pointer">
                <Upload className={`w-7 h-7 mx-auto mb-2.5 ${uploadingResume ? 'text-emerald-500 animate-bounce' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-700 block">
                  {uploadingResume ? 'Uploading…' : 'Click to Upload PDF Resume'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">Only .pdf format · Max 5 MB</span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;