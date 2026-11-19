import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatCardSkeleton, TableRowSkeleton, CardSkeleton } from '../components/Skeletons';
import {
  Building2,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('drives');

  const [drives, setDrives] = useState([]);
  const [isApproved, setIsApproved] = useState(1);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [driveForm, setDriveForm] = useState({
    title: '',
    description: '',
    package_lpa: '',
    min_cgpa: '7.00',
    allowed_branches: 'CSE,IT,ECE',
    max_backlogs: '0',
    deadline: ''
  });

  const [roundForm, setRoundForm] = useState({
    round_no: '',
    round_name: '',
    round_date: ''
  });

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await api.get('/companies/drives');
      if (res.data.success) {
        setDrives(res.data.data || []);
        setIsApproved(res.data.company_approved ?? 1);
        if (res.data.data?.length > 0 && !selectedDriveId) {
          setSelectedDriveId(res.data.data[0].id);
        }
      }
    } catch (err) {
      addToast('Error loading company drives', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (driveId) => {
    if (!driveId) return;
    try {
      setLoadingApplicants(true);
      const res = await api.get(`/companies/drives/${driveId}/applicants`);
      if (res.data.success) {
        setApplicants(res.data.data || []);
        setRounds(res.data.rounds || []);
      }
    } catch (err) {
      addToast('Error fetching applicants', 'error');
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  useEffect(() => {
    if (selectedDriveId) {
      fetchApplicants(selectedDriveId);
    }
  }, [selectedDriveId]);

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    try {
      await api.post('/drives', driveForm);
      addToast('Placement drive posted successfully!', 'success');
      setShowCreateModal(false);
      setDriveForm({
        title: '',
        description: '',
        package_lpa: '',
        min_cgpa: '7.00',
        allowed_branches: 'CSE,IT,ECE',
        max_backlogs: '0',
        deadline: ''
      });
      await fetchDrives();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to post drive.', 'error');
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      const res = await api.put(`/companies/applications/${applicationId}/status`, { status });
      addToast(res.data.message || `Application marked as ${status}`, 'success');
      await fetchApplicants(selectedDriveId);
      await fetchDrives();
    } catch (err) {
      addToast(err.response?.data?.message || 'Status update failed.', 'error');
    }
  };

  const handleAddRound = async (e) => {
    e.preventDefault();
    if (!selectedDriveId) return;
    try {
      await api.post(`/companies/drives/${selectedDriveId}/rounds`, roundForm);
      addToast('Hiring round added successfully!', 'success');
      setRoundForm({ round_no: '', round_name: '', round_date: '' });
      await fetchApplicants(selectedDriveId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add round.', 'error');
    }
  };

  const handleRecordResult = async (applicationId, roundId, result) => {
    try {
      await api.post(`/companies/applications/${applicationId}/round-result`, {
        round_id: roundId,
        result
      });
      addToast(`Candidate marked as ${result.toUpperCase()} for this round.`, 'success');
      await fetchApplicants(selectedDriveId);
    } catch (err) {
      addToast('Failed to record round result.', 'error');
    }
  };

  const totalApplicantsCount = drives.reduce((sum, d) => sum + (parseInt(d.total_applicants, 10) || 0), 0);
  const totalSelectedCount = drives.reduce((sum, d) => sum + (parseInt(d.selected_count, 10) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">

      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-200 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Recruiter Portal</span>
            </div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">
              {user?.profile?.name || user?.email}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Industry: {user?.profile?.industry || 'Technology'} |
              Approval Status:{' '}
              {isApproved === 1 ? (
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Recruiter
                </span>
              ) : (
                <span className="font-semibold text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Pending TPO Approval
                </span>
              )}
            </p>
          </div>

          {isApproved === 1 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Post New Placement Drive
            </button>
          )}
        </div>
      </div>

      {/* Pending Approval Warning */}
      {isApproved === 0 && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-100 text-amber-900 flex items-start gap-3 animate-slide-in-right">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Account Verification Pending:</strong> Your corporate profile is awaiting review by the College Training & Placement Officer (Admin). Once approved, you will be able to post job openings and review candidates.
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up stagger-1">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="border border-slate-200 rounded-lg p-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Posted Drives</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{drives.length}</div>
              <span className="text-xs text-emerald-600 mt-1 block">Active on student portal</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Applications</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{totalApplicantsCount}</div>
              <span className="text-xs text-slate-500 mt-1 block">Received across all roles</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Offers Extended</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-2">{totalSelectedCount}</div>
              <span className="text-xs text-emerald-600 mt-1 block">Placed candidates</span>
            </div>
          </>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 mb-6 animate-fade-in-up stagger-2">
        <button
          onClick={() => setActiveTab('drives')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'drives'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span className="hidden sm:inline">My Placement Drives</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'drives' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {drives.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('applicants')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'applicants'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Review Candidates</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'applicants' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {applicants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rounds')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'rounds'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline">Hiring Rounds</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'rounds' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {rounds.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PLACEMENT DRIVES */}
      {activeTab === 'drives' && (
        <div className="space-y-4 animate-fade-in-up stagger-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : drives.length === 0 ? (
            <div className="py-12 text-center border border-slate-200 rounded-lg">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No placement drives yet</h3>
              <p className="text-sm text-slate-500 mt-1">
                {isApproved === 1 ? 'Click "Post New Placement Drive" above to create your first opening.' : 'Drives can be posted once your recruiter account is approved.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drives.map((drive) => (
                <div key={drive.id} className="border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{drive.title}</h3>
                      <span className="shrink-0 font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-sm">
                        ₹{drive.package_lpa} LPA
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {drive.description || 'No detailed description provided.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                      <div>
                        <span className="text-slate-400 block font-medium">Eligible Branches</span>
                        <span className="font-semibold text-slate-700">{drive.allowed_branches}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Min CGPA</span>
                        <span className="font-semibold text-slate-700">{drive.min_cgpa}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Applicants</span>
                        <span className="font-semibold text-emerald-600">{drive.total_applicants || 0} applied</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Selected</span>
                        <span className="font-semibold text-emerald-600">{drive.selected_count || 0} offered</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Deadline: {new Date(drive.deadline).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedDriveId(drive.id);
                        setActiveTab('applicants');
                      }}
                      className="btn-ghost text-emerald-600 hover:bg-emerald-50 text-xs"
                    >
                      View Candidates <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REVIEW CANDIDATES */}
      {activeTab === 'applicants' && (
        <div className="border border-slate-200 rounded-lg overflow-hidden animate-fade-in-up stagger-3">
          {/* Drive Selector */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Drive:
              </label>
              <select
                value={selectedDriveId || ''}
                onChange={(e) => setSelectedDriveId(parseInt(e.target.value, 10))}
                className="input text-sm py-2"
              >
                {drives.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} (₹{d.package_lpa} LPA)
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-500">
              Total Applicants: <span className="font-bold text-slate-800">{applicants.length}</span>
            </div>
          </div>

          {loadingApplicants ? (
            <div className="p-4">
              <table className="w-full">
                <tbody>
                  <TableRowSkeleton cols={6} rows={4} />
                </tbody>
              </table>
            </div>
          ) : applicants.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No students have applied to this drive yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Candidate Name</th>
                    <th className="px-4 py-3.5">Enrollment & Branch</th>
                    <th className="px-4 py-3.5">CGPA / Backlogs</th>
                    <th className="px-4 py-3.5">Resume</th>
                    <th className="px-4 py-3.5">Current Status</th>
                    <th className="px-4 py-3.5 text-right">Update Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applicants.map((cand) => (
                    <tr key={cand.application_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{cand.student_name}</div>
                        <div className="text-xs text-slate-400">{cand.student_email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-800 block">{cand.enrollment_no}</span>
                        <span className="text-xs text-slate-500">{cand.branch}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-emerald-600 block">{cand.cgpa} CGPA</span>
                        <span className={`text-xs ${cand.backlogs > 0 ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                          {cand.backlogs} Backlogs
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {cand.resume_url ? (
                          <a
                            href={cand.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" /> View PDF
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No resume</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`badge ${
                          cand.application_status === 'selected'
                            ? 'badge-success'
                            : cand.application_status === 'shortlisted'
                            ? 'badge-info'
                            : cand.application_status === 'rejected'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}>
                          {cand.application_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStatusUpdate(cand.application_id, 'shortlisted')}
                            className="btn-ghost text-blue-600 hover:bg-blue-50 text-xs px-3 py-1.5"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(cand.application_id, 'selected')}
                            className="btn-ghost text-emerald-600 hover:bg-emerald-50 text-xs px-3 py-1.5"
                          >
                            Select
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(cand.application_id, 'rejected')}
                            className="btn-ghost text-rose-600 hover:bg-rose-50 text-xs px-3 py-1.5"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HIRING ROUNDS */}
      {activeTab === 'rounds' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up stagger-3">
          {/* Add Round Form */}
          <div className="border border-slate-200 rounded-lg p-5">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Interview Round</h3>
            <form onSubmit={handleAddRound} className="space-y-4">
              <div>
                <label className="label">Target Drive *</label>
                <select
                  value={selectedDriveId || ''}
                  onChange={(e) => setSelectedDriveId(parseInt(e.target.value, 10))}
                  className="input"
                >
                  {drives.map((d) => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Round Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical System Design Interview"
                  value={roundForm.round_name}
                  onChange={(e) => setRoundForm({ ...roundForm, round_name: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={roundForm.round_date}
                  onChange={(e) => setRoundForm({ ...roundForm, round_date: e.target.value })}
                  className="input"
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
              >
                Create Round
              </button>
            </form>
          </div>

          {/* Configured Rounds List */}
          <div className="lg:col-span-2 border border-slate-200 rounded-lg p-5">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Configured Rounds for Drive ({rounds.length})
            </h3>
            {rounds.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No rounds configured for this drive yet.</p>
            ) : (
              <div className="space-y-3">
                {rounds.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                        Round {r.round_no}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800">{r.round_name}</h4>
                      {r.round_date && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(r.round_date).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span className="badge badge-success">Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE DRIVE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-fade-in">
          <div className="bg-white rounded-lg border border-slate-200 max-w-xl w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Post Placement Drive</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="space-y-4">
              <div>
                <label className="label">Drive Title / Job Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Associate Software Engineer - 2026 Batch"
                  value={driveForm.title}
                  onChange={(e) => setDriveForm({ ...driveForm, title: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Role Description</label>
                <textarea
                  rows={3}
                  placeholder="Key responsibilities, team details, tech stack..."
                  value={driveForm.description}
                  onChange={(e) => setDriveForm({ ...driveForm, description: e.target.value })}
                  className="input resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Package (in LPA) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 14.50"
                    value={driveForm.package_lpa}
                    onChange={(e) => setDriveForm({ ...driveForm, package_lpa: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Minimum CGPA *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={driveForm.min_cgpa}
                    onChange={(e) => setDriveForm({ ...driveForm, min_cgpa: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Permitted Branches (Comma separated) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE,IT,ECE"
                    value={driveForm.allowed_branches}
                    onChange={(e) => setDriveForm({ ...driveForm, allowed_branches: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Max Backlogs Allowed *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={driveForm.max_backlogs}
                    onChange={(e) => setDriveForm({ ...driveForm, max_backlogs: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Application Deadline *</label>
                <input
                  type="datetime-local"
                  required
                  value={driveForm.deadline}
                  onChange={(e) => setDriveForm({ ...driveForm, deadline: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Publish Placement Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;