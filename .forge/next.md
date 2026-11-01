# Original image byte integrity repair
Status: Verified
Risk: High
Required model tier: High or equivalent
SRS: REQ-FILES-001, ARCH-FILES-001, METHOD-TEST-001, REQ-RBAC-001

User reports successful downloads that open black. Trace full bytes, not metadata.
Batch 1: remove synthesized missing-file images, resolve metadata IDs to original
storage keys, prevent successful non-durable writes, and increase object-read
timeouts. Preserve existing disk naming and persistent-volume compatibility.
Batch 2: route complaint links through authorized complaint download endpoint,
stop caching raw files, and test JPG/PNG/WebP bytes across fresh storage instances,
S3 retrieval, raw controller and web proxy. Decode downloaded images and verify
size and visible colored pixels. Missing originals must return an error.
Batch 3: all required checks passed, independent review passed, ready to push waleed
and merge production. Existing metadata-only attachments whose originals are absent
cannot be reconstructed from dummy bytes.
