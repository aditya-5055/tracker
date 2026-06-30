const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = 'cos_token';

/**
 * protect — Guards private routes.
 *
 * Token lookup order (most-secure first):
 *  1. httpOnly cookie  `cos_token`          ← primary (browser clients)
 *  2. Authorization: Bearer <token>          ← fallback (REST clients / tests)
 */
const protect = async (req, res, next) => {
  let token =
    req.cookies?.[COOKIE_NAME] ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorised — please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'The account linked to this session no longer exists.',
      });
    }

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Not authorised — invalid or expired session.',
    });
  }
};

module.exports = { protect };
