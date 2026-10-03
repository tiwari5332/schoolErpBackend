# School ERP — Progress & Completed Work Log

> **NOTE / UPDATE POLICY:**
> This file tracks completed milestones, implemented modules, and work history.
> **Rule for AI Assistant**: Only update this file when the user explicitly asks to write or log completed work.

---

## Completed Work

### 1. Authentication & Identity Management (`AuthController`, `OtpController`, `AuthService`, `OtpService`)
- [x] **School Registration (`POST /api/auth/register`)**:
  - Registers a new school entity (`School`).
  - Creates the primary School Administrator (`Admin`) with BCrypt password hashing.
  - Automatically provisions and binds the initial `BASIC` subscription plan.
  - Assigns the system `ADMIN` role to the created administrator.
- [x] **Administrator Login (`POST /api/auth/admin/login`)**:
  - MSISDN + password authentication.
  - Enforces single active session rule (invalidates previous sessions via `AuthSessionRepository.deactivateAllActiveSessions`).
  - Issues stateless HS256 JWT containing `actorType: ADMIN`, `actorId`, `schoolId`, plan code, and plan features.
- [x] **Teacher Login (`POST /api/auth/teacher/login`)**:
  - Login via teacher's registered MSISDN (`loginMsisdn`) + password.
  - Issues JWT scoped to teacher's school and permissions.
- [x] **Parent Multi-School Login (2-Step Flow)**:
  - **Step 1 (`GET /api/auth/parent/schools?msisdn=...`)**: Fetches all school accounts associated with the guardian's mobile number across different schools.
  - **Step 2 (`POST /api/auth/parent/login?parentAccountId=...&deviceId=...`)**: Logs into the chosen school tenant and returns JWT scoped to that specific `ParentAccount`.
- [x] **User Initial Signup Check (`POST /api/auth/signup`)**:
  - Unified eligibility check for newly onboarded Teachers and Parents to set up their accounts.
  - Verifies account existence, checks that initial password hasn't already been created (`passwordSet == false`).
  - Issues temporary cryptographic `signupToken` containing actor details.
- [x] **Initial Password Creation (`POST /api/auth/create-password`)**:
  - Once-in-a-lifetime password setup using validated `signupToken`.
  - Encrypts password, sets `passwordSet = true`, and activates user for standard login.
- [x] **Password Reset & Recovery**:
  - **Forgot Password (`POST /api/auth/forgot-password`)**: Triggers OTP dispatch to user's registered phone/email.
  - **Reset Password (`POST /api/auth/reset-password`)**: Validates OTP code and securely updates password.
  - **Change Password (`POST /api/auth/change-password`)**: Allows password change with old password verification.
- [x] **OTP Lifecycle Management (`/api/auth/otp/*`)**:
  - Endpoints: `POST /api/auth/otp/send`, `POST /api/auth/otp/resend`, `POST /api/auth/otp/verify`.
  - Multi-channel delivery architecture via `NotificationFactory` (Email, SMS, WhatsApp).
  - Single-use and expiration enforcement on OTP codes.
- [x] **Token & Hash Specifications**:
  - **Login Token (Session JWT)**:
    - **Signing Algorithm**: HMAC-SHA256 (`HS256`) signed with `app.jwt.secret`.
    - **Fields / Claims Contained**:
      - `sub`: Actor ID (`UUID` of the logged-in Admin, Teacher, or ParentAccount).
      - `actorType`: Identity type (`ADMIN`, `TEACHER`, `PARENT`, `SUPER_ADMIN`).
      - `schoolId`: School UUID string representing tenant context (`null` for Super Admin).
      - `planCode`: Active subscription plan code (`BASIC`, `ADVANCE`, `PREMIUM`, `ENTERPRISE`).
      - `features`: Array/List of enabled feature codes for this school plan (`List<String>`).
      - `iat`: Issued At epoch timestamp.
      - `exp`: Expiration epoch timestamp (configured via `app.jwt.expiry-minutes`, default 60 mins).
  - **Signup Token (`signupToken`)**:
    - **Signing Algorithm**: HMAC-SHA256 (`HS256`) with 15-minute expiration.
    - **Fields / Claims Contained**:
      - `sub`: Actor ID (`UUID`).
      - `purpose`: Fixed guard claim string `"SIGNUP"`.
      - `actorType`: Identity type (`TEACHER` or `PARENT`).
      - `schoolId`: School UUID string.
      - `msisdn`: Registered mobile phone number.
      - `iat` & `exp`: 15-minute validity timestamps.
  - **Database Hash Token (`AuthSession.tokenHash`)**:
    - **Field Stored**: `tokenHash` in table `auth_session`.
    - **What is Hashed**: The entire JWT token string via Java `token.hashCode()`, formatted as hex: `Integer.toHexString(token.hashCode())`.
    - **Purpose**: Tracks active sessions in DB without storing raw tokens to enforce the "one active session at a time" rule.
  - **Other Auth Hash Fields**:
    - `passwordHash` (in `admin`, `teacher`, `parent_account`): BCrypt hash of user's raw password.
    - `otpHash` (in `otp_request`): BCrypt hash of the 6-digit OTP code (`passwordEncoder.encode(otpCode)`).

---

## Quick Context For Resuming Work
- **Completed Core Controller**: `AuthController`, `OtpController`, `PublicRoleController`, `HealthController`.
- **Next Modules Pending Implementation / Review**:
  - Academic Setup (`ClassMasterController`, `DepartmentController`, `SectionController`, `SubjectController`)
  - Student & Teacher Onboarding (`StudentOnboardingController`, `TeacherOnboardingController`)
  - Fee Management & Payments (`FeeSetupController`, `FeePaymentController`, `FeeInvoiceController`, `FeeWaiverController`, `RefundController`)
  - Tenancy & Billing (`PlanController`, `SchoolController`, `SubscriptionController`, `TopUpController`)
  - Communication Hub (Pending service/controller implementation)
