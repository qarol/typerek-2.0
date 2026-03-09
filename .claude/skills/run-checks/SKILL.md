---
name: run-checks
description: Run all checks (type-check, lint, tests) for frontend and/or backend. Use before committing or declaring work done.
---

Run the following checks in order from the project root `/Users/qarol/Work/typerek-2.0` and report pass/fail with any error details:

1. **Frontend type-check**: `cd frontend && mise exec -- npm run type-check`
2. **Frontend lint**: `cd frontend && mise exec -- npm run lint`
3. **Frontend tests**: `cd frontend && mise exec -- npm run test:unit -- --run`
4. **Backend lint (rubocop)**: `cd backend && mise exec -- bundle exec rubocop --no-color`
5. **Backend security scan (brakeman)**: `cd backend && mise exec -- bundle exec brakeman -q --no-pager`

If any step fails, show the error output and stop. Do not proceed to the next step if there are failures that would cascade.

After all steps, summarize: which passed, which failed, and what needs fixing.
