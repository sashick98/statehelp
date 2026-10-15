const Complaint = require('../models/Complaint');
const ComplaintUpdate = require('../models/ComplaintUpdate');
const Department = require('../models/Department');
const { generateComplaintId } = require('../utils/referenceGenerator');

/**
 * Complaint Controller
 * 
 * Demonstrates:
 * 1. Generating unique reference IDs (`TNG-YYYYMMDD-XXXX`).
 * 2. Immutable audit trails with ComplaintUpdate.
 * 3. Object-level authorization (preventing citizens from viewing others' complaints).
 * 4. Safe public status tracking (data minimization).
 */

// @desc    Register a new grievance
// @route   POST /api/complaints
// @access  Private (Citizen)
const createComplaint = async (req, res, next) => {
  try {
    const { departmentId, district, category, subject, description, priority } = req.body;

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department || !department.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected department is invalid or currently inactive.',
      });
    }

    // Generate unique reference ID
    let referenceId = generateComplaintId();
    let collisionCheck = await Complaint.findOne({ complaintId: referenceId });
    while (collisionCheck) {
      referenceId = generateComplaintId();
      collisionCheck = await Complaint.findOne({ complaintId: referenceId });
    }

    // Create complaint document
    const complaint = await Complaint.create({
      complaintId: referenceId,
      citizenId: req.user._id,
      departmentId,
      district,
      category,
      subject,
      description,
      priority: priority || 'Medium',
      status: 'Submitted',
    });

    // Create initial audit trail entry
    await ComplaintUpdate.create({
      complaintId: complaint._id,
      referenceId: complaint.complaintId,
      actorId: req.user._id,
      actorRole: req.user.role,
      previousStatus: 'None',
      newStatus: 'Submitted',
      publicMessage: 'Grievance submitted by citizen. Acknowledgment pending department assignment.',
      internalNote: 'Automated initial intake record created.',
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('departmentId', 'name nameTamil code icon');

    res.status(201).json({
      success: true,
      message: 'Grievance registered successfully',
      complaint: populatedComplaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints belonging to the authenticated citizen
// @route   GET /api/complaints/my
// @access  Private (Citizen)
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ citizenId: req.user._id })
      .populate('departmentId', 'name nameTamil code icon')
      .populate('assignedOfficerId', 'name')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint details with ownership check
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res, next) => {
  try {
    const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId
      ? { _id: req.params.id }
      : { complaintId: req.params.id.toUpperCase() };

    const complaint = await Complaint.findOne(query)
      .populate('citizenId', 'name email mobile district')
      .populate('departmentId', 'name nameTamil code icon')
      .populate('assignedOfficerId', 'name email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Grievance record not found.',
      });
    }

    // Object-Level Authorization Check:
    // Citizens may ONLY view complaints they personally submitted.
    if (
      req.user.role === 'citizen' &&
      complaint.citizenId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view another citizen\'s grievance.',
      });
    }

    // Fetch timeline updates
    const updates = await ComplaintUpdate.find({ complaintId: complaint._id })
      .populate('actorId', 'name role')
      .sort({ createdAt: 1 });

    // Sanitize timeline: citizens must NOT see internal confidential notes
    const sanitizedUpdates = updates.map((u) => {
      const item = {
        id: u._id,
        createdAt: u.createdAt,
        previousStatus: u.previousStatus,
        newStatus: u.newStatus,
        publicMessage: u.publicMessage,
        actorRole: u.actorRole,
      };

      // Expose internal notes only to officers and admins
      if (req.user.role === 'admin' || req.user.role === 'officer') {
        item.internalNote = u.internalNote;
        item.actor = u.actorId ? { name: u.actorId.name, role: u.actorId.role } : null;
      }

      return item;
    });

    res.status(200).json({
      success: true,
      complaint,
      timeline: sanitizedUpdates,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Public Status Tracker (Data-minimized public lookup by Reference ID)
// @route   GET /api/complaints/track/:referenceId
// @access  Public
const trackPublicComplaint = async (req, res, next) => {
  try {
    const referenceId = req.params.referenceId.trim().toUpperCase();

    const complaint = await Complaint.findOne({ complaintId: referenceId })
      .populate('departmentId', 'name nameTamil code')
      .select('-description -closureFeedback'); // Protect sensitive personal narrative

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `No grievance found with Reference ID "${referenceId}". Please verify the tracking code.`,
      });
    }

    // Fetch only public messages for this complaint
    const publicUpdates = await ComplaintUpdate.find({ complaintId: complaint._id })
      .select('createdAt previousStatus newStatus publicMessage')
      .sort({ createdAt: 1 });

    // Redact citizen personal identification
    res.status(200).json({
      success: true,
      trackingData: {
        complaintId: complaint.complaintId,
        department: complaint.departmentId,
        district: complaint.district,
        category: complaint.category,
        status: complaint.status,
        submittedAt: complaint.submittedAt,
        resolvedAt: complaint.resolvedAt,
        timeline: publicUpdates,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  trackPublicComplaint,
};
