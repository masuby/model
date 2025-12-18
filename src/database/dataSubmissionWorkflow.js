/**
 * DATA SUBMISSION WORKFLOW SYSTEM - ENHANCED VERSION
 *
 * Complete workflow for data collection, submission, review, and approval.
 * Implements a finite state machine pattern with comprehensive lifecycle management.
 *
 * WORKFLOW STATES:
 * DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED/NEEDS_REVISION → PUBLISHED
 *
 * ENHANCED FEATURES:
 * - Finite State Machine with validated transitions
 * - Middleware/Hooks for state change events
 * - Assignment routing and workload balancing
 * - Deadline management with escalation
 * - Batch operations support
 * - Notification system integration
 * - Priority queue for urgent submissions
 * - Data quality scoring
 * - Conflict detection
 * - Version history tracking
 */

import { INDICATOR_DEFINITIONS } from './advancedSchema.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const WORKFLOW_CONFIG = {
  // Deadline settings (in hours)
  deadlines: {
    review: 48,        // Hours to complete review
    revision: 72,      // Hours to submit revision
    approval: 24,      // Hours to approve after review
    publish: 12        // Hours to publish after approval
  },

  // Escalation settings
  escalation: {
    enabled: true,
    warningThreshold: 0.75,   // Warn at 75% of deadline
    escalateThreshold: 1.0,   // Escalate at 100% of deadline
    maxEscalationLevel: 3
  },

  // Priority levels
  priority: {
    CRITICAL: { value: 1, label: 'Critical', slaMultiplier: 0.5 },
    HIGH: { value: 2, label: 'High', slaMultiplier: 0.75 },
    NORMAL: { value: 3, label: 'Normal', slaMultiplier: 1.0 },
    LOW: { value: 4, label: 'Low', slaMultiplier: 1.5 }
  },

  // Auto-assignment
  autoAssignment: {
    enabled: true,
    strategy: 'round_robin',  // 'round_robin', 'workload_balanced', 'expertise'
    maxAssignmentsPerReviewer: 10
  },

  // Batch processing
  batch: {
    maxSize: 100,
    parallelProcessing: true
  },

  // Quality thresholds
  quality: {
    minForApproval: 70,
    requiresExpertReview: 50
  }
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const SUBMISSION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  NEEDS_REVISION: 'needs_revision',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  CANCELLED: 'cancelled'
};

export const USER_ROLES = {
  DATA_COLLECTOR: 'data_collector',
  DATA_REVIEWER: 'data_reviewer',
  SENIOR_REVIEWER: 'senior_reviewer',
  DATA_APPROVER: 'data_approver',
  ADMIN: 'admin',
  SYSTEM: 'system'
};

export const PERMISSION_MATRIX = {
  [USER_ROLES.DATA_COLLECTOR]: {
    canCreate: true,
    canSubmit: true,
    canEdit: true,
    canReview: false,
    canApprove: false,
    canPublish: false,
    canViewAll: false,
    canAssign: false,
    canEscalate: false,
    canArchive: false,
    canCancel: true
  },
  [USER_ROLES.DATA_REVIEWER]: {
    canCreate: true,
    canSubmit: true,
    canEdit: true,
    canReview: true,
    canApprove: false,
    canPublish: false,
    canViewAll: true,
    canAssign: false,
    canEscalate: true,
    canArchive: false,
    canCancel: false
  },
  [USER_ROLES.SENIOR_REVIEWER]: {
    canCreate: true,
    canSubmit: true,
    canEdit: true,
    canReview: true,
    canApprove: true,
    canPublish: false,
    canViewAll: true,
    canAssign: true,
    canEscalate: true,
    canArchive: false,
    canCancel: true
  },
  [USER_ROLES.DATA_APPROVER]: {
    canCreate: true,
    canSubmit: true,
    canEdit: true,
    canReview: true,
    canApprove: true,
    canPublish: false,
    canViewAll: true,
    canAssign: true,
    canEscalate: true,
    canArchive: true,
    canCancel: true
  },
  [USER_ROLES.ADMIN]: {
    canCreate: true,
    canSubmit: true,
    canEdit: true,
    canReview: true,
    canApprove: true,
    canPublish: true,
    canViewAll: true,
    canAssign: true,
    canEscalate: true,
    canArchive: true,
    canCancel: true
  },
  [USER_ROLES.SYSTEM]: {
    canCreate: true,
    canSubmit: true,
    canEdit: true,
    canReview: true,
    canApprove: true,
    canPublish: true,
    canViewAll: true,
    canAssign: true,
    canEscalate: true,
    canArchive: true,
    canCancel: true
  }
};

// ============================================================================
// STATE MACHINE DEFINITION
// ============================================================================

