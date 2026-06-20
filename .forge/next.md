# Build Task: REPAIR-F8-05-DOCKER-RUNTIME - Restore Docker And Finish S3 Proof

Status: Blocked
Required model tier: BUILDER-STRONG
Risk: High (F8-05 cannot be accepted without executed Docker proof)
Phase: Phase 8 - Operational Completion

## Blocker

Docker Desktop's `desktop-linux` daemon is unavailable. The F8-05 Docker proof
attempt failed during image export with:

`failed to create temp dir: mkdir /var/lib/desktop-containerd/daemon/tmpmounts/...: input/output error`

Follow-up commands returned:

`Docker Desktop is unable to start`

## Scope

Do not add new F8-05 feature code unless the rerun exposes a code defect.
Restore the local Docker runtime, then finish the exact S3-backed proof for the
already implemented adapter.

## Acceptance criteria

- AC1 [must] `docker version`, `docker system df`, and `docker compose ps` work
  against the `desktop-linux` context.
- AC2 [must] `docker compose up -d --build minio api redis worker` succeeds with
  S3 attachment environment variables.
- AC3 [must] Docker proof creates/uses the MinIO bucket, logs in through the API,
  uploads an allowed attachment, marks it CLEAN, and verifies the download token
  points at the S3-compatible backend.
- AC4 [must] If proof passes, mark F8-05 complete in backlog/evidence/trust,
  replace state.md, and continue to F8-06.

## Proof commands

- `docker version`
- `docker system df`
- `docker compose ps`
- `docker compose up -d --build minio api redis worker` with:
  - `ATTACHMENT_STORAGE_DRIVER=s3`
  - `ATTACHMENT_S3_ENDPOINT=http://minio:9000`
  - `ATTACHMENT_S3_REGION=us-east-1`
  - `ATTACHMENT_S3_BUCKET=cms-auto-attachments`
  - `ATTACHMENT_S3_ACCESS_KEY_ID` / `ATTACHMENT_S3_SECRET_ACCESS_KEY` set to the
    local MinIO dev values from `docker-compose.yml`
- Docker proof script for bucket create, API upload, scan mark, and signed URL
  verification.

## Guardrails

- Do not claim F8-05 passed on static/unit proof alone.
- Do not log S3 secrets, cookies, CSRF values, signed URLs, or download tokens in
  evidence.
- If Docker remains unavailable, leave state `Blocked` and request human runtime
  repair.
