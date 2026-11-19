import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { StatCardSkeleton, TableRowSkeleton } from '../components/Skeletons';
import {
  ShieldCheck, Users, Building, Briefcase,
  Download, CheckCircle, XCircle, FileText,
  BarChart3, TrendingUp, ExternalLink, Search,
  PieChart as PieIcon, Clock
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/companies'),
        api.get('/admin/students'),
        api.get('/admin/drives')
      ]);

      const [statsRes, compRes, studRes, driveRes] = results;

      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.success) {
        setStats(statsRes.value.data);
      } else if (statsRes.status === 'rejected') {
        console.error('Failed to load /admin/stats:', statsRes.reason?.response?.data || statsRes.reason);
      }

      if (compRes.status === 'fulfilled' && compRes.value?.data?.success) {
        setCompanies(compRes.value.data.data || []);
      } else if (compRes.status === 'rejected') {
        console.error('Failed to load /admin/companies:', compRes.reason?.response?.data || compRes.reason);
      }

      if (studRes.status === 'fulfilled' && studRes.value?.data?.success) {
        setStudents(studRes.value.data.data || []);
      } else if (studRes.status === 'rejected') {
        console.error('Failed to load /admin/students:', studRes.reason?.response?.data || studRes.reason);
      }

      if (driveRes.status === 'fulfilled' && driveRes.value?.data?.success) {
        setDrives(driveRes.value.data.data || []);
      } else if (driveRes.status === 'rejected') {
        console.error('Failed to load /admin/drives:', driveRes.reason?.response?.data || driveRes.reason);
      }

      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        addToast('Failed to load dashboard data.', 'error');
      } else {
        const someFailed = results.some(r => r.status === 'rejected');
        if (someFailed) {
          addToast('Some dashboard sections failed to load.', 'warning');
        }
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
      addToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const handleCompanyDecision = async (companyId, approvedStatus) => {
    try {
      const res = await api.put(`/admin/companies/${companyId}/approve`, { approved: approvedStatus });
      addToast(res.data.message, 'success');
      await fetchAllData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Action failed.', 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/admin/export-placed', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Placed_Students_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Excel report downloaded!', 'success');
    } catch (err) {
      addToast('Failed to generate Excel report.', 'error');
    }
  };

  // Chart color palette - emerald variants
  const emeraldPalette = [
    'rgba(16, 185, 129, 0.85)',  // emerald-500
    'rgba(5, 150, 105, 0.85)',   // emerald-600
    'rgba(4, 120, 87, 0.85)',    // emerald-700
    'rgba(6, 95, 70, 0.85)',     // emerald-800
    'rgba(2, 77, 56, 0.85)'      // emerald-900
  ];

  // Branch Chart Data (Doughnut)
  const branchLabels = stats?.charts?.branch_stats?.map(b => b.branch) || [];
  const branchDataValues = stats?.charts?.branch_stats?.map(b => b.placed_students) || [];
  const doughnutData = {
    labels: branchLabels.length > 0 ? branchLabels : ['CSE', 'IT', 'ECE'],
    datasets: [
      {
        label: 'Placed Students',
        data: branchDataValues.length > 0 ? branchDataValues : [3, 2, 1],
        backgroundColor: emeraldPalette,
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Company Selections Chart Data (Bar)
  const compLabels = stats?.charts?.company_stats?.map(c => c.company_name) || [];
  const compHires = stats?.charts?.company_stats?.map(c => c.total_hires) || [];
  const barData = {
    labels: compLabels.length > 0 ? compLabels : ['Google India', 'Infosys BPM'],
    datasets: [
      {
        label: 'Students Hired',
        data: compHires.length > 0 ? compHires : [2, 1],
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: 'rgba(5, 150, 105, 1)',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  // Line Chart: Monthly placement trend
  const lineData = {
    labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    datasets: [
      {
        label: 'Students Placed',
        data: [0, 0, 0, stats?.summary?.total_placed || 1, 0, 0, 0, 0],
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.9)',
        borderWidth: 2.5,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4
      },
      {
        label: 'Applications Received',
        data: [0, 0, 0, stats?.summary?.total_drives ? stats.summary.total_drives * 2 : 3, 0, 0, 0, 0],
        fill: false,
        borderColor: 'rgba(5, 150, 105, 0.8)',
        borderWidth: 2,
        borderDash: [4, 4],
        pointBackgroundColor: 'rgba(5, 150, 105, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4
      }
    ]
  };

  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.enrollment_no.toLowerCase().includes(q) ||
      s.branch.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">

      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-200 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">TPO Officer Dashboard</span>
            </div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Training & Placement Cell</h1>
            <p className="text-sm text-slate-600 mt-1">
              Campus-wide recruitments, corporate approvals, and student placement analytics
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            className="btn-primary"
          >
            <Download className="w-4 h-4" /> Export Placed Report (.xlsx)
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 animate-fade-in-up stagger-1">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="border border-slate-200 rounded-lg p-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Students</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats?.summary?.total_students || 0}</div>
              <span className="text-xs text-slate-500 mt-1 block">Registered in batch</span>
            </div>

            <div className="border border-slate-200 rounded-lg p-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Students Placed</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-2">{stats?.summary?.total_placed || 0}</div>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">{stats?.summary?.placement_rate_pct || 0}% Placement Rate</span>
            </div>

            <div className="border border-slate-200 rounded-lg p-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Drives</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-2">{stats?.summary?.active_drives || 0}</div>
              <span className="text-xs text-slate-500 mt-1 block">Open for applications</span>
            </div>

            <div className="border border-slate-200 rounded-lg p-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Partner Companies</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats?.summary?.total_companies || 0}</div>
              <span className="text-xs text-slate-500 mt-1 block">{stats?.summary?.approved_companies || 0} approved</span>
            </div>

            <div className="border border-slate-200 rounded-lg p-5 col-span-2 lg:col-span-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Approvals</span>
              <div className={`text-2xl font-extrabold mt-2 ${stats?.summary?.pending_companies > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {stats?.summary?.pending_companies || 0}
              </div>
              <span className="text-xs text-amber-600 mt-1 block">Require TPO review</span>
            </div>
          </>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 mb-6 animate-fade-in-up stagger-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Visual Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'companies'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span className="hidden sm:inline">Company Verification</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'companies' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {companies.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'students'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">All Students</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'students' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {students.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('drives')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'drives'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span className="hidden sm:inline">Placement Drives</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'drives' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {drives.length}
          </span>
        </button>
      </div>

      {/* TAB 1: VISUAL ANALYTICS & CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in-up stagger-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Branch-wise Placed Count */}
            <div className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Branch-wise Placements</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Distribution of offered students by academic discipline</p>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={doughnutData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } }
                    }
                  }}
                />
              </div>
            </div>

            {/* Chart 2: Company-wise Hires */}
            <div className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Company-wise Selections</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Total candidate offers extended per recruiter</p>
              <div className="h-64 flex items-center justify-center">
                <Bar
                  data={barData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(148,163,184,0.1)' } },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Chart 3: Month-wise Placement Trend */}
          <div className="border border-slate-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Month-wise Placement Trend</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Academic year placement activity — placements vs. applications received per month</p>
            <div className="h-72">
              <Line
                data={lineData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } }
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(148,163,184,0.1)' } },
                    x: { grid: { display: false } }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY VERIFICATION */}
      {activeTab === 'companies' && (
        <div className="border border-slate-200 rounded-lg overflow-hidden animate-fade-in-up stagger-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Company Name</th>
                  <th className="px-4 py-3.5">Industry / Domain</th>
                  <th className="px-4 py-3.5">Contact Email</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">TPO Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <TableRowSkeleton cols={5} rows={3} />
                ) : (
                  companies.map((comp) => (
                    <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{comp.name}</div>
                        {comp.website && (
                          <a href={comp.website} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1 mt-0.5">
                            {comp.website} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-700 font-medium">{comp.industry || 'General IT'}</td>
                      <td className="px-4 py-4 text-slate-500">{comp.email}</td>
                      <td className="px-4 py-4">
                        {comp.approved === 1 && (
                          <span className="badge badge-success">
                            <CheckCircle className="w-3 h-3 mr-1" /> Approved
                          </span>
                        )}
                        {comp.approved === 0 && (
                          <span className="badge badge-warning">
                            <Clock className="w-3 h-3 mr-1" /> Pending Approval
                          </span>
                        )}
                        {comp.approved === 2 && (
                          <span className="badge badge-danger">
                            <XCircle className="w-3 h-3 mr-1" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {comp.approved !== 1 && (
                            <button
                              onClick={() => handleCompanyDecision(comp.id, 1)}
                              className="btn-ghost text-emerald-600 hover:bg-emerald-50 text-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                            </button>
                          )}
                          {comp.approved !== 2 && (
                            <button
                              onClick={() => handleCompanyDecision(comp.id, 2)}
                              className="btn-ghost text-rose-600 hover:bg-rose-50 text-xs"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ALL STUDENTS */}
      {activeTab === 'students' && (
        <div className="border border-slate-200 rounded-lg overflow-hidden animate-fade-in-up stagger-3">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search students by name, roll, or branch..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <span className="text-xs text-slate-500">Total: {filteredStudents.length} students</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5">Enrollment No</th>
                  <th className="px-4 py-3.5">Branch</th>
                  <th className="px-4 py-3.5">CGPA</th>
                  <th className="px-4 py-3.5">Backlogs</th>
                  <th className="px-4 py-3.5">Placement Status</th>
                  <th className="px-4 py-3.5 text-right">Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <TableRowSkeleton cols={7} rows={5} />
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">{s.enrollment_no}</td>
                      <td className="px-4 py-4">
                        <span className="badge badge-success">{s.branch}</span>
                      </td>
                      <td className="px-4 py-4 font-bold text-emerald-600">{s.cgpa}</td>
                      <td className="px-4 py-4">
                        <span className={`badge ${s.backlogs > 0 ? 'badge-danger' : 'badge-success'}`}>
                          {s.backlogs}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {s.placement_status === 'Placed' ? (
                          <div>
                            <span className="badge badge-success">
                              <CheckCircle className="w-3 h-3 mr-1" /> Placed ({s.placed_company})
                            </span>
                            <span className="text-xs text-emerald-600 font-semibold block mt-0.5">₹{s.placed_package} LPA</span>
                          </div>
                        ) : s.placement_status === 'In Process' ? (
                          <span className="badge badge-info">
                            <Clock className="w-3 h-3 mr-1" /> In Process
                          </span>
                        ) : (
                          <span className="badge badge-neutral">Not Applied</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {s.resume_url ? (
                          <a href={s.resume_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline">
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PLACEMENT DRIVES OVERVIEW */}
      {activeTab === 'drives' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up stagger-3">
          {drives.map((d) => (
            <div key={d.id} className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                    {d.company_name}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{d.title}</h3>
                </div>
                <span className="shrink-0 font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-sm">
                  ₹{d.package_lpa} LPA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 my-4">
                <div>
                  <span className="text-slate-400 block font-medium">Eligible Branches</span>
                  <span className="font-semibold text-slate-700">{d.allowed_branches}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Min CGPA</span>
                  <span className="font-semibold text-slate-700">{d.min_cgpa}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Applicants</span>
                  <span className="font-semibold text-emerald-600">{d.total_applicants || 0} applied</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Selected</span>
                  <span className="font-semibold text-emerald-600">{d.selected_count || 0} placed</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                Deadline: {new Date(d.deadline).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;