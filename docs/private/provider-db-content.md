# PROVIDER_DB_CONTENT.md

> Version: 2.0
> Product: UniGPU
> Scope: Provider Dashboard
>
> This document defines every visible piece of content for the Provider
> Dashboard including headings, labels, buttons, tooltips, notifications,
> status messages, and empty states.
>
> References
>
> - PROJECT_CONTEXT.md
> - DESIGN_SYSTEM.md
> - APP_DESIGN_SYSTEM.md
> - PROVIDER_DB_DESIGN.md
>
> This document intentionally contains content only.
> Layout decisions belong inside PROVIDER_DB_DESIGN.md.

---

# Brand Voice

The Provider Dashboard should communicate

• Reliability

• Transparency

• System Health

• Real-time Monitoring

• Control

Unlike the Client Dashboard, this dashboard should feel similar to a system monitor rather than a workload submission portal.

Always explain machine state before platform state.

---

# Navbar

## Navigation

Provider Dashboard

Documentation

---

## Wallet Pill

Heading

Available Credits

Value

₹{{wallet_balance}}

Tooltip

Credits earned from completed workloads.

Action

View Wallet

---

## Notifications

Tooltip

Notifications

Empty

No recent activity.

---

## Profile Dropdown

My Profile

Wallet

Settings

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

Your provider node is connected and ready.

Alternative

Monitor your GPUs and receive workloads from the UniGPU network.

---

# Connection Status

Heading

Connection Status

Description

Monitor every component required for workload execution.

---

## Backend

Connected

Connecting...

Disconnected

Tooltip

Secure connection between your machine and UniGPU backend.

---

## GPU Agent

Running

Starting

Restarting

Offline

Tooltip

The UniGPU Agent is responsible for receiving and executing workloads.

---

## Docker Runtime

Healthy

Initializing

Restart Required

Unavailable

Tooltip

Docker is used to execute workloads securely inside isolated containers.

---

# Live Metrics

Heading

System Metrics

Description

Real-time hardware utilization.

---

## GPU Usage

Heading

GPU Utilization

Example

64%

Tooltip

Current GPU compute utilization.

---

## GPU Temperature

Heading

GPU Temperature

Example

63°C

Tooltip

Current GPU core temperature.

---

## CPU Temperature

Heading

CPU Temperature

Example

58°C

Tooltip

Current processor temperature.

---

## Memory Usage

Heading

Memory Usage

Example

8.3 GB / 16 GB

Tooltip

Current system memory usage.

---

# My GPUs

Heading

Registered GPUs

Description

Every GPU currently available for UniGPU workloads.

---

# GPU Card

Primary

NVIDIA RTX 4060 Laptop GPU

---

Status

Available

Busy

Offline

Maintenance

---

Details

VRAM

CUDA Version

Temperature

Power Usage

Memory Usage

GPU Utilization

Driver Version

Last Heartbeat

---

Buttons

View Details

Go Offline

Refresh Status

---

Tooltips

Go Offline

Temporarily stop receiving new workloads.

Refresh Status

Update current GPU information.

---

# GPU Detail Drawer

Heading

GPU Details

---

Sections

Overview

Hardware

Software

Live Usage

Current Workload

Heartbeat

---

Overview

GPU Name

UUID

Vendor

Status

---

Hardware

VRAM

Temperature

Power Draw

Fan Speed

Utilization

---

Software

CUDA Version

Driver Version

Docker Runtime

Agent Version

---

Heartbeat

Last Heartbeat

Connection Latency

Status

---

Current Workload

None

or

train_model.py

Status

Running

Remaining Time

Estimated Completion

---

# Active Workload

Heading

Current Workload

Description

A workload is currently executing on this GPU.

---

Metadata

Script Name

Assigned At

Started At

Execution Time

Container Status

GPU Usage

Memory Usage

Provider Reward

---

Buttons

View Logs

Download Logs

View Details

---

# Received Workloads

Heading

Received Workloads

Description

History of workloads executed on your GPUs.

---

Filters

All

Running

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

Execution Time

Reward

Status

---

# Workload Row

Primary

train_model.py

---

Subtitle

Assigned 12 minutes ago

---

Columns

Status

GPU

Assigned

Started

Duration

Reward

---

Status Chips

Queued

Downloading

Preparing

Running

Completed

Failed

Cancelled

Retrying

---

Overflow Menu

View Details

View Logs

Download Logs

