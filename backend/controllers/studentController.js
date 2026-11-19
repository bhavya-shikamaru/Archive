const { pool } = require('../config/db');
const { uploadToCloudinary } = require('../services/cloudUpload');

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [students] = await pool.query(
      `SELECT s.*, u.email
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ?`,
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: students[0]
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, branch, cgpa, backlogs, skills } = req.body;

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (branch) {
      updates.push('branch = ?');
      values.push(branch.trim().toUpperCase());
    }
    if (cgpa !== undefined) {
      updates.push('cgpa = ?');
      values.push(parseFloat(cgpa) || 0.0);
    }
    if (backlogs !== undefined) {
      updates.push('backlogs = ?');
      values.push(parseInt(backlogs, 10) || 0);
    }
    if (skills !== undefined) {
      updates.push('skills = ?');
      values.push(skills.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update.'
      });
    }

    values.push(userId);

    await pool.query(
      `UPDATE students SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    const [updated] = await pool.query(
      `SELECT s.*, u.email
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ?`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

const uploadResume = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid PDF resume file to upload.'
      });
    }

    let resumeUrl = `/uploads/resumes/${req.file.filename}`;

    // Upload to Cloudinary if configured for persistent storage
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const cloudUrl = await uploadToCloudinary(req.file.path, req.file.originalname);
      if (cloudUrl) {
        resumeUrl = cloudUrl;
      }
    }

    await pool.query(
      'UPDATE students SET resume_url = ? WHERE user_id = ?',
      [resumeUrl, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully.',
      resume_url: resumeUrl
    });
  } catch (error) {
    next(error);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    const studentId = students[0].id;

    const [applications] = await pool.query(
      `SELECT
        a.id AS application_id,
        a.status AS application_status,
        a.applied_at,
        d.id AS drive_id,
        d.title AS drive_title,
        d.package_lpa,
        d.deadline,
        c.name AS company_name,
        c.website AS company_website,
        c.industry
       FROM applications a
       JOIN drives d ON a.drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       WHERE a.student_id = ?
       ORDER BY a.applied_at DESC`,
      [studentId]
    );

    for (const app of applications) {
      const [rounds] = await pool.query(
        `SELECT
          r.round_no,
          r.round_name,
          r.round_date,
          rr.result,
          rr.feedback
         FROM rounds r
         LEFT JOIN round_results rr ON r.id = rr.round_id AND rr.application_id = ?
         WHERE r.drive_id = ?
         ORDER BY r.round_no ASC`,
        [app.application_id, app.drive_id]
      );
      app.rounds = rounds;
    }

    return res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadResume,
  getMyApplications
};
