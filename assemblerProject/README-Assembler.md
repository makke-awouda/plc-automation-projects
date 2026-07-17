# Factory IO Assembler — Two-Axis Pick and Place

A pick-and-place assembly cell simulated in Factory IO, controlled by Siemens S7-1200 logic in TIA Portal, using a step sequencer to coordinate a two-axis gripper that mates a lid to a base and ejects the finished part.

## Demo

Watch the demo video on repo release or from the link https://github.com/makke-awouda/plc-automation-projects/releases/download/V1.0/Assembler_Demo.mp4

## What This Demonstrates

- Step-sequencer design using the CMP + MOVE pattern (step numbers incrementing by 10, so steps can be inserted later without renumbering)
- Two-axis motion coordination with position-limit and moving-status interlocks
- TON-based timing to prevent same-scan logic cascades on axis moves
- A manually-built, edge-triggered production counter (not a canned counter instruction)
- Debugging Factory IO's own emitter timing, not just PLC logic
- Real interlocking between a discrete step sequence and continuous conveyor/eject outputs

## Hardware / Software

| Item | Detail |
|---|---|
| CPU | S7-1200, CPU 1211C DC/DC/DC |
| Programming | TIA Portal, Ladder Logic (LAD) |
| Simulation | PLCSIM (standard) + Factory IO Assembler scene |
| Program blocks | `sequencer` [OB123], `outputs` [OB124] |

## I/O Table

**Inputs**

| Tag | Address | Description |
|---|---|---|
| Moving_X | %I0.0 | X axis currently moving |
| Moving_Z | %I0.1 | Z axis currently moving |
| Item_Detected | %I0.2 | Item detected by gripper |
| Lid_At_Place | %I0.3 | Lid at pick position |
| Lid_Clamped | %I0.4 | Lid clamp confirmed |
| Pos_Limit_Lids | %I0.5 | X arm at lids limit |
| Base_At_Place | %I0.6 | Base at assembly position |
| Base_Clamped | %I0.7 | Base clamp confirmed |
| Pos_Limit_Bases | %I1.0 | X arm at bases limit (home) |
| Part_Leaving | %I1.1 | Assembled product leaving |
| Start | %I1.2 | Start pushbutton |
| Reset | %I1.3 | Reset pushbutton |
| Stop | %I1.4 | Stop pushbutton |
| E_Stop | %I1.5 | Emergency stop |
| Auto | %I1.6 | Auto/Manual selector |

**Outputs**

| Tag | Address | Description |
|---|---|---|
| Move_X | %Q0.0 | Move arm to lids side |
| Move_Z | %Q0.1 | Lower arm (Z down) |
| Grab | %Q0.2 | Activate grabber |
| Lids_Conv | %Q0.3 | Lids conveyor run |
| Clamp_Lid | %Q0.4 | Clamp the lid |
| Pos_Raise_Lids | %Q0.5 | Raise arm at lids side |
| Bases_Conv | %Q0.6 | Bases conveyor run |
| Clamp_Base | %Q0.7 | Clamp the base |
| Pos_Raise_Bases | %Q1.0 | Raise arm at bases side |
| Start_Light | %Q1.1 | Green start indicator |
| Reset_Light | %Q1.2 | Yellow reset indicator |
| Stop_Light | %Q1.3 | Red stop indicator |

**Internal memory:** `sequence` (%MW1, Int, step register), `Counter` (%MD30, DINT, assembled parts count — moved off %QD30, see Debugging Notes).

## Control Architecture

### Sequencer method

A single Int register (`sequence`, %MW1) steps through the process in increments of 10, so new steps can be inserted later without renumbering anything downstream:

```
Step 0   — Idle, wait for Auto + Start
Step 10  — Bases conveyor on, wait for base + lid arrival
Step 20  — Clamp base and lid
Step 30  — Clamp lid confirmed
Step 40  — Move X to lids side
Step 50  — Lower Z, grab lid
Step 60  — Raise Z, move X back home (via TON-gated timing)
Step 70  — Lower Z at base side (via TON-gated timing)
Step 80  — Release grip
Step 90  — Raise Z, position confirmed at base limit
Step 100 — Eject: run conveyor until part leaves, loop back to step 10
```

Each output that needs to stay active across multiple steps (e.g. `Grab` during the whole transfer) is re-asserted in every step it's needed — outputs are turned off simply by not including them in the next step's rung, per the project's sequencer convention.

### Interlocking

Left/right and up/down axis moves are cross-interlocked with NC contacts on the opposing direction's status bit, so the arm can't be commanded to move in two directions at once.

## Debugging Notes

Real problems hit and fixed during development — not just "it works":

1. **Same-scan logic cascade** — several step-advance rungs were bare `CMP + sensor contact + MOVE`, with no timer or edge protecting them. If a downstream condition happened to already be true the instant a step was entered, the sequencer could jump through several steps within a single scan (a few milliseconds) — invisible in real time, showing up as "steps skipped" with no visible physical motion. Fixed for the X/Z axis moves using `TON` timers (steps 60 and 70) to force a genuine pause before advancing; other single-scan-vulnerable transitions were identified and are earmarked for the same treatment (see Known Limitations).
2. **Conveyor never restarted for ejection** — the base conveyor was only ever driven by the step-10 "conveyor run" bit, which turns off the moment the sequence leaves step 10. By the time the process reached the eject step, nothing was physically pushing the finished part past the `Part_Leaving` sensor, so the loop-back condition could never go true and the sequencer parked at step 100 forever. Fixed by also driving the conveyor output from the step 90/100 "position active" bit.
3. **Factory IO emitter flooding the line faster than sensors could register** — with the emitter's default timing, multiple boxes could spawn before the previous one cleared the arrival sensors, so `Lid_At_Place`/`Base_At_Place` never triggered cleanly and the sequence stalled at step 10. Fixed by setting the emitter's Min and Max time interval to an equal, fixed value (1 second) for a predictable one-at-a-time arrival rate.
4. **DINT counter wired to an address that doesn't physically exist** — the original plan used `%QD30` for the assembled-parts counter, but the CPU 1211C only has 4 onboard digital outputs (`%Q0.0`–`%Q0.3`); there is no output module behind `%QD30`. Moved the counter to internal memory (`%MD30`) instead, since it's a pure data value with no real-world signal behind it.
5. **Counter needed to be built manually, not with a canned counter instruction** — incrementing directly off a level-true sensor contact would add far more than once per part (every scan the condition holds true). Built with a rising-edge (`P`) instruction gating an `ADD`, so the count increases by exactly 1 per completed part, with a separate `MOVE 0` network tied to the Reset pushbutton.

## Known Limitations / Next Steps

- Same-scan cascade protection (TON or falling-edge gating) has only been applied to the X/Z axis move transitions — the remaining bare `CMP + contact + MOVE` advance rungs are still theoretically vulnerable to the same issue and are the next thing to harden.
- Industry 4.0 connectivity (OPC UA / MQTT bridge to a web dashboard) is planned for this project, matching the approach used on the Tank Filling project, but not yet implemented.
- No Structured Text (ST/SCL) block yet — a small ST routine (e.g. the counter logic, or a future MQTT payload builder) would round out the ladder-only implementation.
- No fault/alarm word yet — a bit-mapped fault register (e.g. clamp jam, part-not-detected timeout) would be a realistic addition alongside the existing E-stop handling.

## Tools Used

TIA Portal, PLCSIM, Factory IO
