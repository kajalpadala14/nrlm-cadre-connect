# Standard Operating Procedure
## NRLM Cadre Connect — System Usage
**District: Dantewada, Chhattisgarh | Programme: National Rural Livelihoods Mission**

---

**Document Version:** 1.0
**Effective Date:** June 2026
**Applicable Roles:** Field Cadre (PRP / FLCRP / RBK / IFC Anchor / SR·CRP), Block Officer, System Admin

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Login & Access](#2-login--access)
3. [Field Cadre — Daily Workflow](#3-field-cadre--daily-workflow)
4. [Block Officer — Approval Workflow](#4-block-officer--approval-workflow)
5. [Admin — User Management](#5-admin--user-management)
6. [Admin — Attendance Management](#6-admin--attendance-management)
7. [Admin — Reports & Exports](#7-admin--reports--exports)
8. [Offline Usage](#8-offline-usage)
9. [Notifications](#9-notifications)
10. [Common Errors & Resolution](#10-common-errors--resolution)
11. [Data Rules & Constraints](#11-data-rules--constraints)

---

## 1. System Overview

NRLM Cadre Connect is the official field activity tracking and monitoring system for Dantewada district. All registered cadres must use this system to report daily field work. Block officers use it to approve activities and monitor attendance. District admin manages users, attendance records, and exports reports.

**Access URL:** `http://localhost:8080` (local) or the deployed domain provided by your district IT team.

**Supported roles:**

| Role | Code | Dashboard Access | Cadre Portal |
|------|------|-----------------|--------------|
| System Admin | admin | Full `/dashboard` | No |
| Block Officer | block_officer | Full `/dashboard` | No |
| Field Cadre — PRP | PRP | No | `/cadre` |
| Field Cadre — FLCRP | FLCRP | No | `/cadre` |
| Field Cadre — RBK | RBK | No | `/cadre` |
| Field Cadre — IFC Anchor | IFC_Anchor | No | `/cadre` |
| Field Cadre — SR·CRP | SR_CRP | No | `/cadre` |

---

## 2. Login & Access

### 2.1 How to Log In

1. Open the system URL in a browser (Chrome or Edge recommended).
2. On the public landing page (`/`), click **Login to Dashboard**.
3. You will be taken to the login page (`/auth`).
4. Enter your **User ID** (e.g. `rajesh_prp`) and your **4-digit PIN**.
5. Click **Sign In**.

> **First-time login:** The system admin must create your account before you can log in. Contact your block coordinator if you do not have credentials.

### 2.2 After Login

- Cadres are automatically sent to the **Cadre Portal** (`/cadre`).
- Block officers and admins are automatically sent to the **Dashboard** (`/dashboard`).

### 2.3 Forgotten PIN

Contact your system admin. Only the admin can reset your PIN via the User Management screen. You cannot reset it yourself.

### 2.4 Language Toggle

The system supports **English** and **हिंदी**. Use the language button (top-right corner of the login page or header) to switch at any time. Your preference is saved in the browser.

---

## 3. Field Cadre — Daily Workflow

Field cadres follow this cycle every working day:

```
Login → View Home Dashboard → Submit Activity Report → Check Status → View History
```

### 3.1 Cadre Home Dashboard (`/cadre`)

After login, you see:
- Your **today's attendance status** (Present / Absent / On Leave / Not Marked)
- **Today's summary:** activities submitted, villages covered, beneficiaries, photos uploaded
- **Monthly summary:** total activities, attendance %, approved/pending/rejected counts
- **Quick action buttons:** Submit Today's Work · My Work History · My Profile · Help
- **Recent activities** (last 5) with photo thumbnail, status badge, and beneficiary count
- **7-day activity trend** bar chart
- **Pending actions panel** (appears only if you have missing photos, absent days, or rejected activities)
- **Notifications** (unread only, most recent 10)

### 3.2 Submitting a Daily Activity Report

**Route:** `/cadre/submit` — click **"काम सबमिट करें / Submit Today's Work"** from home.

**Step-by-step:**

**Step 1 — Date & Activity Type**
- Date defaults to today. You cannot select a future date.
- Select the Activity Type from the dropdown:
  - SHG Meeting, VO Meeting, Training, Farmer Visit, Livelihood Demo, Bank Linkage, Monitoring Visit, Record Verification, Community Mobilization, Enterprise Promotion, Other

**Step 2 — Location**
- State: `Chhattisgarh` (fixed, cannot change)
- District: `Dantewada` (fixed)
- Block: Pre-filled from your profile. You may change it if needed.
- **Panchayat:** Type the panchayat name (e.g. `Kalnar`) — required
- **Village:** Type the village name (e.g. `Reslapur`) — required

**Step 3 — Beneficiaries**
- Enter the number of women benefited (0–999).

**Step 4 — GPS Geotag**
- The system automatically captures your GPS location when the page loads.
- Allow location access in your browser when prompted.
- If GPS is granted, coordinates appear in the field (e.g. `20.123456° N, 81.234567° E`).
- **If GPS is denied, submission is blocked.** You must enable location access in browser settings and reload the page.
- You cannot manually edit the GPS field.

**Step 5 — Description Notes**
- Optional. Max 500 characters.
- Describe the meeting outcome, agenda points, recovery statistics, etc.

**Step 6 — Photo Evidence**
- Click the camera icon area to select photos from your device or camera.
- Maximum 10 photos per submission.
- At least 1 photo is strongly recommended — attendance is only auto-marked Present when a photo is included.

**Step 7 — PDF Attachment (Optional)**
- Attach meeting minutes or related documents.
- Maximum file size: 10MB.
- Accepted formats: `.pdf`, `.docx`

**Step 8 — Auto-Attendance Toggle**
- Checkbox: "उपस्थिति स्वतः दर्ज / Auto-Mark Attendance"
- Default: ON
- When ON and a photo is uploaded, your attendance for that date is automatically marked **Present**.
- If no photo is uploaded, attendance is NOT auto-marked even if the toggle is ON.

**Step 9 — Submit**
- Click **"सबमिट करें / Submit Report"** to submit with status `Pending`.
- Click **"ड्राफ्ट सहेजें / Save Draft"** to save locally without sending to the server.
- A duplicate check runs: you cannot submit the same activity type + village + date twice.

**After successful submission:**
- You are redirected to Activity History (`/cadre/history`).
- A success notification is shown.
- If auto-attendance was triggered, a second toast confirms attendance was marked.

### 3.3 Activity History (`/cadre/history`)

Shows all your submitted activities with:
- Date, activity type, village, block
- Status badge: **Pending** (amber) · **Approved** (green) · **Rejected** (red)
- Photo thumbnail if uploaded
- For Rejected activities: rejection reason from the block officer
- **Edit** button (only available while status is Pending)
- **Delete** button (only available while status is Pending)
- **Download Report** button (available for Approved activities)
- **Upload Photo** button (if photo is missing and attendance is pending verification)

### 3.4 Activity Status Flow

```
Submitted → Pending → Approved  (by Block Officer)
                    → Rejected  (by Block Officer, with comment)
```

You receive a notification whenever your activity is approved or rejected.

### 3.5 My Profile (`/cadre/profile`)

View your profile details: name, cadre type, block, village, phone, joining date.

Contact your admin to update any profile information.

---

## 4. Block Officer — Approval Workflow

Block officers access the full dashboard at `/dashboard`. Their primary responsibility is approving activity submissions from cadres in their block.

### 4.1 Dashboard Overview (`/dashboard`)

The overview shows:
- **Attendance KPI card** with live Present / Absent / On Leave counts
  - Click **"View"** next to each status to see which cadres are in that state today
- **Activities Today** count with geotag count
- **Villages Covered** today
- **Pending Approvals** count (highlighted in red if > 0)
- **Block-wise Performance Table**
- **Recent Activity Feed** (latest 6 submissions)

### 4.2 Approving Activity Submissions (`/dashboard/approvals`)

**Tab: Activity Submissions**

Each pending item shows:
- Cadre name and role
- Village and panchayat
- Date
- Activity type
- Description
- Beneficiary count
- Photo evidence (click to expand full-screen)
- PDF document link (if attached)

**To Approve:**
1. Review the photo evidence and activity details.
2. Optionally add a comment in the text box.
3. Click **"मंजूर / Approve"** (green button).
4. The cadre receives an approval notification automatically.

**To Reject:**
1. You **must** enter a comment explaining the reason.
2. Click **"अस्वीकार / Reject"** (red button).
3. The cadre receives a rejection notification with your comment.

**Tab: Attendance Verifications**

This tab shows cadres whose attendance is `pending_verification` — they submitted a report without photo evidence.

For each item you can:
- **Verify Present** — marks the cadre's attendance as `present`
- **Reject (Absent)** — marks the cadre's attendance as `absent`

Both actions send a notification to the cadre.

### 4.3 Attendance Management (`/dashboard/attendance`)

**Viewing attendance for a specific date:**
1. Open the Filter Panel.
2. Select the date using the calendar picker.
3. Only cadres with a recorded attendance status on that date are shown.
4. Use the Block filter to narrow to your block.
5. Use the Search field to find a specific cadre by name or role.

**Manually changing a cadre's status:**
1. Find the cadre row.
2. Click one of the status buttons: `Present | Absent | Leave | Late`
3. The system updates the record in real time.

**Exporting attendance:**
- Click **"एक्सेल डाउनलोड / Export Excel"** to download a CSV file of the current filtered view.

### 4.4 Reports (`/dashboard/reports`)

**Available report types:**
| Tab | What it contains |
|-----|-----------------|
| Attendance Report | Date-range attendance records with check-in/check-out times |
| Activity Report | All activity submissions with status, beneficiary count, photo evidence flag |
| Cadre Performance | Per-cadre summary: attendance %, activities, approval rate, villages, beneficiaries |
| Block Performance | Block-wise aggregate: cadre count, activities, approval rate |

**Using reports:**
1. Select a date preset (Today / This Week / This Month / Last Month) or custom range.
2. Select Block filter (admin only — block officers are auto-scoped).
3. Apply additional filters (activity type, status, role, name search) within each tab.
4. Click **Download Excel (.xlsx)** or **Download CSV** to export full data.

> Note: The table view shows a maximum of 200 rows. Use Export for complete data.

---

## 5. Admin — User Management

**Route:** `/dashboard/users`

### 5.1 Adding a New Cadre

1. Click **"जोड़ें / Add Cadre"**.
2. Fill in the form:
   - Full Name (required)
   - Mobile Number (10 digits, optional)
   - Cadre Role: PRP / FLCRP / RBK / IFC Anchor / SR·CRP
   - Gender
   - Block (select from dropdown)
   - Panchayat
   - Village
   - Joining Date
   - **4-digit PIN** (required for new accounts — this becomes the login password)
   - Status: Active / Inactive
3. A User ID is auto-generated from the name (e.g. `ashok_123`).
4. Click **"सहेजें / Save"**.

> **Requires:** `SUPABASE_SERVICE_ROLE_KEY` must be configured in the server environment. Without it, user creation will fail.

### 5.2 Editing a Cadre

1. Find the cadre in the table.
2. Click the **Edit** (pencil) icon.
3. Update any fields.
4. To reset the PIN: enter a new 4-digit PIN in the PIN field. Leave as `••••` to keep the existing PIN unchanged.
5. Click **"सहेजें / Save"**.

### 5.3 Deleting a Cadre

1. Click the **Delete** (trash) icon on the cadre's row.
2. Confirm the deletion in the browser popup.
3. This permanently removes the user from the authentication system.

> **Warning:** This action cannot be undone. All historical activity data for this cadre will remain in the system.

### 5.4 Searching Cadres

Use the search box at the top to filter by name, role, or block name.

---

## 6. Admin — Attendance Management

See [Section 4.3](#43-attendance-management-dashboardattendance) for the full Attendance page workflow.

**Additional admin capabilities:**
- Can view attendance for **any block** (use the Block filter dropdown).
- Can mark or change attendance for any cadre on any date.
- The attendance table only shows cadres who have a recorded status for the selected date — cadres with no record on that date are not shown.

---

## 7. Admin — Reports & Exports

See [Section 4.4](#44-reports-dashboardreports) for the full Reports workflow.

**Admin-exclusive:**
- Can generate reports across **all blocks** (block officers only see their own block).
- The Cadre Performance and Block Performance tabs are visible to all staff roles.

---

## 8. Offline Usage

The submission form (`/cadre/submit`) supports saving drafts locally when there is no internet connection.

### 8.1 Saving a Draft

- Click **"ड्राफ्ट सहेजें / Save Draft"** instead of Submit.
- The form data is saved in your browser's local storage.
- You are redirected to Activity History.

### 8.2 Syncing Drafts

When you are back online:
1. Open the Submit page (`/cadre/submit`).
2. An orange **"सिंक करें / Sync N Drafts"** button will appear at the top if local drafts exist.
3. Click it to upload all saved drafts to the server.

**Important rules for draft sync:**
- Drafts saved without GPS coordinates are automatically **skipped** during sync and a warning is shown. GPS coordinates cannot be retroactively added.
- Only drafts with a valid GPS location are synced.

---

## 9. Notifications

All system events generate notifications that appear in:
- The **Notifications** panel on the cadre home dashboard
- The **Notifications page** (`/cadre/notifications`)

**Events that trigger notifications:**

| Event | Who receives it |
|-------|----------------|
| Activity Approved | Cadre who submitted |
| Activity Rejected (with reason) | Cadre who submitted |
| Attendance Verified Present | Cadre |
| Attendance Verification Rejected | Cadre |

Clicking a notification marks it as read. Unread notifications are shown as a count badge.

---

## 10. Common Errors & Resolution

| Error message | Cause | Resolution |
|---------------|-------|-----------|
| "Invalid User ID or PIN" | Wrong credentials | Check your User ID spelling and PIN. Contact admin if locked out. |
| "GPS permission denied — Submission blocked" | Browser denied location access | Open browser site settings → Allow Location for this site → Reload page |
| "GPS unavailable on this device" | Device has no GPS | Submit from a GPS-enabled device |
| "Please fill all required fields" | Block, Panchayat, Village, or Activity Type is empty | Fill all highlighted required fields |
| "Beneficiary count must be positive and < 1000" | Count is negative or ≥ 1000 | Enter a number between 0 and 999 |
| "This activity has already been submitted for this date!" | Duplicate submission attempted | Check Activity History — you already submitted this activity today |
| "PDF size must be < 10MB" | Attached PDF is too large | Compress the PDF before uploading |
| "Maximum 10 photos allowed" | More than 10 photos selected | Remove photos until count is ≤ 10 |
| "Rejection comment is required" | Block officer tried to reject without a comment | Add a comment explaining the reason before rejecting |
| "Draft skipped: no GPS coordinates" | Draft was saved without GPS | That draft cannot be uploaded — GPS is required for submission |

---

## 11. Data Rules & Constraints

The following rules are enforced by the system and cannot be bypassed:

| Rule | Detail |
|------|--------|
| No future-dated activities | Activity date cannot be set to a future date |
| GPS required for submission | You cannot submit a Pending report without a valid GPS geotag |
| No duplicate submissions | Same cadre + activity type + village + date cannot be submitted twice |
| Photo required for auto-attendance | Attendance is only auto-marked Present if at least one photo is uploaded |
| PIN must be exactly 4 digits | Login PINs are always 4 numeric digits |
| Beneficiary count: 0–999 | Cannot enter negative values or values ≥ 1000 |
| PDF max size: 10MB | Larger files will be rejected at upload |
| Max photos per submission: 10 | Additional photos beyond 10 are blocked |
| Cadres cannot access dashboard | `/dashboard/*` routes are blocked for cadre role — they are redirected to `/cadre` |
| Staff cannot access cadre portal | Block officers and admins are redirected away from `/cadre/*` |
| Activity editing: Pending only | Activities can only be edited or deleted while status is Pending |

---

## Appendix A — Activity Types

| Display Name | System Code |
|-------------|-------------|
| SHG Meeting | SHG_Meeting |
| VO Meeting | Other |
| Training | Training_Session |
| Farmer Visit | Farmer_Visit |
| Livelihood Demo | Livelihood_Activity |
| Bank Linkage | Other |
| Monitoring Visit | Monitoring_Visit |
| Record Verification | Record_Verification |
| Community Mobilization | Other |
| Enterprise Promotion | Livelihood_Activity |
| Other | Other |

---

## Appendix B — Attendance Status Values

| Status | Meaning |
|--------|---------|
| present | Cadre was present (with check-in time) |
| absent | Cadre was absent |
| on_leave | Cadre was on approved leave |
| holiday | Declared holiday — no attendance required |
| pending_verification | Submitted report without photo — awaiting block officer verification |

---

## Appendix C — Report Field Descriptions

**Attendance Report:**
- Date · Cadre Name · User ID · Role · Block · Village · Status · Check-In Time · Check-Out Time · Remarks

**Activity Report:**
- Date · Cadre Name · User ID · Cadre Type · Block · Panchayat · Village · Activity Type · Beneficiaries · Status · Photo Evidence (Yes/No) · Submitted At

**Cadre Performance Report:**
- User ID · Cadre Name · Role · Block · Village · Present Days · Absent Days · Leave Days · Attendance % · Total Activities · Approved · Pending · Rejected · Approval Rate % · Villages Covered · Total Beneficiaries

**Block Performance Report:**
- Block Name · Total Cadres · Activities (in range) · Approved · Pending

---

*End of Document — NRLM Cadre Connect SOP v1.0*
*For technical support, raise a ticket via the Help section inside the system.*
