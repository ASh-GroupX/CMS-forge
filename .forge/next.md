# External read-only system data API — released

Status: Complete
Risk: High
SRS: REQ-INT-DATA-001, REQ-RBAC-001, NFR-SEC-002, ARCH-API-001, ARCH-INTEGRATION-001, METHOD-API-001, METHOD-AUDIT-001

Phases 1–3 were implemented, tested, pushed to waleed, and merged into production at cb120afa63366ec8088a1cf11f414e7a1e94aa9b. GitHub validation and VPS deployment succeeded on 2026-11-10. Public revision matched cb120af, /api/health returned 200, and all four external feed paths returned 401 without a key. The production deployment workflow applied migrations before starting the API.

No production integration key was issued and no customer data was pulled during smoke testing. An administrator can create a scoped key through POST /api/integrations/data-api-keys, then use the four GET /api/external-data endpoints. See docs/operations/external-data-api.md. A production data pull with a real key is an operator UAT step. Preserve tmp/ and uploads/.
