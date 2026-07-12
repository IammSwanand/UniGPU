# CLIENT_DB_CONTENT.md

> Version: 1.0
> Product: UniGPU
> Scope: Client Dashboard
>
> This document defines all user-facing copy, labels, headings,
> microcopy, tooltips, notifications, empty states, loading states,
> and interaction text used throughout the Client Dashboard.
>
> It complements:
>
> - PROJECT_CONTEXT.md
> - DESIGN_SYSTEM.md
> - APP_DESIGN_SYSTEM.md
> - CLIENT_DB_DESIGN.md

---

# Navbar

## Navigation

Dashboard

Documentation

---

## Wallet Pill

Wallet

Available Credits

₹{{balance}}

Tooltip

>Your available credits used to execute workloads.

---

## Notifications

Tooltip

Notifications

Empty

You're all caught up.

---

## Profile Dropdown

My Profile

Wallet

Settings

Sign Out

---

# Greeting

Morning

Good Morning, {{username}}

Afternoon

Good Afternoon, {{username}}

Evening

Good Evening, {{username}}

---

## Subheading

Run AI workloads without owning expensive hardware.

OR

Submit workloads and let UniGPU handle scheduling,
execution and billing.

---

# Quick Metrics

---

## Wallet

Heading

Available Credits

Description

Current balance available for workload execution.

Button

Top Up

---

## Running Jobs

Heading

Running

Description

Currently executing workloads.

---

## Queue

Heading

Queued

Description

Waiting for an available provider.

---

## Completed

Heading

Completed

Description

Successfully executed workloads.

---

# Network Status

Heading

Network Status

Healthy

Scheduler Online

GPU Network Available

Average Queue Time

Average Runtime

Available Providers

Tooltip

UniGPU continuously monitors provider availability
and automatically schedules workloads.

---

# Submit Workload

Heading

Submit Workload

Description

Upload your workload and let UniGPU automatically
find an available GPU.

---

# Upload Area

Heading

Python Script

Dropzone

Drop your .py file here

or

Browse Files

Supported

Python (.py)

Maximum Size

100 MB

---

Success

Python script uploaded successfully.

---

Replace

Replace Script

---

Remove

Remove Script

---

# Dependencies

Heading

Dependencies

Description

Optional requirements.txt file.

Dropzone

Drop requirements.txt here

Optional

No dependency file selected.

---

# GPU Preference

Heading

GPU Preference

Description

Choose a preferred GPU or let UniGPU decide.

Options

Auto Select

Any Available

RTX 4060

RTX 4070

RTX 4080

RTX 4090

Future

RTX 5090

---

Tooltip

Auto Select allows the scheduler to choose
the best available GPU.

---

# Advanced Settings

Heading

Advanced Configuration

Description

Optional execution parameters.

Fields

CUDA Version

Memory Requirement

Execution Timeout

Container Limit

Working Directory

Environment Variables

Collapse

Hide Advanced Settings

Expand

Configure Advanced Settings

---

# Cost Estimate

Heading

Estimated Cost

Description

Approximate execution cost.

---

Queue Estimate

Heading

Estimated Wait

Description

Current average waiting time.

---

# Buttons

Primary

Submit Workload

Secondary

Save Draft

Outline

Clear Form

Loading

Submitting...

Disabled

Complete Required Fields

---

# Submission Success

Heading

Workload Submitted

Description

Your workload has been successfully queued.

Button

View Progress

---

# Job Timeline

Heading

Execution Timeline

---

States

Uploading Files

Waiting for Scheduler

Searching Providers

Provider Found

GPU Assigned

Downloading Files

Preparing Environment

Starting Container

Executing Workload

Streaming Logs

Saving Results

Updating Wallet

Completed

---

Failure States

Provider Disconnected

Retrying

Scheduler Busy

Execution Failed

Download Failed

Upload Failed

Container Error

---

# Live Logs

Heading

Live Execution Logs

Toolbar

Execution Output

Filename

train.py

Status

Running

Completed

Failed

Waiting

---

Code Window Placeholder

Logs will appear once execution begins.

---

Button

Copy Logs

Download Logs

Clear Logs

---

# Recent Workloads

Heading

Recent Workloads

Description

Track every workload you've submitted.

---

Filters

All

Running

Queued

Completed

Failed

Cancelled

---

Search

Search workloads...

