const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

router.get('/', getDepartments);
router.post('/admin', protect, restrictTo('admin'), createDepartment);
router.patch('/admin/:id', protect, restrictTo('admin'), updateDepartment);

module.exports = router;
