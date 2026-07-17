# DTAP — Digital Twin Automation Process Simulator

A Unity-based industrial training simulator built at Simulyn, replicating a Siemens S7-1200 production line for hands-on panel wiring, PLC programming, and commissioning practice. I contributed to this project as a Control Designer, focused on the automation-accuracy side of the simulation — wiring and commissioning validation logic, terminal-naming conventions, and state-machine behavior that mirrors real PLC and electrical commissioning practice.

**Live product:** [simulyn.io](https://simulyn.io)

## Demo

Watch the Demo video on the repo release or from the link https://github.com/makke-awouda/plc-automation-projects/releases/download/V1.0/Dtap_Demo.mp4

## My Role

Control Designer contribution, focused on the parts of the simulator that need to behave like real industrial equipment, not just look like it:

- Wiring and commissioning validator logic
- Terminal-naming conventions matching real panel documentation standards
- State-machine behavior for safe, sequence-correct startup
- Supporting input-system and presentation fixes uncovered while testing the above

## What This Demonstrates

- Encoding real electrical/automation standards (IEC 60204-1 safe power-up sequencing, panel terminal-naming conventions) directly into simulation validation logic — not just visual approximation
- State-machine design (Idle / Running / Stopped / E-Stop) for a safety-relevant startup sequence
- Debugging a data-mapping layer between a validator system and real-world terminal references
- Cross-discipline range: automation domain knowledge applied inside a Unity/software environment, not just a PLC

## Training Content (implemented modules)

| Module | Content |
|---|---|
| M01 — Panel Wiring | Wiring diagrams, panel components (PLCs, relays, MCBs, PSU, contactors, terminals), connection validation |
| M02 — PLC Programming | Ladder logic, I/O, timers, counters, internal memory bits, simulation and validation |
| M03 — Testing & Commissioning | Virtual digital voltmeter, commissioning checklist, breaker/PSU/PLC voltage measurement, E-stop circuit, start/stop sequencing, commissioning report |

## Technical Work

### Commissioning validator — terminal probe map

The validator originally failed to correctly match probe points against real panel terminal references. Fixed by aligning the probe map to the panel's actual naming convention — a consistent `PinN` pattern (e.g. `Pin2`, `Pin4`, `Pin6`) for standard terminals, with specific handling for non-standard cases such as the PSU's positive output terminal (`6TA1_Pin+1`). This is a data-mapping problem as much as a code problem — the fix required matching software references to real documentation conventions used on an actual panel, not just picking arbitrary internal names.

### Wiring validator state machine

Implemented as a state machine with distinct **Idle / Running / Stopped / E-Stop** states, gated by a startup latch that ensures power is confirmed on *before* the start command is accepted — enforcing the same power-then-start discipline required by IEC 60204-1 safe power-up sequencing in real equipment, rather than allowing the validator to accept commands in an arbitrary order.

### Input system architecture

Diagnosed and fixed a persistent bug where first-person camera rotation continued to respond to mouse movement while a UI panel (e.g. a wiring diagram or checklist) was open. Solved with a centralized input manager using an open-panel counter: gameplay camera input is only restored once every open panel has been closed, regardless of how many are open at once or in what order they're closed.

### Presentation pipeline

- Video-only intro sequence built with a dedicated splash manager using a render texture, rather than a scene-based intro.
- Audio mixing for narration/voice content used a fixed timing offset to separate voice from background music, with music levels mixed well under narration for clarity.

## Known Limitations / Next Steps

- Modules 04 (Industrial Safety Systems) and 05 (Industry 4.0 & Industrial Data) are planned but not yet implemented.
- Assessment-mode scoring (accuracy/time-based grading for wiring, PLC programming, and commissioning tasks) exists as a product-tier concept but isn't part of the current validator implementation described here.

## Tools Used

Unity (URP), C#, ffmpeg (audio/video post-processing)
