const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const register = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { email, password, role, ...profileData } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required.'
      });
    }

    if (!['student', 'company'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Public registration is only available for student or company.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    await connection.beginTransaction();

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [userResult] = await connection.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email.trim().toLowerCase(), passwordHash, role]
    );
    const userId = userResult.insertId;
    let profileId = null;

    if (role === 'student') {
      const { name, enrollment_no, branch, cgpa, backlogs, skills } = profileData;

      if (!name || !enrollment_no || !branch || cgpa === undefined) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Student name, enrollment number, branch, and CGPA are mandatory.'
        });
      }

      const [existingRoll] = await connection.query(
        'SELECT id FROM students WHERE enrollment_no = ?',
        [enrollment_no.trim()]
      );
      if (existingRoll.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Enrollment number is already registered.'
        });
      }

      const [studentRecord] = await connection.query(
        `INSERT INTO students (user_id, name, enrollment_no, branch, cgpa, backlogs, skills)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          name.trim(),
          enrollment_no.trim().toUpperCase(),
          branch.trim().toUpperCase(),
          parseFloat(cgpa) || 0.0,
          parseInt(backlogs || 0, 10),
          skills || ''
        ]
      );
      profileId = studentRecord.insertId;
    } else if (role === 'company') {
      const { name, industry, website } = profileData;

      if (!name) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Company name is required.'
        });
      }

      const [companyRecord] = await connection.query(
        `INSERT INTO companies (user_id, name, industry, website, approved)
         VALUES (?, ?, ?, ?, 0)`,
        [userId, name.trim(), industry || '', website || '']
      );
      profileId = companyRecord.insertId;
    }

    await connection.commit();

    const token = jwt.sign(
      {
        id: userId,
        email: email.trim().toLowerCase(),
        role,
        profileId
      },
      process.env.JWT_SECRET || 'cpms_secure_jwt_secret_token_adwt_2026_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      success: true,
      message: role === 'company'
        ? 'Company registered successfully. Account is pending TPO admin verification.'
        : 'Student registered successfully.',
      token,
      user: {
        id: userId,
        email: email.trim().toLowerCase(),
        role,
        profileId,
        approved: role === 'company' ? 0 : 1
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const [users] = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    let profile = null;
    let profileId = null;

    if (user.role === 'student') {
      const [students] = await pool.query(
        'SELECT id, name, enrollment_no, branch, cgpa, backlogs, skills, resume_url FROM students WHERE user_id = ?',
        [user.id]
      );
      if (students.length > 0) {
        profile = students[0];
        profileId = profile.id;
      }
    } else if (user.role === 'company') {
      const [companies] = await pool.query(
        'SELECT id, name, industry, website, approved FROM companies WHERE user_id = ?',
        [user.id]
      );
      if (companies.length > 0) {
        profile = companies[0];
        profileId = profile.id;
      }
    } else if (user.role === 'admin') {
      profile = { name: 'Placement Officer (TPO)' };
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        profileId,
        name: profile ? profile.name : 'User'
      },
      process.env.JWT_SECRET || 'cpms_secure_jwt_secret_token_adwt_2026_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileId,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const user = users[0];
    let profile = null;

    if (user.role === 'student') {
      const [students] = await pool.query(
        'SELECT * FROM students WHERE user_id = ?',
        [user.id]
      );
      profile = students[0] || null;
    } else if (user.role === 'company') {
      const [companies] = await pool.query(
        'SELECT * FROM companies WHERE user_id = ?',
        [user.id]
      );
      profile = companies[0] || null;
    } else if (user.role === 'admin') {
      profile = { name: 'Training & Placement Officer (Admin)' };
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};
