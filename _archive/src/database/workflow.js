/**
 * DATA WORKFLOW - Submission and Approval Entry Point
 *
 * Data submission, review, and approval workflow management.
 * This is the primary entry point for workflow-related imports.
 */

// ============================================================================
// DATA SUBMISSION WORKFLOW
// ============================================================================

export {
  // Configuration
  WORKFLOW_CONFIG,
  SUBMISSION_STATUS,
  USER_ROLES,
  PERMISSION_MATRIX,
  STATE_TRANSITIONS,

  // Error classes
  WorkflowError,
  TransitionError,
  PermissionError,
  ValidationError,

  // Event system
  workflowEvents,

  // Notifications
  NOTIFICATION_TYPES,
  getPendingNotifications,
  markNotificationSent,

  // Deadlines
  checkDeadlines,

  // Assignment
  autoAssignReviewer,
  getAssignment,
  reassignSubmission,

  // Version management
  getVersionHistory,
  getVersion,

  // Validation
  validateTransition,
  calculateQualityScore,

  // Submission CRUD
  createSubmission,
  updateSubmission,
  getSubmission,
  getSubmissions,

  // Review operations
  addReviewComment,
  resolveComment,

  // Queries
  getPendingReviews,
  getPendingApproval,
  getSubmissionsByUser,
  getSubmissionsByAdminUnit,

  // Statistics
  getWorkflowStats,

  // Audit
  getAuditLog,

  // Conflict detection
  checkConflicts
} from './dataSubmissionWorkflow.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import dataSubmissionWorkflow from './dataSubmissionWorkflow.js';

export default dataSubmissionWorkflow;
