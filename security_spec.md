# Security Specification: Tatkhanat Sheba (তৎক্ষণাৎ সেবা)

## Data Invariants
1. **Owner-Only PII Isolation**: `users/{userId}` is strictly isolated to `request.auth.uid == userId`. `list` queries on `users` are completely blocked.
2. **Job Contact PII Isolation**: Exact addresses and phone numbers in `jobs/{jobId}/private/contact` can only be read by the job creator (`clientId`) or the accepted worker (`assignedWorkerId`).
3. **Verified Identity Integrity**: Every write requires `request.auth != null && request.auth.token.email_verified == true`. All `uid`/`clientId`/`workerId` fields must match `request.auth.uid`.
4. **Registered Worker Requirement**: Only users with an active `workers/{uid}` profile can place bids (`jobs/{jobId}/bids/{uid}`). Clients cannot bid on their own jobs.
5. **Atomic Bid Counter Sync**: Creating a bid must happen atomically in a batch that increments `jobs/{jobId}.bidCount` by exactly `1`. Each worker can submit at most one bid document per job (`bidId == request.auth.uid`).
6. **Terminal State Locking**: Once a job reaches `completed` or `cancelled`, no further updates are permitted.
7. **Strict Timestamp Integrity**: `createdAt` and `updatedAt` must equal `request.time` on creation; `createdAt` is immutable on update and `updatedAt` must equal `request.time`.

## The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Job Creation**: Creating a job without `request.auth`.
2. **Unverified Email Write**: Creating a worker profile with `email_verified: false`.
3. **Identity Spoofing on Job**: Creating a job with `clientId: "other-user-uid"`.
4. **Shadow / Ghost Field Injection**: Creating a worker profile with extra `isVerified: true` field.
5. **Self-Inflated Completed Jobs**: Updating `workers/{uid}` to set `completedJobs: 99`.
6. **Reading Another User's PII**: Reading `users/{otherUid}` or `jobs/{jobId}/private/contact` as an unassigned worker.
7. **Blanket List on Users**: Querying `collection(db, "users")` without restriction.
8. **Bidding Without Worker Account**: Creating `jobs/{jobId}/bids/{uid}` when `workers/{uid}` does not exist.
9. **Bidding on Own Job**: Job creator attempting to create a bid on their own job.
10. **Non-Atomic Bid Spam**: Incrementing `bidCount` on `jobs/{jobId}` without creating a corresponding bid document.
11. **Terminal State Bypass**: Updating a `completed` or `cancelled` job back to `open`.
12. **Path ID Poisoning / Oversized String**: Writing a 2KB string to `title` or an invalid document ID with `/../`.
