const jwt = require('jsonwebtoken');
const roles = require('../helpers/roleAccess');
const { responseMessage } = require('../helpers/response');
const model = require('../models');

module.exports = function (req, res, next) {
  const authorization = req.headers.authorization;

  if (authorization === undefined) {
    return res.status(401).json(responseMessage(401));
  }

  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedToken) => {
    if (err) {
      return res.status(401).json(responseMessage(401));
    }

    const user = await model.User.findById(decodedToken.id);
    if ( ! user) {
      return res.status(401).json(responseMessage(401));
    }

    const userRole = roles[user.role || 'admin'];
    const userAccess = userRole.role_access;
    const verifyAccess = userAccess.length > 0
      ? userAccess.find(route => 
          (route.path === req.route.path ) && (route.method.length > 0 ? route.method.includes(req.method) : true)
        )
      : true;

    if ( ! verifyAccess) {
      return res.status(401).json(responseMessage(401));
    }

    req.user = user;
    const refreshTokens = await model.RefreshToken.find({ user: user.id });
    req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);

    return next();
  });
};
