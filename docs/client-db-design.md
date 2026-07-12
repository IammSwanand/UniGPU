# CLIENT_DB_DESIGN.md

> Version: 2.0
> Product: UniGPU
> Scope: Client Dashboard
>
> This document defines the complete UI/UX, information architecture,
> layout hierarchy, interaction design, and component specification for
> the Client Dashboard.
>
> References:
>
> - PROJECT_CONTEXT.md
> - DESIGN_SYSTEM.md
> - APP_DESIGN_SYSTEM.md
>
> This dashboard must feel like a continuation of the Landing Page,
> not a separate admin panel.

---

# Design Philosophy

The Client Dashboard is the user's personal compute workspace.

Unlike traditional cloud dashboards that expose infrastructure first,
UniGPU focuses on the workload.

The dashboard answers four questions immediately:

• Can I submit a workload?

• Is the network available?

• What is happening to my workload?

• Can I retrieve my results?

Every design decision should reinforce those four questions.

---

# Dashboard Structure

```
Navbar

↓

GPU Network Status

↓

Execution Workspace

↓

Workload History
```

No sidebars.

No nested navigation.

No floating cards.

Single-page workflow.

---

# Page Width

Maximum Width

1280px

Centered.

Same spacing system as Landing Page.

Section spacing

48px

Card spacing

24px

Internal spacing

16px

---

# Navbar

The navbar is identical to the Landing Page.

Only the actions change.

-------------------------------------------------

LOGO

Dashboard

Documentation

Wallet Pill

Notifications

Profile Avatar

-------------------------------------------------

Height

72px

Background

Snow Canvas

Blur

Enabled

Border Bottom

Stone Divider

---

# Logo

Same positioning as Landing Page.

Clicking logo always returns to Dashboard.

---

# Navigation

Dashboard

Documentation

Future

CLI

API

Support

---

# Wallet Pill

Small pill.

Never a card.

Displays

₹842.30

Available Credits

Click opens Wallet page.

Never show transaction history here.

---

# Notifications

Bell icon.

Dropdown.

Recent activity.

Maximum 10 entries.

Unread badge.

---

# Profile

Circular avatar.

Dropdown

My Profile

Wallet

Settings

Sign Out

Future

API Keys

CLI Tokens

---

# GPU Network Strip

Immediately below navbar.

Not cards.

Single horizontal strip.

Purpose

Give confidence that compute is available.

Example

```
● 18 GPUs Online

Average Queue

1m 24s

Scheduler Healthy
```

The user should know

"I can submit a workload."

without reading documentation.

---

# Execution Workspace

Largest visual component.

White Feature Card.

40px outer radius.

Uses Feature Shadow from DESIGN_SYSTEM.

Layout

```
Left

↓

Upload Panel

↓

GPU Configuration

↓

Submit

Right

↓

Integrated Editor
```

70 / 30 split.

---

# Upload Panel

Heading

Python Script

Large drag-and-drop area.

No browser default file input.

Uses Vercel deployment style.

Centered icon.

Primary message

Drop your Python script here

Secondary

or browse files

Supported

.py

Hover

Blue border

Blue glow

---

# Dependencies

Second upload card.

Smaller.

Optional.

Heading

Dependencies

Subtext

requirements.txt

Supports

.txt

---

# GPU Configuration

Compact card.

Contains

GPU Preference

Dropdown

Auto Select

Any Available

RTX 4060

RTX 4070

RTX 4080

RTX 4090

Advanced Configuration

Collapsed by default.

Contains

CUDA Version

Memory

Timeout

Container Limit

Environment Variables

Future-ready.

---

# Submit Area

Bottom of upload section.

Displays

Estimated Cost

Estimated Queue Time

Submit Button

Save Draft

Primary CTA

Submit Workload

Only one filled button.

Everything else outlined.

---

# Embedded Editor

Right side.

Purpose

Preview uploaded script.

Quick edits.

Not a full IDE.

Dark Code Window component.

Inherited directly from Landing Page.

Toolbar

Filename

Save

Editor body

Roboto Mono

Syntax Highlighting

No minimap.

No terminal.

Just editing.

---

# Execution Transition

Once workload is submitted

Upload interface transforms.

Editor remains.

Left side becomes

Execution Timeline.

---

Timeline

Uploading Files

↓

Waiting for Scheduler

↓

Searching Provider

↓

GPU Assigned

↓

Downloading Files

↓

Container Starting

↓

Executing

↓

Streaming Logs

↓

Saving Output

↓

Completed

Every state updates live.

Never refresh.

---

# Live Logs

Appears below editor.

Dark Code Window.

Same design as Landing Page.

Toolbar

Execution Output

Auto-scroll.

Copy Logs.

Download Logs.

---

# History Section

Heading

Recent Workloads

Subheading

Track every workload you've executed.

---

Layout

Modern table.

Rounded container.

Hover rows.

Large whitespace.

No Bootstrap styling.

---

Columns

Script

Status

GPU

Created

Duration

Cost

Actions

---

Status

Uses Status Chips.

Queued

Running

Completed

Failed

Cancelled

Preparing

---

Actions

Three-dot menu.

Never multiple buttons.

Menu

View Details

Logs

Download Output

Run Again

Delete

---

# Workload Details

Clicking row opens side drawer.

Contains

Overview

Execution Timeline

Environment

GPU Information

Logs

Artifacts

Billing

No navigation away from dashboard.

---

# Empty State

Centered.

Large upload icon.

Heading

No Workloads Yet

Description

Upload your first Python script to start using UniGPU.

Button

Submit Workload

---

# Loading

Metrics

Skeleton.

Workspace

Skeleton.

History

Skeleton rows.

Editor

Skeleton.

Never spinner-only.

---

# Error States

Upload Failed

Scheduler Offline

Provider Unavailable

Execution Failed

Logs Unavailable

Download Failed

Retry actions always visible.

---

# Motion

Hover

Small elevation.

Dropdown

Fade + Scale.

Cards

Fade Up.

Timeline

Sequential appearance.

Editor

Smooth content replacement.

Never bounce.

Never spring.

---

# Responsive

Desktop

2-column workspace.

Tablet

Editor moves below upload.

Mobile

Everything stacks.

History becomes cards.

Navbar collapses.

Wallet pill becomes icon.

---

# Accessibility

Semantic HTML.

Keyboard navigation.

Visible focus states.

Screen reader support.

Drag-and-drop keyboard alternative.

---

# Backend Awareness

This dashboard must visually reflect the backend defined in PROJECT_CONTEXT.md.

The UI should never fake execution.

Every workload transitions through the real backend pipeline:

Upload

↓

Scheduler

↓

Provider Match

↓

GPU Assignment

↓

Container Execution

↓

Live Logs

↓

Result Upload

↓

Billing

↓

Completed

Every visual component should correspond to one real backend event.

The dashboard is not simply a frontend.

It is a visualization of UniGPU's distributed compute orchestration.