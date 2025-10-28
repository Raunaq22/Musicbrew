const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// Optional authentication middleware - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        spotifyId: true,
        isPublic: true,
      },
    });

    req.user = user || null;
  } catch (error) {
    req.user = null;
  }
  
  next();
};

module.exports = { optionalAuth };

