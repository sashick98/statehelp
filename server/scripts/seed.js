require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Department = require('../models/Department');
const Helpline = require('../models/Helpline');
const Complaint = require('../models/Complaint');
const ComplaintUpdate = require('../models/ComplaintUpdate');
const { generateComplaintId } = require('../utils/referenceGenerator');

const departmentsData = [
  {
    name: 'Police Department',
    nameTamil: 'காவல்துறை',
    code: 'POL',
    description: 'Maintenance of public order, law enforcement, crime prevention, and traffic safety.',
    descriptionTamil: 'சட்டம் ஒழுங்கு பராமரிப்பு, குற்றத் தடுப்பு மற்றும் போக்குவரத்துப் பாதுகாப்பு.',
    icon: 'Shield',
  },
  {
    name: 'Healthcare & Family Welfare',
    nameTamil: 'மக்கள் நல்வாழ்வு மற்றும் மருத்துவத்துறை',
    code: 'HLTH',
    description: 'Public health services, primary health centres, government hospitals, and emergency medical aid.',
    descriptionTamil: 'பொது சுகாதாரம், அரசு மருத்துவமனைகள் மற்றும் அவசர மருத்துவ சேவைகள்.',
    icon: 'Activity',
  },
  {
    name: 'Fire & Rescue Services',
    nameTamil: 'தீயணைப்பு மற்றும் மீட்புப்பணிகள் துறை',
    code: 'FIRE',
    description: 'Fire suppression, building safety compliance, and emergency disaster rescue operations.',
    descriptionTamil: 'தீ தடுப்பு மற்றும் பேரிடர் அவசரகால மீட்புப் பணிகள்.',
    icon: 'Flame',
  },
  {
    name: 'Electricity Distribution (TANGEDCO)',
    nameTamil: 'தமிழ்நாடு மின் உற்பத்தி மற்றும் பகிர்மானக் கழகம்',
    code: 'TNEB',
    description: 'Power transmission, local transformer maintenance, power outages, and metering grievances.',
    descriptionTamil: 'மின் விநியோகம், மின் தடை புகார்கள் மற்றும் மின் இணைப்பு சேவைகள்.',
    icon: 'Zap',
  },
  {
    name: 'Water Supply & Municipal Administration',
    nameTamil: 'நகராட்சி நிர்வாகம் மற்றும் குடிநீர் வழங்கல்',
    code: 'WAT',
    description: 'Drinking water distribution, underground drainage, solid waste management, and civic repairs.',
    descriptionTamil: 'குடிநீர் விநியோகம், பாதாள சாக்கடை மற்றும் திடக்கழிவு மேலாண்மை.',
    icon: 'Droplets',
  },
  {
    name: 'State Transport Corporation',
    nameTamil: 'தமிழ்நாடு அரசுப் போக்குவரத்துக் கழகம்',
    code: 'TRN',
    description: 'Public bus services, bus stops, ticketing, frequency, and road safety regulations.',
    descriptionTamil: 'அரசுப் பேருந்து சேவைகள் மற்றும் சாலைப் போக்குவரத்து மேலாண்மை.',
    icon: 'Bus',
  },
  {
    name: 'Revenue & Disaster Management',
    nameTamil: 'வருவாய் மற்றும் பேரிடர் மேலாண்மைத் துறை',
    code: 'REV',
    description: 'District administration, patta/chitta, community certificates, flood/storm relief.',
    descriptionTamil: 'பட்டா, சான்றிதழ்கள் மற்றும் இயற்கை பேரிடர் நிவாரணப் பணிகள்.',
    icon: 'Building',
  },
  {
    name: 'Social Welfare & Women Safety',
    nameTamil: 'சமூக நலம் மற்றும் மகளிர் உரிமைத்துறை',
    code: 'WCD',
    description: 'Women protection services, child helpline monitoring, senior citizen care, and pension schemes.',
    descriptionTamil: 'மகளிர் பாதுகாப்பு, குழந்தைகள் நலம் மற்றும் முதியோர் உதவித்தொகை.',
    icon: 'HeartHandshake',
  },
];

