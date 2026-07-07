/**
 * i18n.tsx — Language Provider & Translation Hook
 *
 * FIX SUMMARY:
 * 1. Language is read from localStorage synchronously via a lazy initialiser
 *    on useState — eliminates the SSR flash and hydration mismatch.
 * 2. html[lang] attribute is kept in sync automatically.
 * 3. setLang persists to localStorage so it survives page refresh.
 * 4. The `t()` function is memoised per-lang, so all consuming components
 *    re-render correctly when the language changes.
 * 5. A useLang() helper is exported for components that only need the lang string.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "hi";

// ── Dictionary ─────────────────────────────────────────────────────────────
// All keys must have BOTH "en" and "hi" entries.
// Keep values short — labels, not sentences (sentences inline in JSX).
const dict = {
  // Auth
  app_title: { en: "NRLM Cadre Activity Tracker", hi: "NRLM कैडर गतिविधि ट्रैकर" },
  login: { en: "Login", hi: "लॉगिन" },
  logout: { en: "Logout", hi: "लॉगआउट" },
  user_id: { en: "User ID", hi: "यूज़र आईडी" },
  pin: { en: "4-digit PIN", hi: "4-अंकीय पिन" },
  sign_in: { en: "Sign In", hi: "साइन इन" },
  signing_in: { en: "Signing in...", hi: "साइन इन हो रहा है..." },
  invalid_credentials: { en: "Invalid User ID or PIN", hi: "गलत यूज़र आईडी या पिन" },
  default_admin_hint: {
    en: "First time? Default admin is user 'admin' with PIN 1234.",
    hi: "पहली बार? डिफ़ॉल्ट एडमिन यूज़र 'admin' है, पिन 1234।",
  },

  // Language toggle — shows what clicking will switch TO
  switch_lang: { en: "हिंदी में देखें", hi: "View in English" },

  // Navigation (sidebar)
  home: { en: "Home", hi: "होम" },
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  cadre_management: { en: "Cadre Management", hi: "कैडर प्रबंधन" },
  attendance: { en: "Attendance", hi: "उपस्थिति" },
  activity_tracking: { en: "Activity Tracking", hi: "गतिविधि ट्रैकिंग" },
  evidence_gallery: { en: "Evidence Gallery", hi: "साक्ष्य गैलरी" },
  approvals: { en: "Approvals", hi: "स्वीकृतियां" },
  help_support: { en: "Help & Support", hi: "सहायता और समर्थन" },
  reports: { en: "Reports", hi: "रिपोर्ट" },
  leave_requests: { en: "Leave Requests", hi: "अवकाश अनुरोध" },
  leave_management: { en: "Leave Management", hi: "अवकाश प्रबंधन" },

  // Cadre quick actions
  submit_today: { en: "Submit Today's Work", hi: "आज का कार्य भेजें" },
  my_history: { en: "My Activity History", hi: "मेरा गतिविधि इतिहास" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल" },
  welcome: { en: "Welcome", hi: "स्वागत है" },
  quick_actions: { en: "Quick Actions", hi: "त्वरित क्रियाएं" },

  // Submission form
  daily_work_submission: { en: "Daily Work Submission", hi: "दैनिक कार्य रिपोर्ट" },
  date: { en: "Date", hi: "तारीख" },
  block: { en: "Block", hi: "ब्लॉक" },
  village: { en: "Village Name", hi: "गाँव का नाम" },
  activity_type: { en: "Activity Type", hi: "गतिविधि प्रकार" },
  description: { en: "Short Description", hi: "संक्षिप्त विवरण" },
  photo: { en: "Upload Photo Evidence", hi: "फोटो प्रमाण अपलोड करें" },
  submit: { en: "Submit", hi: "भेजें" },
  submitting: { en: "Submitting...", hi: "भेजा जा रहा है..." },
  submission_success: { en: "Activity submitted!", hi: "गतिविधि सफलतापूर्वक भेज दी गई!" },
  submission_error: {
    en: "Could not submit. Try again.",
    hi: "नहीं भेजा जा सका। पुनः प्रयास करें।",
  },
  select_block: { en: "Select block", hi: "ब्लॉक चुनें" },
  select_activity: { en: "Select activity", hi: "गतिविधि चुनें" },
  back: { en: "Back", hi: "वापस" },

  // Activity types
  "act.SHG_Meeting": { en: "SHG Meeting", hi: "एसएचजी बैठक" },
  "act.Farmer_Visit": { en: "Farmer Visit", hi: "किसान भेंट" },
  "act.Training_Session": { en: "Training Session", hi: "प्रशिक्षण सत्र" },
  "act.Monitoring_Visit": { en: "Monitoring Visit", hi: "निगरानी भेंट" },
  "act.Record_Verification": { en: "Record Verification", hi: "रिकॉर्ड सत्यापन" },
  "act.Livelihood_Activity": { en: "Livelihood Activity", hi: "आजीविका गतिविधि" },
  "act.Other": { en: "Other", hi: "अन्य" },

  // Roles
  "role.admin": { en: "Admin", hi: "प्रशासक" },
  "role.block_officer": { en: "Block Officer", hi: "ब्लॉक अधिकारी" },
  "role.fnhw": { en: "FNHW", hi: "FNHW" },
  "role.si": { en: "SI", hi: "SI" },
  "role.cadre": { en: "Cadre", hi: "कैडर" },

  // Cadre types
  "ct.PRP": { en: "PRP", hi: "पीआरपी" },
  "ct.FLCRP": { en: "FLCRP", hi: "एफएलसीआरपी" },
  "ct.RBK": { en: "RBK", hi: "आरबीके" },
  "ct.IFC_Anchor": { en: "IFC Anchor", hi: "आईएफसी एंकर" },
  "ct.SR_CRP": { en: "SR.CRP", hi: "एसआर सीआरपी" },
  "ct.FPO_CEO": { en: "FPO CEO", hi: "एफपीओ सीईओ" },
  "ct.Gender": { en: "Gender", hi: "Gender" },
  "ct.FNHW": { en: "FNHW", hi: "FNHW" },
  "ct.SI": { en: "SI", hi: "SI" },

  // Admin dashboard KPIs
  total_cadres: { en: "Total Cadres", hi: "कुल कैडर" },
  active_today: { en: "Active Today", hi: "आज सक्रिय" },
  inactive_today: { en: "Inactive Today", hi: "आज निष्क्रिय" },
  activities_today: { en: "Activities Today", hi: "आज की गतिविधियाँ" },
  villages_covered: { en: "Villages Covered", hi: "कवर गाँव" },
  block_wise: { en: "Block-wise Summary", hi: "ब्लॉक-वार सारांश" },
  activities: { en: "Activities", hi: "गतिविधियाँ" },
  users: { en: "Users", hi: "उपयोगकर्ता" },

  // User management
  manage_users: { en: "Manage Users", hi: "उपयोगकर्ता प्रबंधन" },
  add_user: { en: "Add User", hi: "नया उपयोगकर्ता" },
  name: { en: "Name", hi: "नाम" },
  role: { en: "Role", hi: "भूमिका" },
  cadre_type: { en: "Cadre Type", hi: "कैडर प्रकार" },
  phone: { en: "Phone", hi: "फोन" },
  actions: { en: "Actions", hi: "क्रियाएँ" },
  delete: { en: "Delete", hi: "हटाएँ" },
  create: { en: "Create", hi: "बनाएँ" },
  cancel: { en: "Cancel", hi: "रद्द करें" },
  full_name: { en: "Full Name", hi: "पूरा नाम" },
  view: { en: "View", hi: "देखें" },
  cadre: { en: "Cadre", hi: "कैडर" },
  active: { en: "Active", hi: "सक्रिय" },
  inactive: { en: "Inactive", hi: "निष्क्रिय" },
  no_activities: { en: "No activities yet.", hi: "अभी तक कोई गतिविधि नहीं।" },
  submitted_at: { en: "Submitted", hi: "भेजा गया" },
  download_excel: { en: "Download Excel", hi: "एक्सेल डाउनलोड करें" },
  daily: { en: "Daily", hi: "दैनिक" },
  weekly: { en: "Weekly", hi: "साप्ताहिक" },
  monthly: { en: "Monthly", hi: "मासिक" },
  cadre_wise: { en: "Cadre-wise", hi: "कैडर-वार" },
  block_wise_report: { en: "Block-wise", hi: "ब्लॉक-वार" },
  from_date: { en: "From", hi: "से" },
  to_date: { en: "To", hi: "तक" },
  all_blocks: { en: "All Blocks", hi: "सभी ब्लॉक" },
  loading: { en: "Loading...", hi: "लोड हो रहा है..." },
  saved: { en: "Saved", hi: "सहेजा गया" },
  user_created: { en: "User created", hi: "उपयोगकर्ता बनाया गया" },
  user_deleted: { en: "User deleted", hi: "उपयोगकर्ता हटाया गया" },
  confirm_delete: { en: "Delete this user?", hi: "क्या इस उपयोगकर्ता को हटाएँ?" },
  activity_details: { en: "Activity Details", hi: "गतिविधि विवरण" },
  photo_evidence: { en: "Photo Evidence", hi: "साक्ष्य चित्र" },
  no_photo: { en: "No photo", hi: "फोटो नहीं" },
  recent: { en: "Recent", hi: "हाल ही में" },
  filter: { en: "Filter", hi: "फ़िल्टर" },

  // App header
  app_header_title: { en: "NRLM Cadre Monitoring System", hi: "NRLM कैडर निगरानी प्रणाली" },

  // Status values
  "status.present": { en: "Present", hi: "उपस्थित" },
  "status.absent": { en: "Absent", hi: "अनुपस्थित" },
  "status.on_leave": { en: "On Leave", hi: "अवकाश पर" },
  "status.leave": { en: "Leave", hi: "अवकाश" },
  "status.late": { en: "Late", hi: "देर से" },
  "status.holiday": { en: "Holiday", hi: "छुट्टी" },
  "status.pending": { en: "Pending", hi: "लंबित" },
  "status.approved": { en: "Approved", hi: "स्वीकृत" },
  "status.rejected": { en: "Rejected", hi: "अस्वीकृत" },
  "status.not_marked": { en: "Not Marked", hi: "चिह्नित नहीं" },
  "status.pending_verification": { en: "Pending Verification", hi: "सत्यापन लंबित" },
  "status.cancelled": { en: "Cancelled", hi: "रद्द किया गया" },
  "lt.Casual": { en: "Casual Leave", hi: "आकस्मिक अवकाश" },
  "lt.Sick": { en: "Sick Leave", hi: "चिकित्सा अवकाश" },
  "lt.Official": { en: "Official Duty", hi: "आधिकारिक कार्य" },
  "lt.Training": { en: "Training", hi: "प्रशिक्षण" },
  "lt.Emergency": { en: "Emergency Leave", hi: "आपातकालीन अवकाश" },
  all_statuses: { en: "All Statuses", hi: "सभी स्थितियां" },
  change_status: { en: "Change Status", hi: "स्थिति बदलें" },
  workflow_status: { en: "Workflow Status", hi: "कार्यप्रवाह स्थिति" },

  // Navigation / pages
  notifications: { en: "Notifications", hi: "सूचनाएं" },
  notifications_hub: { en: "Notifications Hub", hi: "सूचना केंद्र" },
  back_to_home: { en: "Home Dashboard", hi: "मुख्य डैशबोर्ड" },
  mark_all_read: { en: "Mark All Read", hi: "सभी पढ़ा हुआ चिह्नित करें" },
  no_notifications: { en: "No notifications found", hi: "कोई सूचना नहीं मिली" },
  mark_as_read: { en: "Mark as Read", hi: "पढ़ा हुआ चिह्नित करें" },
  notifications_view_all: { en: "View All", hi: "सभी देखें" },
  unread: { en: "Unread", hi: "बिना पढ़े" },
  read_tab: { en: "Read", hi: "पढ़े हुए" },
  all_tab: { en: "All", hi: "सभी" },
  notif_marked_read: { en: "Marked as read", hi: "पढ़ी गई के रूप में चिह्नित" },
  notif_all_marked_read: { en: "All notifications marked as read", hi: "सभी सूचनाएं पढ़ी गई के रूप में चिह्नित" },
  notif_deleted: { en: "Notification deleted", hi: "सूचना हटा दी गई" },

  // Dashboard KPIs / overview
  cadre_attendance: { en: "Cadre Attendance", hi: "कैडर उपस्थिति" },
  activities_today_kpi: { en: "Activities Today", hi: "आज की गतिविधियाँ" },
  villages_covered_kpi: { en: "Villages Covered", hi: "गाँव कवरेज" },
  action_required: { en: "Action Required", hi: "कार्रवाई आवश्यक" },
  daily_operations: { en: "Daily Operations", hi: "दैनिक संचालन" },
  performance_analytics: { en: "Performance & Analytics", hi: "प्रदर्शन और विश्लेषण" },
  block_wise_table: { en: "Block-wise Performance Table", hi: "ब्लॉक-वार प्रदर्शन तालिका" },
  recent_activity_feed: { en: "Recent Activity Feed", hi: "हाल की गतिविधि फ़ीड" },
  pending_approvals_kpi: { en: "Pending Approvals", hi: "लंबित स्वीकृतियां" },
  view_all_activities: { en: "View All Activities", hi: "सभी गतिविधियाँ देखें" },
  view_all_pending: { en: "View All Pending", hi: "सभी लंबित देखें" },
  view_all_blocks: { en: "View All Blocks", hi: "सभी ब्लॉक देखें" },
  quick_actions_dash: { en: "Quick Actions", hi: "त्वरित क्रियाएं" },
  no_pending_approvals: { en: "No pending approvals remaining.", hi: "कोई लंबित स्वीकृति नहीं है।" },
  geotags: { en: "Geotags", hi: "जियोटैग" },
  total_col: { en: "Total Cadres", hi: "कुल कैडर" },
  active_col: { en: "Active", hi: "सक्रिय" },
  inactive_col: { en: "Inactive", hi: "निष्क्रिय" },

  // Table column headers (shared)
  col_name: { en: "Name", hi: "नाम" },
  col_cadre_id: { en: "Cadre ID", hi: "कैडर आईडी" },
  col_role: { en: "Role", hi: "भूमिका" },
  col_gender: { en: "Gender", hi: "लिंग" },
  col_block: { en: "Block", hi: "ब्लॉक" },
  col_panchayat: { en: "Panchayat", hi: "पंचायत" },
  col_village: { en: "Village", hi: "गाँव" },
  col_phone: { en: "Phone / Mobile", hi: "फोन / मोबाइल" },
  col_join_date: { en: "Join Date", hi: "तिथि" },
  col_status: { en: "Status", hi: "स्थिति" },
  col_actions: { en: "Actions", hi: "क्रियाएं" },
  col_check_in: { en: "Check-In", hi: "आगमन समय" },
  col_check_out: { en: "Check-Out", hi: "प्रस्थान समय" },
  col_caption: { en: "Caption", hi: "विवरण" },
  col_cadre: { en: "Cadre", hi: "भूमिका" },
  col_location: { en: "Location", hi: "स्थान" },
  col_type: { en: "Activity Type", hi: "गतिविधि प्रकार" },
  col_date: { en: "Date", hi: "तारीख" },
  col_preview: { en: "Preview", hi: "पूर्वावलोकन" },

  // Cadre management page
  cadre_mgmt_title: { en: "Cadre Management", hi: "कैडर प्रबंधन" },
  cadre_mgmt_sub: { en: "Create, update, and manage NRLM Field Cadres", hi: "NRLM फील्ड कैडर बनाएं, अपडेट करें और प्रबंधित करें" },
  add_cadre: { en: "Add Cadre", hi: "कैडर जोड़ें" },
  no_cadres_found: { en: "No cadres found", hi: "कोई कैडर नहीं मिला" },
  edit_cadre: { en: "Edit Cadre details", hi: "कैडर विवरण संपादित करें" },
  add_new_cadre: { en: "Add New Cadre", hi: "नया कैडर जोड़ें" },
  full_name_label: { en: "Full Name", hi: "पूरा नाम" },
  mobile_number: { en: "Mobile Number", hi: "फ़ोन नंबर" },
  cadre_role_label: { en: "Cadre Role", hi: "भूमिका" },
  gender_label: { en: "Gender", hi: "लिंग" },
  block_label: { en: "Block", hi: "ब्लॉक" },
  panchayat_label: { en: "Panchayat", hi: "पंचायत" },
  village_label: { en: "Village", hi: "गाँव" },
  joining_date: { en: "Joining Date", hi: "नियुक्ति तिथि" },
  pin_label: { en: "4-Digit PIN", hi: "4-अंकीय पिन" },
  status_label: { en: "Status", hi: "स्थिति" },
  save: { en: "Save", hi: "सहेजें" },
  gender_male: { en: "Male", hi: "पुरुष" },
  gender_female: { en: "Female", hi: "महिला" },
  gender_other: { en: "Other", hi: "अन्य" },

  // Toast messages — cadre management
  toast_deleted: { en: "Deleted successfully", hi: "सफलतापूर्वक हटाया गया" },
  toast_name_required: { en: "Name is required", hi: "नाम आवश्यक है" },
  toast_pin_digits: { en: "PIN must be 4 digits", hi: "पिन 4 अंकों का होना चाहिए" },
  toast_phone_digits: { en: "Phone must be 10 digits", hi: "फ़ोन नंबर 10 अंकों का होना चाहिए" },
  toast_details_updated: { en: "Details updated", hi: "विवरण सहेजा गया" },
  toast_cadre_created: { en: "Cadre created successfully", hi: "नया कैडर जोड़ा गया" },

  // Attendance page
  attendance_title: { en: "Daily Attendance Management", hi: "दैनिक उपस्थिति प्रबंधन" },
  attendance_sub: { en: "Mark check-in/out status and monitor logs", hi: "चेक-इन/आउट स्थिति दर्ज करें और लॉग देखें" },
  export_excel: { en: "Export Excel", hi: "एक्सेल डाउनलोड" },
  filter_panel: { en: "Filter Panel", hi: "फ़िल्टर पैनल" },
  select_date: { en: "Select Date", hi: "तारीख चुनें" },
  block_filter: { en: "Block Filter", hi: "ब्लॉक फ़िल्टर" },
  search: { en: "Search", hi: "खोजें" },
  search_placeholder: { en: "Search by name or role...", hi: "नाम या भूमिका से खोजें..." },
  no_attendance_marked: { en: "No attendance marked for", hi: "के लिए कोई उपस्थिति दर्ज नहीं" },
  no_records_found: { en: "No records found", hi: "कोई रिकॉर्ड नहीं मिला" },
  toast_attendance_updated: { en: "Attendance updated", hi: "उपस्थिति अपडेट की गई" },

  // Approvals page
  approvals_activity_tab: { en: "Activity Submissions", hi: "गतिविधि अनुमोदन" },
  approvals_attendance_tab: { en: "Attendance Verifications", hi: "उपस्थिति सत्यापन" },
  approvals_activity_title: { en: "Activity Approvals Workspace", hi: "गतिविधि अनुमोदन कार्यस्थल" },
  approvals_activity_sub: { en: "Approve or reject activity evidence submissions", hi: "गतिविधि साक्ष्य सबमिशन स्वीकृत या अस्वीकार करें" },
  approvals_attendance_title: { en: "Attendance Verifications Workspace", hi: "उपस्थिति सत्यापन कार्यस्थल" },
  approvals_attendance_sub: { en: "Verify attendance submissions that lack photo evidence", hi: "फोटो साक्ष्य रहित उपस्थिति सबमिशन सत्यापित करें" },
  activity_type_label: { en: "Activity Type", hi: "गतिविधि प्रकार" },
  description_label: { en: "Description", hi: "विवरण" },
  beneficiaries_label: { en: "Beneficiaries", hi: "लाभार्थी संख्या" },
  view_pdf: { en: "View PDF Minutes", hi: "दस्तावेज़ देखें" },
  decision_comments: { en: "Decision Comments", hi: "अनुमोदक टिप्पणी" },
  comment_placeholder: { en: "Comment (Required if rejecting...)", hi: "टिप्पणी (अस्वीकार करने पर आवश्यक...)" },
  no_comments: { en: "No comments", hi: "कोई टिप्पणी नहीं" },
  reject: { en: "Reject", hi: "अस्वीकार" },
  approve: { en: "Approve", hi: "मंजूर" },
  verify_present: { en: "Verify Present", hi: "स्वीकार करें" },
  reject_absent: { en: "Reject (Absent)", hi: "अनुपस्थित" },
  filter_all: { en: "All", hi: "सभी" },
  comments_label: { en: "Comments", hi: "टिप्पणी" },
  no_pending_activities: { en: "No pending activity approvals remaining.", hi: "कोई लंबित गतिविधि अनुमोदन नहीं है।" },
  no_pending_verifications: { en: "No pending attendance verifications remaining.", hi: "कोई लंबित उपस्थिति सत्यापन नहीं है।" },
  no_activities_filter: { en: "No activities matching filter", hi: "कोई गतिविधि नहीं मिली" },
  toast_rejection_comment_required: { en: "Rejection comment is required", hi: "अस्वीकार करने के लिए टिप्पणी आवश्यक है" },
  toast_activity_approved: { en: "Activity Approved", hi: "गतिविधि स्वीकृत" },
  toast_activity_rejected: { en: "Activity Rejected", hi: "गतिविधि अस्वीकृत" },
  toast_attendance_verified: { en: "Attendance verification approved", hi: "उपस्थिति सत्यापन स्वीकृत" },
  toast_attendance_rejected: { en: "Attendance verification rejected", hi: "उपस्थिति सत्यापन अस्वीकृत" },
  related_activity: { en: "Submitted Activity Details (Photo Missing)", hi: "संबंधित गतिविधि (फोटो अनुपस्थित)" },
  no_activity_for_date: { en: "No activity submitted for this date", hi: "इस तारीख के लिए कोई गतिविधि सबमिट नहीं की गई" },

  // Evidence gallery page
  evidence_gallery_title: { en: "Evidence Gallery", hi: "साक्ष्य गैलरी" },
  evidence_gallery_sub: { en: "Geotagged image monitoring & activity logs review", hi: "जियोटैग छवि निगरानी और गतिविधि लॉग समीक्षा" },
  download_csv: { en: "Download CSV", hi: "CSV डाउनलोड" },
  timeline_label: { en: "Timeline:", hi: "तारीख स्लाइडर:" },
  all_dates: { en: "All Dates", hi: "सभी तारीखें" },
  search_text: { en: "Search text", hi: "खोजें" },
  vo_village: { en: "Village (VO)", hi: "ग्राम संगठन (VO)" },
  reset_filters: { en: "Reset Filters", hi: "फ़िल्टर रीसेट" },
  all_types: { en: "All Types", hi: "सभी प्रकार" },
  no_evidence_found: { en: "No evidence found", hi: "कोई साक्ष्य नहीं मिला" },
  filters_reset: { en: "Filters reset", hi: "फ़िल्टर साफ़ किए गए" },
  bulk_approved: { en: "Bulk Approved", hi: "बल्क स्वीकृत" },
  bulk_rejected: { en: "Bulk Rejected", hi: "बल्क अस्वीकृत" },
  evidence_approved: { en: "Evidence Approved", hi: "साक्ष्य स्वीकृत" },
  evidence_rejected: { en: "Evidence Rejected", hi: "साक्ष्य अस्वीकृत" },
  csv_exported: { en: "records exported", hi: "रिकॉर्ड निर्यात किए गए" },

  // Reports page
  reports_title: { en: "Reports Module", hi: "रिपोर्ट मॉड्यूल" },
  reports_sub: { en: "Generate, filter and export government MIS reports", hi: "सरकारी MIS रिपोर्ट तैयार करें, फ़िल्टर करें और निर्यात करें" },
  tab_attendance: { en: "Attendance", hi: "उपस्थिति" },
  tab_activity: { en: "Activity", hi: "गतिविधि" },
  tab_cadre_performance: { en: "Cadre Performance", hi: "कैडर प्रदर्शन" },
  tab_block_performance: { en: "Block Performance", hi: "ब्लॉक प्रदर्शन" },
  preset_today: { en: "Today", hi: "आज" },
  preset_this_week: { en: "This Week", hi: "इस सप्ताह" },
  preset_this_month: { en: "This Month", hi: "इस महीने" },
  preset_last_month: { en: "Last Month", hi: "पिछले महीने" },
  preset_custom: { en: "Custom", hi: "कस्टम" },
  from_date_label: { en: "From Date", hi: "कब से" },
  to_date_label: { en: "To Date", hi: "कब तक" },
  report_period: { en: "Report Period", hi: "रिपोर्ट अवधि" },
  all_blocks_option: { en: "All Blocks", hi: "सभी ब्लॉक" },
  no_data_found: { en: "No data found for selected filters.", hi: "चुने गए फ़िल्टर के लिए कोई डेटा नहीं मिला।" },
  attendance_report: { en: "Attendance Report", hi: "उपस्थिति रिपोर्ट" },
  activity_report: { en: "Activity Report", hi: "गतिविधि रिपोर्ट" },
  cadre_performance_report: { en: "Cadre Performance Report", hi: "कैडर प्रदर्शन रिपोर्ट" },
  block_performance_report: { en: "Block Performance Report", hi: "ब्लॉक प्रदर्शन रिपोर्ट" },
  all_roles: { en: "All Roles", hi: "सभी भूमिकाएं" },

  // Help pages
  help_title: { en: "Help & Support FAQs", hi: "सहायता और अक्सर पूछे जाने वाले प्रश्न" },
  help_sub: { en: "Frequently asked questions and user guides for NRLM cadres", hi: "NRLM कैडर के लिए अक्सर पूछे जाने वाले प्रश्न और उपयोगकर्ता गाइड" },
  faq_heading: { en: "Frequently Asked Questions", hi: "अक्सर पूछे जाने वाले प्रश्न" },
  answer_label: { en: "Answer:", hi: "उत्तर:" },
  training_manuals: { en: "Training Manuals", hi: "प्रशिक्षण सामग्री" },
  coming_soon: { en: "Coming Soon", hi: "जल्द आ रहा है" },
  raise_ticket: { en: "Raise Support Ticket", hi: "सहायता टिकट दर्ज करें" },
  subject_label: { en: "Subject", hi: "विषय" },
  desc_label_help: { en: "Description", hi: "विवरण" },
  submit_ticket: { en: "Submit Ticket", hi: "टिकट दर्ज करें" },
  submitting_ticket: { en: "Submitting...", hi: "भेजा जा रहा है..." },
  my_tickets: { en: "My Support Tickets", hi: "आपके सहायता टिकट" },
  coordinators_dir: { en: "Coordinators Directory", hi: "आधिकारिक संपर्क निर्देशिका" },
  ticket_raised: { en: "Ticket raised successfully!", hi: "सहायता टिकट सफलतापूर्वक दर्ज किया गया" },
  fill_required_fields: { en: "Please fill all required fields", hi: "कृपया सभी आवश्यक फ़ील्ड भरें" },
  govt_compliance: { en: "Government Guidelines Compliance", hi: "सरकारी दिशानिर्देशों का अनुपालन" },

  // Cadre dashboard (cadre.index)
  welcome_header: { en: "Welcome", hi: "स्वागत है" },
  today_summary: { en: "Today's Summary", hi: "आज का सारांश" },
  monthly_summary: { en: "Monthly Summary", hi: "मासिक सारांश" },
  recent_activities_heading: { en: "Recent Activities", hi: "हाल की गतिविधियाँ" },
  quick_stats: { en: "Quick Statistics", hi: "त्वरित आँकड़े" },
  pending_actions: { en: "Pending Actions", hi: "लंबित कार्रवाइयाँ" },
  activity_trend: { en: "Last 7 Days Activity Trend", hi: "7 दिन की गतिविधि प्रवृत्ति" },
  notifications_panel: { en: "Notifications", hi: "हालिया सूचनाएं" },
  view_full_history: { en: "View Full History", hi: "सभी देखें" },
  no_activities_found: { en: "No activities found", hi: "कोई गतिविधि नहीं मिली" },
  submit_work: { en: "Submit Today's Work", hi: "काम सबमिट करें" },
  work_history: { en: "My Work History", hi: "कार्य इतिहास" },
  profile_settings: { en: "Profile Settings", hi: "प्रोफाइल" },
  raise_support: { en: "Raise Support Ticket", hi: "सहायता" },
  today_activities: { en: "Activities Today", hi: "आज की गतिविधियाँ" },
  today_villages: { en: "Villages Covered", hi: "गाँव कवर" },
  today_beneficiaries: { en: "Beneficiaries Today", hi: "आज के लाभार्थी" },
  today_photos: { en: "Photos Uploaded", hi: "फ़ोटो साक्ष्य" },
  monthly_total: { en: "Total Activities", hi: "कुल गतिविधियाँ" },
  monthly_villages: { en: "Villages Covered", hi: "अनोखे गाँव" },
  monthly_beneficiaries: { en: "Beneficiaries", hi: "कुल लाभार्थी" },
  attendance_pct: { en: "Attendance %", hi: "उपस्थिति %" },
  beneficiaries_count: { en: "beneficiaries", hi: "लाभार्थी" },
  missing_photo: { en: "Missing Photo Evidence", hi: "फ़ोटो साक्ष्य अपलोड करें" },
  absent_days: { en: "Absent Days This Month", hi: "अनुपस्थित दिन" },
  rejected_acts: { en: "Rejected Activities", hi: "अस्वीकृत गतिविधियाँ" },
  view_history: { en: "View History", hi: "इतिहास देखें" },
  activities_label: { en: "activities", hi: "गतिविधियाँ" },
  days_label: { en: "days", hi: "दिन" },
  marked_absent: { en: "Marked Absent", hi: "अनुपस्थित" },

  // Activity history (cadre.history)
  history_title: { en: "My Activity History", hi: "मेरा कार्य इतिहास" },
  history_sub: { en: "Review your submitted reports and verification statuses", hi: "अपनी सबमिट की गई रिपोर्ट और सत्यापन स्थिति देखें" },
  refresh: { en: "Refresh", hi: "रिफ्रेश" },
  stat_total: { en: "Total", hi: "कुल गतिविधियाँ" },
  stat_approved: { en: "Approved", hi: "स्वीकृत" },
  stat_pending: { en: "Pending", hi: "लंबित" },
  stat_rejected: { en: "Rejected", hi: "अस्वीकृत" },
  stat_villages: { en: "Villages", hi: "गाँव कवर्ड" },
  stat_beneficiaries: { en: "Beneficiaries", hi: "कुल लाभार्थी" },
  filter_options: { en: "Filter Options", hi: "फ़िल्टर विकल्प" },
  reset_filters_btn: { en: "Reset Filters", hi: "फ़िल्टर साफ़ करें" },
  search_label: { en: "Search", hi: "खोजें" },
  start_date: { en: "Start Date", hi: "प्रारंभ तिथि" },
  end_date: { en: "End Date", hi: "अंतिम तिथि" },
  all_statuses_opt: { en: "All Statuses", hi: "सभी" },
  all_villages: { en: "All Villages", hi: "सभी गाँव" },
  all_types_opt: { en: "All Types", hi: "सभी प्रकार" },
  no_activities_history: { en: "No activities found for the selected filters.", hi: "कोई रिकॉर्ड नहीं मिला" },

  // Submit form (cadre.submit)
  submit_title: { en: "Submit Today's Work", hi: "दैनिक कार्य रिपोर्ट" },
  submit_sub: { en: "Fill in the activity details and upload photo evidence", hi: "गतिविधि विवरण भरें और फोटो साक्ष्य अपलोड करें" },
  offline_active: { en: "Offline Mode Active", hi: "सिस्टम ऑफ़लाइन मोड" },
  online_stable: { en: "Cloud Connection Stable", hi: "सिस्टम ऑनलाइन मोड" },
  sync_drafts: { en: "Sync Drafts", hi: "सिंक करें" },
  form_title: { en: "Activity Submission Form", hi: "दैनिक कार्य रिपोर्ट फॉर्म" },
  date_label: { en: "Date of Activity", hi: "तारीख" },
  activity_type_form: { en: "Activity Type", hi: "गतिविधि प्रकार" },
  state_label: { en: "State", hi: "राज्य" },
  district_label: { en: "District", hi: "जिला" },
  block_form: { en: "Block", hi: "ब्लॉक" },
  panchayat_form: { en: "Panchayat", hi: "पंचायत" },
  village_form: { en: "Village", hi: "गाँव" },
  beneficiaries_form: { en: "Women benefited (Max 1000)", hi: "महिला लाभार्थी संख्या (अधिकतम 1000)" },
  description_form: { en: "Description Notes (Max 500 characters)", hi: "विवरण नोट्स (अधिकतम 500 अक्षर)" },
  capture_photos: { en: "Capture Photos", hi: "साक्ष्य चित्र" },
  pdf_attachment: { en: "PDF Attachment (Max 10MB)", hi: "दस्तावेज़ (अधिकतम 10MB)" },
  auto_attendance: { en: "Auto-Mark Attendance", hi: "उपस्थिति स्वतः दर्ज" },
  save_draft: { en: "Save Draft", hi: "ड्राफ्ट सहेजें" },
  submit_report: { en: "Submit Report", hi: "सबमिट करें" },
  submitting_report: { en: "Submitting...", hi: "सहेज रहा है..." },
  saved_as_draft: { en: "Saved as Draft locally", hi: "ड्राफ्ट के रूप में सहेजा गया" },
  select_activity_placeholder: { en: "Select Activity", hi: "गतिविधि का चयन करें" },
  all_required_fields: { en: "Please fill all required fields", hi: "सभी आवश्यक फ़ील्ड भरें" },
  gps_label: { en: "GPS Geotag coords (Auto-capture)", hi: "जीपीएस जियोटैग निर्देशांक (स्वतः कैप्चर)" },
  acquiring_gps: { en: "Acquiring GPS…", hi: "GPS लोकेशन प्राप्त की जा रही है..." },
  gps_denied: { en: "GPS permission denied", hi: "GPS अनुमति अस्वीकृत" },
  gps_unavailable: { en: "GPS unavailable on this device", hi: "GPS उपलब्ध नहीं" },
  gps_warning: { en: "Submission is blocked without GPS. Enable location in browser settings and reload.", hi: "GPS बिना सबमिशन ब्लॉक है। ब्राउज़र में लोकेशन एक्सेस चालू करें और पेज रीलोड करें।" },

  // Profile page (cadre.profile)
  profile_title: { en: "Profile & Settings", hi: "प्रोफ़ाइल और सेटिंग्स" },
  profile_sub: { en: "Manage your personal details, emergency contact, and login PIN", hi: "अपनी व्यक्तिगत जानकारी, आपातकालीन संपर्क और पिन प्रबंधित करें" },
  tab_general: { en: "General Info", hi: "विवरण" },
  tab_emergency: { en: "Emergency", hi: "आपातकालीन" },
  tab_security: { en: "Security", hi: "सुरक्षा" },
  personal_details: { en: "Personal Details", hi: "निजी जानकारी" },
  official_details: { en: "Official Details", hi: "आधिकारिक विवरण" },
  change_photo: { en: "Change Photo", hi: "फ़ोटो अपलोड करें" },
  uploading_photo: { en: "Uploading...", hi: "अपलोड हो रहा है..." },
  save_profile: { en: "Save Profile Info", hi: "जानकारी सहेजें" },
  saving: { en: "Saving...", hi: "सहेजा जा रहा है..." },
  training_status_label: { en: "Training Status", hi: "प्रशिक्षण स्थिति" },
  current_status: { en: "Current status:", hi: "वर्तमान स्थिति:" },
  emergency_contact: { en: "Emergency Contact Info", hi: "आपातकालीन संपर्क सूत्र" },
  contact_name: { en: "Contact Person Name", hi: "संपर्क का नाम" },
  contact_phone: { en: "Mobile Number", hi: "मोबाइल नंबर" },
  save_emergency: { en: "Save Emergency Details", hi: "विवरण सहेजें" },
  change_pin_title: { en: "Change Login PIN", hi: "लॉगिन पिन बदलें" },
  new_pin: { en: "New 4-Digit PIN", hi: "नया 4-अंकीय पिन" },
  confirm_pin: { en: "Confirm PIN", hi: "पिन की पुष्टि करें" },
  update_pin: { en: "Update PIN", hi: "पिन बदलें" },
  updating: { en: "Updating...", hi: "बदला जा रहा है..." },

  // Sidebar
  sidebar_menu: { en: "Menu", hi: "मेनू" },
  signed_in_as: { en: "Signed in as", hi: "लॉग इन हैं" },

  // Wizard
  add_user_wizard: { en: "Add User — Guided Setup", hi: "उपयोगकर्ता जोड़ें — सहायक सेटअप" },
  step: { en: "Step", hi: "चरण" },
  of: { en: "of", hi: "/" },
  step_role: { en: "Choose Role", hi: "भूमिका चुनें" },
  step_identity: { en: "Identity & Login", hi: "पहचान और लॉगिन" },
  step_assignment: { en: "Assignment", hi: "नियुक्ति" },
  step_review: { en: "Review & Create", hi: "समीक्षा और बनाएँ" },
  next: { en: "Next", hi: "आगे" },
  previous: { en: "Previous", hi: "पीछे" },
  role_admin_desc: {
    en: "Full system access — manage users, view all reports.",
    hi: "पूर्ण सिस्टम पहुँच — उपयोगकर्ता प्रबंधन, सभी रिपोर्ट।",
  },
  role_block_officer_desc: {
    en: "Oversees a single block. Must be assigned to a block.",
    hi: "एक ब्लॉक की देखरेख। ब्लॉक नियुक्ति आवश्यक।",
  },
  role_cadre_desc: {
    en: "Field worker. Requires cadre type, block, and village.",
    hi: "फील्ड कार्यकर्ता। कैडर प्रकार, ब्लॉक और गाँव आवश्यक।",
  },
  err_user_id: {
    en: "User ID: 2–40 chars, letters/digits/_.- only.",
    hi: "यूज़र आईडी: 2–40 अक्षर, केवल अक्षर/अंक/_.-।",
  },
  err_pin: { en: "PIN must be exactly 4 digits.", hi: "पिन ठीक 4 अंकों का होना चाहिए।" },
  err_full_name: { en: "Full name is required.", hi: "पूरा नाम आवश्यक है।" },
  err_phone: {
    en: "Phone must be 10 digits (optional).",
    hi: "फोन 10 अंकों का होना चाहिए (वैकल्पिक)।",
  },
  err_block_required: {
    en: "Block is required for this role.",
    hi: "इस भूमिका के लिए ब्लॉक आवश्यक है।",
  },
  err_village_required: { en: "Village is required for cadre.", hi: "कैडर के लिए गाँव आवश्यक है।" },
  err_cadre_type_required: { en: "Cadre type is required.", hi: "कैडर प्रकार आवश्यक है।" },
  review_hint: {
    en: "Confirm the details below. The user will sign in with the User ID and PIN.",
    hi: "नीचे विवरण की पुष्टि करें। उपयोगकर्ता यूज़र आईडी और पिन से साइन इन करेगा।",
  },
  village_assigned: { en: "Assigned Village", hi: "नियुक्त गाँव" },

  // Activities page — missing keys
  activities_grid_tab: { en: "Activities Grid", hi: "गतिविधियाँ सूची" },
  submit_form_tab: { en: "Submit Activity Form", hi: "कार्य रिपोर्ट फॉर्म" },
  activity_tracking_title: { en: "Activity Tracking", hi: "गतिविधि ट्रैकिंग" },
  new_activity: { en: "New Activity", hi: "नई गतिविधि" },
  total_today: { en: "Total Today", hi: "आज कुल गतिविधियाँ" },
  pending_approvals_kpi2: { en: "Pending Approvals", hi: "स्वीकृति प्रतीक्षारत" },
  completed: { en: "Completed", hi: "पूर्ण गतिविधियाँ" },
  shg_meetings: { en: "SHG Meetings", hi: "एसएचजी बैठकें" },
  trainings: { en: "Trainings", hi: "प्रशिक्षण" },
  farmer_visits: { en: "Farmer Visits", hi: "किसान सर्वेक्षण" },
  daily_activity_trend: { en: "Daily Activity Trend", hi: "दैनिक गतिविधि प्रगति रुझान" },
  cadre_name_filter: { en: "Cadre Name", hi: "कर्मी का नाम" },
  village_name_filter: { en: "Village", hi: "गाँव का नाम" },
  go_offline: { en: "Go Offline", hi: "ऑफलाइन जाएं" },
  switch_to_online: { en: "Switch to Online", hi: "ऑनलाइन जाएं" },
  simulate_offline: { en: "Simulate offline state and IndexedDB caching", hi: "ऑफलाइन स्थिति का अनुकरण करें" },
  offline_mode: { en: "Offline Mode Active", hi: "सिस्टम ऑफ़लाइन मोड" },
  online_mode: { en: "Cloud Connection Stable", hi: "सिस्टम ऑनलाइन मोड" },
  sync_btn: { en: "Sync", hi: "सिंक करें" },
  drafts_label: { en: "Drafts", hi: "ड्राफ्ट" },

  // Attendance page — missing keys
  attendance_mgmt_title: { en: "Daily Attendance Management", hi: "दैनिक उपस्थिति प्रबंधन" },
  export_excel_btn: { en: "Export Excel", hi: "एक्सेल डाउनलोड" },
  filter_panel_title: { en: "Filter Panel", hi: "फ़िल्टर पैनल" },
  select_date_label: { en: "Select Date", hi: "तारीख चुनें" },
  block_filter_label: { en: "Block Filter", hi: "ब्लॉक फ़िल्टर" },
  all_blocks_label: { en: "All Blocks", hi: "सभी ब्लॉक" },
  loading_msg: { en: "Loading...", hi: "लोड हो रहा है..." },
  no_attendance_for: { en: "No attendance marked for", hi: "के लिए कोई उपस्थिति दर्ज नहीं" },
  no_records: { en: "No records found", hi: "कोई रिकॉर्ड नहीं मिला" },
  change_status_label: { en: "Change Status", hi: "स्थिति बदलें" },

  // Dashboard index — missing keys
  cadre_attendance_kpi: { en: "Cadre Attendance", hi: "सक्रिय कैडर" },
  activities_today_kpi2: { en: "Activities Today", hi: "कार्य रिपोर्ट" },
  villages_covered_kpi2: { en: "Villages Covered", hi: "गाँव कवरेज" },
  action_required_kpi: { en: "Action Required", hi: "स्वीकृति लंबित" },
  daily_ops_tab: { en: "Daily Operations", hi: "दैनिक संचालन" },
  perf_analytics_tab: { en: "Performance & Analytics", hi: "प्रदर्शन और विश्लेषण" },
  attendance_details: { en: "Attendance Details", hi: "उपस्थिति विवरण" },
  activity_summary: { en: "Activity Summary", hi: "गतिविधि सारांश" },
  geographic_coverage: { en: "Geographic Coverage", hi: "भौगोलिक कवरेज" },
  block_wise_perf: { en: "Block Wise Performance Table", hi: "ब्लॉक-वार प्रदर्शन" },
  recent_activity_feed_title: { en: "Recent Activity Feed", hi: "हाल की गतिविधि" },
  pending_approvals_title: { en: "Pending Approvals", hi: "लंबित स्वीकृतियां" },
  quick_actions_title: { en: "Quick Actions", hi: "त्वरित क्रियाएं" },
  mark_attendance_action: { en: "Mark Attendance", hi: "उपस्थिति दर्ज करें" },
  daily_attendance_sub: { en: "Daily Attendance", hi: "दैनिक उपस्थिति" },
  submit_activity_action: { en: "Submit Activity", hi: "गतिविधि सबमिट करें" },
  submit_today_work_sub: { en: "Submit Today's Work", hi: "कार्य रिपोर्ट" },
  upload_evidence_action: { en: "Upload Evidence", hi: "साक्ष्य अपलोड करें" },
  add_cadre_action: { en: "Add Cadre", hi: "कैडर जोड़ें" },
  farmer_visits_label: { en: "Farmer Visits", hi: "किसान भेंट" },
  trainings_label: { en: "Trainings", hi: "प्रशिक्षण" },
  monitoring_label: { en: "Monitoring", hi: "निगरानी" },
  verification_label: { en: "Verification", hi: "सत्यापन" },
  livelihoods_label: { en: "Livelihoods", hi: "आजीविका" },
  other_label: { en: "Other", hi: "अन्य" },
  no_cadres_present: { en: "No cadres present", hi: "कोई उपस्थित नहीं" },
  no_absences: { en: "No absences recorded", hi: "कोई अनुपस्थित नहीं" },
  no_leave: { en: "No leave records", hi: "कोई छुट्टी नहीं" },
  present_cadres: { en: "Present Cadres", hi: "उपस्थित कैडर" },
  absent_cadres: { en: "Absent Cadres", hi: "अनुपस्थित कैडर" },
  on_leave_cadres: { en: "On Leave Cadres", hi: "अवकाश पर कैडर" },
  district_label_geo: { en: "District", hi: "जिला" },
  blocks_covered_label: { en: "Blocks Covered", hi: "ब्लॉक कवरेज" },
  panchayats_covered: { en: "Panchayats Covered", hi: "पंचायत कवरेज" },
  villages_covered_geo: { en: "Villages Covered", hi: "गाँव कवरेज" },
  view_details: { en: "View Details", hi: "विवरण देखें" },
  view_all_blocks_link: { en: "View All Blocks", hi: "सभी ब्लॉक देखें" },
  view_all_activities_link: { en: "View All Activities", hi: "सभी गतिविधियाँ देखें" },
  view_all_pending_link: { en: "View All Pending", hi: "सभी लंबित देखें" },
  no_pending_remaining: { en: "No pending approvals remaining.", hi: "कोई लंबित स्वीकृति नहीं है।" },
  approved_activity: { en: "Approved", hi: "स्वीकृत" },
  notifications_label: { en: "Notifications", hi: "सूचनाएं" },

  // Approvals page — missing keys
  activity_submissions_tab: { en: "Activity Submissions", hi: "गतिविधि अनुमोदन" },
  attendance_verifications_tab: { en: "Attendance Verifications", hi: "उपस्थिति सत्यापन" },
  activity_approvals_title: { en: "Activity Approvals Workspace", hi: "गतिविधि अनुमोदन कार्यस्थल" },
  attendance_verif_title: { en: "Attendance Verifications Workspace", hi: "उपस्थिति सत्यापन कार्यस्थल" },
  filter_all_label: { en: "All", hi: "सभी" },
  filter_pending_label: { en: "Pending", hi: "लंबित" },
  filter_approved_label: { en: "Approved", hi: "स्वीकृत" },
  filter_rejected_label: { en: "Rejected", hi: "अस्वीकृत" },
  photo_evidence_label: { en: "Photo Evidence", hi: "साक्ष्य चित्र" },
  activity_type_label2: { en: "Activity Type", hi: "गतिविधि प्रकार" },
  description_label2: { en: "Description", hi: "विवरण" },
  beneficiaries_label2: { en: "Beneficiaries", hi: "लाभार्थी संख्या" },
  view_pdf_label: { en: "View PDF Minutes", hi: "दस्तावेज़ देखें" },
  decision_comments_label: { en: "Decision Comments", hi: "अनुमोदक टिप्पणी" },
  comments_label2: { en: "Comments", hi: "टिप्पणी" },
  no_comments_text: { en: "No comments", hi: "कोई टिप्पणी नहीं" },
  reject_btn: { en: "Reject", hi: "अस्वीकार" },
  approve_btn: { en: "Approve", hi: "मंजूर" },
  verify_present_btn: { en: "Verify Present", hi: "स्वीकार करें" },
  reject_absent_btn: { en: "Reject (Absent)", hi: "अनुपस्थित" },
  no_pending_activities_msg: { en: "No pending activity approvals remaining.", hi: "कोई लंबित गतिविधि अनुमोदन नहीं है।" },
  no_pending_verif_msg: { en: "No pending attendance verifications remaining.", hi: "कोई लंबित उपस्थिति सत्यापन नहीं है।" },
  no_activities_filter_msg: { en: "No activities matching filter", hi: "कोई गतिविधि नहीं मिली" },
  loading_text: { en: "Loading...", hi: "लोड हो रहा है..." },
  workflow_status_label: { en: "Workflow Status", hi: "कार्यप्रवाह स्थिति" },
  related_activity_label: { en: "Submitted Activity Details (Photo Missing)", hi: "संबंधित गतिविधि (फोटो अनुपस्थित)" },
  no_activity_for_date_msg: { en: "No activity submitted for this date", hi: "इस तारीख के लिए कोई गतिविधि सबमिट नहीं की गई" },

  // Evidence gallery — missing keys
  evidence_title: { en: "Evidence Gallery", hi: "साक्ष्य गैलरी" },
  download_csv_btn: { en: "Download CSV", hi: "CSV डाउनलोड" },
  timeline_label2: { en: "Timeline:", hi: "तारीख स्लाइडर:" },
  all_dates_label: { en: "All Dates", hi: "सभी तारीखें" },
  search_text_label: { en: "Search text", hi: "खोजें" },
  block_label2: { en: "Block", hi: "ब्लॉक" },
  vo_village_label: { en: "Village (VO)", hi: "ग्राम संगठन (VO)" },
  activity_type_label3: { en: "Activity Type", hi: "गतिविधि प्रकार" },
  status_label2: { en: "Status", hi: "स्थिति" },
  reset_filters_label: { en: "Reset Filters", hi: "रीसेट फ़िल्टर" },
  all_types_label: { en: "All Types", hi: "सभी प्रकार" },
  all_statuses_label: { en: "All Statuses", hi: "सभी स्थितियाँ" },
  no_evidence_label: { en: "No evidence found", hi: "कोई साक्ष्य नहीं मिला" },
  col_preview2: { en: "Preview", hi: "पूर्वावलोकन" },
  col_caption2: { en: "Caption", hi: "विवरण" },
  col_cadre2: { en: "Cadre", hi: "भूमिका" },
  col_location2: { en: "Location", hi: "स्थान" },
  col_type2: { en: "Activity Type", hi: "गतिविधि प्रकार" },
  col_date2: { en: "Date", hi: "तारीख" },
  col_status2: { en: "Status", hi: "स्थिति" },

  // Reports page — missing keys
  reports_module_title: { en: "Reports Module", hi: "रिपोर्ट मॉड्यूल" },
  tab_attendance_label: { en: "Attendance", hi: "उपस्थिति" },
  tab_activity_label: { en: "Activity", hi: "गतिविधि" },
  tab_cadre_perf_label: { en: "Cadre Performance", hi: "कैडर प्रदर्शन" },
  tab_block_perf_label: { en: "Block Performance", hi: "ब्लॉक प्रदर्शन" },
  preset_today_label: { en: "Today", hi: "आज" },
  preset_week_label: { en: "This Week", hi: "इस सप्ताह" },
  preset_month_label: { en: "This Month", hi: "इस महीने" },
  preset_last_month_label: { en: "Last Month", hi: "पिछले महीने" },
  preset_custom_label: { en: "Custom", hi: "कस्टम" },
  from_date_label2: { en: "From Date", hi: "कब से" },
  to_date_label2: { en: "To Date", hi: "कब तक" },
  block_label3: { en: "Block", hi: "ब्लॉक" },
  report_period_label: { en: "Report Period", hi: "रिपोर्ट अवधि" },
  all_blocks_opt: { en: "All Blocks", hi: "सभी ब्लॉक" },
  no_data_msg: { en: "No data found for selected filters.", hi: "चुने गए फ़िल्टर के लिए कोई डेटा नहीं मिला।" },
  attendance_report_title: { en: "Attendance Report", hi: "उपस्थिति रिपोर्ट" },
  activity_report_title: { en: "Activity Report", hi: "गतिविधि रिपोर्ट" },
  cadre_perf_report_title: { en: "Cadre Performance Report", hi: "कैडर प्रदर्शन रिपोर्ट" },
  block_perf_report_title: { en: "Block Performance Report", hi: "ब्लॉक प्रदर्शन रिपोर्ट" },
  all_roles_label: { en: "All Roles", hi: "सभी भूमिकाएं" },
  role_label2: { en: "Role", hi: "भूमिका" },

  // Users/Cadre management page — missing keys
  cadre_mgmt_page_title: { en: "Cadre Management", hi: "कैडर प्रबंधन" },
  add_cadre_btn: { en: "Add Cadre", hi: "जोड़ें" },
  edit_cadre_title: { en: "Edit Cadre details", hi: "संपादित करें" },
  add_new_cadre_title: { en: "Add New Cadre", hi: "नया कैडर जोड़ें" },
  full_name_field: { en: "Full Name", hi: "पूरा नाम" },
  mobile_number_field: { en: "Mobile Number", hi: "फ़ोन नंबर" },
  cadre_role_field: { en: "Cadre Role", hi: "भूमिका" },
  gender_field: { en: "Gender", hi: "लिंग" },
  block_field: { en: "Block", hi: "ब्लॉक" },
  panchayat_field: { en: "Panchayat", hi: "पंचायत" },
  village_field: { en: "Village", hi: "गाँव" },
  joining_date_field: { en: "Joining Date", hi: "नियुक्ति तिथि" },
  pin_field: { en: "4-Digit PIN", hi: "4-अंकीय पिन" },
  status_field: { en: "Status", hi: "स्थिति" },
  cancel_btn: { en: "Cancel", hi: "रद्द करें" },
  save_btn: { en: "Save", hi: "सहेजें" },
  active_status: { en: "Active", hi: "सक्रिय" },
  inactive_status: { en: "Inactive", hi: "निष्क्रिय" },
  male_option: { en: "Male", hi: "पुरुष" },
  female_option: { en: "Female", hi: "महिला" },
  other_option: { en: "Other", hi: "अन्य" },
  no_cadres_msg: { en: "No cadres found", hi: "कोई रिकॉर्ड नहीं मिला" },
  confirm_delete_msg: { en: "Are you sure you want to delete", hi: "क्या आप वाकई हटाना चाहते हैं" },

  // Profile page — missing keys
  profile_page_title: { en: "Profile & Settings", hi: "प्रोफ़ाइल और सेटिंग्स" },
  general_tab: { en: "General Info", hi: "विवरण" },
  emergency_tab: { en: "Emergency", hi: "आपातकालीन" },
  security_tab: { en: "Security", hi: "सुरक्षा" },
  personal_details_title: { en: "Personal Details", hi: "निजी जानकारी" },
  official_details_title: { en: "Official Details", hi: "आधिकारिक विवरण" },
  photo_upload_btn: { en: "Change Photo", hi: "फ़ोटो अपलोड करें" },
  uploading_text: { en: "Uploading...", hi: "अपलोड हो रहा है..." },
  save_profile_btn: { en: "Save Profile Info", hi: "जानकारी सहेजें" },
  saving_text: { en: "Saving...", hi: "सहेजा जा रहा है..." },
  training_status_title: { en: "Training Status", hi: "एनआरएलएम प्रशिक्षण स्थिति" },
  current_status_label: { en: "Current status:", hi: "वर्तमान स्थिति:" },
  emergency_contact_title: { en: "Emergency Contact Info", hi: "आपातकालीन संपर्क सूत्र" },
  contact_name_field: { en: "Contact Person Name", hi: "संपर्क का नाम" },
  contact_phone_field: { en: "Mobile Number", hi: "मोबाइल नंबर" },
  save_emergency_btn: { en: "Save Emergency Details", hi: "विवरण सहेजें" },
  change_pin_title2: { en: "Change Login PIN", hi: "लॉगिन पिन बदलें" },
  new_pin_field: { en: "New 4-Digit PIN", hi: "नया 4-अंकीय पिन" },
  confirm_pin_field: { en: "Confirm PIN", hi: "पिन की पुष्टि करें" },
  update_pin_btn: { en: "Update PIN", hi: "पिन बदलें" },
  updating_text: { en: "Updating...", hi: "बदला जा रहा है..." },

  // Submit form — missing keys
  submit_page_title: { en: "Submit Today's Work", hi: "दैनिक कार्य रिपोर्ट" },
  submit_sub_title: { en: "Fill in the activity details and upload photo evidence", hi: "गतिविधि विवरण भरें और फोटो साक्ष्य अपलोड करें" },
  form_section_title: { en: "Activity Submission Form", hi: "दैनिक कार्य रिपोर्ट फॉर्म" },
  date_field_label: { en: "Date of Activity (Cannot select future)", hi: "तारीख (भविष्य की तारीख नहीं चुन सकते)" },
  activity_type_field: { en: "Activity Type", hi: "गतिविधि प्रकार" },
  state_field: { en: "State", hi: "राज्य" },
  district_field: { en: "District", hi: "जिला" },
  block_field2: { en: "Block", hi: "ब्लॉक" },
  panchayat_field2: { en: "Panchayat", hi: "पंचायत" },
  village_field2: { en: "Village", hi: "गाँव" },
  beneficiaries_field: { en: "Women benefited (Max 1000)", hi: "महिला लाभार्थी संख्या (अधिकतम 1000)" },
  description_field: { en: "Description Notes (Max 500 characters)", hi: "विवरण नोट्स (अधिकतम 500 अक्षर)" },
  capture_photos_label: { en: "Capture Photos", hi: "साक्ष्य चित्र" },
  pdf_label: { en: "PDF Attachment (Max 10MB)", hi: "दस्तावेज़ (अधिकतम 10MB)" },
  auto_attendance_label: { en: "Auto-Mark Attendance", hi: "उपस्थिति स्वतः दर्ज" },
  save_draft_btn: { en: "Save Draft", hi: "ड्राफ्ट सहेजें" },
  submit_report_btn: { en: "Submit Report", hi: "सबमिट करें" },
  gps_acquiring: { en: "Acquiring GPS…", hi: "GPS लोकेशन प्राप्त की जा रही है..." },
  select_activity_opt: { en: "Select Activity", hi: "गतिविधि का चयन करें" },

  // Sidebar notifications item
  notifications_sidebar: { en: "Notifications", hi: "सूचनाएं" },
} as const;

export type DictKey = keyof typeof dict;

// ── Read language from localStorage synchronously ──────────────────────────
// Using a lazy initialiser avoids the "English flash then Hindi" problem.
// On the server (SSR), localStorage doesn't exist, so we default to "en".
function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("nrlm_lang");
  return stored === "hi" ? "hi" : "en";
}

// ── Context ───────────────────────────────────────────────────────────────
interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (k: DictKey | string) => string;
}

const I18nContext = createContext<I18nCtx | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────
export function I18nProvider({ children }: { children: ReactNode }) {
  // Lazy initialiser: reads localStorage ONCE on first render (client-side)
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nrlm_lang", l);
      // Update html[lang] so screen readers and fonts adjust
      document.documentElement.lang = l === "hi" ? "hi" : "en";
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "hi" : "en");
  }, [lang, setLang]);

  // Sync html[lang] on initial load
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "hi" ? "hi" : "en";
    }
  }, [lang]);

  // t() is memoised per lang — changes when lang changes
  const t = useCallback(
    (k: DictKey | string): string => {
      const entry = (dict as Record<string, { en: string; hi: string }>)[k];
      if (!entry) return k; // return the key itself as fallback
      return entry[lang];
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, setLang, toggleLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ── Hooks ─────────────────────────────────────────────────────────────────
/** Main hook — returns { lang, setLang, toggleLang, t } */
export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside <I18nProvider>");
  return ctx;
}

/** Lightweight hook for components that only need the current lang string */
export function useLang(): Lang {
  return useT().lang;
}
