const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../School_ERP.postman_collection.json');
const collection = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const onboardingFolder = collection.item.find(f => f.name.includes('3. Onboarding'));
if (!onboardingFolder) {
  console.error('Folder 3 not found');
  process.exit(1);
}

const newRequests = [
  {
    name: "Get Single Teacher by ID",
    request: {
      auth: {
        type: "bearer",
        bearer: [{ key: "token", value: "{{authToken}}", type: "string" }]
      },
      method: "GET",
      header: [],
      url: {
        raw: "{{baseUrl}}/api/teachers/{{teacherId}}",
        host: ["{{baseUrl}}"],
        path: ["api", "teachers", "{{teacherId}}"]
      }
    }
  },
  {
    name: "Update Teacher (Full)",
    request: {
      auth: {
        type: "bearer",
        bearer: [{ key: "token", value: "{{authToken}}", type: "string" }]
      },
      method: "PUT",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          name: "Dr. Anita Sharma",
          email: "anita.sharma@schoolerp.com",
          loginMsisdn: "9876543220",
          designation: "Senior Faculty - Mathematics",
          gender: "FEMALE",
          dateOfBirth: "1988-06-15",
          address: "456 Professors Enclave, New Delhi",
          status: "ACTIVE"
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/teachers/{{teacherId}}",
        host: ["{{baseUrl}}"],
        path: ["api", "teachers", "{{teacherId}}"]
      }
    }
  },
  {
    name: "Update Teacher (Partial)",
    request: {
      auth: {
        type: "bearer",
        bearer: [{ key: "token", value: "{{authToken}}", type: "string" }]
      },
      method: "PATCH",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          designation: "Head of Mathematics Department",
          address: "Flat 101, Faculty Quarters, Campus"
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/teachers/{{teacherId}}",
        host: ["{{baseUrl}}"],
        path: ["api", "teachers", "{{teacherId}}"]
      }
    }
  },
  {
    name: "List Students (Directory & Search)",
    request: {
      auth: {
        type: "bearer",
        bearer: [{ key: "token", value: "{{authToken}}", type: "string" }]
      },
      method: "GET",
      header: [],
      url: {
        raw: "{{baseUrl}}/api/students?search=Aarav&limit=50&offset=0",
        host: ["{{baseUrl}}"],
        path: ["api", "students"],
        query: [
          { key: "search", value: "Aarav" },
          { key: "sectionId", value: "{{sectionId}}", disabled: true },
          { key: "limit", value: "50" },
          { key: "offset", value: "0" }
        ]
      }
    }
  },
  {
    name: "Get Single Student by ID",
    request: {
      auth: {
        type: "bearer",
        bearer: [{ key: "token", value: "{{authToken}}", type: "string" }]
      },
      method: "GET",
      header: [],
      url: {
        raw: "{{baseUrl}}/api/students/{{studentId}}",
        host: ["{{baseUrl}}"],
        path: ["api", "students", "{{studentId}}"]
      }
    }
  },
  {
    name: "Update Student (Full)",
    request: {
      auth: {
        type: "bearer",
        bearer: [{ key: "token", value: "{{authToken}}", type: "string" }]
      },
      method: "PUT",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          name: "Aarav K. Sharma",
          email: "aarav.k@student.com",
          phone: "9876543211",
          dob: "2012-05-15",
          bloodGroup: "O+",
          address: "Flat 302, Green Valley Apartments, Delhi",
          previousSchool: "Delhi Public School",
          rollNo: 12,
          parentName: "Rajesh Kumar Sharma",
          parentEmail: "rajesh.k@parent.com",
          guardianOccupation: "Senior Director",
          guardianAddress: "Flat 302, Green Valley Apartments, Delhi"
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/students/{{studentId}}",
        host: ["{{baseUrl}}"],
        path: ["api", "students", "{{studentId}}"]
      }
    }
  },
  {
    name: "Update Student (Partial)",
    request: {
      auth: {
        type: "bearer",
        bearer: [{ key: "token", value: "{{authToken}}", type: "string" }]
      },
      method: "PATCH",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          rollNo: 15,
          bloodGroup: "O+",
          address: "House 45, Sector 12, Rohini, Delhi"
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/students/{{studentId}}",
        host: ["{{baseUrl}}"],
        path: ["api", "students", "{{studentId}}"]
      }
    }
  }
];

// Avoid duplicate additions
for (const req of newRequests) {
  const existingIdx = onboardingFolder.item.findIndex(r => r.name === req.name);
  if (existingIdx !== -1) {
    onboardingFolder.item[existingIdx] = req;
  } else {
    onboardingFolder.item.push(req);
  }
}

fs.writeFileSync(filePath, JSON.stringify(collection, null, 2), 'utf8');
console.log('✅ Postman collection updated successfully! Folder 3 now has ' + onboardingFolder.item.length + ' requests.');

