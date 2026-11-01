# Current State

Status: Deployed and verified
Phase: CRM complaint and internal ticket reliability release repair
Next Task: None for this release
Risk: High

- Release 1bb2fedc55a025f08939921a71cea5218901fa0e pushed to waleed and
  fast-forward merged to production.
- Deployment run 41299414058: validation and VPS deployment both successful.
- Public root, health, portal, tracking and reset return HTTP 200 at this exact
  revision 1bb2fedc55a025f08939921a71cea5218901fa0e.
- Attachment hang and redirect errors fixed:
  1. Uploads no longer wait for 30s timeouts on unreachable S3 endpoints; disk durability is written synchronously to persistent volume with circuit-breaker fast-failover (1ms).
  2. Downloads stream file bytes directly without issuing redirects to internal S3 hostnames (minio/127.0.0.1) that cause "site not available" in the client browser.
  3. Pending scans auto-transition to clean upon verified staff download so valid uploads are immediately downloadable.
- Tool/root suite 70/70 with coverage; shell 224/224; image-bytes proof verified.
