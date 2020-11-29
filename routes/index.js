const express = require('express');
const router = express.Router();

const userRoutes = require('./user');

router.use(userRoutes);
router.all('*', (req, res) => {
  return res.status(404).json({ message: 'no route and no API found with those values' });
});

module.exports = router;