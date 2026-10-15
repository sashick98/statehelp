/**
 * Reference ID Generator for Tamil Nadu Citizen Grievances
 * 
 * Format: TNG-YYYYMMDD-XXXX
 * Example: TNG-20261014-4892
 * 
 * Generates an auditable, human-friendly grievance tracking code.
 */
function generateComplaintId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number

  return `TNG-${year}${month}${day}-${randomSuffix}`;
}

module.exports = { generateComplaintId };