const helplinesData = [
  {
    title: 'Integrated Emergency Helpline',
    titleTamil: 'ஒருங்கிணைந்த அவசர உதவி எண்',
    category: 'Emergency',
    phoneNumber: '112',
    alternateNumber: '100',
    description: 'Single national emergency short code for Police, Fire, and Ambulance dispatch.',
    descriptionTamil: 'காவல், தீயணைப்பு மற்றும் ஆம்புலன்ஸ் சேவைகளுக்கான பொதுவான அவசர உதவி.',
    operatingHours: '24x7 Toll-Free',
    officialSourceUrl: 'https://cms.tn.gov.in',
    isSampleData: false,
    isPublished: true,
  },
  {
    title: 'Police Emergency Response',
    titleTamil: 'காவல்துறை அவசர உதவி',
    category: 'Police & Safety',
    phoneNumber: '100',
    alternateNumber: '044-28448000',
    description: 'Direct police control room for urgent law and order assistance.',
    descriptionTamil: 'காவல் கட்டுப்பாட்டு அறை அவசரத் தொடர்பு.',
    operatingHours: '24x7 Toll-Free',
    officialSourceUrl: 'https://eservices.tnpolice.gov.in',
    isSampleData: false,
    isPublished: true,
  },
  {
    title: 'Women in Distress Helpline',
    titleTamil: 'மகளிர் அவசர உதவி எண்',
    category: 'Women & Child Safety',
    phoneNumber: '181',
    alternateNumber: '1091',
    description: '24-hour emergency counseling, domestic violence rescue, and legal assistance for women.',
    descriptionTamil: 'பெண்களுக்கான அவசர உதவி, குடும்ப வன்முறை பாதுகாப்பு மற்றும் சட்ட ஆலோசனை.',
    operatingHours: '24x7 Toll-Free',
    officialSourceUrl: 'https://cms.tn.gov.in',
    isSampleData: false,
    isPublished: true,
  },
  {
    title: 'Childline (Child Protection)',
    titleTamil: 'குழந்தைகள் உதவி மையம்',
    category: 'Women & Child Safety',
    phoneNumber: '1098',
    alternateNumber: '',
    description: 'National 24-hour emergency phone service for children in need of care and protection.',
    descriptionTamil: 'பாதுகாப்பு தேவைப்படும் குழந்தைகளுக்கான அவசர உதவி மையம்.',
    operatingHours: '24x7 Toll-Free',
    officialSourceUrl: 'https://www.childlineindia.org',
    isSampleData: false,
    isPublished: true,
  },
  {
    title: 'Medical Emergency & Ambulance',
    titleTamil: 'அவசர மருத்துவ ஊர்தி சேவை',
    category: 'Healthcare & Medical',
    phoneNumber: '108',
    alternateNumber: '102 (Pregnancy Aid)',
    description: 'Emergency ambulance dispatch and on-scene medical response across Tamil Nadu.',
    descriptionTamil: 'அவசர சிகிச்சை ஆம்புலன்ஸ் சேவை.',
    operatingHours: '24x7 Toll-Free',
    officialSourceUrl: 'https://cms.tn.gov.in',
    isSampleData: false,
    isPublished: true,
  },
  {
    title: 'TANGEDCO Minnagam Power Helpline',
    titleTamil: 'மின்னகம் - மின்நுகர்வோர் சேவை மையம்',
    category: 'Electricity & Utilities',
    phoneNumber: '94987 94987',
    alternateNumber: '1912',
    description: 'Statewide centralized electricity grievance helpline for power cuts and transformer repairs.',
    descriptionTamil: 'மின் தடை மற்றும் மின்சார வாரிய புகார்களுக்கான மாநில ஒருங்கிணைந்த சேவை மையம்.',
    operatingHours: '24x7 Service',
    officialSourceUrl: 'https://www.tangedco.gov.in',
    isSampleData: false,
    isPublished: true,
  },
  {
    title: 'Disaster Management Control Room',
    titleTamil: 'மாநில பேரிடர் அவசர கட்டுப்பாட்டு மையம்',
    category: 'Disaster & Rescue',
    phoneNumber: '1070',
    alternateNumber: '1077 (District Collectorates)',
    description: 'State disaster emergency response for cyclone, flood, and heavy rainfall advisories.',
    descriptionTamil: 'புயல், வெள்ளம் உள்ளிட்ட இயற்கை பேரிடர் மேலாண்மை அவசரக் கட்டுப்பாட்டு அறை.',
    operatingHours: '24x7 Operational',
    officialSourceUrl: 'https://tnsdma.tn.gov.in',
    isSampleData: false,
    isPublished: true,
  },
  {
    title: 'Chief Minister\'s Helpline (Mudhalvarin Mugavari)',
    titleTamil: 'முதல்வரின் முகவரி உதவி மையம்',
    category: 'Citizen Services',
    phoneNumber: '1100',
    alternateNumber: '',
    description: 'Integrated citizen grievance redressal helpline for all state government departments.',
    descriptionTamil: 'அரசுத் துறைகள் தொடர்பான அனைத்துப் பொதுமக்களின் குறைதீர்க்கும் ஒருங்கிணைந்த உதவி எண்.',
    operatingHours: '8:00 AM - 8:00 PM Daily',
    officialSourceUrl: 'https://cmhelpline.tnega.org',
    isSampleData: false,
    isPublished: true,
  },
  {
    title: 'Elderline (Senior Citizen Helpline)',
    titleTamil: 'மூத்த குடிமக்கள் தேசிய உதவி எண்',
    category: 'Citizen Services',
    phoneNumber: '14567',
    alternateNumber: '',
    description: 'Free national helpline providing emotional support, abuse intervention, and rescue for senior citizens.',
    descriptionTamil: 'மூத்த குடிமக்களுக்கான உதவி, பாதுகாப்பு மற்றும் முதியோர் நல ஆலோசனை.',
    operatingHours: '8:00 AM - 8:00 PM Daily',
    officialSourceUrl: 'https://cms.tn.gov.in',
    isSampleData: false,
    isPublished: true,
  },
  {
    title: 'Tele-MANAS Mental Health Support',
    titleTamil: 'டெலி-மானாஸ் மனநல ஆலோசனை மையம்',
    category: 'Healthcare & Medical',
    phoneNumber: '14416',
    alternateNumber: '1800 891 4416',
    description: 'Toll-free tele-mental health assistance with qualified counselors in Tamil and English.',
    descriptionTamil: 'இலவச மனநல ஆலோசனை மற்றும் மன அழுத்த நிவாரண சேவை.',
    operatingHours: '24x7 Toll-Free',
    officialSourceUrl: 'https://telemanas.mohfw.gov.in',
    isSampleData: false,
    isPublished: true,
  },
];