---

Sort

Newest

Oldest

Duration

Cost

Status

---

# Job Card

Title

train.py

Subtitle

Submitted Today

---

Status

Queued

Running

Completed

Failed

Cancelled

Preparing

Downloading

Uploading

---

Metadata

GPU

Execution Time

Cost

Submitted

Completed

Output Size

Provider

Container

---

Actions

View Logs

Download Output

Run Again

Delete

---

Tooltip

View complete execution details.

---

# Job Details

Heading

Execution Details

---

Sections

General

Environment

GPU Information

Runtime

Logs

Artifacts

Billing

---

General

Script Name

Status

Submitted At

Completed At

Execution Time

---

GPU

Assigned GPU

CUDA Version

Memory

Driver

---

Billing

Execution Cost

Wallet Deduction

Transaction ID

---

Artifacts

Output Files

Logs

Download ZIP

---

# Wallet

Heading

Wallet

Description

Manage credits for workload execution.

Buttons

Top Up

View Transactions

---

Empty

No transactions yet.

---

# Activity Feed

Heading

Recent Activity

Events

Workload Submitted

GPU Assigned

Execution Started

Execution Completed

Wallet Updated

Retry Scheduled

Provider Changed

Logs Available

Output Ready

---

# Empty Dashboard

Heading

No Workloads Yet

Description

Upload your first Python script
to begin using UniGPU.

Button

Submit Workload

---

# Empty Search

Heading

Nothing Found

Description

Try changing your filters.

---

# Empty Logs

Heading

Waiting for Execution

Description

Logs will appear after
your workload starts.

---

# Loading States

Loading Metrics...

Loading Workloads...

Preparing Workspace...

Fetching Logs...

Loading Wallet...

Loading Activity...

---

# Success Messages

Python script uploaded.

Dependencies uploaded.

Workload submitted.

GPU assigned.

Execution started.

Execution completed.

Results available.

Logs downloaded.

Wallet updated.

Draft saved.

Settings updated.

---

# Warning Messages

No GPU currently matches your preference.

Using Auto Select may reduce queue time.

Large workloads may take longer.

Insufficient wallet balance.

Requirements file missing.

Provider unavailable.

Retry scheduled.

---

# Error Messages

Unable to upload script.

Unable to contact scheduler.

Provider disconnected.

Execution failed.

Logs unavailable.

Download failed.

Wallet update failed.

Network connection lost.

Unexpected server error.

---

# Confirmation Dialogs

Delete Workload

Are you sure you want to delete this workload?

Buttons

Cancel

Delete

---

Run Again

Submit this workload again?

Buttons

Cancel

Run Again

---

Clear Form

Discard uploaded files?

Buttons

Keep Editing

Discard

---

Sign Out

Are you sure you want to sign out?

Buttons

Cancel

Sign Out

---

# Notifications

Success

✓ Workload Submitted

✓ GPU Assigned

✓ Execution Started

✓ Execution Completed

✓ Results Ready

✓ Wallet Updated

---

Warning

Scheduler Busy

Retry Scheduled

Provider Offline

Queue Delay

---

Error

Execution Failed

Upload Failed

Download Failed

Wallet Error

Connection Lost

---

# Tooltips

Wallet

Credits used to pay providers.

---

Scheduler

Matches workloads to available GPUs.

---

Queue

Current workloads waiting
for execution.

---

GPU Preference

Selecting Auto allows faster scheduling.

---

Execution Cost

Estimated cost based on workload duration.

---

Logs

Real-time output streamed
from the provider.

---

Provider

The remote GPU executing your workload.

---

# Future Features

Pinned Workloads

Notebook Execution

TensorBoard

Saved Templates

Shared Workloads

Dataset Manager

CLI Sync

GitHub Integration

Webhook Notifications

API Keys

Cloud Storage

---

# Tone & Writing Style

Always use

Submit Workload

Never

Submit Job

---

Always use

Available Credits

Never

Wallet Amount

---

Always use

Running Workload

Never

Active Job

---

Always use

Provider

Never

Host

---

Always use

GPU Preference

Never

Target GPU

---

Always use

Dependencies

Never

Requirements File

---

# UX Principle

Every piece of text should answer one of three questions:

1. What is happening?

2. What should I do next?

3. What happens after this?

Users should never be uncertain about the current state of their workload or the next expected action.