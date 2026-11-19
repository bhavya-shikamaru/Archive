const { pool } = require('../config/db');
const xlsx = require('xlsx');

/**
 * Controller: Get placement analytics, counts, and chart data
 * GET /admin/stats
 */
const getStats = async (req, res, next) => {
  try {
    // 1. Overall counts
    const [studentCount] = await pool.query('SELECT COUNT(*) AS total FROM students');
    const [companyCount] = await pool.query(
      `SELECT 
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN approved = 0 THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END), 0) AS approved
       FROM companies`
    );
    const [driveCount] = await pool.query(
      `SELECT 
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0) AS active
       FROM drives`
    );
    const [placedCount] = await pool.query(
      "SELECT COUNT(DISTINCT student_id) AS total FROM applications WHERE status = 'selected'"
    );

    const totalStudents = studentCount[0]?.total || 0;
    const totalPlaced = placedCount[0]?.total || 0;
    const placementRate = totalStudents > 0 ? ((totalPlaced / totalStudents) * 100).toFixed(1) : 0;

    // 2. Branch-wise placement statistics (For Pie/Doughnut Chart)
    const [branchStats] = await pool.query(
      `SELECT 
        s.branch,
        COUNT(DISTINCT s.id) AS total_students,
        COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN s.id END) AS placed_students,
        ROUND((COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN s.id END) / COUNT(DISTINCT s.id)) * 100, 1) AS placement_pct
       FROM students s
       LEFT JOIN applications a ON s.id = a.student_id
       GROUP BY s.branch
       ORDER BY placed_students DESC`
    );

    // 3. Company-wise selections (For Bar Chart)
    const [companyStats] = await pool.query(
      `SELECT 
        c.name AS company_name,
        COUNT(a.id) AS total_hires,
        AVG(d.package_lpa) AS avg_package_lpa
       FROM applications a
       JOIN drives d ON a.drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       WHERE a.status = 'selected'
       GROUP BY c.id, c.name
       ORDER BY total_hires DESC
       LIMIT 10`
    );

    return res.status(200).json({
      success: true,
      summary: {
        total_students: totalStudents,
        total_placed: totalPlaced,
        placement_rate_pct: parseFloat(placementRate),
        total_companies: companyCount[0]?.total || 0,
        pending_companies: companyCount[0]?.pending || 0,
        approved_companies: companyCount[0]?.approved || 0,
        total_drives: driveCount[0]?.total || 0,
        active_drives: driveCount[0]?.active || 0
      },
      charts: {
        branch_stats: branchStats,
        company_stats: companyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get all registered companies with approval status
 * GET /admin/companies
 */
const getCompanies = async (req, res, next) => {
  try {
    const { status } = req.query; // 'pending', 'approved', 'rejected'
    let query = `
      SELECT 
        c.*, 
        u.email,
        (SELECT COUNT(*) FROM drives d WHERE d.company_id = c.id) AS drives_posted
      FROM companies c
      JOIN users u ON c.user_id = u.id
    `;
    const params = [];

    if (status === 'pending') {
      query += ' WHERE c.approved = 0';
    } else if (status === 'approved') {
      query += ' WHERE c.approved = 1';
    } else if (status === 'rejected') {
      query += ' WHERE c.approved = 2';
    }

    query += ' ORDER BY c.created_at DESC';

    const [companies] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Approve or Reject a company account
 * PUT /admin/companies/:id/approve
 */
const approveCompany = async (req, res, next) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    const { approved } = req.body; // 1 = Approved, 2 = Rejected

    if (![1, 2].includes(Number(approved))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval status. Must be 1 (Approved) or 2 (Rejected).'
      });
    }

    const [result] = await pool.query(
      'UPDATE companies SET approved = ? WHERE id = ?',
      [Number(approved), companyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    const actionText = Number(approved) === 1 ? 'approved' : 'rejected';

    return res.status(200).json({
      success: true,
      message: `Company account has been ${actionText} successfully.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get all registered students with placement status
 * GET /admin/students
 */
const getAllStudents = async (req, res, next) => {
  try {
    const [students] = await pool.query(
      `SELECT 
        s.*,
        u.email,
        CASE 
          WHEN EXISTS (SELECT 1 FROM applications a WHERE a.student_id = s.id AND a.status = 'selected') THEN 'Placed'
          WHEN EXISTS (SELECT 1 FROM applications a WHERE a.student_id = s.id) THEN 'In Process'
          ELSE 'Not Applied'
        END AS placement_status,
        (SELECT c.name FROM applications a 
         JOIN drives d ON a.drive_id = d.id 
         JOIN companies c ON d.company_id = c.id 
         WHERE a.student_id = s.id AND a.status = 'selected' LIMIT 1) AS placed_company,
        (SELECT d.package_lpa FROM applications a 
         JOIN drives d ON a.drive_id = d.id 
         WHERE a.student_id = s.id AND a.status = 'selected' LIMIT 1) AS placed_package
       FROM students s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.cgpa DESC`
    );

    return res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get all drives across all companies
 * GET /admin/drives
 */
const getAllDrives = async (req, res, next) => {
  try {
    const [drives] = await pool.query(
      `SELECT 
        d.*, 
        c.name AS company_name, 
        c.approved AS company_approved,
        (SELECT COUNT(*) FROM applications a WHERE a.drive_id = d.id) AS total_applicants,
        (SELECT COUNT(*) FROM applications a WHERE a.drive_id = d.id AND a.status = 'selected') AS selected_count
       FROM drives d
       JOIN companies c ON d.company_id = c.id
       ORDER BY d.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      data: drives
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Export Placed Students report to Excel (.xlsx)
 * GET /admin/export-placed
 * Complies with Rubric "Export reports to Excel" requirement
 */
const exportPlacedToExcel = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        s.enrollment_no AS 'Enrollment No',
        s.name AS 'Student Name',
        s.branch AS 'Branch',
        s.cgpa AS 'CGPA',
        u.email AS 'Email Address',
        c.name AS 'Placed Company',
        d.title AS 'Job Role',
        d.package_lpa AS 'Package (LPA)',
        a.updated_at AS 'Selection Date'
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN drives d ON a.drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       WHERE a.status = 'selected'
       ORDER BY s.branch ASC, d.package_lpa DESC`
    );

    // Create a new Excel workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(rows);

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Placed Students');

    // Generate buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Placed_Students_Report_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    return res.status(200).send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getCompanies,
  approveCompany,
  getAllStudents,
  getAllDrives,
  exportPlacedToExcel
};