async function seedDatabase() {
  try {
    await connectDB();
    console.log('[Seed]: Cleaning existing collections for clean prototype setup...');

    await User.deleteMany({});
    await Department.deleteMany({});
    await Helpline.deleteMany({});
    await Complaint.deleteMany({});
    await ComplaintUpdate.deleteMany({});

    // 1. Seed Departments
    console.log('[Seed]: Seeding Departments...');
    const insertedDepartments = await Department.insertMany(departmentsData);
    const polDept = insertedDepartments.find((d) => d.code === 'POL');
    const hlthDept = insertedDepartments.find((d) => d.code === 'HLTH');
    const tnebDept = insertedDepartments.find((d) => d.code === 'TNEB');
    const watDept = insertedDepartments.find((d) => d.code === 'WAT');

    // 2. Link Departments to Helplines & Seed
    console.log('[Seed]: Seeding Helplines...');
    const linkedHelplines = helplinesData.map((h) => {
      let depId = null;
      if (h.category.includes('Police')) depId = polDept?._id;
      if (h.category.includes('Healthcare')) depId = hlthDept?._id;
      if (h.category.includes('Electricity')) depId = tnebDept?._id;
      return { ...h, departmentId: depId };
    });
    await Helpline.insertMany(linkedHelplines);

    // 3. Seed Users (Admin, Officers, Citizens)
    console.log('[Seed]: Creating Users with secure passwords...');

    // Administrator
    const adminUser = await User.create({
      name: 'TN State Helpline Administrator',
      email: 'admin@statehelp.tn.gov.in',
      mobile: '9876543210',
      password: 'Password@123',
      role: 'admin',
      district: 'Chennai',
    });

    // Officer 1: Police
    const officerPolice = await User.create({
      name: 'Inspector S. Radhakrishnan',
      email: 'officer.police@statehelp.tn.gov.in',
      mobile: '9876543211',
      password: 'Password@123',
      role: 'officer',
      departmentId: polDept._id,
      district: 'Chennai',
    });

    // Officer 2: TANGEDCO
    const officerTneb = await User.create({
      name: 'Assistant Engineer M. Karthik',
      email: 'officer.tneb@statehelp.tn.gov.in',
      mobile: '9876543212',
      password: 'Password@123',
      role: 'officer',
      departmentId: tnebDept._id,
      district: 'Coimbatore',
    });

    // Citizen 1
    const citizenUser = await User.create({
      name: 'K. Anand Kumar',
      email: 'citizen@example.com',
      mobile: '9876543220',
      password: 'Password@123',
      role: 'citizen',
      district: 'Chennai',
    });

    // Citizen 2
    const citizenUser2 = await User.create({
      name: 'P. Priya Dharshini',
      email: 'priya@example.com',
      mobile: '9876543221',
      password: 'Password@123',
      role: 'citizen',
      district: 'Madurai',
    });

    // 4. Seed Realistic Grievance Complaints with Audit Timelines
    console.log('[Seed]: Creating Initial Grievances & Audit Logs...');

    // Complaint 1: In Progress
    const comp1Id = generateComplaintId();
    const comp1 = await Complaint.create({
      complaintId: comp1Id,
      citizenId: citizenUser._id,
      departmentId: tnebDept._id,
      district: 'Chennai',
      category: 'Street Light Failure & Low Voltage',
      subject: 'Frequent voltage fluctuations and street lights non-functional in Anna Nagar West',
      description: 'The street lights on 6th Main Road, Anna Nagar West have been dark for 4 consecutive days. Additionally, frequent low voltage is causing damage to domestic appliances.',
      priority: 'High',
      status: 'In Progress',
      assignedOfficerId: officerTneb._id,
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    });

    await ComplaintUpdate.create([
      {
        complaintId: comp1._id,
        referenceId: comp1.complaintId,
        actorId: citizenUser._id,
        actorRole: 'citizen',
        previousStatus: 'None',
        newStatus: 'Submitted',
        publicMessage: 'Grievance submitted by citizen online.',
        internalNote: 'Automated ingestion via citizen web portal.',
        createdAt: comp1.submittedAt,
      },
      {
        complaintId: comp1._id,
        referenceId: comp1.complaintId,
        actorId: adminUser._id,
        actorRole: 'admin',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        publicMessage: 'Grievance assigned to TANGEDCO local section officer for field inspection.',
        internalNote: 'Routed to Anna Nagar section maintenance crew.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        complaintId: comp1._id,
        referenceId: comp1.complaintId,
        actorId: officerTneb._id,
        actorRole: 'officer',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
        publicMessage: 'Field lineman dispatched. Replacement LED fittings and cable repairs underway.',
        internalNote: 'Cable fault located near Pillar Box 14. Work order issued.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ]);

    // Complaint 2: Resolved
    const comp2Id = generateComplaintId();
    const comp2 = await Complaint.create({
      complaintId: comp2Id,
      citizenId: citizenUser._id,
      departmentId: watDept._id,
      district: 'Chennai',
      category: 'Water Supply Disruption',
      subject: 'Contaminated tap water supply in T. Nagar housing quarters',
      description: 'Drinking water pipeline mixed with rainwater seepage observed for the past 24 hours. Urgent inspection required.',
      priority: 'Emergency',
      status: 'Resolved',
      assignedOfficerId: adminUser._id,
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    await ComplaintUpdate.create([
      {
        complaintId: comp2._id,
        referenceId: comp2.complaintId,
        actorId: citizenUser._id,
        actorRole: 'citizen',
        previousStatus: 'None',
        newStatus: 'Submitted',
        publicMessage: 'Grievance submitted by citizen.',
        createdAt: comp2.submittedAt,
      },
      {
        complaintId: comp2._id,
        referenceId: comp2.complaintId,
        actorId: adminUser._id,
        actorRole: 'admin',
        previousStatus: 'Submitted',
        newStatus: 'Resolved',
        publicMessage: 'Pipeline breach identified and sealed. Water sample testing completed and verified potable.',
        internalNote: 'Joint inspection by Metro Water health wing completed.',
        createdAt: comp2.resolvedAt,
      },
    ]);

    // Complaint 3: Newly Submitted
    const comp3Id = generateComplaintId();
    const comp3 = await Complaint.create({
      complaintId: comp3Id,
      citizenId: citizenUser2._id,
      departmentId: polDept._id,
      district: 'Madurai',
      category: 'Public Safety & Noise Pollution',
      subject: 'Unauthorized loudspeaker usage near school zone during study hours',
      description: 'High decibel commercial loudspeakers operating adjacent to Government Girls Higher Secondary School without statutory sound permits.',
      priority: 'Medium',
      status: 'Submitted',
      submittedAt: new Date(),
    });

    await ComplaintUpdate.create({
      complaintId: comp3._id,
      referenceId: comp3.complaintId,
      actorId: citizenUser2._id,
      actorRole: 'citizen',
      previousStatus: 'None',
      newStatus: 'Submitted',
      publicMessage: 'Grievance submitted. Awaiting review by Madurai District Police control room.',
      internalNote: 'System intake timestamp logged.',
      createdAt: comp3.submittedAt,
    });

    console.log('=======================================================');
    console.log(' Database Seeding Completed Successfully!');
    console.log('-------------------------------------------------------');
    console.log(' Sample Logins for Testing:');
    console.log(' 1. Administrator:');
    console.log('    Email:    admin@statehelp.tn.gov.in');
    console.log('    Password: Password@123');
    console.log(' 2. Officer (Police):');
    console.log('    Email:    officer.police@statehelp.tn.gov.in');
    console.log('    Password: Password@123');
    console.log(' 3. Citizen:');
    console.log('    Email:    citizen@example.com');
    console.log('    Password: Password@123');
    console.log(' Sample Trackable Complaint IDs:');
    console.log(`    ${comp1Id} (In Progress)`);
    console.log(`    ${comp2Id} (Resolved)`);
    console.log(`    ${comp3Id} (Submitted)`);
    console.log('=======================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
}

seedDatabase();