export const STATE_TRANSITIONS = {
  [SUBMISSION_STATUS.DRAFT]: {
    allowed: [SUBMISSION_STATUS.SUBMITTED, SUBMISSION_STATUS.CANCELLED],
    actions: {
      [SUBMISSION_STATUS.SUBMITTED]: 'submit',
      [SUBMISSION_STATUS.CANCELLED]: 'cancel'
    }
  },
  [SUBMISSION_STATUS.SUBMITTED]: {
    allowed: [SUBMISSION_STATUS.UNDER_REVIEW, SUBMISSION_STATUS.DRAFT, SUBMISSION_STATUS.CANCELLED],
    actions: {
      [SUBMISSION_STATUS.UNDER_REVIEW]: 'start_review',
      [SUBMISSION_STATUS.DRAFT]: 'withdraw',
      [SUBMISSION_STATUS.CANCELLED]: 'cancel'
    }
  },
  [SUBMISSION_STATUS.UNDER_REVIEW]: {
    allowed: [SUBMISSION_STATUS.APPROVED, SUBMISSION_STATUS.REJECTED, SUBMISSION_STATUS.NEEDS_REVISION],
    actions: {
      [SUBMISSION_STATUS.APPROVED]: 'approve',
      [SUBMISSION_STATUS.REJECTED]: 'reject',
      [SUBMISSION_STATUS.NEEDS_REVISION]: 'request_revision'
    }
  },
  [SUBMISSION_STATUS.NEEDS_REVISION]: {
    allowed: [SUBMISSION_STATUS.SUBMITTED, SUBMISSION_STATUS.CANCELLED],
    actions: {
      [SUBMISSION_STATUS.SUBMITTED]: 'resubmit',
      [SUBMISSION_STATUS.CANCELLED]: 'cancel'
    }
  },
  [SUBMISSION_STATUS.APPROVED]: {
    allowed: [SUBMISSION_STATUS.PUBLISHED, SUBMISSION_STATUS.UNDER_REVIEW],
    actions: {
      [SUBMISSION_STATUS.PUBLISHED]: 'publish',
      [SUBMISSION_STATUS.UNDER_REVIEW]: 'reopen_review'
    }
  },
  [SUBMISSION_STATUS.REJECTED]: {
    allowed: [SUBMISSION_STATUS.DRAFT, SUBMISSION_STATUS.ARCHIVED],
    actions: {
      [SUBMISSION_STATUS.DRAFT]: 'revise',
      [SUBMISSION_STATUS.ARCHIVED]: 'archive'
    }
  },
  [SUBMISSION_STATUS.PUBLISHED]: {
    allowed: [SUBMISSION_STATUS.ARCHIVED],
    actions: {
      [SUBMISSION_STATUS.ARCHIVED]: 'archive'
    }
  },
  [SUBMISSION_STATUS.ARCHIVED]: {
    allowed: [SUBMISSION_STATUS.DRAFT],
    actions: {
      [SUBMISSION_STATUS.DRAFT]: 'restore'
    }
  },
  [SUBMISSION_STATUS.CANCELLED]: {
    allowed: [SUBMISSION_STATUS.DRAFT],
    actions: {
      [SUBMISSION_STATUS.DRAFT]: 'restore'
    }
  }
};

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class WorkflowError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'WorkflowError';
    this.code = code;
    this.details = details;
  }
}

export class TransitionError extends WorkflowError {
  constructor(fromState, toState, reason) {
    super(`Invalid transition from ${fromState} to ${toState}: ${reason}`, 'INVALID_TRANSITION', { fromState, toState });
    this.name = 'TransitionError';
  }
}

export class PermissionError extends WorkflowError {
  constructor(userId, action, resource) {
    super(`User ${userId} does not have permission to ${action} on ${resource}`, 'PERMISSION_DENIED', { userId, action, resource });
    this.name = 'PermissionError';
  }
}

