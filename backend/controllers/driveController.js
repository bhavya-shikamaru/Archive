const { pool } = require('../config/db');
const { checkEligibility } = require('../services/eligibility');

const getAllDrives = async (req, res, next) => {
  try {
    const { search, branch, min_cgpa, status, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['c.approved = 1'];
    const params = [];

    if (search) {
      conditions.push('(d.title LIKE ? OR c.name LIKE ? OR d.description LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (branch) {
      conditions.push('(FIND_IN_SET(?, d.allowed_branches) > 0 OR d.allowed_branches LIKE ?)');
      params.push(branch.trim().toUpperCase(), `%${branch.trim().toUpperCase()}%`);
    }

    if (min_cgpa) {
      conditions.push('d.min_cgpa <= ?');
      params.push(parseFloat(min_cgpa));
    }

    if (status) {
      conditions.push('d.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM drives d
       JOIN companies c ON d.company_id = c.id
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [drives] = await pool.query(
      `SELECT d.*, c.name AS company_name, c.website AS company_website, c.industry
       FROM drives d
       JOIN companies c ON d.company_id = c.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      data: drives
    });
  } catch (error) {
    next(error);
  }
};

const getEligibleDrives = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please complete your profile.'
      });
    }

    const student = students[0];

    const [drives] = await pool.query(
      `SELECT d.*, c.name AS company_name, c.approved AS company_approved,
              a.id AS application_id, a.status AS application_status
       FROM drives d
       JOIN companies c ON d.company_id = c.id
       LEFT JOIN applications a ON d.id = a.drive_id AND a.student_id = ?
       WHERE d.status = 'open' AND c.approved = 1 AND d.deadline >= NOW()
       ORDER BY d.created_at DESC`,
      [student.id]
    );

    const eligibleDrives = [];
    const otherDrives = [];

    for (const drive of drives) {
      const evaluation = checkEligibility(student, drive);
      const enrichedDrive = {
        ...drive,
        is_eligible: evaluation.isEligible,
        eligibility_reasons: evaluation.reasons,
        has_applied: !!drive.application_id
      };

      if (evaluation.isEligible) {
        eligibleDrives.push(enrichedDrive);
      } else {
        otherDrives.push(enrichedDrive);
      }
    }

    return res.status(200).json({
      success: true,
      student_profile: {
        name: student.name,
        branch: student.branch,
        cgpa: student.cgpa,
        backlogs: student.backlogs,
        has_resume: !!student.resume_url
      },
      eligible_drives: eligibleDrives,
      all_open_drives: [...eligibleDrives, ...otherDrives]
    });
  } catch (error) {
    next(error);
  }
};

const getDriveById = async (req, res, next) => {
  try {
    const driveId = parseInt(req.params.id, 10);

    const [drives] = await pool.query(
      `SELECT d.*, c.name AS company_name, c.industry, c.website, c.approved AS company_approved
       FROM drives d
       JOIN companies c ON d.company_id = c.id
       WHERE d.id = ?`,
      [driveId]
    );

    if (drives.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.'
      });
    }

    const [rounds] = await pool.query(
      'SELECT * FROM rounds WHERE drive_id = ? ORDER BY round_no ASC',
      [driveId]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...drives[0],
        rounds
      }
    });
  } catch (error) {
    next(error);
  }
};

const createDrive = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description, package_lpa, min_cgpa, allowed_branches, max_backlogs, deadline } = req.body;

    const [companies] = await pool.query(
      'SELECT id, approved FROM companies WHERE user_id = ?',
      [userId]
    );

    if (companies.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only registered companies can create placement drives.'
      });
    }

    const company = companies[0];

    if (company.approved !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Your company profile is awaiting approval from the TPO Admin. You cannot create drives until approved.'
      });
    }

    if (!title || !package_lpa || !allowed_branches || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, package LPA, allowed branches, and deadline are required fields.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO drives (company_id, title, description, package_lpa, min_cgpa, allowed_branches, max_backlogs, deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        company.id,
        title.trim(),
        description || '',
        parseFloat(package_lpa) || 0.0,
        parseFloat(min_cgpa) || 0.0,
        allowed_branches.trim().toUpperCase(),
        parseInt(max_backlogs || 0, 10),
        new Date(deadline)
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Placement drive created successfully.',
      drive_id: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

const updateDrive = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const driveId = parseInt(req.params.id, 10);
    const { title, description, package_lpa, min_cgpa, allowed_branches, max_backlogs, deadline, status } = req.body;

    const [companies] = await pool.query('SELECT id FROM companies WHERE user_id = ?', [userId]);
    const companyId = companies[0]?.id;

    const [drives] = await pool.query(
      'SELECT id FROM drives WHERE id = ? AND company_id = ?',
      [driveId, companyId]
    );

    if (drives.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found or unauthorized.'
      });
    }

    const updates = [];
    const values = [];

    if (title) { updates.push('title = ?'); values.push(title.trim()); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (package_lpa !== undefined) { updates.push('package_lpa = ?'); values.push(parseFloat(package_lpa)); }
    if (min_cgpa !== undefined) { updates.push('min_cgpa = ?'); values.push(parseFloat(min_cgpa)); }
    if (allowed_branches) { updates.push('allowed_branches = ?'); values.push(allowed_branches.trim().toUpperCase()); }
    if (max_backlogs !== undefined) { updates.push('max_backlogs = ?'); values.push(parseInt(max_backlogs, 10)); }
    if (deadline) { updates.push('deadline = ?'); values.push(new Date(deadline)); }
    if (status && ['open', 'closed'].includes(status)) { updates.push('status = ?'); values.push(status); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(driveId);

    await pool.query(
      `UPDATE drives SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return res.status(200).json({
      success: true,
      message: 'Drive details updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const deleteDrive = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const driveId = parseInt(req.params.id, 10);

    const [companies] = await pool.query('SELECT id FROM companies WHERE user_id = ?', [userId]);
    const companyId = companies[0]?.id;

    const [result] = await pool.query(
      'DELETE FROM drives WHERE id = ? AND company_id = ?',
      [driveId, companyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found or unauthorized.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Drive deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const applyDrive = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const driveId = parseInt(req.params.id, 10);

    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please complete profile before applying.'
      });
    }

    const student = students[0];

    const [drives] = await pool.query(
      `SELECT d.*, c.name AS company_name, c.approved AS company_approved
       FROM drives d
       JOIN companies c ON d.company_id = c.id
       WHERE d.id = ?`,
      [driveId]
    );

    if (drives.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.'
      });
    }

    const drive = drives[0];

    const evaluation = checkEligibility(student, drive);
    if (!evaluation.isEligible) {
      return res.status(400).json({
        success: false,
        message: 'You are not eligible to apply for this drive.',
        reasons: evaluation.reasons
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM applications WHERE drive_id = ? AND student_id = ?',
      [driveId, student.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this placement drive.'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO applications (drive_id, student_id, status) VALUES (?, ?, ?)',
      [driveId, student.id, 'applied']
    );

    return res.status(201).json({
      success: true,
      message: `Successfully applied to ${drive.title} at ${drive.company_name}!`,
      application_id: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this drive.'
      });
    }
    next(error);
  }
};

module.exports = {
  getAllDrives,
  getEligibleDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
  applyDrive
};
