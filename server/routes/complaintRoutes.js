const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  trackPublicComplaint,
} = require('../controllers/complaintController');
const { createComplaintValidator } = require('../validators/complaintValidator');
const { protect } = require('../middleware/authMiddleware');

// Public tracking lookup by reference ID (data minimized)
router.get('/track/:referenceId', trackPublicComplaint);

// Protected Citizen routes
router.post('/', protect, createComplaintValidator, createComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/:id', protect, getComplaintById);

module.exports = router;
