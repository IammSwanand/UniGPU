# CLIENT_DB_CONTENT.md

> Version: 2.0
> Product: UniGPU
> Scope: Client Dashboard
>
> This document defines every piece of content visible to a Client using
> the UniGPU platform.
>
> References
>
> - PROJECT_CONTEXT.md
> - DESIGN_SYSTEM.md
> - APP_DESIGN_SYSTEM.md
> - CLIENT_DB_DESIGN.md
>
> This document intentionally contains **only content**.
> Layout decisions belong in CLIENT_DB_DESIGN.md.

---

# Brand Voice

The dashboard should communicate confidence.

It should never feel overly technical nor overly simplified.

Avoid phrases like

❌ Job

❌ Host

❌ Machine

❌ Execute Code

❌ Deploy

Prefer

✓ Workload

✓ Provider

✓ Compute

✓ Scheduler

✓ Runtime

✓ Execution

✓ Results

---

# Navbar

## Navigation

Dashboard

Documentation

---

## Wallet Pill

Heading

Available Credits

Value

₹{{wallet_balance}}

Tooltip

Available credits used to execute workloads.

Action

View Wallet

---

## Notifications

Tooltip

Notifications

Empty State

You're all caught up.

---

## Profile Menu

My Profile

Wallet

Settings

Documentation

Keyboard Shortcuts

Sign Out

---

# Greeting

Morning

Good Morning, {{first_name}}

Afternoon

Good Afternoon, {{first_name}}

Evening

Good Evening, {{first_name}}

---

## Welcome Text

Welcome back.

Your compute workspace is ready.

Alternative

Ready to run your next workload?

---

# GPU Network Strip

Heading

GPU Network

---

Healthy

Scheduler Online

---

Metric

Available GPUs

---

Metric

Average Queue Time

---

Metric

Running Workloads

---

Tooltip

UniGPU continuously monitors provider availability and automatically schedules workloads.

---

If no providers

No providers are currently online.

Your workload will automatically begin once compute becomes available.

---

# Execution Workspace

Heading

Submit Workload

Description

Upload a Python workload and UniGPU will securely schedule execution on an available provider GPU.

---

# Python Script

Heading

Python Script

Description

Upload the primary Python file to execute.

---

Dropzone

Drop your Python script here

or

Browse Files

---

Supported

.py

Maximum Size

100 MB

---

After Upload

Python script uploaded successfully.

Replace File

Remove File

Preview Script

---

# Dependencies

Heading

Dependencies

Description

Optional Python dependencies.

---

Dropzone

Drop requirements.txt here

or

Browse Files

---

Helper

Leave empty if your workload has no external dependencies.

---

After Upload

Dependencies uploaded successfully.

Replace File

Remove File

---

# GPU Preference

Heading

GPU Preference

Description

Choose a preferred GPU or allow UniGPU to automatically assign the best available provider.

---

Dropdown Options

Auto Select

Any Available

RTX 3060

RTX 3070

RTX 3080

RTX 4060

RTX 4070

RTX 4080

RTX 4090

Future

RTX 5090

---

Tooltip

Auto Select minimizes queue time and improves scheduling efficiency.

---

# Advanced Configuration

Heading

Advanced Configuration

Description

Optional runtime settings.

---

Fields

CUDA Version

GPU Memory Requirement

Execution Timeout

Working Directory

Environment Variables

Container Limit

---

Buttons

Show Advanced Settings

Hide Advanced Settings

---

# Runtime Estimate

Heading

Estimated Runtime

Description

Based on previous workloads.

---

Example

≈ 12 minutes

---

# Cost Estimate

Heading

Estimated Cost

Description

Approximate compute cost.

---

Example

≈ ₹3.42

---

# Queue Estimate

Heading

Estimated Queue Time

Example

Less than 2 minutes

---

# Buttons

Primary

Submit Workload

---

Secondary

Save Draft

---

Outline

Reset

---

Loading

Submitting Workload...

---

Disabled

Complete the required fields to continue.

---

# Submission Success

Title

Workload Submitted

Message

Your workload has been successfully queued.

UniGPU will automatically assign an available provider.

Primary Button

Track Progress

Secondary Button

Return to Dashboard

---

# Execution Timeline

Heading

Execution Progress

Description

Follow your workload through every stage of execution.

---

States

Uploading Files

Waiting for Scheduler

Searching for Provider

Provider Selected

GPU Assigned

Preparing Runtime

Downloading Files

Creating Container

Installing Dependencies

Executing Workload

Streaming Logs

Saving Results

Updating Wallet

Execution Complete

---

Completed Message

Your workload finished successfully.

Results are now available.

---

Failure States

Provider Disconnected

Scheduler Retrying

Execution Failed

Container Error

Dependency Installation Failed

Runtime Error

Logs Unavailable

---

# Live Logs

Heading

Execution Logs

Description

Real-time output streamed directly from the provider.

---

Toolbar

Running

Completed

Failed

---

Buttons

Copy Logs

Download Logs

Clear

Expand

Collapse

---

Empty

Logs will appear when execution begins.

---

# Embedded Editor

Heading

Script Preview

Toolbar

Filename

Save

Read Only

