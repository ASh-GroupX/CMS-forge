-- CreateEnum
CREATE TYPE "ComplaintTransitionAction" AS ENUM (
    'SUBMIT',
    'ACCEPT_INTAKE',
    'REJECT_AS_INVALID',
    'APPROVE_AND_ROUTE',
    'SEND_BACK',
    'ASSIGN_INVESTIGATION',
    'RESOLVE_DIRECTLY',
    'REJECT_AFTER_REVIEW',
    'ADD_INVESTIGATION_UPDATE',
    'RESOLVE',
    'REJECT_AFTER_INVESTIGATION',
    'CLOSE',
    'REJECT_RESOLUTION',
    'REOPEN',
    'ROUTE_AGAIN'
);

-- CreateEnum
CREATE TYPE "ComplaintTransitionRequestSource" AS ENUM (
    'STAFF_API',
    'CUSTOMER_PORTAL',
    'SYSTEM_JOB',
    'IMPORT'
);

-- AlterTable
ALTER TABLE "complaint_status_history"
ADD COLUMN "action" "ComplaintTransitionAction",
ADD COLUMN "actor_role" "RoleCode",
ADD COLUMN "request_source" "ComplaintTransitionRequestSource";
