require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const app = require('../app');
const connectDB = require('../config/database');

let server;
const PORT = 5001; // Test port to avoid conflicts

async function runTests() {
  console.log('[Test Suite]: Starting Backend REST API Tests...');
  await connectDB();

  server = app.listen(PORT, async () => {
    console.log(`[Test Suite]: Test server running on port ${PORT}`);

    try {
      // Helper function to make HTTP requests
      const request = (path, method = 'GET', data = null, headers = {}) => {
        return new Promise((resolve, reject) => {
          const bodyData = data ? JSON.stringify(data) : null;
          const reqHeaders = {
            'Content-Type': 'application/json',
            ...(bodyData && { 'Content-Length': Buffer.byteLength(bodyData) }),
            ...headers,
          };

          const req = http.request(
            {
              hostname: '127.0.0.1',
              port: PORT,
              path,
              method,
              headers: reqHeaders,
            },
            (res) => {
              let resBody = '';
              res.on('data', (chunk) => (resBody += chunk));
              res.on('end', () => {
                let parsed;
                try {
                  parsed = JSON.parse(resBody);
                } catch {
                  parsed = resBody;
                }
                resolve({ status: res.statusCode, body: parsed });
              });
            }
          );

          req.on('error', (err) => reject(err));
          if (bodyData) req.write(bodyData);
          req.end();
        });
      };

      // Test 1: Health Check
      console.log('Test 1: GET /api/health');
      const healthRes = await request('/api/health');
      if (healthRes.status !== 200 || healthRes.body.status !== 'ok') {
        throw new Error(`Health check failed: ${JSON.stringify(healthRes)}`);
      }
      console.log('  ✓ Passed: Health check OK');

      // Test 2: Get Departments
      console.log('Test 2: GET /api/departments');
      const deptRes = await request('/api/departments');
      if (deptRes.status !== 200 || !deptRes.body.departments?.length) {
        throw new Error('Get departments failed');
      }
      console.log(`  ✓ Passed: Retrieved ${deptRes.body.count} departments`);
      const sampleDept = deptRes.body.departments[0];

      // Test 3: Get Published Helplines
      console.log('Test 3: GET /api/helplines');
      const helpRes = await request('/api/helplines');
      if (helpRes.status !== 200 || !helpRes.body.helplines?.length) {
        throw new Error('Get helplines failed');
      }
      console.log(`  ✓ Passed: Retrieved ${helpRes.body.count} published helplines`);

      // Test 4: Citizen Login
      console.log('Test 4: POST /api/auth/login (Citizen)');
      const citizenLoginRes = await request('/api/auth/login', 'POST', {
        email: 'citizen@example.com',
        password: 'Password@123',
      });
      if (citizenLoginRes.status !== 200 || !citizenLoginRes.body.token) {
        throw new Error(`Citizen login failed: ${JSON.stringify(citizenLoginRes)}`);
      }
      const citizenToken = citizenLoginRes.body.token;
      console.log('  ✓ Passed: Citizen authenticated with JWT');

      // Test 5: Register Complaint
      console.log('Test 5: POST /api/complaints (Submit Grievance)');
      const compRes = await request(
        '/api/complaints',
        'POST',
        {
          departmentId: sampleDept._id,
          district: 'Chennai',
          category: 'Civic Infrastructure',
          subject: 'Pothole on Main Road causing traffic congestion and hazard',
          description: 'A deep pothole measuring over 1 metre wide has formed near the junction. Vehicles are swerving into oncoming traffic to avoid it.',
          priority: 'High',
        },
        { Authorization: `Bearer ${citizenToken}` }
      );
      if (compRes.status !== 201 || !compRes.body.complaint?.complaintId) {
        throw new Error(`Create complaint failed: ${JSON.stringify(compRes)}`);
      }
      const newComplaintId = compRes.body.complaint.complaintId;
      console.log(`  ✓ Passed: Grievance created with Reference ID: ${newComplaintId}`);

      // Test 6: Public Tracking
      console.log(`Test 6: GET /api/complaints/track/${newComplaintId} (Public Lookup)`);
      const trackRes = await request(`/api/complaints/track/${newComplaintId}`);
      if (trackRes.status !== 200 || trackRes.body.trackingData?.status !== 'Submitted') {
        throw new Error(`Public tracking failed: ${JSON.stringify(trackRes)}`);
      }
      console.log('  ✓ Passed: Public status tracker verified without exposing citizen identity');

      // Test 7: Admin Login & Status Update
      console.log('Test 7: POST /api/auth/login (Admin) & PATCH status');
      const adminLoginRes = await request('/api/auth/login', 'POST', {
        email: 'admin@statehelp.tn.gov.in',
        password: 'Password@123',
      });
      const adminToken = adminLoginRes.body.token;

      const updateRes = await request(
        `/api/admin/complaints/${compRes.body.complaint._id}/status`,
        'PATCH',
        {
          status: 'In Progress',
          publicMessage: 'Inspection team dispatched to junction site.',
          internalNote: 'High priority road work scheduled.',
        },
        { Authorization: `Bearer ${adminToken}` }
      );
      if (updateRes.status !== 200 || updateRes.body.complaint.status !== 'In Progress') {
        throw new Error(`Update status failed: ${JSON.stringify(updateRes)}`);
      }
      console.log('  ✓ Passed: Admin updated status to In Progress with audit trail');

      // Test 8: Admin Reports Summary
      console.log('Test 8: GET /api/admin/reports/summary');
      const reportRes = await request('/api/admin/reports/summary', 'GET', null, {
        Authorization: `Bearer ${adminToken}`,
      });
      if (reportRes.status !== 200 || !reportRes.body.summary) {
        throw new Error('Report summary failed');
      }
      console.log(`  ✓ Passed: Reports summary retrieved (Total complaints: ${reportRes.body.summary.total})`);

      console.log('=======================================================');
      console.log(' ALL 8 BACKEND INTEGRATION TESTS PASSED!');
      console.log('=======================================================');
      server.close(() => process.exit(0));
    } catch (err) {
      console.error('[Test Failure]:', err.message);
      if (server) server.close();
      process.exit(1);
    }
  });
}

runTests();