---

Empty

Upload a Python script to preview or edit it.

---

# Recent Workloads

Heading

Recent Workloads

Description

Monitor every workload you've submitted.

---

Filters

All

Queued

Running

Completed

Failed

Cancelled

---

Search Placeholder

Search workloads...

---

Sort

Newest

Oldest

Duration

Cost

Status

---

# Workload Card

Primary

train_model.py

---

Subtitle

Submitted 4 minutes ago

---

Metadata

GPU

Execution Time

Estimated Cost

Created

Completed

Output Size

Provider

Container

---

Status Chips

Queued

Preparing

Running

Completed

Failed

Cancelled

Retrying

Downloading

Uploading

---

Actions

View Details

View Logs

Download Results

Run Again

Delete

---

Tooltip

Open workload details.

---

# Workload Details

Heading

Execution Details

---

Sections

Overview

Timeline

Environment

GPU

Logs

Artifacts

Billing

---

Overview

Script Name

Status

Submitted

Completed

Execution Time

Runtime

---

Environment

Python Version

CUDA Version

Installed Dependencies

Container ID

---

GPU

Model

Memory

CUDA

Driver

Provider

---

Billing

Execution Cost

Wallet Deduction

Transaction ID

---

Artifacts

Results

Logs

ZIP Archive

Download All

---

# Activity Feed

Heading

Recent Activity

---

Events

Workload Submitted

Provider Assigned

Execution Started

Execution Completed

Wallet Updated

Retry Scheduled

Results Available

Logs Downloaded

---

Empty

No recent activity.

---

# Empty Dashboard

Heading

Welcome to UniGPU

Description

Submit your first workload to begin using community-powered GPU compute.

Primary Button

Submit Workload

Secondary Button

Read Documentation

---

# Empty Search

Heading

No matching workloads

Description

Try changing your search or filters.

---

# Empty Logs

Heading

Waiting for Execution

Description

Execution logs will appear once your workload begins running.

---

# Loading States

Loading Workspace...

Loading Workloads...

Preparing Execution...

Fetching Logs...

Loading Wallet...

Updating Timeline...

---

# Success Toasts

✓ Python script uploaded.

✓ Dependencies uploaded.

✓ Workload submitted.

✓ Provider assigned.

✓ Execution started.

✓ Execution completed.

✓ Results ready.

✓ Wallet updated.

✓ Draft saved.

---

# Warning Toasts

Scheduler is currently busy.

Using Auto Select may reduce queue time.

Provider temporarily unavailable.

Retrying execution.

Insufficient wallet balance.

Large workloads may take longer.

---

# Error Toasts

Unable to upload script.

Scheduler unavailable.

Execution failed.

Provider disconnected.

Download failed.

Wallet update failed.

Network connection lost.

Unexpected server error.

---

# Confirmation Dialogs

## Delete Workload

Title

Delete Workload?

Message

This action permanently removes the workload history from your dashboard.

Buttons

Cancel

Delete

---

## Run Again

Title

Run this workload again?

Message

The same files and configuration will be submitted as a new workload.

Buttons

Cancel

Run Again

---

## Reset Workspace

Title

Clear current workspace?

Message

Uploaded files and unsaved changes will be removed.

Buttons

Keep Editing

Clear Workspace

---

## Sign Out

Title

Sign out?

Message

You'll need to log in again to access your workloads.

Buttons

Cancel

Sign Out

---

# Notifications

Success

✓ Workload Submitted

✓ Provider Assigned

✓ GPU Ready

✓ Execution Started

✓ Execution Completed

✓ Results Ready

---

Information

Scheduler Searching...

Waiting for Available GPU...

Installing Dependencies...

Preparing Runtime...

Streaming Logs...

---

Warning

Provider Offline

Retry Scheduled

Queue Delay

Low Wallet Balance

---

Error

Execution Failed

Runtime Error

Container Failed

Upload Failed

Download Failed

Wallet Error

---

# Tooltips

Wallet

Credits available for workload execution.

---

Scheduler

Matches workloads to the most suitable available provider.

---

GPU Preference

Auto Select chooses the provider with the shortest estimated wait.

---

Estimated Cost

Calculated using workload duration and provider pricing.

---

Execution Logs

Real-time output streamed from the provider's runtime container.

---

Download Results

Download all generated output files as a ZIP archive.

---

# Future Features

Saved Workload Templates

Notebook Execution

TensorBoard Integration

Dataset Library

Cloud Storage

GitHub Repository Import

Webhook Notifications

CLI Upload

API Access

Artifact Explorer

---

# Writing Guidelines

Always write

Submit Workload

Never

Submit Job

---

Always write

Available Credits

Never

Wallet Amount

---

Always write

Provider

Never

Host

---

Always write

GPU Preference

Never

Target GPU

---

Always write

Execution

Never

Processing

---

Always write

Results

Never

Output Files

(unless referring specifically to downloadable artifacts)

---

# UX Principle

Every piece of copy should answer one of these questions:

1. What is happening?

2. What should I do next?

3. What will happen after I do it?

The dashboard should make distributed GPU execution feel transparent, predictable, and trustworthy without exposing unnecessary backend complexity.