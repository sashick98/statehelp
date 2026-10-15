const Helpline = require('../models/Helpline');

// @desc    Get all published helplines with optional filters and search
// @route   GET /api/helplines
// @access  Public
const getHelplines = async (req, res, next) => {
  try {
    const { category, search, departmentId } = req.query;

    const query = { isPublished: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { titleTamil: regex },
        { description: regex },
        { phoneNumber: regex },
      ];
    }

    const helplines = await Helpline.find(query)
      .populate('departmentId', 'name nameTamil code')
      .sort({ category: 1, title: 1 });

    res.status(200).json({
      success: true,
      count: helplines.length,
      helplines,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single helpline by ID
// @route   GET /api/helplines/:id
// @access  Public
const getHelplineById = async (req, res, next) => {
  try {
    const helpline = await Helpline.findById(req.params.id)
      .populate('departmentId', 'name nameTamil code');

    if (!helpline || !helpline.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Helpline contact not found or not currently published.',
      });
    }

    res.status(200).json({
      success: true,
      helpline,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new helpline contact
// @route   POST /api/admin/helplines
// @access  Private (Admin)
const createHelpline = async (req, res, next) => {
  try {
    const helpline = await Helpline.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Helpline contact created successfully',
      helpline,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update helpline contact
// @route   PATCH /api/admin/helplines/:id
// @access  Private (Admin)
const updateHelpline = async (req, res, next) => {
  try {
    const helpline = await Helpline.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastVerifiedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!helpline) {
      return res.status(404).json({
        success: false,
        message: 'Helpline not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Helpline contact updated successfully',
      helpline,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or archive helpline contact
// @route   DELETE /api/admin/helplines/:id
// @access  Private (Admin)
const deleteHelpline = async (req, res, next) => {
  try {
    const helpline = await Helpline.findByIdAndDelete(req.params.id);

    if (!helpline) {
      return res.status(404).json({
        success: false,
        message: 'Helpline not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Helpline record removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHelplines,
  getHelplineById,
  createHelpline,
  updateHelpline,
  deleteHelpline,
};
