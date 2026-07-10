# WEBSITE_CONTENT.md

> Version: 1.0
> Project: UniGPU
> Purpose: Marketing copy, page structure, messaging, microcopy, and website content guidelines.
>
> This document defines **what the website should communicate**, while `DESIGN_SYSTEM.md` defines **how it should look**.

---

# Brand Identity

## Product Name

**UniGPU**

---

## Positioning

UniGPU is a **peer-to-peer GPU marketplace** that enables students, researchers, and developers to share idle GPU resources and execute compute-intensive workloads securely.

Unlike traditional cloud providers, UniGPU transforms unused GPUs into a distributed compute network where providers earn credits and clients gain affordable access to GPU power.

---

## One-Line Pitch

> Turn idle GPUs into shared compute.

---

## Elevator Pitch

UniGPU is a distributed GPU marketplace where anyone with an NVIDIA GPU can contribute compute power and anyone needing GPU acceleration can securely execute machine learning workloads inside isolated Docker containers.

---

# Brand Voice

## Tone

- Technical
- Modern
- Minimal
- Developer-first
- Trustworthy
- Confident
- Practical

---

## Avoid

❌ AI buzzwords

❌ "Revolutionizing"

❌ "Next Generation"

❌ "Powered by AI"

❌ "Changing the Future"

❌ "Infinite Scale"

---

## Prefer

✓ Distributed Compute

✓ GPU Marketplace

✓ Secure Containers

✓ Real-time Logs

✓ Automatic Scheduling

✓ Peer-to-peer Infrastructure

✓ Docker Isolation

✓ Usage-based Billing

---

# Target Audience

Primary

- Students
- AI Engineers
- ML Engineers
- Researchers
- University Clubs
- Hackathon Teams

Secondary

- Freelance Developers
- Small AI Startups
- Open Source Contributors

---

# Website Structure

```
Navbar

Hero

Trusted By / Community

Features

How It Works

For Clients

For Providers

Technical Architecture

Platform Benefits

Pricing

FAQ

Final CTA

Footer
```

---

# Navigation

## Left

Logo

UniGPU

---

## Center

Home

Features

How It Works

Pricing

Docs

FAQ

---

## Right

Log In

Get Started

---

# Hero Section

## Eyebrow

PEER-TO-PEER GPU COMPUTE

---

## Headline

Turn Idle GPUs into **Shared Compute.**

> Highlight "Shared Compute" using the brand accent.

---

## Subheading

Submit Python workloads and execute them on idle GPUs contributed by students.

Secure Docker containers, live execution logs, automatic scheduling, and usage-based billing—all from one platform.

---

## Primary CTA

Start Computing

---

## Secondary CTA

Become a Provider

---

## Hero Terminal

```bash
$ unigpu submit train.py

✓ Upload complete

✓ Matching available GPU...

✓ NVIDIA RTX 4060 selected

✓ Container started

Streaming logs...

Epoch 1/20

Loss: 0.038

Accuracy: 97.4%

✓ Training Complete

Execution Time:
11m 42s
```

---

# Community Section

## Eyebrow

BUILT FOR DEVELOPERS

---

## Heading

Designed for students.
Built for compute.

---

## Description

Whether you're training machine learning models, participating in hackathons, conducting research, or experimenting with AI, UniGPU provides affordable access to GPU resources through a distributed marketplace.

---

# Features Section

## Eyebrow

WHY UNIGPU

---

## Heading

Built for distributed GPU execution.

---

## Feature 1

### Secure Containers

Every workload executes inside an isolated Docker container using the NVIDIA Runtime.

---

## Feature 2

### Automatic Scheduling

Jobs are automatically matched with available GPUs across the network.

---

## Feature 3

### Live Execution Logs

Monitor execution in real time with streamed logs from the provider machine.

---

## Feature 4

### Wallet-based Billing

Pay only for compute consumed while providers earn credits for every completed workload.

---

## Feature 5

### Distributed GPU Network

Transform idle GPUs into shared infrastructure accessible to the community.

---

## Feature 6

### Real-time Communication

Persistent WebSocket connections keep providers online and workloads synchronized.

---

# How It Works

## Eyebrow

HOW IT WORKS

---

## Heading

From upload to execution in four simple steps.

---

## Step 1

Upload

Upload your Python script together with an optional requirements.txt.

---

## Step 2

Match

The scheduler automatically selects an available GPU from the network.

---

## Step 3

Execute

The UniGPU Agent downloads your workload and executes it securely inside Docker.

---

## Step 4

Monitor & Finish

Watch live logs, receive outputs, and pay only for the compute you used.

---

# Client Section

## Eyebrow

FOR CLIENTS

---

## Heading

Compute without owning expensive hardware.

---

## Description

Run machine learning training, inference, simulations, or data processing without investing in high-end GPUs.

