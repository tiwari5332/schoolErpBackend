// AUTO-GENERATED FROM api-contract.json - DO NOT EDIT MANUALLY
export const CONTRACT_FIXTURES = {
  "AUTH_LOGIN": {
    "request": {
      "body": {
        "identifier": "admin@sunrise.edu",
        "password": "Secret@123",
        "tenantSlug": "sunrise",
        "rememberMe": true
      }
    },
    "response": {
      "status": 200,
      "data": {
        "accessToken": "jwt...",
        "refreshToken": "rt...",
        "expiresIn": 900,
        "user": {
          "$ref": "#/components/entities/User"
        },
        "tenant": {
          "$ref": "#/components/entities/Tenant"
        },
        "permissions": [
          "dashboard.view",
          "students.view"
        ],
        "subscription": {
          "status": "TRIAL",
          "trialEndsAt": "2026-11-15"
        },
        "mustChangePassword": false
      }
    }
  },
  "AUTH_REFRESH": {
    "request": {
      "body": {
        "refreshToken": "rt..."
      }
    },
    "response": {
      "status": 200,
      "data": {
        "accessToken": "jwt...",
        "refreshToken": "rt2...",
        "expiresIn": 900
      }
    }
  },
  "AUTH_LOGOUT": {
    "request": {
      "body": {
        "refreshToken": "rt..."
      }
    },
    "response": {
      "status": 204
    }
  },
  "AUTH_ME": {
    "response": {
      "status": 200,
      "data": {
        "user": {
          "$ref": "#/components/entities/User"
        },
        "tenant": {
          "$ref": "#/components/entities/Tenant"
        },
        "permissions": [
          "dashboard.view"
        ],
        "activeSession": {
          "$ref": "#/components/entities/AcademicSession"
        },
        "serverDate": "2026-11-12",
        "serverDateTime": "2026-11-12T08:31:00Z"
      }
    }
  },
  "AUTH_FORGOT_PASSWORD": {
    "request": {
      "body": {
        "identifier": "admin@sunrise.edu"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "message": "If the account exists, a reset link has been sent."
      }
    }
  },
  "AUTH_RESET_PASSWORD": {
    "request": {
      "body": {
        "token": "abc",
        "newPassword": "NewSecret@123"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "message": "Password updated"
      }
    }
  },
  "AUTH_CHANGE_PASSWORD": {
    "request": {
      "body": {
        "currentPassword": "old",
        "newPassword": "NewSecret@123"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "message": "Password changed"
      }
    }
  },
  "AUTH_UPDATE_PROFILE": {
    "request": {
      "body": {
        "name": "Shubham Tiwari",
        "phone": "+919876543210",
        "avatarFileId": "fil_01"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/User"
      }
    }
  },
  "PLANS_LIST": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Plan"
          }
        ]
      }
    }
  },
  "TENANT_REGISTER": {
    "request": {
      "body": {
        "schoolName": "Sunrise Public School",
        "board": "CBSE",
        "city": "Prayagraj",
        "state": "Uttar Pradesh",
        "adminName": "Shubham Tiwari",
        "email": "admin@sunrise.edu",
        "phone": "+919876543210",
        "password": "Secret@123",
        "planCode": "GROWTH",
        "billingCycle": "YEARLY",
        "acceptTerms": true
      }
    },
    "response": {
      "status": 201,
      "data": {
        "tenant": {
          "$ref": "#/components/entities/Tenant"
        },
        "user": {
          "$ref": "#/components/entities/User"
        },
        "subscription": {
          "$ref": "#/components/entities/Subscription"
        },
        "accessToken": "jwt...",
        "refreshToken": "rt..."
      }
    }
  },
  "ONBOARDING_STATUS": {
    "response": {
      "status": 200,
      "data": {
        "completedCount": 2,
        "totalCount": 7,
        "steps": [
          {
            "key": "school_profile",
            "title": "Complete school profile",
            "isDone": true,
            "link": "/settings/school"
          },
          {
            "key": "academic_session",
            "title": "Set academic session",
            "isDone": true,
            "link": "/academic/sessions"
          },
          {
            "key": "classes",
            "title": "Add classes & sections",
            "isDone": false,
            "link": "/academic/classes"
          },
          {
            "key": "fee_structure",
            "title": "Create fee structure",
            "isDone": false,
            "link": "/fees/structures"
          },
          {
            "key": "staff",
            "title": "Add staff",
            "isDone": false,
            "link": "/staff/new"
          },
          {
            "key": "students",
            "title": "Add or import students",
            "isDone": false,
            "link": "/students/import"
          },
          {
            "key": "invite_team",
            "title": "Invite your team",
            "isDone": false,
            "link": "/administrators"
          }
        ]
      }
    }
  },
  "ONBOARDING_DISMISS": {
    "response": {
      "status": 204
    }
  },
  "SUBSCRIPTION_GET": {
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Subscription"
      }
    }
  },
  "SUBSCRIPTION_CHECKOUT": {
    "request": {
      "body": {
        "planCode": "GROWTH",
        "billingCycle": "YEARLY",
        "couponCode": "WELCOME10"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "orderId": "ord_01",
        "gateway": "RAZORPAY",
        "amount": 26991,
        "currency": "INR",
        "gatewayPayload": {
          "key": "rzp_test_x",
          "orderId": "order_x"
        }
      }
    }
  },
  "SUBSCRIPTION_CONFIRM": {
    "request": {
      "body": {
        "orderId": "ord_01",
        "paymentId": "pay_x",
        "signature": "sig"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Subscription"
      }
    }
  },
  "SUBSCRIPTION_CHANGE_PLAN": {
    "request": {
      "body": {
        "planCode": "PRO",
        "billingCycle": "MONTHLY"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Subscription"
      }
    }
  },
  "SUBSCRIPTION_CANCEL": {
    "request": {
      "body": {
        "reason": "Switching software",
        "feedback": ""
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Subscription"
      }
    }
  },
  "SUBSCRIPTION_INVOICES": {
    "request": {
      "query": {
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "id": "inv_01",
            "number": "INV-2026-0001",
            "amount": 26991,
            "currency": "INR",
            "status": "PAID",
            "issuedAt": "2026-11-01",
            "pdfUrl": "https://files/inv.pdf"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "PLATFORM_METRICS": {
    "response": {
      "status": 200,
      "data": {
        "totalSchools": 120,
        "activeSchools": 95,
        "trialSchools": 20,
        "mrr": 245000,
        "churnPercent": 2.1,
        "signupsTrend": [
          {
            "date": "2026-11-01",
            "count": 3
          }
        ]
      }
    }
  },
  "PLATFORM_TENANTS_LIST": {
    "request": {
      "query": {
        "page": 1,
        "pageSize": 20,
        "status": "TRIAL",
        "q": "sunrise"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Tenant"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "PLATFORM_TENANT_STATUS": {
    "request": {
      "body": {
        "status": "SUSPENDED",
        "reason": "Non payment"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Tenant"
      }
    }
  },
  "PLATFORM_PLAN_CREATE": {
    "request": {
      "body": {
        "code": "PRO",
        "name": "Pro",
        "priceMonthly": 5999,
        "priceYearly": 59990,
        "trialDays": 14,
        "limits": {
          "students": 3000,
          "staff": 300,
          "storageGb": 100,
          "smsCredits": 10000
        },
        "features": [
          "Everything in Growth"
        ],
        "isActive": true
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/Plan"
      }
    }
  },
  "PLATFORM_PLAN_UPDATE": {
    "request": {
      "body": {
        "name": "Pro",
        "priceMonthly": 6499,
        "priceYearly": 64990,
        "limits": {
          "students": 3000,
          "staff": 300,
          "storageGb": 100,
          "smsCredits": 10000
        },
        "features": [
          "Everything in Growth"
        ],
        "isActive": true
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Plan"
      }
    }
  },
  "DASH_KPI_STUDENTS": {
    "response": {
      "status": 200,
      "data": {
        "total": 342,
        "active": 330,
        "newThisMonth": 12,
        "deltaPercent": 3.6,
        "sparkline": [
          320,
          325,
          330,
          342
        ]
      }
    }
  },
  "DASH_KPI_STAFF": {
    "response": {
      "status": 200,
      "data": {
        "total": 28,
        "teaching": 21,
        "nonTeaching": 7,
        "onLeaveToday": 2
      }
    }
  },
  "DASH_KPI_FEES_TODAY": {
    "response": {
      "status": 200,
      "data": {
        "amount": 84500,
        "currency": "INR",
        "transactions": 23,
        "vsYesterdayPercent": 12.4,
        "pendingTotal": 640000
      }
    }
  },
  "DASH_KPI_ATTENDANCE": {
    "response": {
      "status": 200,
      "data": {
        "date": "2026-11-12",
        "present": 310,
        "absent": 20,
        "late": 5,
        "total": 335,
        "percent": 92.5,
        "markedClasses": 14,
        "totalClasses": 16
      }
    }
  },
  "DASH_QUICK_ACTIONS": {
    "response": {
      "status": 200,
      "data": {
        "role": "SUPER_ADMIN",
        "actions": [
          {
            "key": "add_student",
            "label": "Add Student",
            "icon": "user-plus",
            "link": "/students/new",
            "permission": "students.create"
          },
          {
            "key": "mark_attendance",
            "label": "Mark Attendance",
            "icon": "check-square",
            "link": "/attendance/students",
            "permission": "attendance.student.mark"
          },
          {
            "key": "collect_fee",
            "label": "Collect Fee",
            "icon": "wallet",
            "link": "/fees/collect",
            "permission": "fees.collect"
          },
          {
            "key": "send_notice",
            "label": "Send Notice",
            "icon": "megaphone",
            "link": "/communication/new",
            "permission": "communication.send"
          },
          {
            "key": "create_exam",
            "label": "Create Exam",
            "icon": "file-text",
            "link": "/exams/new",
            "permission": "exams.create"
          },
          {
            "key": "bulk_upload",
            "label": "Bulk Upload",
            "icon": "upload",
            "link": "/bulk-upload",
            "permission": "students.import"
          }
        ]
      }
    }
  },
  "DASH_FEE_TREND": {
    "request": {
      "query": {
        "range": "7d"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "range": "7d",
        "points": [
          {
            "date": "2026-11-06",
            "collected": 52000,
            "due": 80000
          }
        ],
        "totalCollected": 410000
      }
    }
  },
  "DASH_ATTENDANCE_TREND": {
    "request": {
      "query": {
        "range": "30d"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "points": [
          {
            "date": "2026-11-06",
            "studentPercent": 93.1,
            "staffPercent": 96
          }
        ]
      }
    }
  },
  "DASH_PENDING_APPROVALS": {
    "request": {
      "query": {
        "limit": 5
      }
    },
    "response": {
      "status": 200,
      "data": {
        "total": 4,
        "items": [
          {
            "$ref": "#/components/entities/Approval"
          }
        ]
      }
    }
  },
  "APPROVAL_DECIDE": {
    "request": {
      "body": {
        "decision": "APPROVED",
        "note": "Ok"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Approval"
      }
    }
  },
  "APPROVALS_LIST": {
    "request": {
      "query": {
        "status": "PENDING",
        "type": "LEAVE",
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Approval"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "CALENDAR_EVENTS": {
    "request": {
      "query": {
        "month": "2026-11"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "month": "2026-11",
        "serverDate": "2026-11-12",
        "events": [
          {
            "$ref": "#/components/entities/CalendarEvent"
          }
        ]
      }
    }
  },
  "CALENDAR_UPCOMING": {
    "request": {
      "query": {
        "days": 30
      }
    },
    "response": {
      "status": 200,
      "data": {
        "count": 1,
        "items": [
          {
            "$ref": "#/components/entities/CalendarEvent"
          }
        ]
      }
    }
  },
  "CALENDAR_EVENT_CREATE": {
    "request": {
      "body": {
        "title": "Annual Day",
        "type": "EVENT",
        "startDate": "2026-11-25",
        "endDate": "2026-11-25",
        "allDay": true,
        "startTime": null,
        "endTime": null,
        "description": "",
        "audience": "ALL",
        "isHoliday": false,
        "notify": true
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/CalendarEvent"
      }
    }
  },
  "CALENDAR_EVENT_UPDATE": {
    "request": {
      "body": {
        "title": "Annual Day",
        "type": "EVENT",
        "startDate": "2026-11-26",
        "endDate": "2026-11-26",
        "allDay": true,
        "description": "",
        "audience": "ALL",
        "isHoliday": false
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/CalendarEvent"
      }
    }
  },
  "CALENDAR_EVENT_DELETE": {
    "response": {
      "status": 204
    }
  },
  "GLOBAL_SEARCH": {
    "request": {
      "query": {
        "q": "aarav",
        "limit": 8
      }
    },
    "response": {
      "status": 200,
      "data": {
        "students": [
          {
            "id": "stu_01",
            "title": "Aarav Sharma",
            "subtitle": "Class 5-A | ADM-2026-0001",
            "link": "/students/stu_01"
          }
        ],
        "staff": [],
        "pages": [
          {
            "title": "Fee Management",
            "link": "/fees"
          }
        ]
      }
    }
  },
  "NOTIFICATIONS_LIST": {
    "request": {
      "query": {
        "unreadOnly": false,
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "unreadCount": 3,
        "items": [
          {
            "$ref": "#/components/entities/Notification"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "NOTIFICATION_READ": {
    "response": {
      "status": 204
    }
  },
  "NOTIFICATIONS_READ_ALL": {
    "response": {
      "status": 204
    }
  },
  "SESSIONS_LIST": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/AcademicSession"
          }
        ]
      }
    }
  },
  "SESSION_CREATE": {
    "request": {
      "body": {
        "name": "2027-28",
        "startDate": "2027-04-01",
        "endDate": "2028-03-31"
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/AcademicSession"
      }
    }
  },
  "SESSION_ACTIVATE": {
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/AcademicSession"
      }
    }
  },
  "SESSION_ROLLOVER": {
    "request": {
      "body": {
        "targetSessionId": "ses_2728",
        "copy": [
          "CLASSES",
          "SUBJECTS",
          "FEE_STRUCTURES",
          "TIMETABLE"
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "copied": {
          "classes": 12,
          "subjects": 40,
          "feeStructures": 12,
          "timetableEntries": 480
        }
      }
    }
  },
  "SESSION_LOCK": {
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/AcademicSession"
      }
    }
  },
  "CLASSES_LIST": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Class"
          }
        ]
      }
    }
  },
  "CLASS_CREATE": {
    "request": {
      "body": {
        "name": "Class 6",
        "displayOrder": 6,
        "sections": [
          {
            "name": "A",
            "capacity": 40,
            "classTeacherId": null
          },
          {
            "name": "B",
            "capacity": 40,
            "classTeacherId": null
          }
        ]
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/Class"
      }
    }
  },
  "CLASS_UPDATE": {
    "request": {
      "body": {
        "name": "Class 6",
        "displayOrder": 6,
        "sections": [
          {
            "id": "sec_06A",
            "name": "A",
            "capacity": 45,
            "classTeacherId": "stf_21"
          }
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Class"
      }
    }
  },
  "CLASS_DELETE": {
    "response": {
      "status": 204
    }
  },
  "SUBJECTS_LIST": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Subject"
          }
        ]
      }
    }
  },
  "SUBJECT_CREATE": {
    "request": {
      "body": {
        "name": "Science",
        "code": "SCI",
        "type": "THEORY",
        "isElective": false
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/Subject"
      }
    }
  },
  "SUBJECT_UPDATE": {
    "request": {
      "body": {
        "name": "Science",
        "code": "SCI",
        "type": "THEORY",
        "isElective": false
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Subject"
      }
    }
  },
  "CLASS_SUBJECTS_ASSIGN": {
    "request": {
      "body": {
        "subjectIds": [
          "sbj_math",
          "sbj_eng"
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Class"
      }
    }
  },
  "GRADE_SCALES_LIST": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/GradeScale"
          }
        ]
      }
    }
  },
  "GRADE_SCALE_UPSERT": {
    "request": {
      "body": {
        "name": "CBSE 9-point",
        "bands": [
          {
            "grade": "A1",
            "minPercent": 91,
            "maxPercent": 100,
            "gradePoint": 10
          }
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/GradeScale"
      }
    }
  },
  "STUDENTS_LIST": {
    "request": {
      "query": {
        "page": 1,
        "pageSize": 20,
        "q": "aarav",
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "status": "ACTIVE",
        "gender": "MALE",
        "feeDue": true,
        "sortBy": "fullName",
        "sortOrder": "asc"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Student"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "STUDENT_CREATE": {
    "request": {
      "body": {
        "admissionNo": "ADM-2026-0002",
        "firstName": "Diya",
        "lastName": "Singh",
        "gender": "FEMALE",
        "dob": "2014-02-20",
        "bloodGroup": "O+",
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "rollNo": "13",
        "admissionDate": "2026-11-12",
        "category": "GENERAL",
        "photoFileId": null,
        "address": {
          "line1": "10 Park St",
          "city": "Prayagraj",
          "state": "Uttar Pradesh",
          "pincode": "211001"
        },
        "guardians": [
          {
            "name": "Amit Singh",
            "relation": "FATHER",
            "phone": "+919833333333",
            "email": "amit@mail.com",
            "occupation": "Business",
            "isPrimary": true,
            "createLogin": true
          }
        ],
        "autoAssignFees": true
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/Student"
      }
    }
  },
  "STUDENT_GET": {
    "response": {
      "status": 200,
      "data": {
        "student": {
          "$ref": "#/components/entities/Student"
        },
        "attendanceSummary": {
          "present": 120,
          "absent": 8,
          "late": 3,
          "percent": 94.5
        },
        "feeSummary": {
          "totalDue": 4500,
          "totalPaid": 13500
        },
        "recentResults": [
          {
            "examName": "Unit Test 1",
            "percentage": 88
          }
        ],
        "documents": [
          {
            "id": "doc_01",
            "name": "Birth Certificate",
            "url": "https://files/doc.pdf",
            "type": "BIRTH_CERTIFICATE"
          }
        ]
      }
    }
  },
  "STUDENT_UPDATE": {
    "request": {
      "body": {
        "firstName": "Diya",
        "lastName": "Singh",
        "gender": "FEMALE",
        "dob": "2014-02-20",
        "bloodGroup": "O+",
        "classId": "cls_05",
        "sectionId": "sec_05B",
        "rollNo": "13",
        "address": {
          "line1": "10 Park St",
          "city": "Prayagraj",
          "state": "Uttar Pradesh",
          "pincode": "211001"
        },
        "guardians": [
          {
            "id": "grd_01",
            "name": "Amit Singh",
            "relation": "FATHER",
            "phone": "+919833333333",
            "email": "amit@mail.com",
            "isPrimary": true
          }
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Student"
      }
    }
  },
  "STUDENT_STATUS": {
    "request": {
      "body": {
        "status": "INACTIVE",
        "reason": "Relocated",
        "effectiveDate": "2026-11-12"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Student"
      }
    }
  },
  "STUDENT_DELETE": {
    "response": {
      "status": 204
    }
  },
  "STUDENT_DOCUMENT_UPLOAD": {
    "request": {
      "body": {
        "file": "<binary>",
        "type": "BIRTH_CERTIFICATE",
        "name": "Birth Certificate"
      }
    },
    "response": {
      "status": 201,
      "data": {
        "id": "doc_01",
        "name": "Birth Certificate",
        "url": "https://files/doc.pdf",
        "type": "BIRTH_CERTIFICATE"
      }
    }
  },
  "STUDENT_PROMOTE": {
    "request": {
      "body": {
        "fromSessionId": "ses_2627",
        "toSessionId": "ses_2728",
        "fromClassId": "cls_05",
        "fromSectionId": "sec_05A",
        "toClassId": "cls_06",
        "toSectionId": "sec_06A",
        "studentIds": [
          "stu_01",
          "stu_02"
        ],
        "action": "PROMOTE",
        "carryForwardDues": true
      }
    },
    "response": {
      "status": 200,
      "data": {
        "total": 2,
        "succeeded": 2,
        "failed": 0,
        "errors": []
      }
    }
  },
  "STUDENT_TC_GENERATE": {
    "request": {
      "body": {
        "leavingDate": "2026-11-30",
        "reason": "Relocation",
        "conduct": "GOOD",
        "overrideDues": false
      }
    },
    "response": {
      "status": 201,
      "data": {
        "tcNumber": "TC-2026-004",
        "pdfUrl": "https://files/tc.pdf"
      }
    }
  },
  "STUDENT_ID_CARDS": {
    "request": {
      "body": {
        "studentIds": [
          "stu_01"
        ],
        "template": "DEFAULT"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "pdfUrl": "https://files/idcards.pdf"
      }
    }
  },
  "STUDENT_NEXT_ADMISSION_NO": {
    "response": {
      "status": 200,
      "data": {
        "admissionNo": "ADM-2026-0003"
      }
    }
  },
  "STAFF_LIST": {
    "request": {
      "query": {
        "page": 1,
        "pageSize": 20,
        "q": "anita",
        "department": "Academics",
        "status": "ACTIVE",
        "roleId": "rol_teacher"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Staff"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "STAFF_CREATE": {
    "request": {
      "body": {
        "employeeCode": "EMP-0022",
        "firstName": "Ravi",
        "lastName": "Kumar",
        "gender": "MALE",
        "dob": "1990-05-10",
        "email": "ravi@school.edu",
        "phone": "+919844444444",
        "designation": "PGT Physics",
        "department": "Academics",
        "joiningDate": "2026-11-12",
        "qualification": "M.Sc",
        "roleId": "rol_teacher",
        "createLogin": true,
        "assignments": [
          {
            "classId": "cls_05",
            "sectionId": "sec_05A",
            "subjectId": "sbj_math",
            "isClassTeacher": false
          }
        ]
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/Staff"
      }
    }
  },
  "STAFF_GET": {
    "response": {
      "status": 200,
      "data": {
        "staff": {
          "$ref": "#/components/entities/Staff"
        },
        "attendanceSummary": {
          "present": 20,
          "absent": 1,
          "leave": 2,
          "percent": 95
        },
        "leaveBalance": [
          {
            "type": "CASUAL",
            "total": 12,
            "used": 3
          }
        ]
      }
    }
  },
  "STAFF_UPDATE": {
    "request": {
      "body": {
        "firstName": "Ravi",
        "lastName": "Kumar",
        "designation": "PGT Physics",
        "department": "Academics",
        "phone": "+919844444444",
        "roleId": "rol_teacher",
        "assignments": [
          {
            "classId": "cls_06",
            "sectionId": "sec_06A",
            "subjectId": "sbj_phy",
            "isClassTeacher": true
          }
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Staff"
      }
    }
  },
  "STAFF_STATUS": {
    "request": {
      "body": {
        "status": "RESIGNED",
        "reason": "Personal",
        "effectiveDate": "2026-12-31"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Staff"
      }
    }
  },
  "STAFF_DELETE": {
    "response": {
      "status": 204
    }
  },
  "LEAVE_APPLY": {
    "request": {
      "body": {
        "type": "CASUAL",
        "fromDate": "2026-11-20",
        "toDate": "2026-11-21",
        "reason": "Family function",
        "halfDay": false
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/LeaveRequest"
      }
    }
  },
  "LEAVES_LIST": {
    "request": {
      "query": {
        "status": "PENDING",
        "staffId": "stf_21",
        "from": "2026-11-01",
        "to": "2026-11-30",
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/LeaveRequest"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "LEAVE_DECIDE": {
    "request": {
      "body": {
        "decision": "APPROVED",
        "note": "Approved"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/LeaveRequest"
      }
    }
  },
  "LEAVE_CANCEL": {
    "response": {
      "status": 204
    }
  },
  "ATT_STUDENT_GET": {
    "request": {
      "query": {
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "date": "2026-11-12"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "date": "2026-11-12",
        "isHoliday": false,
        "isMarked": false,
        "records": [
          {
            "$ref": "#/components/entities/StudentAttendanceRecord"
          }
        ]
      }
    }
  },
  "ATT_STUDENT_MARK": {
    "request": {
      "body": {
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "date": "2026-11-12",
        "records": [
          {
            "studentId": "stu_01",
            "status": "PRESENT",
            "remark": null
          },
          {
            "studentId": "stu_02",
            "status": "ABSENT",
            "remark": "Fever"
          }
        ],
        "notifyParentsOfAbsent": true
      }
    },
    "response": {
      "status": 200,
      "data": {
        "date": "2026-11-12",
        "present": 35,
        "absent": 1,
        "late": 0,
        "notified": 1
      }
    }
  },
  "ATT_STUDENT_SUMMARY": {
    "request": {
      "query": {
        "date": "2026-11-12",
        "month": "2026-11"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "classes": [
          {
            "classId": "cls_05",
            "sectionId": "sec_05A",
            "label": "Class 5-A",
            "total": 36,
            "present": 34,
            "absent": 2,
            "percent": 94.4,
            "isMarked": true,
            "markedBy": "Anita Verma"
          }
        ]
      }
    }
  },
  "ATT_STUDENT_MONTHLY": {
    "request": {
      "query": {
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "month": "2026-11"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "month": "2026-11",
        "days": [
          "2026-11-02",
          "2026-11-03"
        ],
        "students": [
          {
            "studentId": "stu_01",
            "name": "Aarav Sharma",
            "marks": {
              "2026-11-02": "PRESENT",
              "2026-11-03": "ABSENT"
            },
            "presentCount": 20,
            "absentCount": 1,
            "percent": 95.2
          }
        ]
      }
    }
  },
  "ATT_STAFF_GET": {
    "request": {
      "query": {
        "date": "2026-11-12",
        "department": "Academics"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "date": "2026-11-12",
        "isMarked": false,
        "records": [
          {
            "$ref": "#/components/entities/StaffAttendanceRecord"
          }
        ]
      }
    }
  },
  "ATT_STAFF_MARK": {
    "request": {
      "body": {
        "date": "2026-11-12",
        "records": [
          {
            "staffId": "stf_21",
            "status": "PRESENT",
            "checkIn": "08:45",
            "checkOut": null,
            "remark": null
          }
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "present": 25,
        "absent": 1,
        "leave": 2
      }
    }
  },
  "ATT_STAFF_SELF_CHECKIN": {
    "request": {
      "body": {
        "action": "CHECK_IN"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "status": "PRESENT",
        "checkIn": "08:45",
        "checkOut": null
      }
    }
  },
  "ATT_STAFF_MONTHLY": {
    "request": {
      "query": {
        "month": "2026-11"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "month": "2026-11",
        "days": [
          "2026-11-02"
        ],
        "staff": [
          {
            "staffId": "stf_21",
            "name": "Anita Verma",
            "marks": {
              "2026-11-02": "PRESENT"
            },
            "presentCount": 20,
            "percent": 95
          }
        ]
      }
    }
  },
  "PERIODS_GET": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Period"
          }
        ],
        "workingDays": [
          1,
          2,
          3,
          4,
          5,
          6
        ]
      }
    }
  },
  "PERIODS_PUT": {
    "request": {
      "body": {
        "workingDays": [
          1,
          2,
          3,
          4,
          5,
          6
        ],
        "periods": [
          {
            "name": "Period 1",
            "startTime": "08:30",
            "endTime": "09:15",
            "isBreak": false,
            "order": 1
          }
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Period"
          }
        ]
      }
    }
  },
  "TIMETABLE_BY_CLASS": {
    "request": {
      "query": {
        "classId": "cls_05",
        "sectionId": "sec_05A"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "periods": [
          {
            "$ref": "#/components/entities/Period"
          }
        ],
        "entries": [
          {
            "$ref": "#/components/entities/TimetableEntry"
          }
        ]
      }
    }
  },
  "TIMETABLE_BY_TEACHER": {
    "request": {
      "query": {
        "staffId": "stf_21"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "periods": [
          {
            "$ref": "#/components/entities/Period"
          }
        ],
        "entries": [
          {
            "$ref": "#/components/entities/TimetableEntry"
          }
        ]
      }
    }
  },
  "TIMETABLE_ENTRY_UPSERT": {
    "request": {
      "body": {
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "dayOfWeek": 1,
        "periodId": "per_01",
        "subjectId": "sbj_math",
        "teacherId": "stf_21",
        "room": "R-101"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/TimetableEntry"
      }
    }
  },
  "TIMETABLE_ENTRY_DELETE": {
    "response": {
      "status": 204
    }
  },
  "TIMETABLE_SUBSTITUTE": {
    "request": {
      "body": {
        "date": "2026-11-13",
        "entryId": "ttb_01",
        "substituteTeacherId": "stf_22",
        "reason": "Leave"
      }
    },
    "response": {
      "status": 201,
      "data": {
        "id": "sbs_01",
        "date": "2026-11-13",
        "entryId": "ttb_01",
        "substituteTeacherId": "stf_22"
      }
    }
  },
  "TIMETABLE_FREE_TEACHERS": {
    "request": {
      "query": {
        "date": "2026-11-13",
        "periodId": "per_01"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "staffId": "stf_22",
            "name": "Ravi Kumar"
          }
        ]
      }
    }
  },
  "EXAMS_LIST": {
    "request": {
      "query": {
        "status": "SCHEDULED",
        "classId": "cls_05",
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Exam"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "EXAM_CREATE": {
    "request": {
      "body": {
        "name": "Half Yearly 2026",
        "type": "TERM",
        "startDate": "2026-12-01",
        "endDate": "2026-12-12",
        "classIds": [
          "cls_05"
        ],
        "gradeScaleId": "grs_01",
        "weightage": 50,
        "papers": [
          {
            "classId": "cls_05",
            "subjectId": "sbj_math",
            "date": "2026-12-02",
            "startTime": "10:00",
            "endTime": "12:00",
            "maxMarks": 100,
            "passMarks": 33,
            "room": "R-101"
          }
        ]
      }
    },
    "response": {
      "status": 201,
      "data": {
        "exam": {
          "$ref": "#/components/entities/Exam"
        },
        "papers": [
          {
            "$ref": "#/components/entities/ExamPaper"
          }
        ]
      }
    }
  },
  "EXAM_GET": {
    "response": {
      "status": 200,
      "data": {
        "exam": {
          "$ref": "#/components/entities/Exam"
        },
        "papers": [
          {
            "$ref": "#/components/entities/ExamPaper"
          }
        ],
        "progress": [
          {
            "classId": "cls_05",
            "subjectId": "sbj_math",
            "entered": 30,
            "total": 36,
            "isLocked": false
          }
        ]
      }
    }
  },
  "EXAM_UPDATE": {
    "request": {
      "body": {
        "name": "Half Yearly 2026",
        "startDate": "2026-12-01",
        "endDate": "2026-12-14",
        "papers": [
          {
            "id": "pap_01",
            "date": "2026-12-03",
            "startTime": "10:00",
            "endTime": "12:00",
            "maxMarks": 100,
            "passMarks": 33,
            "room": "R-102"
          }
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Exam"
      }
    }
  },
  "EXAM_DELETE": {
    "response": {
      "status": 204
    }
  },
  "EXAM_MARKS_GET": {
    "request": {
      "query": {
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "subjectId": "sbj_math"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "paper": {
          "$ref": "#/components/entities/ExamPaper"
        },
        "isLocked": false,
        "rows": [
          {
            "$ref": "#/components/entities/MarksRow"
          }
        ]
      }
    }
  },
  "EXAM_MARKS_SAVE": {
    "request": {
      "body": {
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "subjectId": "sbj_math",
        "rows": [
          {
            "studentId": "stu_01",
            "marks": 87.5,
            "isAbsent": false,
            "remark": null
          },
          {
            "studentId": "stu_02",
            "marks": null,
            "isAbsent": true,
            "remark": "Sick"
          }
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "saved": 36,
        "entered": 36,
        "total": 36
      }
    }
  },
  "EXAM_MARKS_LOCK": {
    "request": {
      "body": {
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "subjectId": "sbj_math"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "isLocked": true
      }
    }
  },
  "EXAM_MARKS_UNLOCK": {
    "request": {
      "body": {
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "subjectId": "sbj_math",
        "reason": "Correction"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "isLocked": false
      }
    }
  },
  "EXAM_MARKS_IMPORT": {
    "request": {
      "body": {
        "file": "<binary>",
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "subjectId": "sbj_math"
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/ImportJob"
      }
    }
  },
  "EXAM_PUBLISH": {
    "request": {
      "body": {
        "classIds": [
          "cls_05"
        ],
        "notifyParents": true,
        "channels": [
          "IN_APP",
          "SMS"
        ],
        "showRank": true
      }
    },
    "response": {
      "status": 200,
      "data": {
        "exam": {
          "$ref": "#/components/entities/Exam"
        },
        "notified": 342
      }
    }
  },
  "EXAM_UNPUBLISH": {
    "request": {
      "body": {
        "reason": "Error in marks"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Exam"
      }
    }
  },
  "EXAM_RESULTS": {
    "request": {
      "query": {
        "classId": "cls_05",
        "sectionId": "sec_05A"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "subjects": [
          "Mathematics",
          "English"
        ],
        "rows": [
          {
            "studentId": "stu_01",
            "name": "Aarav Sharma",
            "marks": {
              "Mathematics": 87.5,
              "English": 80
            },
            "total": 450,
            "percentage": 90,
            "grade": "A1",
            "rank": 3,
            "result": "PASS"
          }
        ],
        "stats": {
          "passPercent": 95,
          "average": 72.4,
          "topper": "Aarav Sharma"
        }
      }
    }
  },
  "REPORT_CARD_GET": {
    "request": {
      "query": {
        "examId": "exm_01"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/ReportCard"
      }
    }
  },
  "REPORT_CARD_PDF_BULK": {
    "request": {
      "body": {
        "classId": "cls_05",
        "sectionId": "sec_05A",
        "studentIds": []
      }
    },
    "response": {
      "status": 200,
      "data": {
        "pdfUrl": "https://files/reportcards.pdf"
      }
    }
  },
  "ADMIT_CARDS_PDF": {
    "request": {
      "body": {
        "classId": "cls_05",
        "sectionId": "sec_05A"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "pdfUrl": "https://files/admit.pdf",
        "skippedForDues": [
          "stu_09"
        ]
      }
    }
  },
  "PORTAL_RESULTS": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "examId": "exm_01",
            "examName": "Half Yearly 2026",
            "percentage": 90,
            "grade": "A1",
            "publishedAt": "2026-12-20T10:00:00Z"
          }
        ]
      }
    }
  },
  "FEE_CATEGORIES_LIST": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/FeeCategory"
          }
        ]
      }
    }
  },
  "FEE_CATEGORY_CREATE": {
    "request": {
      "body": {
        "name": "Transport Fee",
        "code": "TRN",
        "isRefundable": false
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/FeeCategory"
      }
    }
  },
  "FEE_STRUCTURES_LIST": {
    "request": {
      "query": {
        "classId": "cls_05"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/FeeStructure"
          }
        ]
      }
    }
  },
  "FEE_STRUCTURE_CREATE": {
    "request": {
      "body": {
        "name": "Class 5 - 2026-27",
        "classIds": [
          "cls_05"
        ],
        "items": [
          {
            "categoryId": "fcat_tuition",
            "amount": 1500,
            "frequency": "MONTHLY",
            "dueDay": 10,
            "lateFeePerDay": 5
          }
        ],
        "applyToExistingStudents": true
      }
    },
    "response": {
      "status": 201,
      "data": {
        "structure": {
          "$ref": "#/components/entities/FeeStructure"
        },
        "linesGenerated": 432
      }
    }
  },
  "FEE_STRUCTURE_UPDATE": {
    "request": {
      "body": {
        "name": "Class 5 - 2026-27",
        "items": [
          {
            "categoryId": "fcat_tuition",
            "amount": 1600,
            "frequency": "MONTHLY",
            "dueDay": 10,
            "lateFeePerDay": 5
          }
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/FeeStructure"
      }
    }
  },
  "FEE_ASSIGN_STUDENT": {
    "request": {
      "body": {
        "categoryId": "fcat_transport",
        "amount": 800,
        "frequency": "MONTHLY",
        "fromPeriod": "2026-11",
        "toPeriod": "2027-03"
      }
    },
    "response": {
      "status": 201,
      "data": {
        "linesCreated": 5
      }
    }
  },
  "FEE_STUDENT_LEDGER": {
    "response": {
      "status": 200,
      "data": {
        "student": {
          "id": "stu_01",
          "name": "Aarav Sharma",
          "className": "Class 5-A",
          "admissionNo": "ADM-2026-0001",
          "guardianName": "Rakesh Sharma",
          "guardianPhone": "+919811111111"
        },
        "totalAmount": 18000,
        "totalPaid": 13500,
        "totalConcession": 0,
        "totalDue": 4500,
        "lines": [
          {
            "$ref": "#/components/entities/FeeLine"
          }
        ],
        "payments": [
          {
            "$ref": "#/components/entities/FeePayment"
          }
        ]
      }
    }
  },
  "FEE_COLLECT": {
    "request": {
      "headers": {
        "Idempotency-Key": "uuid"
      },
      "body": {
        "studentId": "stu_01",
        "lines": [
          {
            "feeLineId": "fln_01",
            "amount": 1550
          }
        ],
        "mode": "UPI",
        "reference": "UPI12345",
        "paidAt": "2026-11-12T10:15:00Z",
        "remark": "",
        "sendReceipt": {
          "channels": [
            "SMS",
            "EMAIL"
          ]
        }
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/FeePayment"
      }
    }
  },
  "FEE_PAYMENTS_LIST": {
    "request": {
      "query": {
        "from": "2026-11-01",
        "to": "2026-11-12",
        "mode": "UPI",
        "classId": "cls_05",
        "q": "RCPT",
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/FeePayment"
          }
        ],
        "totals": {
          "amount": 84500,
          "count": 23
        }
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "FEE_RECEIPT": {
    "response": {
      "status": 200,
      "data": {
        "payment": {
          "$ref": "#/components/entities/FeePayment"
        },
        "school": {
          "name": "Sunrise Public School",
          "address": "12 Civil Lines",
          "phone": "+915322000000",
          "logoUrl": null
        },
        "amountInWords": "Three thousand rupees only",
        "pdfUrl": "https://files/receipt.pdf"
      }
    }
  },
  "FEE_PAYMENT_REFUND": {
    "request": {
      "body": {
        "amount": 500,
        "reason": "Excess paid"
      }
    },
    "response": {
      "status": 202,
      "data": {
        "approvalId": "apr_09",
        "status": "PENDING"
      }
    }
  },
  "FEE_CONCESSION": {
    "request": {
      "body": {
        "studentId": "stu_01",
        "feeLineIds": [
          "fln_01"
        ],
        "type": "PERCENT",
        "value": 10,
        "reason": "Sibling discount"
      }
    },
    "response": {
      "status": 201,
      "data": {
        "approvalId": "apr_10",
        "status": "PENDING",
        "estimatedAmount": 150
      }
    }
  },
  "FEE_DUES": {
    "request": {
      "query": {
        "classId": "cls_05",
        "minAmount": 500,
        "overdueOnly": true,
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "studentId": "stu_01",
            "name": "Aarav Sharma",
            "className": "Class 5-A",
            "guardianName": "Rakesh Sharma",
            "guardianPhone": "+919811111111",
            "totalDue": 4500,
            "oldestDueDate": "2026-09-10",
            "overdueDays": 63
          }
        ],
        "totals": {
          "due": 640000,
          "students": 120
        }
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "FEE_REMINDERS_SEND": {
    "request": {
      "body": {
        "studentIds": [
          "stu_01"
        ],
        "channels": [
          "SMS",
          "IN_APP"
        ],
        "templateId": "tpl_fee_due",
        "message": null
      }
    },
    "response": {
      "status": 202,
      "data": {
        "queued": 1
      }
    }
  },
  "FEE_SUMMARY": {
    "response": {
      "status": 200,
      "data": {
        "collectedToday": 84500,
        "collectedThisMonth": 920000,
        "totalDue": 640000,
        "overdue": 210000,
        "collectionRatePercent": 78.5,
        "byMode": [
          {
            "mode": "UPI",
            "amount": 40000
          }
        ]
      }
    }
  },
  "FEE_ONLINE_INITIATE": {
    "request": {
      "body": {
        "studentId": "stu_01",
        "feeLineIds": [
          "fln_01"
        ],
        "returnUrl": "https://app/fees/return"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "orderId": "ord_77",
        "gateway": "RAZORPAY",
        "amount": 1550,
        "gatewayPayload": {
          "key": "rzp_test_x",
          "orderId": "order_x"
        }
      }
    }
  },
  "FEE_ONLINE_CONFIRM": {
    "request": {
      "body": {
        "orderId": "ord_77",
        "paymentId": "pay_x",
        "signature": "sig"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/FeePayment"
      }
    }
  },
  "NOTICES_LIST": {
    "request": {
      "query": {
        "status": "SENT",
        "audience": "CLASS",
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Notice"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "NOTICE_CREATE": {
    "request": {
      "body": {
        "title": "Annual Day Rehearsal",
        "body": "Rehearsal on Monday.",
        "audience": "CLASS",
        "classIds": [
          "cls_05"
        ],
        "sectionIds": [],
        "userIds": [],
        "channels": [
          "IN_APP",
          "SMS"
        ],
        "attachmentFileIds": [
          "fil_01"
        ],
        "scheduledAt": null,
        "templateId": null
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/Notice"
      }
    }
  },
  "NOTICE_GET": {
    "response": {
      "status": 200,
      "data": {
        "notice": {
          "$ref": "#/components/entities/Notice"
        },
        "recipients": [
          {
            "userId": "usr_88",
            "name": "Rakesh Sharma",
            "channel": "SMS",
            "status": "DELIVERED",
            "readAt": null
          }
        ]
      }
    }
  },
  "NOTICE_DELETE": {
    "response": {
      "status": 204
    }
  },
  "NOTICE_RECIPIENT_COUNT": {
    "request": {
      "body": {
        "audience": "CLASS",
        "classIds": [
          "cls_05"
        ],
        "sectionIds": [],
        "userIds": []
      }
    },
    "response": {
      "status": 200,
      "data": {
        "count": 36,
        "withoutContact": 1
      }
    }
  },
  "TEMPLATES_LIST": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "id": "tpl_fee_due",
            "name": "Fee due reminder",
            "channel": "SMS",
            "body": "Dear {{guardianName}}, fee of Rs {{amount}} for {{studentName}} is due.",
            "variables": [
              "guardianName",
              "amount",
              "studentName"
            ]
          }
        ]
      }
    }
  },
  "TEMPLATE_UPSERT": {
    "request": {
      "body": {
        "name": "Fee due reminder",
        "channel": "SMS",
        "body": "Dear {{guardianName}}, fee of Rs {{amount}} is due."
      }
    },
    "response": {
      "status": 200,
      "data": {
        "id": "tpl_fee_due",
        "name": "Fee due reminder",
        "channel": "SMS",
        "body": "Dear {{guardianName}}, fee of Rs {{amount}} is due.",
        "variables": [
          "guardianName",
          "amount"
        ]
      }
    }
  },
  "THREADS_LIST": {
    "request": {
      "query": {
        "q": "",
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Thread"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "THREAD_CREATE": {
    "request": {
      "body": {
        "studentId": "stu_01",
        "recipientUserIds": [
          "usr_88"
        ],
        "subject": "Homework doubt",
        "firstMessage": "Hello"
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/Thread"
      }
    }
  },
  "THREAD_MESSAGES": {
    "request": {
      "query": {
        "cursor": null,
        "limit": 30
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Message"
          }
        ],
        "nextCursor": null
      }
    }
  },
  "THREAD_SEND": {
    "request": {
      "body": {
        "text": "Please check the worksheet",
        "attachmentFileIds": []
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/Message"
      }
    }
  },
  "THREAD_READ": {
    "response": {
      "status": 204
    }
  },
  "PORTAL_NOTICES": {
    "request": {
      "query": {
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Notice"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "ROLES_LIST": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/Role"
          }
        ]
      }
    }
  },
  "ROLE_CREATE": {
    "request": {
      "body": {
        "name": "Front Office",
        "description": "Reception staff",
        "permissions": [
          "students.view",
          "fees.collect"
        ],
        "cloneFromRoleId": null
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/Role"
      }
    }
  },
  "ROLE_UPDATE": {
    "request": {
      "body": {
        "name": "Front Office",
        "description": "Reception staff",
        "permissions": [
          "students.view",
          "fees.collect",
          "students.create"
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Role"
      }
    }
  },
  "ROLE_DELETE": {
    "response": {
      "status": 204
    }
  },
  "PERMISSIONS_CATALOG": {
    "response": {
      "status": 200,
      "data": {
        "groups": [
          {
            "module": "Students",
            "permissions": [
              {
                "key": "students.view",
                "label": "View students"
              },
              {
                "key": "students.create",
                "label": "Add students"
              }
            ]
          }
        ]
      }
    }
  },
  "USERS_LIST": {
    "request": {
      "query": {
        "roleId": "rol_01",
        "status": "ACTIVE",
        "q": "",
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/User"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "USER_INVITE": {
    "request": {
      "body": {
        "name": "Priya Nair",
        "email": "priya@school.edu",
        "phone": "+919855555555",
        "roleId": "rol_accountant",
        "linkedStaffId": null
      }
    },
    "response": {
      "status": 201,
      "data": {
        "user": {
          "$ref": "#/components/entities/User"
        },
        "inviteLink": "https://app/accept-invite?token=abc"
      }
    }
  },
  "USER_UPDATE": {
    "request": {
      "body": {
        "name": "Priya Nair",
        "phone": "+919855555555",
        "roleId": "rol_admin"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/User"
      }
    }
  },
  "USER_STATUS": {
    "request": {
      "body": {
        "status": "INACTIVE"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/User"
      }
    }
  },
  "USER_RESET_PASSWORD": {
    "response": {
      "status": 200,
      "data": {
        "message": "Reset link sent"
      }
    }
  },
  "INVITE_ACCEPT": {
    "request": {
      "body": {
        "token": "abc",
        "password": "Secret@123"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "accessToken": "jwt...",
        "refreshToken": "rt..."
      }
    }
  },
  "REPORTS_CATALOG": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/ReportDefinition"
          }
        ]
      }
    }
  },
  "REPORT_DATA": {
    "request": {
      "body": {
        "filters": {
          "classId": "cls_05",
          "status": "ACTIVE",
          "from": "2026-11-01",
          "to": "2026-11-12"
        },
        "page": 1,
        "pageSize": 50,
        "sortBy": "fullName",
        "sortOrder": "asc"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "title": "Student List",
        "generatedAt": "2026-11-12T10:00:00Z",
        "filtersApplied": [
          {
            "label": "Class",
            "value": "Class 5"
          }
        ],
        "columns": [
          {
            "key": "admissionNo",
            "label": "Admission No",
            "type": "string",
            "width": 18
          },
          {
            "key": "fullName",
            "label": "Name",
            "type": "string",
            "width": 28
          },
          {
            "key": "feeDue",
            "label": "Fee Due",
            "type": "currency",
            "width": 14,
            "total": true
          }
        ],
        "rows": [
          {
            "admissionNo": "ADM-2026-0001",
            "fullName": "Aarav Sharma",
            "feeDue": 4500
          }
        ],
        "totals": {
          "feeDue": 4500
        }
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "REPORT_EXPORT_JOB": {
    "request": {
      "body": {
        "format": "xlsx",
        "filters": {
          "classId": "cls_05"
        }
      }
    },
    "response": {
      "status": 202,
      "data": {
        "jobId": "job_01",
        "status": "QUEUED"
      }
    }
  },
  "REPORT_EXPORT_STATUS": {
    "response": {
      "status": 200,
      "data": {
        "jobId": "job_01",
        "status": "COMPLETED",
        "progress": 100,
        "downloadUrl": "https://files/report.xlsx",
        "expiresAt": "2026-11-13T10:00:00Z"
      }
    }
  },
  "BULK_TEMPLATE": {
    "request": {
      "query": {
        "format": "xlsx"
      }
    },
    "response": {
      "status": 200,
      "data": "<binary file>",
      "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  },
  "BULK_UPLOAD": {
    "request": {
      "body": {
        "file": "<binary>",
        "entity": "STUDENTS",
        "options": {
          "skipDuplicates": true,
          "updateExisting": false,
          "defaultClassId": null
        }
      }
    },
    "response": {
      "status": 201,
      "data": {
        "$ref": "#/components/entities/ImportJob"
      }
    }
  },
  "BULK_GET": {
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/ImportJob"
      }
    }
  },
  "BULK_ROWS": {
    "request": {
      "query": {
        "status": "INVALID",
        "page": 1,
        "pageSize": 50
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "row": 5,
            "status": "INVALID",
            "values": {
              "firstName": "Diya",
              "dob": "32-13-2014"
            },
            "errors": [
              {
                "field": "dob",
                "message": "Invalid date. Use YYYY-MM-DD"
              }
            ]
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "BULK_COMMIT": {
    "request": {
      "headers": {
        "Idempotency-Key": "uuid"
      },
      "body": {
        "skipInvalid": true
      }
    },
    "response": {
      "status": 202,
      "data": {
        "importId": "imp_01",
        "status": "COMMITTING"
      }
    }
  },
  "BULK_ERROR_REPORT": {
    "response": {
      "status": 200,
      "data": "<binary file>",
      "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  },
  "BULK_CANCEL": {
    "response": {
      "status": 204
    }
  },
  "BULK_HISTORY": {
    "request": {
      "query": {
        "entity": "STUDENTS",
        "page": 1,
        "pageSize": 20
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/ImportJob"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "SCHOOL_PROFILE_GET": {
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Tenant"
      }
    }
  },
  "SCHOOL_PROFILE_UPDATE": {
    "request": {
      "body": {
        "name": "Sunrise Public School",
        "board": "CBSE",
        "udiseCode": "09XXXXXXXX",
        "logoFileId": "fil_01",
        "brandColor": "#4F46E5",
        "address": {
          "line1": "12 Civil Lines",
          "city": "Prayagraj",
          "state": "Uttar Pradesh",
          "pincode": "211001"
        },
        "phone": "+915322000000",
        "email": "info@sunrise.edu"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "$ref": "#/components/entities/Tenant"
      }
    }
  },
  "PREFERENCES_GET": {
    "response": {
      "status": 200,
      "data": {
        "admissionNoFormat": "ADM-{YYYY}-{SEQ:4}",
        "receiptNoFormat": "RCPT-{YYYY}-{SEQ:5}",
        "attendanceCutoffTime": "10:00",
        "lateFeeEnabled": true,
        "blockAdmitCardOnDues": false,
        "concessionApprovalThresholdPercent": 10,
        "notifyParentOnAbsent": true,
        "defaultChannels": [
          "IN_APP",
          "SMS"
        ],
        "workingDays": [
          1,
          2,
          3,
          4,
          5,
          6
        ],
        "dateFormat": "DD/MM/YYYY",
        "language": "en"
      }
    }
  },
  "PREFERENCES_UPDATE": {
    "request": {
      "body": {
        "attendanceCutoffTime": "10:30",
        "lateFeeEnabled": true,
        "blockAdmitCardOnDues": true,
        "concessionApprovalThresholdPercent": 10,
        "notifyParentOnAbsent": true,
        "defaultChannels": [
          "IN_APP"
        ]
      }
    },
    "response": {
      "status": 200,
      "data": {
        "message": "Preferences saved"
      }
    }
  },
  "FILE_UPLOAD": {
    "request": {
      "body": {
        "file": "<binary>",
        "purpose": "STUDENT_PHOTO"
      }
    },
    "response": {
      "status": 201,
      "data": {
        "id": "fil_01",
        "name": "photo.png",
        "url": "https://files/photo.png",
        "size": 20480,
        "mimeType": "image/png"
      }
    }
  },
  "AUDIT_LOGS": {
    "request": {
      "query": {
        "actorId": "usr_01",
        "entity": "Student",
        "action": "STUDENT_CREATED",
        "from": "2026-11-01",
        "to": "2026-11-12",
        "page": 1,
        "pageSize": 50
      }
    },
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "$ref": "#/components/entities/AuditLog"
          }
        ]
      },
      "meta": {
        "$ref": "#/components/pagination"
      }
    }
  },
  "PORTAL_CHILDREN": {
    "response": {
      "status": 200,
      "data": {
        "items": [
          {
            "id": "stu_01",
            "name": "Aarav Sharma",
            "className": "Class 5-A",
            "photoUrl": null
          }
        ]
      }
    }
  },
  "PORTAL_OVERVIEW": {
    "response": {
      "status": 200,
      "data": {
        "student": {
          "id": "stu_01",
          "name": "Aarav Sharma",
          "className": "Class 5-A"
        },
        "attendance": {
          "monthPercent": 94.5,
          "todayStatus": "PRESENT"
        },
        "fees": {
          "totalDue": 4500,
          "nextDueDate": "2026-12-10",
          "nextDueAmount": 1500
        },
        "latestResult": {
          "examName": "Unit Test 1",
          "percentage": 88
        },
        "timetableToday": [
          {
            "period": "Period 1",
            "subject": "Mathematics",
            "teacher": "Anita Verma"
          }
        ],
        "notices": [
          {
            "id": "ntc_01",
            "title": "Annual Day Rehearsal",
            "sentAt": "2026-11-12T10:00:00Z"
          }
        ]
      }
    }
  },
  "PORTAL_ATTENDANCE": {
    "request": {
      "query": {
        "month": "2026-11"
      }
    },
    "response": {
      "status": 200,
      "data": {
        "month": "2026-11",
        "marks": {
          "2026-11-02": "PRESENT",
          "2026-11-03": "ABSENT"
        },
        "percent": 94.5
      }
    }
  },
  "PORTAL_FEES": {
    "response": {
      "status": 200,
      "data": {
        "totalDue": 4500,
        "lines": [
          {
            "$ref": "#/components/entities/FeeLine"
          }
        ],
        "payments": [
          {
            "$ref": "#/components/entities/FeePayment"
          }
        ]
      }
    }
  },
  "PORTAL_LEAVE_APPLY": {
    "request": {
      "body": {
        "fromDate": "2026-11-20",
        "toDate": "2026-11-21",
        "reason": "Family function"
      }
    },
    "response": {
      "status": 201,
      "data": {
        "id": "sle_01",
        "status": "PENDING"
      }
    }
  }
} as const;
