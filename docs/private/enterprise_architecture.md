# UniGPU Enterprise Architecture (Distributed Training)

This document outlines the architecture, design decisions, and future roadmap for the UniGPU Enterprise offering.

## 1. High-Level Architecture Strategy: "Total Separation"

The Enterprise offering is designed to be completely distinct from the Consumer P2P platform. 
To achieve this without the operational overhead of managing multiple microservices, we utilize a **Modular Monolith** pattern.

### Backend (Modular Monolith)
- **Code Structure**: The enterprise API logic lives in a dedicated namespace (`backend/app/routers/enterprise/`) and relies on enterprise-specific database models (`Organization`, `EnterpriseCluster`, `EnterpriseNode`). 
- **Database Separation**: Consumer jobs are placed in the global `jobs` table and scheduled via standard celery tasks. Enterprise distributed workloads are handled entirely by Ray Orchestration linked to `EnterpriseCluster` records. They do not cross over.
- **Benefits**: We reuse authentication (JWT, Roles), database pooling, and infrastructure deployment pipelines while maintaining strict business logic separation.

### Frontend (Separate Subdomain)
- **Project Structure**: A separate React (Vite) project (`frontend-enterprise/`) built from scratch for enterprise users.
- **Routing**: Designed to be served on a distinct subdomain (e.g., `enterprise.unigpu.in`).
- **Focus**: The UI abandons the "marketplace" and "wallet" paradigms in favor of Cluster Health, Node Utilization (CPU/RAM/VRAM), and Job Distribution graphs.

---

## 2. The Enterprise CLI Agent

Instead of extending the P2P Python agent (`agent/agent.py`), Enterprise nodes will run a dedicated **CLI Agent**.

- **Language**: **Go (Golang)**
- **Why Go?**: Go produces a single, statically compiled binary with zero external dependencies. It's incredibly fast, handles concurrent networking exceptionally well, and is trivial for enterprise IT departments to distribute and install across Windows, macOS, and Linux without worrying about Python environments.
- **Functionality**: 
  - Authenticates via an Organization API Key.
  - Registers the node with the backend and joins an `EnterpriseCluster`.
  - Bootstraps the local Ray environment (acting as either a Head Node or Worker Node).
  - Streams logs and resource utilization back to the backend.

---

## 3. Distributed Training (Ray) & Networking Strategy

Distributed training across multiple laptops introduces significant networking complexity, primarily due to NAT and firewalls.

### Optimizations Used
- **Ray Placement Groups**: Used to optimize job scheduling, ensuring tasks that require heavy cross-communication are co-located or placed on nodes with sufficient VRAM.
- **Ray Elastic Training**: Critical for the laptop use-case. Since laptops can drop offline (sleep mode, WiFi loss), Elastic Training ensures the distributed job pauses and rescales rather than crashing the entire cluster.

### Network Topology Roadmap

To handle cross-network communication between laptops on different networks, we have a phased roadmap:

#### V1 Architecture (MVP)
In the initial release, we assume that all laptops in an `EnterpriseCluster` are on the same local network (LAN) OR the enterprise manages their own VPN.
- **Requirement**: The customer must ensure their laptops can communicate directly over TCP.
- **Use Case**: Office environments, university labs, or customers using existing ZeroTier/Tailscale meshes.

#### V2 Architecture (Advanced Future Plan)
In the future, we will automate cross-network NAT traversal.
- **Feature**: Integrate a lightweight VPN tunnel directly into the Go CLI Agent.
- **Mechanism**: When the CLI Agent joins a cluster, it automatically joins a private, ephemeral VPN mesh (using technologies similar to WireGuard or Tailscale overlay networks).
- **Result**: Laptops on completely different WiFi networks (e.g., employee homes) instantly get static virtual IPs and can form a seamless Ray cluster over the public internet without user configuration.

---

## 4. Execution Phases

### Phase 1: Foundation (Current)
- Introduce `UserRole.enterprise` and Organization DB models.
- Build `/api/enterprise/` REST endpoints.
- Scaffold the `frontend-enterprise/` Vite project.
- Design and implement the Enterprise Dashboard UI.

### Phase 2: Orchestration (Next)
- Build the `unigpu-cli` Go agent.
- Implement the backend logic to designate Ray Head vs Worker nodes.
- Support submitting Ray workloads from the Enterprise Dashboard to the cluster.
- Implement Ray log streaming and cluster status monitoring.
