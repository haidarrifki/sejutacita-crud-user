const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const model = require('../models');

const randomTokenString = () => {
  return crypto.randomBytes(40).toString('base64');
}

exports.generateJwtToken = (user) => {
  return jwt.sign(
    { sub: user._id, id: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_LIFE }
  );
}

exports.generateRefreshToken = async (user, ipAddress) => {
  // create a refresh token that expires in 7 days
  const refreshToken = await model.RefreshToken.create({
      user: user.id,
      token: randomTokenString(),
      expires: new Date(Date.now() + 7*24*60*60*1000),
      createdByIp: ipAddress
  });

  return refreshToken;
}

exports.getRefreshToken = async (token) => {
  const refreshToken = await model.RefreshToken.findOne({ token }).populate('user');
  if ( ! refreshToken || ! refreshToken.isActive) return null;
  return refreshToken;
}

exports.setTokenCookie = (res, token) => {
  // create http only cookie with refresh token that expires in 7 days
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7*24*60*60*1000)
  };

  return res.cookie('refreshToken', token, cookieOptions);
}