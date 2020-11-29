const pagination = require('../helpers/pagination');
const { responseMessage, responseData } = require('../helpers/response');
const { hash, verify } = require('../helpers/encryption');
const { generateJwtToken, generateRefreshToken, getRefreshToken, setTokenCookie } = require('../helpers/token');
const Role = require('../helpers/roleConstant');

const model = require('../models');

exports.getAll = async (req, res) => {
  try {
    const {
      size,
      page
    } = req.query;

    const count = await model.User.countDocuments();
    const offset = parseInt(size) * (parseInt(page) - 1);

    const rows = await model.User.find()
      .skip(offset)
      .limit(parseInt(size))
      .sort();

    const paginationResponse = await pagination(size, page, count, '/users?', rows);

    return res.json(paginationResponse);
  }
  catch (err) {
    console.log(err);
    return res.status(500).json(responseMessage(500));
  }
}

exports.getById = async (req, res) => {
  try {
    const { userId } = req.params;
    // users can get their own record and admins can get any record
    if (userId !== req.user.id && req.user.role !== Role.Admin) {
      return res.status(401).json(responseMessage(401));
    }

    const user = await model.User.findById(userId);
    if ( ! user) {
      return res.status(404).json(responseMessage(404));
    }

    return res.json(responseData(user));
  }
  catch (err) {
    console.log(err);
    return res.status(500).json(responseMessage(500));
  }
}

exports.create = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role,
      username,
      password,
      address
    } = req.body;

    if (firstName === undefined || lastName === undefined || email === undefined || username === undefined || password === undefined || address === undefined || role === undefined) {
      return res.status(422).json(responseMessage(422));
    }

    const passwordHash = await hash(password);
    const user = await model.User.create({
      firstName,
      lastName,
      email,
      role,
      username,
      password: passwordHash,
      address
    });

    return res.status(201).json(responseData(user));
  }
  catch (err) {
    if (err.code === 11000) {
      let message;

      if (err.keyPattern.email !== undefined) {
        message = 'Email already exist';
      }
      else if (err.keyPattern.username !== undefined) {
        message = 'Username already exist';
      }

      return res.status(422).json(responseMessage(422, message));
    }

    console.log(err);
    return res.status(500).json(responseMessage(500));
  }
}

exports.update = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      firstName,
      lastName,
      email,
      role,
      username,
      password,
      address
    } = req.body;

    if (firstName === undefined || lastName === undefined || email === undefined || username === undefined || password === undefined || address === undefined || role === undefined) {
      return res.status(422).json(responseMessage(422));
    }

    const passwordHash = await hash(password);
    const user = await model.User.findByIdAndUpdate(userId, {
      firstName,
      lastName,
      email,
      role,
      username,
      password: passwordHash,
      address
    }, {
      new: true
    });

    if ( ! user) {
      return res.status(404).json(responseMessage(404));
    }

    return res.json(responseData(user));
  }
  catch (err) {
    if (err.code === 11000) {
      let message;

      if (err.keyPattern.email !== undefined) {
        message = 'Email already exist';
      }
      else if (err.keyPattern.username !== undefined) {
        message = 'Username already exist';
      }

      return res.status(422).json(responseMessage(422, message));
    }

    console.log(err);
    return res.status(500).json(responseMessage(500));
  }
}

exports.delete = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await model.User.findByIdAndDelete(userId);

    if ( ! user) {
      return res.status(404).json(responseMessage(404));
    }

    return res.status(204).json();
  }
  catch (err) {
    console.log(err);
    return res.status(500).json(responseMessage(500));
  }
}

exports.authenticate = async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip;

    const user = await model.User.findOne({ username });
    if ( ! user) {
      return res.status(404).json(responseMessage(404, 'Incorrect username or password'));
    }

    const passwordMatch = await verify(password, user.password);
    if ( ! passwordMatch) {
      return res.status(404).json(responseMessage(404, 'Incorrect username or password'));
    }

    const jwtToken = await generateJwtToken(user);
    const refreshToken = await generateRefreshToken(user, ipAddress);
    const payloadResponse = Object.assign(user.toObject(), { jwtToken });
    await setTokenCookie(res, refreshToken.token);

    return res.json(responseData(payloadResponse));
  }
  catch (err) {
    console.log(err);
    return res.status(500).json(responseMessage(500));
  }
}

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    const ipAddress = req.ip;
    const refreshToken = await getRefreshToken(token);
    if ( ! refreshToken) {
      return res.status(422).json(responseMessage(422, 'Invalid token'));
    }
    const { user } = refreshToken;
    // replace old refresh token with a new one and save
    const newRefreshToken = await generateRefreshToken(user, ipAddress);
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await newRefreshToken.save();

    // generate new jwt
    const jwtToken = await generateJwtToken(user);
    const payloadResponse = Object.assign(user.toObject(), { jwtToken });
    await setTokenCookie(res, newRefreshToken.token);

    return res.json(responseData(payloadResponse));
  }
  catch (err) {
    console.log(err);
    return res.status(500).json(responseMessage(500));
  }
}

exports.revokeToken = async (req, res) => {
  try {
    // accept token from request body or cookie
    const token = req.body.token || req.cookies.refreshToken;
    const ipAddress = req.ip;
    if ( ! token) {
      return res.status(422).json(responseMessage(422, 'Token is required'));
    }

    // users can revoke their own tokens and admins can revoke any tokens
    if ( ! req.user.ownsToken(token) && req.user.role !== Role.Admin) {
      return res.status(401).json(responseMessage(401));
    }
    const refreshToken = await getRefreshToken(token);
    if ( ! refreshToken) {
      return res.status(422).json(responseMessage(422, 'Invalid token'));
    }
    // revoke token and save
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();

    return res.json(responseMessage(200, 'Token revoked'));
  }
  catch (err) {
    console.log(err);
    return res.status(500).json(responseMessage(500));
  }
}

exports.refreshTokenUser = async (req, res) => {
  try {
    const { userId } = req.params;
    // users can get their own record and admins can get any record
    if (userId !== req.user.id && req.user.role !== Role.Admin) {
      return res.status(401).json(responseMessage(401));
    }

    const refreshTokens = await model.RefreshToken.find({ user: userId });

    return res.json(responseData(refreshTokens));
  }
  catch (err) {
    console.log(err);
    return res.status(500).json(responseMessage(500));
  }
}