Delete Local Files

---

Tooltip

Delete Local Files removes cached execution files from your provider machine only.

It does not affect the client's workload history.

---

# Execution Logs

Heading

Execution Logs

Description

Real-time output streamed from the Docker container.

---

Toolbar

Running

Completed

Failed

---

Buttons

Copy Logs

Download Logs

Expand

Collapse

---

Empty

Logs will appear once execution begins.

---

# Provider Rewards

Heading

Reward

Description

Credits earned for completing this workload.

---

Example

₹4.28

---

# Empty Dashboard

Heading

No Active Workloads

Description

Your registered GPUs are online and ready to receive workloads.

Primary Button

Refresh Status

Secondary Button

View Documentation

---

# Empty GPU

Heading

No GPUs Registered

Description

Install and start the UniGPU Agent to register your first GPU.

Button

Register GPU

---

# Empty History

Heading

No Workloads Yet

Description

Completed workloads will appear here once your GPU starts receiving jobs.

---

# Loading States

Loading System Metrics...

Loading GPUs...

Loading Connection Status...

Loading Workload History...

Loading Logs...

Loading Hardware Information...

---

# Success Toasts

✓ GPU Registered

✓ Agent Connected

✓ Docker Connected

✓ Workload Assigned

✓ Execution Started

✓ Execution Completed

✓ Logs Downloaded

✓ Local Files Removed

✓ GPU Status Updated

---

# Warning Toasts

GPU Temperature High

Memory Usage High

Docker Restart Recommended

Agent Reconnecting

Provider Temporarily Offline

Heartbeat Delayed

---

# Error Toasts

Backend Connection Lost

GPU Agent Offline

Docker Not Running

Heartbeat Lost

GPU Registration Failed

Execution Failed

Container Crashed

Unexpected Runtime Error

---

# Confirmation Dialogs

## Go Offline

Title

Stop Receiving Workloads?

Message

Your GPU will no longer receive new workloads until you go online again.

Buttons

Cancel

Go Offline

---

## Delete Local Files

Title

Delete Local Execution Files?

Message

Cached logs and temporary execution files will be permanently removed from this machine.

Buttons

Cancel

Delete Files

---

## Sign Out

Title

Sign Out?

Message

You'll need to sign in again to monitor your provider node.

Buttons

Cancel

Sign Out

---

# Notifications

Success

✓ GPU Registered

✓ Agent Connected

✓ Docker Healthy

✓ Workload Assigned

✓ Execution Started

✓ Execution Completed

✓ Reward Added

---

Information

Waiting for Workloads

Agent Checking Updates

Synchronizing Heartbeat

Preparing Runtime

Cleaning Containers

---

Warning

GPU Temperature High

High Memory Usage

Docker Restart Needed

Heartbeat Delayed

Network Latency Detected

---

Error

Backend Offline

Docker Offline

Agent Offline

Execution Failed

Container Crashed

GPU Disconnected

---

# Tooltips

Connection Status

Current health of every required service.

---

GPU Utilization

Percentage of GPU currently in use.

---

GPU Temperature

Current operating temperature.

---

CPU Temperature

Current processor temperature.

---

Memory Usage

Current RAM consumption.

---

Heartbeat

Latest communication between your provider machine and UniGPU.

---

Reward

Credits earned after successful workload completion.

---

Delete Local Files

Removes cached execution data without affecting the client.

---

# Future Features

Power Consumption

Network Bandwidth

GPU Fan Speed

Disk Usage

Provider Analytics

Daily Earnings

Monthly Earnings

Carbon Savings

Remote Restart

Container Explorer

Multi-GPU Grouping

Performance Benchmark

Agent Update Channel

---

# Writing Guidelines

Always write

Provider

Never

Host

---

Always write

Workload

Never

Job

---

Always write

Available Credits

Never

Wallet Amount

---

Always write

GPU Utilization

Never

GPU Load

---

Always write

Connection Status

Never

System Status

---

Always write

Registered GPUs

Never

My Devices

---

Always write

Reward

Never

Income

---

# UX Principle

A provider should always know:

1. Is my machine healthy?

2. Is my GPU available?

3. Am I currently running a workload?

4. Is the UniGPU Agent connected?

5. How much have I earned?

Every piece of content should answer one of these questions.

The Provider Dashboard should feel like a modern infrastructure monitoring platform while remaining approachable for students who may be sharing a GPU for the first time.