Perfect for students, researchers, developers, and hackathon teams.

---

## CTA

Start Computing

---

# Provider Section

## Eyebrow

FOR PROVIDERS

---

## Heading

Put your idle GPU to work.

---

## Description

Install the UniGPU Agent once.

When your GPU is available, UniGPU automatically assigns workloads, executes them securely inside Docker containers, and rewards you with credits based on execution time.

---

## CTA

Become a Provider

---

# Technical Section

## Eyebrow

UNDER THE HOOD

---

## Heading

Built using modern distributed systems.

---

## Description

UniGPU combines FastAPI, PostgreSQL, Redis, Celery, Docker, and WebSockets to orchestrate secure GPU execution across a decentralized network.

---

## Technology Chips

FastAPI

Docker

Redis

Celery

PostgreSQL

WebSockets

NVIDIA Runtime

Python

---

# Benefits Section

## Eyebrow

WHY CHOOSE UNIGPU

---

## Card

Docker Isolation

Every workload runs inside its own isolated execution environment.

---

## Card

Automatic Matching

No manual coordination required.

---

## Card

Usage Billing

Only pay for the compute you actually consume.

---

## Card

Real-time Logs

Monitor every stage of execution live.

---

## Card

Distributed Infrastructure

Leverage idle GPUs contributed by the community.

---

## Card

Persistent Agents

Provider machines stay connected through WebSockets for instant scheduling.

---

# Future Statistics Section

Use these once real data exists.

Active GPUs

Jobs Completed

Compute Hours

Credits Earned

---

# Pricing Section

## Eyebrow

PRICING

---

## Heading

Simple usage-based billing.

---

## Description

Pay only for execution time.

Providers earn credits based on completed workloads.

No subscriptions.

No reserved instances.

No hidden charges.

---

# FAQ

## What is UniGPU?

UniGPU is a peer-to-peer GPU marketplace where students and developers can execute compute-intensive workloads using idle GPUs contributed by other users.

---

## How are workloads executed?

Every submitted workload runs inside an isolated Docker container with NVIDIA GPU runtime.

---

## Can providers access my code?

Workloads are managed through the UniGPU Agent and executed inside isolated containers without requiring direct interaction from providers.

---

## What workloads are supported?

Any Python-based workload that can execute inside Docker, including machine learning, AI inference, data processing, and scientific computing.

---

## How do providers earn credits?

Providers receive credits based on the execution time of completed workloads.

---

## What happens if a provider disconnects?

Heartbeat monitoring detects unavailable providers and pending workloads can be reassigned.

---

## What hardware is required?

An NVIDIA GPU supporting CUDA together with Docker and NVIDIA Container Toolkit.

---

## Is UniGPU only for students?

No.

While UniGPU is designed with students in mind, anyone can participate as either a client or provider.

---

# Final CTA

## Heading

Ready to share compute?

---

## Description

Join the UniGPU network and start executing workloads or earning credits today.

---

## Primary CTA

Start Computing

---

## Secondary CTA

Become a Provider

---

# Footer

## About

UniGPU

Distributed GPU Compute Marketplace

Turning idle GPUs into shared compute infrastructure.

---

## Product

Features

Pricing

Docs

Dashboard

---

## Resources

Documentation

API Reference

GitHub

FAQ

---

## Community

Discord

LinkedIn

Contributors

---

## Legal

Privacy Policy

Terms of Service

License

---

## Copyright

© 2026 UniGPU

Built for students.
Powered by distributed compute.

---

# Suggested Taglines

Primary

> Turn Idle GPUs into Shared Compute.

Alternatives

- Compute Together.
- Every GPU Matters.
- Share Compute. Earn Credits.
- Compute Beyond Your Machine.
- Built by Students. Powered by Students.
- Distributed Compute Starts Here.

---

# Button Copy

Primary

- Start Computing
- Get Started
- Submit Workload

Secondary

- Become a Provider
- Learn More
- View Docs

Authentication

- Log In
- Register
- Continue

Dashboard

- Upload Script
- View Jobs
- Register GPU
- Open Dashboard

---

# Empty States

## No Jobs

No workloads yet.

Upload your first Python script to begin.

---

## No GPUs Available

No providers are currently available.

We'll automatically schedule your workload when a GPU comes online.

---

## No Wallet Transactions

Your wallet activity will appear here after your first workload.

---

# SEO

## Title

UniGPU — Peer-to-Peer GPU Marketplace

---

## Description

Run machine learning workloads on idle GPUs shared by the community. Secure Docker execution, automatic scheduling, real-time logs, and usage-based billing.

---

## Keywords

GPU Marketplace

Distributed GPU Computing

Machine Learning

AI Infrastructure

Docker

GPU Sharing

Python

CUDA

Students

Cloud Compute