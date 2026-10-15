const express = require('express');
const router = express.Router();
const {
  getAllComplaints,
  assignOfficer,
  updateComplaintStatus,
  getComplaintHistory,
  getReportsSummary,
} = require('../controllers/adminController');
const { updateStatusValidator } = require('../validators/complaintValidator');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// All admin routes require authentication and officer or admin role
router.use(protect);
router.use(restrictTo('admin', 'officer'));

router.get('/complaints', getAllComplaints);
router.patch('/complaints/:id/assign', restrictTo('admin'), assignOfficer);
router.patch('/complaints/:id/status', updateStatusValidator, updateComplaintStatus);
router.get('/complaints/:id/history', getComplaintHistory);
router.get('/reports/summary', getReportsSummary);

module.exports = router;
