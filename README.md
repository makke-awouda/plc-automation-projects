# Industrial Automation Portfolio

Automation & Electrical Engineer with hands-on experience in Siemens PLC systems, electrical panel design, and commissioning, plus graduate-level study in Automation Engineering (M.Sc, incomplete). My work focuses on the full control stack — from ladder logic and PID regulation up to Industry 4.0 data integration (OPC UA, virtual PLC architectures, live web dashboards).

This repository collects self-directed control-design projects built to demonstrate that range in practice. Each project has its own detailed write-up — design decisions, I/O mapping, and real debugging notes — in its folder.

## Projects

| Project | What it demonstrates | Stack |
|---|---|---|
| **[Tank Filling — Dual-PID Control](./tank-filling-dual-pid/)** | Two-PID level regulation around a live setpoint, plus a live OPC UA → web dashboard (Industry 4.0 / OT-IT integration) | S7-1200, TIA Portal, PID_Compact, WinCC RT Advanced, OPC UA, Node.js, Chart.js |
| **[Factory IO Assembler](./factoryio-assembler/)** | Two-axis pick-and-place cell driven by a step sequencer, with edge-triggered counting and race-condition-safe transitions | S7-1200, TIA Portal, Factory IO, Ladder Logic |
| **[DTAP — Control Design](./dtap-control-design/)** | Commissioning-validation logic and IEC 60204-1 safe power-up state machines for an industrial training simulator | Unity, C#, automation domain logic |

## Background

- **M.Sc Automation Engineering** (University of Calabria, Italy) — coursework completed, degree incomplete; thesis work on integrating virtual Siemens PLCs with the cloud via OPC UA for Industry 4.0
- **B.Sc Electrical Engineering (Power)** — University of Bahri
- Prior industry roles as Automation Engineer (Siemens TIA Portal / SIMATIC, SCADA, HMI, PROFINET) and Electrical & Maintenance Engineer

The OPC UA / Industry 4.0 focus in these projects is a direct continuation of my master's thesis work — extending virtual-PLC-to-cloud integration from research into working, demonstrable control systems.

## Focus areas

- Ladder logic and step-sequencer design (CMP + MOVE pattern)
- Closed-loop PID control and split-range regulation
- Analog signal scaling, interlocking, and safe startup sequencing
- SCADA / HMI development (WinCC RT Advanced)
- Industry 4.0: OPC UA data bridging to live web dashboards
- Simulation-based development and commissioning (PLCSIM, Factory IO)

## Contact

📧 makke.awouda@simulyn.io
