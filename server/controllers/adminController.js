const Complaint = require('../models/Complaint');
const ComplaintUpdate = require('../models/ComplaintUpdate');
const User = require('../models/User');
const Department = require('../models/Department');

/**
 * Admin & Officer Grievance Management Controller
 * 
 * Supports:
 * - Paginated grievance datatables with district, status, and department filtering.
 * - Officer assignment with automated audit logging.
 * - Status transitions with mandatory explanation for citizens.
 * - Summary reports and resolution analytics.
 */

// @desc    List all complaints with pagination, filtering & search
// @route   GET /api/admin/complaints
// @access  Private (Officer / Admin)
const getAllComplaints = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      departmentId,
      district,
      priority,
      search,
    } = req.query;

    const query = {};

    // If an officer is restricted to their assigned department
    if (req.user.role === 'officer' && req.user.departmentId) {
      query.departmentId = req.user.departmentId;
    } else if (departmentId && departmentId !== 'All') {
      query.departmentId = departmentId;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (district && district !== 'All') {
      query.district = district;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { complaintId: new RegExp(q, 'i') },
        { subject: new RegExp(q, 'i') },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('citizenId', 'name email mobile district')
      .populate('departmentId', 'name nameTamil code icon')
      .populate('assignedOfficerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: complaints.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign grievance to an officer
// @route   PATCH /api/admin/complaints/:id/assign
// @access  Private (Admin / Officer Supervisor)
const assignOfficer = async (req, res, next) => {
  try {
    const { officerId, internalNote } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Grievance record not found.',
      });
    }

    const officer = await User.findById(officerId);
    if (!officer || (officer.role !== 'officer' && officer.role !== 'admin')) {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not an authorized officer.',
      });
    }

    const previousStatus = complaint.status;
    complaint.assignedOfficerId = officer._id;

    // Transition status to Assigned if newly submitted or acknowledged
    if (complaint.status === 'Submitted' || complaint.status === 'Acknowledged') {
      complaint.status = 'Assigned';
    }

    await complaint.save();

    // Record audit update
    await ComplaintUpdate.create({
      complaintId: complaint._id,
      referenceId: complaint.complaintId,
      actorId: req.user._id,
      actorRole: req.user.role,
      previousStatus,
      newStatus: complaint.status,
      publicMessage: `Assigned to department officer (${officer.name}) for investigation.`,
      internalNote: internalNote || `Assigned to officer ID ${officer._id} by ${req.user.name}`,
    });

    res.status(200).json({
      success: true,
      message: `Grievance successfully assigned to Officer ${officer.name}`,
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status with mandatory audit note
// @route   PATCH /api/admin/complaints/:id/status
// @access  Private (Officer / Admin)
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status: newStatus, publicMessage, internalNote } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Grievance record not found.',
      });
    }

    const previousStatus = complaint.status;

    // Apply status change
    complaint.status = newStatus;
    if (newStatus === 'Resolved') {
      complaint.resolvedAt = Date.now();
    } else if (previousStatus === 'Resolved' && newStatus !== 'Resolved') {
      complaint.resolvedAt = null;
    }

    await complaint.save();

    // Create immutable audit trail record
    const auditRecord = await ComplaintUpdate.create({
      complaintId: complaint._id,
      referenceId: complaint.complaintId,
      actorId: req.user._id,
      actorRole: req.user.role,
      previousStatus,
      newStatus,
      publicMessage,
      internalNote: internalNote || '',
    });

    res.status(200).json({
      success: true,
      message: `Status updated from ${previousStatus} to ${newStatus}`,
      complaint,
      auditRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full audit trail for complaint
// @route   GET /api/admin/complaints/:id/history
// @access  Private (Officer / Admin)
const getComplaintHistory = async (req, res, next) => {
  try {
    const updates = await ComplaintUpdate.find({ complaintId: req.params.id })
      .populate('actorId', 'name role email')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: updates.length,
      history: updates,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard summary statistics & analytics
// @route   GET /api/admin/reports/summary
// @access  Private (Officer / Admin)
const getReportsSummary = async (req, res, next) => {
  try {
    const total = await Complaint.countDocuments();
    const submitted = await Complaint.countDocuments({ status: 'Submitted' });
    const acknowledged = await Complaint.countDocuments({ status: 'Acknowledged' });
    const assigned = await Complaint.countDocuments({ status: 'Assigned' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const closed = await Complaint.countDocuments({ status: 'Closed' });

    // Aggregate by Department
    const byDepartment = await Complaint.aggregate([
      {
        $group: {
          _id: '$departmentId',
          count: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department',
        },
      },
      { $unwind: '$department' },
      {
        $project: {
          departmentId: '$_id',
          name: '$department.name',
          nameTamil: '$department.nameTamil',
          code: '$department.code',
          count: 1,
          resolvedCount: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Aggregate top districts
    const byDistrict = await Complaint.aggregate([
      {
        $group: {
          _id: '$district',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      summary: {
        total,
        pending: submitted + acknowledged + assigned,
        inProgress,
        resolved,
        closed,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      },
      byDepartment,
      byDistrict,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllComplaints,
  assignOfficer,
  updateComplaintStatus,
  getComplaintHistory,
  getReportsSummary,
};
