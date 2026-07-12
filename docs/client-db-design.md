# CLIENT_DB_DESIGN.md

> Version: 1.0
> Product: UniGPU
> Scope: Client Dashboard
>
> This document defines the complete layout, information hierarchy,
> interaction design and UX for the Client Dashboard.
>
> It extends:
>
> - PROJECT_CONTEXT.md
> - DESIGN_SYSTEM.md
> - APP_DESIGN_SYSTEM.md

---

# Dashboard Philosophy

The Client Dashboard is **not** an admin panel.

It is a **Developer Workspace**.

The dashboard exists for one purpose:

> Submit workloads, monitor execution, and retrieve results.

Everything else is secondary.

---

# Primary User Goal

A client should be able to

1. Upload workload
2. Configure execution
3. Submit
4. Watch scheduler
5. Monitor logs
6. Retrieve outputs

without navigating across multiple pages.

---

# Dashboard Layout

```

Navbar

↓

Greeting

↓

Quick Metrics

↓

Execution Workspace

↓

Recent Workloads

↓

Footer

```

No sidebar.

No left navigation.

No floating menus.

Everything flows vertically.

---

# Navbar

Uses APP_DESIGN_SYSTEM.

Contains

```
Logo

Dashboard

Documentation

Wallet Pill

Notification

Avatar
```

Avatar Dropdown

```
My Profile

Wallet

Settings

Sign Out
```

---

# Greeting Section

Instead of

```
Client Dashboard
```

Use

```
Good Afternoon, {{username}}
```

Subtext

```
Submit workloads and let UniGPU manage scheduling,
execution, billing and log collection.
```

---

# Quick Metrics

Four cards.

Single row.

Equal width.

---

## Card 1

Wallet

```
₹850.20

Available Credits
```

Small button

```
Top Up
```

---

## Card 2

Running Jobs

```
2

Currently Executing
```

---

## Card 3

Queued Jobs

```
1

Waiting for Provider
```

---

## Card 4

Completed

```
24

Lifetime Workloads
```

---

# Network Status Strip

Below metrics.

Full width.

Small pill.

Example

```
● 18 GPUs Online

Average Queue Time

< 2 min

Scheduler Healthy
```

This connects PROJECT_CONTEXT with the UI.

Client understands

There are providers online.

Scheduler is functioning.

No need to expose provider machines.

---

# Main Workspace

Largest component.

Two-column layout.

70 / 30 split.

---

# Left Column

Submit Workload

This is the primary action.

---

Card

Heading

```
Submit Workload
```

Description

```
Upload your Python script and optional dependencies.

UniGPU automatically schedules execution
to an available provider GPU.
```

---

Section 1

Python Script

Large Dropzone

```
Drop train.py

or Browse
```

Supported

```
.py
```

---

Section 2

Dependencies

Optional

```
requirements.txt
```

---

Section 3

Execution Configuration

Dropdown

GPU Preference

```
Auto Select

RTX 4060

RTX 4070

RTX 4080

RTX 4090

Any Available
```

Advanced

Collapsed by default.

Contains

Memory Requirement

CUDA Version

Timeout

Container Limits

Future ready.

---

Section 4

Estimated Cost

```
≈ ₹3.42
```

Estimated Wait

```
≈ 1 min
```

These update dynamically.

---

Section 5

Buttons

Primary

```
Submit Workload
```

Secondary

```
Save Draft
```

---

# Right Column

Developer Information

Instead of Wallet.

Contains

---

## Current Scheduler

```
Scheduler

Healthy

18 GPUs Online
```

---

## Recent Activity

Card

```
Workload Submitted

2 mins ago

━━━━━━━━━━━━━━

GPU Assigned

1 min ago

━━━━━━━━━━━━━━

Execution Started

Now
```

Timeline style.

---

## Documentation

Small links

Execution Guide

Supported Libraries

Python Requirements

GPU Runtime

---

# Job Lifecycle

Immediately after submission

Workspace transforms.

Instead of upload form

Show

```
Uploading

↓

Waiting for Scheduler

↓

Searching Providers

↓

GPU Assigned

↓

Downloading Files

↓

Container Starting

↓

Running

↓

Streaming Logs

↓

Completed
```

Timeline updates live.

---

# Live Execution

Below Workspace.

Dark Code Window.

Exactly same component as Landing Page.

Toolbar

```
train.py

Running
```

Body

```
Epoch 1

Loss

Accuracy

GPU Utilization

Memory

ETA
```

Scrollable.

---

# Recent Workloads

Heading

```
Recent Workloads
```

Description

```
Track every workload you've submitted.
```

---

Instead of Bootstrap table

Use Job Cards.

Each card

------------------------------------------------

Python Icon

train_resnet.py

Completed

RTX 4060

Duration

11m 42s

Created

Today

Actions

View Logs

Download

Delete

------------------------------------------------

Status chip appears top right.

---

# Job Status

Uploading

Queued

Waiting

GPU Assigned

Preparing

Running

Completed

Failed

Cancelled

---

# Job Details

Clicking card expands.

Shows

Script

Provider GPU

Execution Time

Cost

Container

Logs

Artifacts

Output Files

Environment

---

Uses accordion.

No page navigation.

---

# Download Area

If completed

Card shows

```
Outputs Ready

Download ZIP

View Logs

Run Again
```

---

# Wallet

Wallet is NOT part of workspace.

Wallet only appears

Navbar

Dropdown

Dedicated Wallet Page

Never inside dashboard body.

---

# Empty Dashboard

Illustration

Simple upload icon.

Heading

```
No Workloads Yet
```

Description

```
Submit your first Python script
to begin using UniGPU.
```

Button

```
Submit Workload
```

---

# Notifications

Dropdown

Recent

```
Workload Completed

Wallet Updated

GPU Assigned

Execution Failed

Provider Offline

Scheduler Retry
```

---

# Error Handling

Upload Failed

Retry

Scheduler Offline

Retry Later

Provider Disconnected

Automatic Reschedule

Execution Failed

View Logs

Run Again

---

# Loading

Metrics

Skeleton

Cards

Skeleton

Workspace

Skeleton

History

Skeleton

Never spinner-only.

---

# Responsive

Desktop

2-column workspace.

Tablet

Single column.

History cards.

Mobile

Everything stacks.

Timeline collapses.

Upload fills width.

Navbar compresses.

---

# Future Components

Pinned Workloads

Favourite Templates

Saved Configurations

Notebook Support

Jupyter Execution

TensorBoard

Artifact Browser

Dataset Library

Cloud Storage Integration

Webhook Notifications

API Tokens

CLI Upload

---

# UX Goals

Users should always know

- What is happening
- Which GPU is executing
- What the scheduler is doing
- Estimated wait
- Estimated cost
- Current execution stage

without needing to refresh.

The dashboard should feel like watching a distributed compute network operate in real time while remaining simple enough that first-time users can understand it within minutes.

The interface should prioritize confidence, transparency, and clarity over exposing unnecessary backend complexity.