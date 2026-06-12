# Technical Design Checklist: API Contracts, Data Model & Edge Cases

**Purpose**: Validate technical design completeness and quality for the Round Results and Game Restart feature
**Created**: 2026-06-12
**Focus**: API contract correctness, data model consistency, edge-case coverage in design docs
**Artifacts**: [plan.md](../plan.md), [data-model.md](../data-model.md), [contracts/api.md](../contracts/api.md), [tasks.md](../tasks.md)

---

## Requirement Completeness (Technical Design)

- [ ] **CHK001**: Does the data model explicitly define how the `results` state is represented and what fields are populated versus cleared?
- [ ] **CHK002**: Is the automatic round-end condition (all non-drawer participants guessed correctly) implemented as a server-side check on every successful guess submission?
- [ ] **CHK003**: Is the host manual round-end endpoint protected by host-only authorization?
- [ ] **CHK004**: Does the restart endpoint explicitly clear all round state while preserving participant and host references?
- [ ] **CHK005**: Is joining a room in `results` state explicitly rejected with a consistent error code and message?

## Requirement Clarity (Technical Design)

- [ ] **CHK006**: Is the `RoomSnapshot` for `results` state unambiguously defined with `secretWord`, `scores`, and `guessHistory` fields?
- [ ] **CHK007**: Are the error response shapes for the new `POST /end-round` and `POST /restart` endpoints consistent with the existing `{ message: string }` format?
- [ ] **CHK008**: Is the drawer-leave mid-round behavior (from spec 003) distinguished from the new round-end behavior in state transitions?

## Requirement Consistency

- [ ] **CHK009**: Does the `results` state snapshot reuse the same `scores` and `guessHistory` structures defined in spec 003 without introducing duplicate or incompatible schemas?
- [ ] **CHK010**: Does the restart action reset participant scores to 0 in a single operation, or does it rely on implicit inference?
- [ ] **CHK011**: Are state transition rules (lobby → playing → results → lobby) documented and free of unreachable states?

## Acceptance Criteria Measurability

- [ ] **CHK012**: Can "all participants see the secret word within 3 seconds" be verified by inspecting the room snapshot polling interval and network latency?
- [ ] **CHK013**: Can "0% of non-host restart attempts succeed" be verified at the API-contract level?
- [ ] **CHK014**: Is "round-specific state fully cleared" testable by asserting the absence of `secretWord`, `scores`, `guessHistory`, and `canvasStrokes` in the post-restart room snapshot?

## Edge Cases & Failure Mode Coverage

- [ ] **CHK015**: Does the API contract handle the case where the host calls `POST /end-round` when the room is already in `results` state (idempotent or error)?
- [ ] **CHK016**: Does the design specify behavior when `POST /restart` is called while the room is in `lobby` or `playing` state (error or no-op)?
- [ ] **CHK017**: Is the "host leaves during results" edge case reflected in the data model lifecycle (room destruction, participants returned to home screen)?
- [ ] **CHK018**: Does the design prevent guess submissions in `results` state beyond endpoint-level validation (e.g., service-layer guard)?
- [ ] **CHK019**: Is the automatic round-end check robust against the case where a non-drawer participant leaves after guessing correctly (their correct guess still counts toward the condition)?

## Constitution Alignment

- [ ] **CHK020**: Does the results/restart design comply with **HTTP Polling Only** by piggybacking the `results` state on the existing room snapshot endpoint?
- [ ] **CHK021**: Does the in-memory state discipline explicitly clear round state on restart to prevent memory leaks and state drift?
- [ ] **CHK022**: Does the design comply with **Extend the Starter** by limiting new routes/endpoints and avoiding new top-level dependencies?

## Validation Notes

- Check items off as completed: `[x]`
- Add comments or findings inline below each item
- Link to relevant resources or task IDs

## Findings

- Pending review after plan and data-model generation.

## Approval

- [ ] Technical design approved for implementation
- [ ] Technical design requires revision before implementation

**Reviewer**: ________________
**Date**: ________________
