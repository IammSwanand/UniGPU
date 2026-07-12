# APP_DESIGN_SYSTEM.md

> Version: 1.0
> Product: UniGPU
> Scope: Authenticated Application
>
> This document defines the visual language and interaction principles for
> every authenticated page inside UniGPU.
>
> It extends DESIGN_SYSTEM.md.
>
> DESIGN_SYSTEM.md defines how UniGPU looks.
>
> APP_DESIGN_SYSTEM.md defines how UniGPU behaves after login.

---

# Philosophy

The authenticated application should feel like a natural continuation of the
marketing website.

Users should never feel they have entered a completely different product.

Every page should inherit the same:

- Typography
- Colors
- Border Radius
- Shadows
- Motion
- Buttons
- Cards
- Code Windows
- Status Chips

defined inside DESIGN_SYSTEM.md.

---

# Inspiration

The application experience should resemble

- Linear
- Railway
- Vercel
- Modal
- GitHub Actions
- Stripe Dashboard

Avoid traditional Bootstrap admin templates.

Avoid enterprise ERP layouts.

Avoid left navigation sidebars.

---

# Core Principles

## Workspace First

Users come here to accomplish work.

Every screen should prioritize:

1. Current workload
2. Running workloads
3. Previous workloads

before secondary information.

---

## Progressive Disclosure

Never overwhelm users.

Advanced options remain hidden until needed.

Example

GPU Preference

↓

Advanced

↓

CUDA Version

Memory Requirement

Container Limits

---

## Real-Time First

UniGPU is a distributed system.

Users should always understand

Current Network

Current Jobs

Current Queue

Current Status

Current Wallet

without refreshing.

---

## Minimal Navigation

Top navigation only.

No permanent sidebars.

No nested navigation trees.

---

# Layout

Desktop

------------------------------------------------------------

Navbar

------------------------------------------------------------

Workspace Header

------------------------------------------------------------

Primary Workspace

------------------------------------------------------------

Secondary Information

------------------------------------------------------------

History

------------------------------------------------------------

Footer (minimal)

---

Maximum Width

1280px

Centered

Generous whitespace

---

# Navbar

Height

72px

Background

Snow Canvas

Blur

Same as Landing Page

Bottom Border

Stone Divider

---

Left

UniGPU Logo

Dashboard

Documentation

---

Center

Current Page

---

Right

Wallet Balance

Notifications

Profile Avatar

---

Profile Menu

My Profile

Wallet

Settings

Sign Out

Danger Divider

Delete Account (future)

---

Notifications

Bell icon

Unread badge

Dropdown

Recent events

Job Completed

Wallet Updated

GPU Assigned

Provider Offline

---

Wallet Indicator

Compact pill

Example

₹842.50

Available Credits

Click opens Wallet page.

---

# Workspace Header

Instead of

Dashboard

Use

Good Morning, {{username}}

or

Welcome back, {{username}}

Subheading

Ready to run your next workload?

---

# Cards

Cards inherit Feature Card styling from DESIGN_SYSTEM.

Background

White

Radius

8px

Shadow

Feature Shadow

Padding

24px

---

Card Types

Information Card

Workspace Card

Timeline Card

History Card

Metric Card

---

# Buttons

Ghost Outline

Default Action

Primary

Submit Workload

Save Draft

Upload

---

Inverse Fill

Highest Priority

Used only once per page.

Usually

Submit Workload

---

Danger

Ghost Outline

Red text only.

Never solid red buttons.

---

# Forms

Rounded

12px Radius

Large labels

16px spacing

Generous whitespace

Never cramped.

---

# Upload Areas

Large Drop Zone

Centered icon

Heading

Description

Supported file types

Browse button

Drag & Drop

Hover accent border

---

# Code Window

Inherited directly from Landing Page.

Dark Surface

Roboto Mono

Rounded

16px

No shadow

Toolbar

Filename

Syntax highlighting

Optional line numbers

---

Used for

Logs

Editor

Output

Execution Preview

---

# Status Chips

Exactly same as Landing Page.

Queued

Running

Completed

Failed

Cancelled

Uploading

Preparing

---

Only one accent color.

Never traffic-light colors.

---

# Tables

Avoid traditional data grids.

Prefer card rows.

If tables are necessary

Large row height

Rounded container

Hover state

Status chip

Overflow menu

---

# Timeline

Workloads should visualize progress.

Queued

↓

GPU Assigned

↓

Downloading

↓

Running

↓

Streaming Logs

↓

Completed

Timeline uses chips.

Never progress bars.

---

# Empty States

Always friendly.

Never blank pages.

Example

No workloads yet.

Upload your first Python script.

Button

Submit Workload

---

# Loading States

Skeleton Cards

Skeleton Table

Skeleton Metrics

No spinners unless action is blocking.

---

# Error States

Friendly language.

Never raw exceptions.

Example

Unable to contact scheduler.

Please try again.

Retry

---

# Success States

Use concise confirmation.

Workload Submitted

GPU Assigned

Logs Ready

Wallet Updated

Download Complete

---

# Motion

Duration

150–250ms

Easing

ease

Hover

Small lift

Cards

Fade Up

Dropdown

Scale + Fade

Never bounce.

Never spring.

---

# Responsive

Desktop

4-column metrics

2-column workspace

History table

Tablet

2-column metrics

Single-column workspace

Mobile

Stack everything

Cards replace tables

Bottom sheets replace dropdowns

---

# Accessibility

Keyboard navigation

Visible focus

ARIA labels

Semantic HTML

Screen reader friendly

---

# Shared Components

Navbar

Profile Menu

Wallet Pill

Notification Dropdown

Status Chip

Metric Card

Workspace Card

Upload Dropzone

Code Window

Timeline

Job Card

History Table

Modal

Toast

Confirmation Dialog

Loading Skeleton

Empty State

Error State

---

# Design Goal

The authenticated application should feel like

"I am working inside a premium developer platform."

not

"I am filling out forms in an admin dashboard."

Every interaction should reinforce the idea that UniGPU is orchestrating a distributed GPU network behind the scenes while keeping the interface calm, minimal, and developer-focused.