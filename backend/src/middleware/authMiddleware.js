const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { AppError, asyncHandler } = require('../utils/helpers');

const authMiddleware = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Authentication token is invalid', 401, 'INVALID_TOKEN');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw new AppError('User not found', 401, 'UNAUTHORIZED');
  }

  req.user = user;
  next();
});

const requireProfileCompleted = (req, res, next) => {
  if (!req.user?.profileCompleted) {
    return next(
      new AppError(
        'Please complete personalization before accessing this resource',
        403,
        'PROFILE_INCOMPLETE'
      )
    );
  }
  return next();
};

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

module.exports = { authMiddleware, requireProfileCompleted, signToken };