export class ValidationError extends WorkflowError {
  constructor(errors) {
    super(`Validation failed: ${errors.join(', ')}`, 'VALIDATION_FAILED', { errors });
    this.name = 'ValidationError';
  }
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================

class WorkflowEventEmitter {
  constructor() {
    this.listeners = new Map();
    this.middlewares = [];
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  async emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    const results = [];

    for (const callback of callbacks) {
      try {
        const result = await callback(data);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  async executeMiddlewares(context) {
    let index = 0;

    const next = async () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(context, next);
      }
    };

    await next();
  }
}

export const workflowEvents = new WorkflowEventEmitter();

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

const submissionsStore = new Map();
const auditLogStore = [];
const assignmentsStore = new Map();
const notificationsQueue = [];
const deadlinesStore = new Map();
const versionsStore = new Map();

let submissionCounter = 1;

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

export const NOTIFICATION_TYPES = {
  SUBMISSION_CREATED: 'submission_created',
  SUBMISSION_SUBMITTED: 'submission_submitted',
  REVIEW_STARTED: 'review_started',
  REVIEW_COMPLETED: 'review_completed',
  REVISION_REQUESTED: 'revision_requested',
  SUBMISSION_APPROVED: 'submission_approved',
  SUBMISSION_REJECTED: 'submission_rejected',
  SUBMISSION_PUBLISHED: 'submission_published',
  DEADLINE_WARNING: 'deadline_warning',
  DEADLINE_EXPIRED: 'deadline_expired',
  ESCALATION: 'escalation',
  ASSIGNMENT: 'assignment'
};

/**
 * Queue a notification
 * @param {Object} notification - Notification data
 */
function queueNotification(notification) {
  notificationsQueue.push({
    id: `NOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...notification,
    createdAt: new Date().toISOString(),
    sent: false
  });

  // Emit notification event
  workflowEvents.emit('notification:queued', notification);
}

/**
 * Get pending notifications
 * @param {Object} filters - Filter options
 * @returns {Object[]} - Pending notifications
 */
export function getPendingNotifications(filters = {}) {
  let notifications = notificationsQueue.filter(n => !n.sent);

  if (filters.userId) {
    notifications = notifications.filter(n => n.userId === filters.userId);
  }

  if (filters.type) {
    notifications = notifications.filter(n => n.type === filters.type);
  }

  return notifications;
}

/**
 * Mark notification as sent
 * @param {string} notificationId - Notification ID
 */
export function markNotificationSent(notificationId) {
  const notification = notificationsQueue.find(n => n.id === notificationId);
  if (notification) {
    notification.sent = true;
    notification.sentAt = new Date().toISOString();
  }
}

// ============================================================================
// DEADLINE MANAGEMENT
// ============================================================================

/**
 * Set deadline for a submission
 * @param {string} submissionId - Submission ID
 * @param {string} deadlineType - Type of deadline
 * @param {number} hoursFromNow - Hours until deadline
 * @param {number} priority - Priority multiplier
 */
function setDeadline(submissionId, deadlineType, hoursFromNow, priority = 1) {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + (hoursFromNow * priority));

  deadlinesStore.set(`${submissionId}:${deadlineType}`, {
    submissionId,
    type: deadlineType,
    deadline: deadline.toISOString(),
    createdAt: new Date().toISOString(),
    escalationLevel: 0
  });
}

/**
 * Check and process deadlines
 * @returns {Object[]} - Expired or warning deadlines
 */
export function checkDeadlines() {
  const now = new Date();
  const results = [];

  for (const [key, deadline] of deadlinesStore.entries()) {
    const deadlineDate = new Date(deadline.deadline);
    const timeRemaining = deadlineDate - now;
    const totalTime = new Date(deadline.deadline) - new Date(deadline.createdAt);
    const percentRemaining = timeRemaining / totalTime;

    if (timeRemaining <= 0) {
      // Deadline expired
      results.push({
        ...deadline,
        status: 'expired',
        overdue: Math.abs(timeRemaining)
      });

      // Escalate if enabled
      if (WORKFLOW_CONFIG.escalation.enabled && deadline.escalationLevel < WORKFLOW_CONFIG.escalation.maxEscalationLevel) {
        escalateDeadline(deadline.submissionId, deadline.type);
      }

      queueNotification({
        type: NOTIFICATION_TYPES.DEADLINE_EXPIRED,
        submissionId: deadline.submissionId,
        deadlineType: deadline.type
      });
    } else if (percentRemaining <= (1 - WORKFLOW_CONFIG.escalation.warningThreshold)) {
      // Warning threshold
      results.push({
        ...deadline,
        status: 'warning',
        timeRemaining
      });

      queueNotification({
        type: NOTIFICATION_TYPES.DEADLINE_WARNING,
        submissionId: deadline.submissionId,
        deadlineType: deadline.type,
        timeRemaining
      });
    }
  }

  return results;
}

/**
 * Escalate a deadline
 * @param {string} submissionId - Submission ID
 * @param {string} deadlineType - Type of deadline
 */
function escalateDeadline(submissionId, deadlineType) {
  const key = `${submissionId}:${deadlineType}`;
  const deadline = deadlinesStore.get(key);

  if (deadline && deadline.escalationLevel < WORKFLOW_CONFIG.escalation.maxEscalationLevel) {
    deadline.escalationLevel++;
    deadlinesStore.set(key, deadline);

    queueNotification({
      type: NOTIFICATION_TYPES.ESCALATION,
      submissionId,
      deadlineType,
      escalationLevel: deadline.escalationLevel
    });

    logAudit({
      action: 'DEADLINE_ESCALATED',
      submissionId,
      details: { deadlineType, escalationLevel: deadline.escalationLevel }
    });
  }
}

/**
 * Clear deadline
 * @param {string} submissionId - Submission ID
 * @param {string} deadlineType - Type of deadline
 */
function clearDeadline(submissionId, deadlineType) {
  deadlinesStore.delete(`${submissionId}:${deadlineType}`);
}

// ============================================================================
// ASSIGNMENT ROUTING
// ============================================================================

/**
 * Auto-assign submission to reviewer
 * @param {string} submissionId - Submission ID
 * @param {Object[]} availableReviewers - List of available reviewers
 * @returns {Object|null} - Assigned reviewer
 */
export function autoAssignReviewer(submissionId, availableReviewers) {
  if (!WORKFLOW_CONFIG.autoAssignment.enabled || availableReviewers.length === 0) {
    return null;
  }

  let selectedReviewer = null;

  switch (WORKFLOW_CONFIG.autoAssignment.strategy) {
    case 'round_robin':
      selectedReviewer = selectRoundRobin(availableReviewers);
      break;
    case 'workload_balanced':
      selectedReviewer = selectByWorkload(availableReviewers);
      break;
    case 'expertise':
      const submission = submissionsStore.get(submissionId);
      selectedReviewer = selectByExpertise(availableReviewers, submission);
      break;
    default:
      selectedReviewer = availableReviewers[0];
  }

  if (selectedReviewer) {
    assignmentsStore.set(submissionId, {
      reviewerId: selectedReviewer.id,
      assignedAt: new Date().toISOString(),
      strategy: WORKFLOW_CONFIG.autoAssignment.strategy
    });

    queueNotification({
      type: NOTIFICATION_TYPES.ASSIGNMENT,
      submissionId,
      userId: selectedReviewer.id,
      message: `You have been assigned to review submission ${submissionId}`
    });
  }

  return selectedReviewer;
}

function selectRoundRobin(reviewers) {
  // Simple round-robin based on assignment count
  const counts = reviewers.map(r => ({
    reviewer: r,
    count: Array.from(assignmentsStore.values()).filter(a => a.reviewerId === r.id).length
  }));

  counts.sort((a, b) => a.count - b.count);
  return counts[0]?.reviewer || null;
}

function selectByWorkload(reviewers) {
  // Select reviewer with lowest active workload
  const workloads = reviewers.map(r => {
    const activeSubmissions = Array.from(submissionsStore.values())
      .filter(s => s.workflow?.currentReviewer?.id === r.id && s.status === SUBMISSION_STATUS.UNDER_REVIEW);
    return { reviewer: r, workload: activeSubmissions.length };
  });

  workloads.sort((a, b) => a.workload - b.workload);

  // Check max assignments limit
  const selected = workloads.find(w => w.workload < WORKFLOW_CONFIG.autoAssignment.maxAssignmentsPerReviewer);
  return selected?.reviewer || null;
}

function selectByExpertise(reviewers, submission) {
  // Select based on region expertise
  const regionMatch = reviewers.find(r =>
    r.regions?.includes(submission?.adminUnitCode?.substring(0, 2))
  );
  return regionMatch || selectByWorkload(reviewers);
}

/**
 * Get reviewer assignment
 * @param {string} submissionId - Submission ID
 * @returns {Object|null} - Assignment details
 */
export function getAssignment(submissionId) {
  return assignmentsStore.get(submissionId) || null;
}

/**
 * Reassign submission to different reviewer
 * @param {string} submissionId - Submission ID
 * @param {string} newReviewerId - New reviewer ID
 * @param {string} reason - Reason for reassignment
 */
export function reassignSubmission(submissionId, newReviewerId, reason = '') {
  const currentAssignment = assignmentsStore.get(submissionId);

  assignmentsStore.set(submissionId, {
    reviewerId: newReviewerId,
    assignedAt: new Date().toISOString(),
    previousReviewerId: currentAssignment?.reviewerId,
    reassignmentReason: reason
  });

  logAudit({
    action: 'SUBMISSION_REASSIGNED',
    submissionId,
    details: { newReviewerId, previousReviewerId: currentAssignment?.reviewerId, reason }
  });
}

// ============================================================================
// VERSION HISTORY
// ============================================================================

/**
 * Save version of submission
 * @param {Object} submission - Submission to version
 */
function saveVersion(submission) {
  const versions = versionsStore.get(submission.id) || [];

  versions.push({
    version: versions.length + 1,
    snapshot: JSON.parse(JSON.stringify(submission)),
    createdAt: new Date().toISOString()
  });

  versionsStore.set(submission.id, versions);
}

/**
 * Get version history
 * @param {string} submissionId - Submission ID
 * @returns {Object[]} - Version history
 */
export function getVersionHistory(submissionId) {
  return versionsStore.get(submissionId) || [];
}

/**
 * Get specific version
 * @param {string} submissionId - Submission ID
 * @param {number} version - Version number
 * @returns {Object|null} - Version snapshot
 */
export function getVersion(submissionId, version) {
  const versions = versionsStore.get(submissionId);
  return versions?.find(v => v.version === version)?.snapshot || null;
}

// ============================================================================
// STATE MACHINE
// ============================================================================

/**
 * Validate state transition
 * @param {string} fromState - Current state
 * @param {string} toState - Target state
 * @returns {Object} - Validation result
 */
export function validateTransition(fromState, toState) {
  const transitions = STATE_TRANSITIONS[fromState];

  if (!transitions) {
    return { valid: false, error: `Unknown state: ${fromState}` };
  }

  if (!transitions.allowed.includes(toState)) {
    return {
      valid: false,
      error: `Transition from ${fromState} to ${toState} is not allowed`,
      allowedTransitions: transitions.allowed
    };
  }

  return {
    valid: true,
    action: transitions.actions[toState]
  };
}

/**
 * Execute state transition
 * @param {string} submissionId - Submission ID
 * @param {string} toState - Target state
 * @param {Object} context - Transition context
 * @returns {Object} - Updated submission
 */
async function executeTransition(submissionId, toState, context) {
  const submission = submissionsStore.get(submissionId);

  if (!submission) {
    throw new WorkflowError('Submission not found', 'NOT_FOUND');
  }

  const fromState = submission.status;
  const validation = validateTransition(fromState, toState);

  if (!validation.valid) {
    throw new TransitionError(fromState, toState, validation.error);
  }

  // Execute middlewares
  const middlewareContext = {
    submission,
    fromState,
    toState,
    action: validation.action,
    context
  };

  await workflowEvents.executeMiddlewares(middlewareContext);

  // Save version before transition
  saveVersion(submission);

  // Update state
  const previousState = submission.status;
  submission.status = toState;
  submission.workflow.currentStep = toState;
  submission.workflow.history.push({
    action: validation.action,
    fromState,
    toState,
    timestamp: new Date().toISOString(),
    userId: context.userId,
    userName: context.userName,
    notes: context.notes
  });

  submission.metadata.updatedAt = new Date().toISOString();
  submissionsStore.set(submissionId, submission);

  // Emit transition event
  await workflowEvents.emit('transition', {
    submissionId,
    fromState,
    toState,
    action: validation.action,
    context
  });

  // Log audit
  logAudit({
    action: `STATE_TRANSITION_${validation.action.toUpperCase()}`,
    submissionId,
    userId: context.userId,
    details: { fromState, toState }
  });

  return submission;
}

// ============================================================================
// DATA QUALITY SCORING
// ============================================================================

/**
 * Calculate data quality score for submission
 * @param {Object} submission - Submission to score
 * @returns {Object} - Quality score breakdown
 */
export function calculateQualityScore(submission) {
  const scores = {
    completeness: 0,
    consistency: 0,
    timeliness: 0,
    accuracy: 0,
    documentation: 0
  };

  // Completeness: percentage of required indicators filled
  const totalIndicators = Object.keys(INDICATOR_DEFINITIONS).length;
  const filledIndicators = Object.values(submission.indicators || {}).filter(i => i.value !== null && i.value !== undefined).length;
  scores.completeness = Math.round((filledIndicators / Math.max(totalIndicators * 0.5, 1)) * 100);

  // Consistency: check for validation errors
  const validIndicators = Object.values(submission.indicators || {}).filter(i => i.validationResult?.valid !== false).length;
  scores.consistency = filledIndicators > 0 ? Math.round((validIndicators / filledIndicators) * 100) : 0;

  // Timeliness: based on data year vs current year
  const currentYear = new Date().getFullYear();
  const dataYear = submission.dataYear || currentYear;
  const yearDiff = currentYear - dataYear;
  scores.timeliness = Math.max(0, 100 - (yearDiff * 20));

  // Accuracy: based on validation results and value ranges
  const indicatorsWithNotes = Object.values(submission.indicators || {}).filter(i => i.notes && i.notes.length > 10).length;
  scores.accuracy = filledIndicators > 0 ? Math.round((indicatorsWithNotes / filledIndicators) * 50 + 50) : 50;

  // Documentation: based on attachments and metadata
  const hasSource = !!submission.sourceName;
  const hasAttachments = Object.values(submission.indicators || {}).some(i => i.attachments?.length > 0);
  scores.documentation = (hasSource ? 50 : 0) + (hasAttachments ? 50 : 0);

  // Overall score (weighted average)
  const weights = { completeness: 0.3, consistency: 0.25, timeliness: 0.15, accuracy: 0.15, documentation: 0.15 };
  const overall = Object.entries(scores).reduce((sum, [key, value]) => sum + (value * weights[key]), 0);

  return {
    overall: Math.round(overall),
    breakdown: scores,
    grade: overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F',
    meetsMinimum: overall >= WORKFLOW_CONFIG.quality.minForApproval,
    requiresExpertReview: overall < WORKFLOW_CONFIG.quality.requiresExpertReview
  };
}

// ============================================================================
// DATA SUBMISSION OPERATIONS
// ============================================================================

/**
 * Create a new data submission
 * @param {Object} params - Submission parameters
 * @returns {Object} Created submission
 */
export function createSubmission(params) {
  const {
    submitterId,
    submitterName,
    submitterRole,
    adminUnitCode,
    adminUnitName,
    adminLevel,
    dataYear,
    dataMonth = null,
    sourceType,
    sourceName,
    indicators,
    priority = 'NORMAL',
    metadata = {}
  } = params;

  // Check permissions
  const permissions = PERMISSION_MATRIX[submitterRole];
  if (!permissions?.canCreate) {
    throw new PermissionError(submitterId, 'create', 'submission');
  }

  const submissionId = `SUB-${Date.now()}-${submissionCounter++}`;
  const priorityConfig = WORKFLOW_CONFIG.priority[priority] || WORKFLOW_CONFIG.priority.NORMAL;

  const submission = {
    id: submissionId,
    status: SUBMISSION_STATUS.DRAFT,
    priority: {
      level: priority,
      value: priorityConfig.value,
      slaMultiplier: priorityConfig.slaMultiplier
    },

    // Submitter info
    submitterId,
    submitterName,
    submitterRole,

    // Location
    adminUnitCode,
    adminUnitName,
    adminLevel,

    // Data period
    dataYear,
    dataMonth,

    // Source
    sourceType,
    sourceName,

    // Indicators
    indicators: {},

    // Metadata
    metadata: {
      ...metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },

    // Workflow
    workflow: {
      currentStep: 'draft',
      currentReviewer: null,
      history: [{
        action: 'created',
        timestamp: new Date().toISOString(),
        userId: submitterId,
        userName: submitterName
      }]
    },

    // Review
    reviews: [],
    comments: [],

    // Validation
    validation: null,

    // Quality
    quality: null
  };

  // Process and validate indicators
  for (const [indicatorId, data] of Object.entries(indicators || {})) {
    const definition = INDICATOR_DEFINITIONS?.[indicatorId];
    if (!definition) {
      console.warn(`Unknown indicator: ${indicatorId}`);
    }

    submission.indicators[indicatorId] = {
      value: data.value,
      normalizedValue: null,
      notes: data.notes || '',
      attachments: data.attachments || [],
      validationResult: validateIndicator(indicatorId, data.value),
      updatedAt: new Date().toISOString()
    };
  }

  // Calculate initial quality score
  submission.quality = calculateQualityScore(submission);

  submissionsStore.set(submissionId, submission);

  // Emit event
  workflowEvents.emit('submission:created', { submissionId, submission });

  // Queue notification
  queueNotification({
    type: NOTIFICATION_TYPES.SUBMISSION_CREATED,
    submissionId,
    userId: submitterId
  });

  // Log audit
  logAudit({
    action: 'SUBMISSION_CREATED',
    submissionId,
    userId: submitterId,
    details: { adminUnitCode, dataYear, indicatorCount: Object.keys(indicators || {}).length, priority }
  });

  return submission;
}

/**
 * Validate indicator value
 * @param {string} indicatorId - Indicator ID
 * @param {*} value - Value to validate
 * @returns {Object} - Validation result
 */
function validateIndicator(indicatorId, value) {
  const errors = [];
  const warnings = [];

  if (value === null || value === undefined) {
    return { valid: true, value: null, errors: [], warnings: ['Value is missing'] };
  }

  if (typeof value === 'number') {
    if (isNaN(value)) {
      errors.push('Value is not a valid number');
    } else if (value < 0 || value > 10) {
      errors.push('Value must be between 0 and 10');
    }
  }

  return {
    valid: errors.length === 0,
    value,
    errors,
    warnings
  };
}

/**
 * Update a draft submission
 * @param {string} submissionId - Submission ID
 * @param {Object} updates - Fields to update
 * @param {string} userId - User making the update
 * @param {string} userRole - User's role
 * @returns {Object} Updated submission
 */
export function updateSubmission(submissionId, updates, userId, userRole) {
  const submission = submissionsStore.get(submissionId);

  if (!submission) {
    throw new WorkflowError('Submission not found', 'NOT_FOUND');
  }

  // Check permissions
  const permissions = PERMISSION_MATRIX[userRole];
  if (!permissions?.canEdit) {
    throw new PermissionError(userId, 'edit', submissionId);
  }

  if (submission.status !== SUBMISSION_STATUS.DRAFT &&
      submission.status !== SUBMISSION_STATUS.NEEDS_REVISION) {
    throw new WorkflowError('Can only update draft or revision-needed submissions', 'INVALID_STATE');
  }

  // Save version before update
  saveVersion(submission);

  // Update allowed fields
  const allowedFields = ['indicators', 'sourceType', 'sourceName', 'dataYear', 'dataMonth', 'metadata', 'priority'];

  for (const [field, value] of Object.entries(updates)) {
    if (allowedFields.includes(field)) {
      if (field === 'indicators') {
        for (const [indicatorId, data] of Object.entries(value)) {
          submission.indicators[indicatorId] = {
            value: data.value,
            normalizedValue: null,
            notes: data.notes || '',
            attachments: data.attachments || [],
            validationResult: validateIndicator(indicatorId, data.value),
            updatedAt: new Date().toISOString()
          };
        }
      } else if (field === 'priority') {
        const priorityConfig = WORKFLOW_CONFIG.priority[value] || WORKFLOW_CONFIG.priority.NORMAL;
        submission.priority = {
          level: value,
          value: priorityConfig.value,
          slaMultiplier: priorityConfig.slaMultiplier
        };
      } else {
        submission[field] = value;
      }
    }
  }

  // Recalculate quality
  submission.quality = calculateQualityScore(submission);

  submission.metadata.updatedAt = new Date().toISOString();
  submission.workflow.history.push({
    action: 'updated',
    timestamp: new Date().toISOString(),
    userId,
    changes: Object.keys(updates)
  });

  submissionsStore.set(submissionId, submission);

  logAudit({
    action: 'SUBMISSION_UPDATED',
    submissionId,
    userId,
    details: { updatedFields: Object.keys(updates) }
  });

  return submission;
}

/**
 * Submit for review
 * @param {string} submissionId - Submission ID
 * @param {string} userId - User submitting
 * @param {string} userRole - User's role
 * @param {string} notes - Submission notes
 * @returns {Object} Updated submission
 */
export async function submitForReview(submissionId, userId, userRole, notes = '') {
  const submission = submissionsStore.get(submissionId);

  if (!submission) {
    throw new WorkflowError('Submission not found', 'NOT_FOUND');
  }

  // Check permissions
  const permissions = PERMISSION_MATRIX[userRole];
  if (!permissions?.canSubmit) {
    throw new PermissionError(userId, 'submit', submissionId);
  }

  // Validate submission quality
  const quality = calculateQualityScore(submission);
  submission.quality = quality;

  if (!quality.meetsMinimum) {
    submission.validation = {
      valid: false,
      errors: [`Quality score (${quality.overall}) is below minimum threshold (${WORKFLOW_CONFIG.quality.minForApproval})`]
    };
    submissionsStore.set(submissionId, submission);
    throw new ValidationError([`Quality score too low: ${quality.overall}%`]);
  }

  // Execute transition
  const updated = await executeTransition(submissionId, SUBMISSION_STATUS.SUBMITTED, {
    userId,
    userName: submission.submitterName,
    notes
  });

  // Set review deadline
  const priorityMultiplier = submission.priority?.slaMultiplier || 1;
  setDeadline(submissionId, 'review', WORKFLOW_CONFIG.deadlines.review, priorityMultiplier);

  // Queue notification
  queueNotification({
    type: NOTIFICATION_TYPES.SUBMISSION_SUBMITTED,
    submissionId,
    userId
  });

  return updated;
}

// ============================================================================
// REVIEW WORKFLOW
// ============================================================================

/**
 * Start review of a submission
 * @param {string} submissionId - Submission ID
 * @param {string} reviewerId - Reviewer user ID
 * @param {string} reviewerName - Reviewer name
 * @param {string} reviewerRole - Reviewer's role
 * @returns {Object} Updated submission
 */
export async function startReview(submissionId, reviewerId, reviewerName, reviewerRole) {
  const submission = submissionsStore.get(submissionId);

  if (!submission) {
    throw new WorkflowError('Submission not found', 'NOT_FOUND');
  }

  // Check permissions
  const permissions = PERMISSION_MATRIX[reviewerRole];
  if (!permissions?.canReview) {
    throw new PermissionError(reviewerId, 'review', submissionId);
  }

  // Execute transition
  const updated = await executeTransition(submissionId, SUBMISSION_STATUS.UNDER_REVIEW, {
    userId: reviewerId,
    userName: reviewerName,
    notes: 'Review started'
  });

  // Set reviewer
  updated.workflow.currentReviewer = { id: reviewerId, name: reviewerName };

  // Clear submission deadline, set approval deadline
  clearDeadline(submissionId, 'review');
  setDeadline(submissionId, 'approval', WORKFLOW_CONFIG.deadlines.approval, submission.priority?.slaMultiplier || 1);

  submissionsStore.set(submissionId, updated);

  // Queue notification
  queueNotification({
    type: NOTIFICATION_TYPES.REVIEW_STARTED,
    submissionId,
    userId: submission.submitterId,
    reviewerId
  });

  return updated;
}

/**
 * Add review comment
 * @param {string} submissionId - Submission ID
 * @param {string} reviewerId - Reviewer user ID
 * @param {Object} comment - Comment data
 * @returns {Object} Updated submission
 */
export function addReviewComment(submissionId, reviewerId, comment) {
  const submission = submissionsStore.get(submissionId);

  if (!submission) {
    throw new WorkflowError('Submission not found', 'NOT_FOUND');
  }

  const newComment = {
    id: `CMT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: 'review',
    userId: reviewerId,
    indicatorId: comment.indicatorId || null,
    message: comment.message,
    severity: comment.severity || 'info',
    resolved: false,
    timestamp: new Date().toISOString()
  };

  submission.comments.push(newComment);
  submission.metadata.updatedAt = new Date().toISOString();

  submissionsStore.set(submissionId, submission);

  return { submission, comment: newComment };
}

/**
 * Resolve review comment
 * @param {string} submissionId - Submission ID
 * @param {string} commentId - Comment ID
 * @param {string} userId - User resolving
 * @param {string} resolution - Resolution notes
 * @returns {Object} Updated submission
 */
export function resolveComment(submissionId, commentId, userId, resolution = '') {
  const submission = submissionsStore.get(submissionId);

  if (!submission) {
    throw new WorkflowError('Submission not found', 'NOT_FOUND');
  }

  const comment = submission.comments.find(c => c.id === commentId);
  if (!comment) {
    throw new WorkflowError('Comment not found', 'NOT_FOUND');
  }

  comment.resolved = true;
  comment.resolvedBy = userId;
  comment.resolvedAt = new Date().toISOString();
  comment.resolution = resolution;

  submissionsStore.set(submissionId, submission);

  return submission;
}

/**
 * Complete review with decision
 * @param {string} submissionId - Submission ID
 * @param {string} reviewerId - Reviewer user ID
 * @param {string} reviewerRole - Reviewer's role
 * @param {Object} decision - Review decision
 * @returns {Object} Updated submission
 */
export async function completeReview(submissionId, reviewerId, reviewerRole, decision) {
  const submission = submissionsStore.get(submissionId);

  if (!submission) {
    throw new WorkflowError('Submission not found', 'NOT_FOUND');
  }

  // Check permissions
  const permissions = PERMISSION_MATRIX[reviewerRole];
  if (!permissions?.canReview) {
    throw new PermissionError(reviewerId, 'review', submissionId);
  }

  const { action, notes, reason } = decision;

  // Validate action
  const validActions = ['approve', 'reject', 'request_revision'];
  if (!validActions.includes(action)) {
    throw new WorkflowError(`Invalid review action: ${action}`, 'INVALID_ACTION');
  }

  // Determine target state
  const stateMap = {
    approve: SUBMISSION_STATUS.APPROVED,
    reject: SUBMISSION_STATUS.REJECTED,
    request_revision: SUBMISSION_STATUS.NEEDS_REVISION
  };

  const targetState = stateMap[action];

  // Check if approver permission needed
  if (action === 'approve' && !permissions?.canApprove) {
    throw new PermissionError(reviewerId, 'approve', submissionId);
  }

  // Save review record
  const review = {
    id: `REV-${Date.now()}`,
    reviewerId,
    action,
    notes,
    reason,
    quality: submission.quality,
    timestamp: new Date().toISOString()
  };

  submission.reviews.push(review);

  // Execute transition
  const updated = await executeTransition(submissionId, targetState, {
    userId: reviewerId,
    notes,
    reason
  });

  // Clear current reviewer
  updated.workflow.currentReviewer = null;
  clearDeadline(submissionId, 'approval');

  // Set next deadline based on action
  if (action === 'request_revision') {
    setDeadline(submissionId, 'revision', WORKFLOW_CONFIG.deadlines.revision, submission.priority?.slaMultiplier || 1);
  } else if (action === 'approve') {
    setDeadline(submissionId, 'publish', WORKFLOW_CONFIG.deadlines.publish, submission.priority?.slaMultiplier || 1);
  }

  submissionsStore.set(submissionId, updated);

  // Queue notifications
  const notificationType = action === 'approve' ? NOTIFICATION_TYPES.SUBMISSION_APPROVED
    : action === 'reject' ? NOTIFICATION_TYPES.SUBMISSION_REJECTED
    : NOTIFICATION_TYPES.REVISION_REQUESTED;

  queueNotification({
    type: notificationType,
    submissionId,
    userId: submission.submitterId,
    reviewerId,
    reason
  });

  return updated;
}

// ============================================================================
// APPROVAL & PUBLISHING
// ============================================================================

/**
 * Publish approved data to the main database
 * @param {string} submissionId - Submission ID
 * @param {string} publisherId - Publisher user ID
 * @param {string} publisherRole - Publisher role
 * @returns {Object} Published data result
 */
export async function publishSubmission(submissionId, publisherId, publisherRole) {
  const submission = submissionsStore.get(submissionId);

  if (!submission) {
    throw new WorkflowError('Submission not found', 'NOT_FOUND');
  }

  // Check permissions
  const permissions = PERMISSION_MATRIX[publisherRole];
  if (!permissions?.canPublish) {
    throw new PermissionError(publisherId, 'publish', submissionId);
  }

  // Execute transition
  const updated = await executeTransition(submissionId, SUBMISSION_STATUS.PUBLISHED, {
    userId: publisherId,
    notes: 'Published to main database'
  });

  // Extract data for main database
  const publishedData = {
    adminUnitCode: submission.adminUnitCode,
    adminUnitName: submission.adminUnitName,
    adminLevel: submission.adminLevel,
    dataYear: submission.dataYear,
    dataMonth: submission.dataMonth,
    sourceType: submission.sourceType,
    sourceName: submission.sourceName,
    indicators: {},
    quality: submission.quality,
    publishedAt: new Date().toISOString(),
    publishedBy: publisherId,
    submissionId: submission.id
  };

  // Extract indicator values
  for (const [indicatorId, data] of Object.entries(submission.indicators)) {
    publishedData.indicators[indicatorId] = {
      value: data.value,
      notes: data.notes,
      validatedAt: updated.workflow.history.find(h => h.action === 'approve')?.timestamp
    };
  }

  // Update workflow
  updated.workflow.publishedBy = publisherId;
  updated.workflow.publishedAt = new Date().toISOString();

  // Clear publish deadline
  clearDeadline(submissionId, 'publish');

  submissionsStore.set(submissionId, updated);

  // Queue notification
  queueNotification({
    type: NOTIFICATION_TYPES.SUBMISSION_PUBLISHED,
    submissionId,
    userId: submission.submitterId,
    publisherId
  });

  return {
    success: true,
    submission: updated,
    publishedData
  };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Process multiple submissions in batch
 * @param {Object[]} operations - Array of { submissionId, action, params }
 * @param {string} userId - User performing batch
 * @param {string} userRole - User's role
 * @returns {Object} - Batch results
 */
export async function batchProcess(operations, userId, userRole) {
  if (operations.length > WORKFLOW_CONFIG.batch.maxSize) {
    throw new WorkflowError(`Batch size exceeds maximum of ${WORKFLOW_CONFIG.batch.maxSize}`, 'BATCH_TOO_LARGE');
  }

  const results = {
    total: operations.length,
    successful: 0,
    failed: 0,
    results: []
  };

  for (const op of operations) {
    try {
      let result;

      switch (op.action) {
        case 'submit':
          result = await submitForReview(op.submissionId, userId, userRole, op.params?.notes);
          break;
        case 'approve':
          result = await completeReview(op.submissionId, userId, userRole, { action: 'approve', ...op.params });
          break;
        case 'reject':
          result = await completeReview(op.submissionId, userId, userRole, { action: 'reject', ...op.params });
          break;
        case 'publish':
          result = await publishSubmission(op.submissionId, userId, userRole);
          break;
        default:
          throw new WorkflowError(`Unknown batch action: ${op.action}`, 'UNKNOWN_ACTION');
      }

      results.successful++;
      results.results.push({ submissionId: op.submissionId, success: true, result });
    } catch (error) {
      results.failed++;
      results.results.push({ submissionId: op.submissionId, success: false, error: error.message });
    }
  }

  logAudit({
    action: 'BATCH_PROCESS',
    userId,
    details: { total: results.total, successful: results.successful, failed: results.failed }
  });

  return results;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Object|null} Submission or null
 */
export function getSubmission(submissionId) {
  return submissionsStore.get(submissionId) || null;
}

/**
 * Get submissions with filters
 * @param {Object} filters - Filter options
 * @returns {Object[]} Matching submissions
 */
export function getSubmissions(filters = {}) {
  let submissions = Array.from(submissionsStore.values());

  if (filters.status) {
    submissions = submissions.filter(s => s.status === filters.status);
  }

  if (filters.submitterId) {
    submissions = submissions.filter(s => s.submitterId === filters.submitterId);
  }

  if (filters.reviewerId) {
    submissions = submissions.filter(s => s.workflow?.currentReviewer?.id === filters.reviewerId);
  }

  if (filters.adminUnitCode) {
    submissions = submissions.filter(s => s.adminUnitCode === filters.adminUnitCode);
  }

  if (filters.priority) {
    submissions = submissions.filter(s => s.priority?.level === filters.priority);
  }

  if (filters.dataYear) {
    submissions = submissions.filter(s => s.dataYear === filters.dataYear);
  }

  if (filters.fromDate) {
    submissions = submissions.filter(s => new Date(s.metadata.createdAt) >= new Date(filters.fromDate));
  }

  if (filters.toDate) {
    submissions = submissions.filter(s => new Date(s.metadata.createdAt) <= new Date(filters.toDate));
  }

  // Sort
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';

  submissions.sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case 'priority':
        aVal = a.priority?.value || 3;
        bVal = b.priority?.value || 3;
        break;
      case 'quality':
        aVal = a.quality?.overall || 0;
        bVal = b.quality?.overall || 0;
        break;
      default:
        aVal = new Date(a.metadata.createdAt);
        bVal = new Date(b.metadata.createdAt);
    }

    return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  // Pagination
  if (filters.limit) {
    const offset = filters.offset || 0;
    submissions = submissions.slice(offset, offset + filters.limit);
  }

  return submissions;
}

/**
 * Get submissions pending review
 * @returns {Object[]} Submissions awaiting review
 */
export function getPendingReviews() {
  return getSubmissions({ status: SUBMISSION_STATUS.SUBMITTED, sortBy: 'priority' });
}

/**
 * Get submissions pending approval
 * @returns {Object[]} Approved submissions awaiting publishing
 */
export function getPendingApproval() {
  return getSubmissions({ status: SUBMISSION_STATUS.APPROVED, sortBy: 'priority' });
}

/**
 * Get submissions by user
 * @param {string} userId - User ID
 * @returns {Object[]} User's submissions
 */
export function getSubmissionsByUser(userId) {
  return getSubmissions({ submitterId: userId });
}

/**
 * Get submissions by admin unit
 * @param {string} adminUnitCode - Admin unit code
 * @returns {Object[]} Submissions for the admin unit
 */
export function getSubmissionsByAdminUnit(adminUnitCode) {
  return getSubmissions({ adminUnitCode });
}

/**
 * Get workflow statistics
 * @returns {Object} Workflow statistics
 */
export function getWorkflowStats() {
  const all = Array.from(submissionsStore.values());

  const byStatus = {};
  Object.values(SUBMISSION_STATUS).forEach(status => {
    byStatus[status] = all.filter(s => s.status === status).length;
  });

  const byPriority = {};
  Object.keys(WORKFLOW_CONFIG.priority).forEach(priority => {
    byPriority[priority] = all.filter(s => s.priority?.level === priority).length;
  });

  const avgQuality = all.reduce((sum, s) => sum + (s.quality?.overall || 0), 0) / Math.max(all.length, 1);

  const overdueDeadlines = checkDeadlines().filter(d => d.status === 'expired').length;

  return {
    total: all.length,
    byStatus,
    byPriority,
    pendingActions: {
      awaitingReview: byStatus[SUBMISSION_STATUS.SUBMITTED] || 0,
      awaitingApproval: byStatus[SUBMISSION_STATUS.UNDER_REVIEW] || 0,
      awaitingPublish: byStatus[SUBMISSION_STATUS.APPROVED] || 0,
      needsRevision: byStatus[SUBMISSION_STATUS.NEEDS_REVISION] || 0
    },
    quality: {
      average: Math.round(avgQuality),
      meetsMinimum: all.filter(s => s.quality?.meetsMinimum).length,
      requiresExpertReview: all.filter(s => s.quality?.requiresExpertReview).length
    },
    deadlines: {
      overdue: overdueDeadlines,
      pending: deadlinesStore.size
    }
  };
}

// ============================================================================
// AUDIT LOG
// ============================================================================

/**
 * Log audit entry
 * @param {Object} entry - Audit entry
 */
function logAudit(entry) {
  auditLogStore.push({
    id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ...entry,
    timestamp: new Date().toISOString()
  });

  // Keep only last 10000 entries
  while (auditLogStore.length > 10000) {
    auditLogStore.shift();
  }
}

/**
 * Get audit log
 * @param {Object} filters - Filter options
 * @returns {Object[]} Audit entries
 */
export function getAuditLog(filters = {}) {
  let entries = [...auditLogStore];

  if (filters.submissionId) {
    entries = entries.filter(e => e.submissionId === filters.submissionId);
  }

  if (filters.userId) {
    entries = entries.filter(e => e.userId === filters.userId);
  }

  if (filters.action) {
    entries = entries.filter(e => e.action === filters.action);
  }

  if (filters.fromDate) {
    entries = entries.filter(e => new Date(e.timestamp) >= new Date(filters.fromDate));
  }

  if (filters.toDate) {
    entries = entries.filter(e => new Date(e.timestamp) <= new Date(filters.toDate));
  }

  // Pagination
  if (filters.limit) {
    const offset = filters.offset || 0;
    entries = entries.slice(offset, offset + filters.limit);
  }

  return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Check for conflicting submissions
 * @param {Object} submission - Submission to check
 * @returns {Object[]} - Conflicting submissions
 */
export function checkConflicts(submission) {
  const conflicts = [];

  const potentialConflicts = Array.from(submissionsStore.values()).filter(s =>
    s.id !== submission.id &&
    s.adminUnitCode === submission.adminUnitCode &&
    s.dataYear === submission.dataYear &&
    (s.dataMonth === submission.dataMonth || s.dataMonth === null || submission.dataMonth === null) &&
    [SUBMISSION_STATUS.SUBMITTED, SUBMISSION_STATUS.UNDER_REVIEW, SUBMISSION_STATUS.APPROVED, SUBMISSION_STATUS.PUBLISHED].includes(s.status)
  );

  for (const conflict of potentialConflicts) {
    const overlappingIndicators = Object.keys(submission.indicators).filter(
      id => conflict.indicators[id]?.value !== undefined
    );

    if (overlappingIndicators.length > 0) {
      conflicts.push({
        submissionId: conflict.id,
        status: conflict.status,
        submittedBy: conflict.submitterName,
        overlappingIndicators,
        severity: conflict.status === SUBMISSION_STATUS.PUBLISHED ? 'high' : 'medium'
      });
    }
  }

  return conflicts;
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Configuration
  WORKFLOW_CONFIG,

  // Constants
  SUBMISSION_STATUS,
  USER_ROLES,
  PERMISSION_MATRIX,
  STATE_TRANSITIONS,
  NOTIFICATION_TYPES,

  // Error classes
  WorkflowError,
  TransitionError,
  PermissionError,
  ValidationError,

  // Event system
  workflowEvents,

  // State machine
  validateTransition,

  // Submission operations
  createSubmission,
  updateSubmission,
  submitForReview,

  // Review workflow
  startReview,
  addReviewComment,
  resolveComment,
  completeReview,

  // Publishing
  publishSubmission,

  // Batch operations
  batchProcess,

  // Queries
  getSubmission,
  getSubmissions,
  getPendingReviews,
  getPendingApproval,
  getSubmissionsByUser,
  getSubmissionsByAdminUnit,
  getWorkflowStats,

  // Quality
  calculateQualityScore,

  // Notifications
  getPendingNotifications,
  markNotificationSent,

  // Deadlines
  checkDeadlines,

  // Assignments
  autoAssignReviewer,
  getAssignment,
  reassignSubmission,

  // Version history
  getVersionHistory,
  getVersion,

  // Conflict detection
  checkConflicts,

  // Audit
  getAuditLog
};
