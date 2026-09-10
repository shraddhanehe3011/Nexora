const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { AppError, success } = require('../utils/helpers');
const { signToken } = require('../middleware/authMiddleware');

function assertDatabaseReady() {
  if (mongoose.connection.readyState !== 1) {
    throw new AppError(
      'Database is not connected. Check Render MONGODB_URI and Atlas Network Access (0.0.0.0/0).',
      503,
      'DB_UNAVAILABLE'
    );
  }
}

async function register(req, res) {
  assertDatabaseReady();
  const { username, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    username,
    email: email.toLowerCase(),
    passwordHash,
  });

  const token = signToken(user);
  return success(
    res,
    {
      token,
      user: user.toSafeObject(),
    },
    201
  );
}

async function login(req, res) {
  assertDatabaseReady();
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = signToken(user);
  return success(res, {
    token,
    user: user.toSafeObject(),
  });
}

async function me(req, res) {
  return success(res, { user: req.user.toSafeObject() });
}

async function logout(req, res) {
  // Stateless JWT — client discards token
  return success(res, { message: 'Logged out successfully' });
}

module.exports = { register, login, me, logout };
