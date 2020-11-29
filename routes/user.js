const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const userHandler = require('../handlers/user');

router.post('/users/auth', userHandler.authenticate);
router.get('/users/:userId/refresh_tokens', authMiddleware, userHandler.refreshTokenUser);
router.post('/users/refresh_token', authMiddleware, userHandler.refreshToken);
router.post('/users/revoke_token', authMiddleware, userHandler.revokeToken);
router.route('/users')
  .get(authMiddleware, userHandler.getAll)
  .post(authMiddleware, userHandler.create);

router.route('/users/:userId')
  .get(authMiddleware, userHandler.getById)
  .patch(authMiddleware, userHandler.update)
  .delete(authMiddleware, userHandler.delete);

module.exports = router;