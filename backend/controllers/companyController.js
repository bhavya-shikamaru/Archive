const { pool } = require('../config/db');
const { sendStatusNotification } = require('../services/emailService');

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [companies] = await pool.query(
      `SELECT c.*, u.email
       FROM companies c
       JOIN users u ON c.user_id = u.id
       WHERE c.user_id = ?`,
      [userId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: companies[0]
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, industry, website } = req.body;

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (industry !== undefined) {
      updates.push('industry = ?');
      values.push(industry.trim());
    }
    if (website !== undefined) {
      updates.push('website = ?');
      values.push(website.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update.'
      });
    }

    values.push(userId);

    await pool.query(
      `UPDATE companies SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    const [updated] = await pool.query(
      'SELECT * FROM companies WHERE user_id = ?',
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Company profile updated.',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

const getMyDrives = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [companies] = await pool.query(
      'SELECT id, approved FROM companies WHERE user_id = ?',
      [userId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    const companyId = companies[0].id;

    const [drives] = await pool.query(
      `SELECT d.*,
        COUNT(a.id) AS total_applicants,
        SUM(CASE WHEN a.status = 'selected' THEN 1 ELSE 0 END) AS selected_count,
        SUM(CASE WHEN a.status = 'shortlisted' THEN 1 ELSE 0 END) AS shortlisted_count
       FROM drives d
       LEFT JOIN applications a ON d.id = a.drive_id
       WHERE d.company_id = ?
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [companyId]
    );

    return res.status(200).json({
      success: true,
      company_approved: companies[0].approved,
      data: drives
    });
  } catch (error) {
    next(error);
  }
};

const getDriveApplicants = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const driveId = parseInt(req.params.id, 10);

    const [companies] = await pool.query('SELECT id FROM companies WHERE user_id = ?', [userId]);
    if (companies.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const companyId = companies[0].id;
    const [drives] = await pool.query('SELECT * FROM drives WHERE id = ? AND company_id = ?', [driveId, companyId]);

    if (drives.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found or access denied.'
      });
    }

    const [applicants] = await pool.query(
      `SELECT
        a.id AS application_id,
        a.status AS application_status,
        a.applied_at,
        s.id AS student_id,
        s.name AS student_name,
        s.enrollment_no,
        s.branch,
        s.cgpa,
        s.backlogs,
        s.skills,
        s.resume_url,
        u.email AS student_email
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE a.drive_id = ?
       ORDER BY a.applied_at DESC`,
      [driveId]
    );

    const [rounds] = await pool.query(
      'SELECT * FROM rounds WHERE drive_id = ? ORDER BY round_no ASC',
      [driveId]
    );

    return res.status(200).json({
      success: true,
      drive: drives[0],
      rounds,
      data: applicants
    });
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const applicationId = parseInt(req.params.id, 10);
    const { status, round_name } = req.body;

    if (!['applied', 'shortlisted', 'rejected', 'selected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: applied, shortlisted, rejected, selected.'
      });
    }

    const [companies] = await pool.query('SELECT id FROM companies WHERE user_id = ?', [userId]);
    if (companies.length === 0) {
      return res.status(403).json({ success: false, message: 'Company account required.' });
    }

    const companyId = companies[0].id;

    const [apps] = await pool.query(
      `SELECT a.id, a.student_id, a.drive_id, d.title AS drive_title, c.name AS company_name,
              s.name AS student_name, u.email AS student_email
       FROM applications a
       JOIN drives d ON a.drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE a.id = ? AND d.company_id = ?`,
      [applicationId, companyId]
    );

    if (apps.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized to modify.'
      });
    }

    const targetApp = apps[0];

    await pool.query(
      'UPDATE applications SET status = ? WHERE id = ?',
      [status, applicationId]
    );

    if (['shortlisted', 'selected', 'rejected'].includes(status)) {
      sendStatusNotification({
        toEmail: targetApp.student_email,
        studentName: targetApp.student_name,
        driveTitle: targetApp.drive_title,
        companyName: targetApp.company_name,
        status,
        roundName: round_name || null
      }).catch(err => console.error('Notification dispatch error:', err));
    }

    return res.status(200).json({
      success: true,
      message: `Application status updated to ${status}. Notification dispatched.`,
      status
    });
  } catch (error) {
    next(error);
  }
};

const addRound = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const driveId = parseInt(req.params.id, 10);
    const { round_no, round_name, round_date } = req.body;

    if (!round_name) {
      return res.status(400).json({
        success: false,
        message: 'Round name is required.'
      });
    }

    const [companies] = await pool.query('SELECT id FROM companies WHERE user_id = ?', [userId]);
    const companyId = companies[0]?.id;

    const [drives] = await pool.query(
      'SELECT id FROM drives WHERE id = ? AND company_id = ?',
      [driveId, companyId]
    );

    if (drives.length === 0) {
      return res.status(404).json({ success: false, message: 'Drive not found or unauthorized.' });
    }

    let calculatedRoundNo = round_no;
    if (!calculatedRoundNo) {
      const [existing] = await pool.query(
        'SELECT COALESCE(MAX(round_no), 0) + 1 AS next_round FROM rounds WHERE drive_id = ?',
        [driveId]
      );
      calculatedRoundNo = existing[0].next_round;
    }

    const [result] = await pool.query(
      'INSERT INTO rounds (drive_id, round_no, round_name, round_date) VALUES (?, ?, ?, ?)',
      [driveId, calculatedRoundNo, round_name.trim(), round_date || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Interview round created successfully.',
      round_id: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

const recordRoundResult = async (req, res, next) => {
  try {
    const applicationId = parseInt(req.params.id, 10);
    const { round_id, result, feedback } = req.body;

    if (!round_id || !result || !['pass', 'fail', 'pending'].includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'round_id and valid result (pass, fail, pending) are required.'
      });
    }

    await pool.query(
      `INSERT INTO round_results (application_id, round_id, result, feedback)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE result = VALUES(result), feedback = VALUES(feedback)`,
      [applicationId, round_id, result, feedback || '']
    );

    return res.status(200).json({
      success: true,
      message: 'Round evaluation result recorded.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getMyDrives,
  getDriveApplicants,
  updateApplicationStatus,
  addRound,
  recordRoundResult
};
