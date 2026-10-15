const { check, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const createComplaintValidator = [
  check('departmentId')
    .notEmpty()
    .withMessage('Department selection is required')
    .isMongoId()
    .withMessage('Invalid department identifier format'),
  check('district')
    .trim()
    .notEmpty()
    .withMessage('District in Tamil Nadu is required'),
  check('category')
    .trim()
    .notEmpty()
    .withMessage('Complaint category is required'),
  check('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject line is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  check('description')
    .trim()
    .notEmpty()
    .withMessage('Detailed grievance description is required')
    .isLength({ min: 20, max: 3000 })
    .withMessage('Description must be between 20 and 3000 characters for adequate investigation'),
  check('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Emergency'])
    .withMessage('Invalid priority level'),
  validate,
];

const updateStatusValidator = [
  check('status')
    .notEmpty()
    .withMessage('New status is required')
    .isIn([
      'Submitted',
      'Acknowledged',
      'Assigned',
      'In Progress',
      'Resolved',
      'Closed',
      'Reopened',
    ])
    .withMessage('Invalid status code provided'),
  check('publicMessage')
    .trim()
    .notEmpty()
    .withMessage('A public message explaining the action to the citizen is required')
    .isLength({ min: 5 })
    .withMessage('Public update message must be at least 5 characters long'),
  check('internalNote')
    .optional()
    .trim(),
  validate,
];

module.exports = { createComplaintValidator, updateStatusValidator };
