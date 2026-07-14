# PROVIDER_DB_DESIGN.md

> Version: 2.0
> Product: UniGPU
> Scope: Provider Dashboard
>
> This document defines the visual hierarchy, layout,
> interaction model and UI components for the Provider Dashboard.
>
> References
>
> - PROJECT_CONTEXT.md
> - DESIGN_SYSTEM.md
> - APP_DESIGN_SYSTEM.md
>
> The Provider Dashboard should feel like a real-time machine
> monitoring console while maintaining the same design language
> as the UniGPU Landing Page.

---

# Design Philosophy

Unlike the Client Dashboard, which is workload-centric, the Provider Dashboard is machine-centric.

A provider wants answers to these questions immediately:

• Is my machine online?

• Is my GPU Agent connected?

• Is Docker healthy?

• Is my GPU available?

• Am I currently executing someone's workload?

Everything else is secondary.

---

# Dashboard Structure

Navbar

↓

Connection Status Pipeline

↓

System Metrics

↓

My GPUs

↓

Received Workloads

No sidebar.

No nested navigation.

Single-page workflow.

---

# Page Width

1280px

Centered.

Uses the exact spacing, typography, shadows, border radius,
and color palette defined in DESIGN_SYSTEM.md.

---

# Navbar

Exactly the same as Landing Page and Client Dashboard.

------------------------------------------------

Logo

Provider Dashboard

Documentation

Wallet Pill

Notifications

Profile Avatar

------------------------------------------------

Height

72px

Background

Snow Canvas

Blur Enabled

Border Bottom

Stone Divider

---

# Wallet Pill

Compact.

Displays

₹{{balance}}

Available Credits

Click opens Wallet page.

Never display transaction history inside dashboard.

---

# Profile Dropdown

My Profile

Wallet

Settings

Sign Out

---

# Connection Status Pipeline

Purpose

Instantly communicate the health of the provider machine.

Displayed as a horizontal pipeline.

------------------------------------------------

Backend

● Connected

━━━━━━━━━━

GPU Agent

● Running

━━━━━━━━━━

Docker Runtime

● Healthy

------------------------------------------------

Each stage has

Status Dot

Status Text

Tooltip

Never use progress bars.

Status Colors

Green

Healthy

Amber

Warning

Red

Disconnected

---

# Metrics Section

Four equal cards.

These display live hardware metrics.

Metric 1

GPU Utilization

62%

Real-time

---

Metric 2

GPU Temperature

64°C

Real-time

---

Metric 3

CPU Temperature

58°C

Real-time

---

Metric 4

Memory Usage

7.4 GB / 16 GB

Real-time

Metrics update continuously.

Cards use Feature Card styling from DESIGN_SYSTEM.

---

# My GPUs

Heading

My GPUs

Purpose

Show every GPU registered with UniGPU.

Each GPU is represented by a card.

Example

------------------------------------------------

RTX 4060 Laptop GPU

Status

Available

VRAM

8 GB

CUDA

12.4

Temperature

63°C

Utilization

14%

Memory

2.3 / 8 GB

Buttons

View Details

Go Offline

------------------------------------------------

If multiple GPUs exist

Cards stack vertically.

Never use tables.

---

# GPU Detail Drawer

Clicking View Details opens side drawer.

Displays

GPU Name

UUID

Driver Version

CUDA Version

Memory

Temperature

Power Usage

Fan Speed

Running Workload

Container ID

Provider ID

Heartbeat Timestamp

---

# Received Workloads

Heading

Received Workloads

Description

Monitor every workload assigned to your machine.

Modern rounded table.

Columns

Script

Status

Assigned

Started

Duration

Actions

Actions

Overflow Menu

View Details

Logs

Download Logs

Delete Local Files

Never show Delete Workload.

Providers cannot delete client jobs.

---

# Execution Card

When workload is active

Display sticky execution card above table.

------------------------------------------------

Current Workload

train_model.py

Running

GPU

RTX 4060

Duration

04m 13s

GPU Usage

81%

VRAM

7.2 GB

Container

Running

Button

View Live Logs

------------------------------------------------

---

# Live Logs

Dark code window.

Same style as Landing Page.

Toolbar

Execution Logs

Auto Scroll

Copy Logs

Download Logs

Clear

Logs stream in real-time from Docker.

---

# Empty State

Heading

No Active Workloads

Description

Your registered GPUs are online and ready to receive workloads.

Button

Refresh Status

---

# Notifications

Provider Connected

GPU Registered

Docker Restarted

Agent Updated

New Workload Assigned

Execution Started

Execution Completed

Heartbeat Lost

GPU Offline

---

# Loading States

Metrics Skeleton

GPU Cards Skeleton

History Skeleton

Logs Skeleton

Never spinner-only.

---

# Error States

Backend Disconnected

Agent Offline

Docker Not Running

Heartbeat Lost

GPU Unavailable

Execution Failed

Connection Timeout

Retry actions always visible.

---

# Motion

Cards

Fade Up

Metrics

Count Animation

GPU Cards

Lift on Hover

Dropdown

Scale + Fade

Logs

Smooth Auto Scroll

Never bounce.

---

# Responsive

Desktop

Pipeline

4 Metrics

GPU Cards

History Table

Tablet

2 Metrics Per Row

GPU Cards Stack

History Cards

Mobile

Everything Stacks

Pipeline Becomes Vertical

History Uses Cards

---

# Backend Awareness

Every visible state must map directly to PROJECT_CONTEXT.md.

Backend

↓

GPU Agent

↓

Heartbeat

↓

Docker Runtime

↓

Container Execution

↓

Log Streaming

↓

Completion

The UI should visualize the real architecture rather than hiding it.

This creates confidence for providers while making debugging significantly easier.