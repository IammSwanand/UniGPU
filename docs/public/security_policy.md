# Security Policy

> **Version:** 1.0
> **Effective Date:** July 16, 2026
> **Last Updated:** July 16, 2026

---

## Table of Contents

1. Introduction
2. Definitions
3. Security Principles
4. Platform Security
5. Account Security
6. Compute Security
7. Provider Security
8. Data Protection
9. Incident Response
10. Vulnerability Reporting
11. Security Best Practices for Users
12. Compliance
13. Changes to this Policy
14. Contact

---

# 1. Introduction

At UniGPU, security is a core component of the Services we provide.

As a distributed GPU computing platform, UniGPU is committed to protecting the confidentiality, integrity, and availability of our platform, infrastructure, Users, and Compute Jobs.

This Security Policy describes our general security practices and the responsibilities shared between UniGPU, Clients, and Providers.

This Policy should be read together with the Privacy Policy, Terms of Service, Provider Agreement, Client Agreement, and Acceptable Use Policy.

---

# 2. Definitions

Capitalized terms used in this Policy have the meanings assigned to them in the **Legal Definitions** document unless expressly defined otherwise.

---

# 3. Security Principles

UniGPU is guided by the following principles:

- Security by design.
- Least privilege access.
- Defense in depth.
- Secure defaults.
- Continuous improvement.
- Responsible disclosure.
- Privacy-first engineering.
- Operational transparency where appropriate.

Security is a shared responsibility between UniGPU and its Users.

---

# 4. Platform Security

UniGPU implements administrative, technical, and organizational safeguards designed to protect the Services.

These safeguards may include:

- HTTPS/TLS encryption for data in transit.
- Encryption of sensitive data where appropriate.
- Password hashing using modern cryptographic algorithms.
- Role-based access controls.
- Authentication and session management.
- Audit logging.
- Infrastructure monitoring.
- Secure deployment practices.
- Network segmentation where appropriate.
- Routine security updates.

While we continuously improve our security posture, no online service can guarantee absolute security.

---

# 5. Account Security

Users are responsible for maintaining the security of their Accounts.

Users should:

- Choose strong, unique passwords.
- Enable Multi-Factor Authentication (MFA) when available.
- Protect API keys and access tokens.
- Avoid sharing credentials.
- Sign out from shared devices.
- Report suspected account compromise immediately.

Users are responsible for activities performed using their Accounts unless otherwise required by applicable law.

---

# 6. Compute Security

UniGPU is designed to execute Compute Jobs in isolated execution environments where technically feasible.

Compute workloads may utilize technologies such as:

- Containers
- Virtualization
- Process isolation
- Resource quotas
- Filesystem isolation
- Network controls

Execution methods may evolve over time as the platform develops.

Clients remain responsible for the security of their own code, datasets, models, dependencies, and configuration.

---

# 7. Provider Security

Providers play a critical role in maintaining Marketplace security.

Providers are expected to:

- Keep operating systems updated.
- Use supported GPU drivers.
- Secure their local networks.
- Protect physical access to hardware.
- Maintain malware protection.
- Run the official Provider Agent.
- Report suspected compromises promptly.

Providers must not intentionally inspect, retain, modify, or disclose Client User Content except as technically necessary to execute assigned Jobs.

Failure to meet security expectations may result in suspension or removal from the Marketplace.

---

# 8. Data Protection

UniGPU is committed to protecting User information through reasonable security measures.

Depending on the nature of the data, protections may include:

- Encryption in transit.
- Secure storage practices.
- Access controls.
- Authentication mechanisms.
- Logging and monitoring.
- Backup procedures.
- Data minimization.

Users are encouraged to encrypt particularly sensitive information before submitting Compute Jobs.

---

# 9. Incident Response

UniGPU maintains processes for identifying, investigating, responding to, and recovering from security incidents.

When appropriate, our response may include:

- Incident containment.
- Service restoration.
- Internal investigation.
- Security remediation.
- User notification where required by applicable law.
- Cooperation with relevant authorities when legally required.

The specific timing and content of incident communications may depend on the nature and severity of the incident.

---

# 10. Vulnerability Reporting

We welcome responsible disclosure of security vulnerabilities.

If you believe you have identified a security issue affecting the Services, please report it to:

**Security**

security@unigpu.in

Please include, where possible:

- Description of the issue.
- Steps to reproduce.
- Potential impact.
- Supporting screenshots or logs.
- Suggested remediation (optional).

We ask that researchers:

- Avoid disrupting the Services.
- Avoid accessing User data without authorization.
- Refrain from exploiting vulnerabilities beyond what is necessary to demonstrate their existence.
- Allow UniGPU a reasonable opportunity to investigate and remediate reported issues before public disclosure.

Submission of a vulnerability report does not automatically entitle the reporter to financial compensation or participation in a bug bounty program unless expressly stated by UniGPU.

---

# 11. Security Best Practices for Users

To help maintain a secure environment, Users should:

- Keep software dependencies updated.
- Validate third-party packages.
- Protect API credentials.
- Review uploaded datasets.
- Monitor account activity.
- Remove unused access tokens.
- Use secure development practices.
- Report suspicious activity immediately.

Providers should also:

- Monitor hardware health.
- Secure local infrastructure.
- Perform routine maintenance.
- Verify system integrity before accepting Jobs.

---

# 12. Compliance

UniGPU continuously works to improve its operational and security practices.

As the platform evolves, UniGPU may adopt additional industry standards, certifications, or compliance frameworks where appropriate.

Any certifications or compliance claims will be published separately and should not be inferred unless expressly stated by UniGPU.

---

# 13. Changes to this Policy

UniGPU may update this Security Policy from time to time.

When material changes are made, we will update the **Last Updated** date and, where appropriate, notify Users through the Services or by email.

Continued use of the Services after changes become effective constitutes acceptance of the revised Policy.

---

# 14. Contact

For security-related inquiries:

swanand@unigpu.in

---

© 2026 UniGPU. All rights reserved.