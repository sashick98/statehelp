const express = require('express');
const router = express.Router();
const {
  getHelplines,
  getHelplineById,
  createHelpline,
  updateHelpline,
  deleteHelpline,
} = require('../controllers/helplineController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// Public routes
router.get('/', getHelplines);
router.get('/:id', getHelplineById);

// Admin-only management routes
router.post('/admin', protect, restrictTo('admin'), createHelpline);
router.patch('/admin/:id', protect, restrictTo('admin'), updateHelpline);
router.delete('/admin/:id', protect, restrictTo('admin'), deleteHelpline);

module.exports = router;
