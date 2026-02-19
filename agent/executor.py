"""
UniGPU Agent — Docker Job Executor
Reads training scripts from local paths (as stored by the backend),
builds/runs containers with NVIDIA runtime,
enforces resource limits & timeouts, and collects results.
"""

import asyncio
import logging
import os
import shutil
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

import docker
from docker.errors import (
    ContainerError,
    DockerException,
    ImageNotFound,
    NotFound,
)

logger = logging.getLogger("unigpu.agent.executor")


@dataclass
class JobResult:
    """Result of a single job execution."""
    job_id: str
    status: str          # "completed" | "failed" | "timeout" | "error"
    exit_code: int
    runtime_seconds: float
    output_dir: Optional[str] = None
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "status": self.status,
            "exit_code": self.exit_code,
            "runtime_seconds": round(self.runtime_seconds, 2),
            "output_dir": self.output_dir,
            "error_message": self.error_message,
        }


class JobExecutor:
    """
    Executes training jobs inside Docker containers using NVIDIA runtime.

    Lifecycle:
      1. Copy training script from backend's upload dir into job work directory
      2. Create and start a container with resource limits
      3. Monitor for completion or timeout
      4. Collect exit code and output
    """

    def __init__(
        self,
        work_dir: str,
        docker_base_image: str,
        cpu_limit: float = 4.0,
        memory_limit: str = "8g",
        max_timeout: int = 3600,
    ):
        self.work_dir = Path(work_dir)
        self.docker_base_image = docker_base_image
        self.cpu_limit = cpu_limit
        self.memory_limit = memory_limit
        self.max_timeout = max_timeout

        self._docker: Optional[docker.DockerClient] = None

    # ──────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────

    async def execute(self, job: Dict[str, Any]) -> JobResult:
        """
        Run a job end-to-end.

        Expected job payload (from backend assign_job):
          {
            "type": "assign_job",
            "job_id": "uuid",
            "script_path": "uploads/<job_id>/train.py",
            "requirements_path": "uploads/<job_id>/requirements.txt" | null,
          }
        """
        job_id = job["job_id"]
        logger.info("▶ Starting job %s", job_id)

        try:
            # Step 1: Prepare directories
            job_dir = self._prepare_job_dir(job_id)
            input_dir = job_dir / "input"
            output_dir = job_dir / "output"
            input_dir.mkdir(exist_ok=True)
            output_dir.mkdir(exist_ok=True)

            # Step 2: Copy training script from backend's upload dir
            self._copy_script(job, input_dir)

            # Step 3: Run Docker container (blocking, run in executor)
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                self._run_container,
                job, input_dir, output_dir,
            )
            return result

        except Exception as exc:
            logger.exception("Job %s failed with unexpected error", job_id)
            return JobResult(
                job_id=job_id,
                status="error",
                exit_code=-1,
                runtime_seconds=0,
                error_message=str(exc),
            )

    def get_container_for_job(self, job_id: str) -> Optional[Any]:
        """Get the running Docker container for a job (for log streaming)."""
        client = self._get_docker_client()
        try:
            return client.containers.get(f"unigpu-job-{job_id}")
        except NotFound:
            return None

    # ──────────────────────────────────────────────
    # Internal — File operations
    # ──────────────────────────────────────────────

    def _prepare_job_dir(self, job_id: str) -> Path:
        """Create a clean working directory for this job."""
        job_dir = self.work_dir / job_id
        if job_dir.exists():
            shutil.rmtree(job_dir)
        job_dir.mkdir(parents=True)
        return job_dir

    def _copy_script(self, job: Dict[str, Any], dest: Path) -> None:
        """
        Copy the training script (and optional requirements) from the backend's
        upload directory into the job's input directory.

        The backend stores uploaded files at paths like:
          uploads/<job_id>/train.py
          uploads/<job_id>/requirements.txt

        These paths are relative to the backend's working directory.
        When running on the same machine or with shared volumes (Docker),
        we can read them directly.
        """
        script_path = Path(job["script_path"])
        if not script_path.exists():
            raise FileNotFoundError(
                f"Script not found at {script_path}. "
                f"Ensure the agent can access the backend's upload directory."
            )

        # Copy script
        script_name = script_path.name
        shutil.copy2(str(script_path), str(dest / script_name))
        logger.info("Copied script %s (%d bytes)", script_name, script_path.stat().st_size)

        # Copy requirements if provided
        req_path = job.get("requirements_path")
        if req_path:
            req_path = Path(req_path)
            if req_path.exists():
                shutil.copy2(str(req_path), str(dest / req_path.name))
                logger.info("Copied requirements %s", req_path.name)

    # ──────────────────────────────────────────────
    # Internal — Docker execution
    # ──────────────────────────────────────────────

    def _get_docker_client(self) -> docker.DockerClient:
        """Lazy-init Docker client."""
        if self._docker is None:
            self._docker = docker.from_env()
        return self._docker

    def _run_container(
        self,
        job: Dict[str, Any],
        input_dir: Path,
        output_dir: Path,
    ) -> JobResult:
        """
        Create and run a Docker container for the job.
        This is a BLOCKING call — should be run via run_in_executor.
        """
        job_id = job["job_id"]
        image = self.docker_base_image
        timeout = self.max_timeout

        # Determine script name from the path
        script_name = Path(job["script_path"]).name

        client = self._get_docker_client()

        # Ensure image is available
        self._ensure_image(client, image)

        # Build command: install deps then run script
        cmd_parts = []
        req_path = job.get("requirements_path")
        if req_path:
            req_name = Path(req_path).name
            if (input_dir / req_name).exists():
                cmd_parts.append(f"pip install -q -r /workspace/input/{req_name} &&")
        cmd_parts.append(f"python /workspace/input/{script_name}")
        full_cmd = " ".join(cmd_parts)

        start_time = time.time()
        container = None

        try:
            container = client.containers.run(
                image=image,
                command=["bash", "-c", full_cmd],
                name=f"unigpu-job-{job_id}",
                detach=True,
                runtime="nvidia",                         # NVIDIA GPU runtime
                environment={"NVIDIA_VISIBLE_DEVICES": "all"},
                volumes={
                    str(input_dir.resolve()): {"bind": "/workspace/input", "mode": "ro"},
                    str(output_dir.resolve()): {"bind": "/workspace/output", "mode": "rw"},
                },
                working_dir="/workspace",
                cpu_period=100000,
                cpu_quota=int(self.cpu_limit * 100000),    # e.g. 4 cores
                mem_limit=self.memory_limit,
                network_mode="bridge",
                auto_remove=False,
            )

            logger.info("Container %s started for job %s", container.short_id, job_id)

            # Wait for container to finish or timeout
            result = container.wait(timeout=timeout)
            elapsed = time.time() - start_time
            exit_code = result.get("StatusCode", -1)

            status = "completed" if exit_code == 0 else "failed"
            logger.info(
                "Job %s %s (exit=%d, %.1fs)",
                job_id, status, exit_code, elapsed,
            )

            return JobResult(
                job_id=job_id,
                status=status,
                exit_code=exit_code,
                runtime_seconds=elapsed,
                output_dir=str(output_dir),
            )

        except Exception as exc:
            elapsed = time.time() - start_time

            if "timed out" in str(exc).lower() or "read timed out" in str(exc).lower():
                logger.warning("Job %s timed out after %.1fs", job_id, elapsed)
                return JobResult(
                    job_id=job_id,
                    status="timeout",
                    exit_code=-1,
                    runtime_seconds=elapsed,
                    error_message=f"Exceeded {timeout}s timeout",
                )

            logger.exception("Container execution error for job %s", job_id)
            return JobResult(
                job_id=job_id,
                status="error",
                exit_code=-1,
                runtime_seconds=elapsed,
                error_message=str(exc),
            )

        finally:
            # Cleanup container
            if container:
                try:
                    container.remove(force=True)
                except Exception:
                    pass

    def _ensure_image(self, client: docker.DockerClient, image: str) -> None:
        """Pull image if not available locally."""
        try:
            client.images.get(image)
            logger.debug("Image %s already available", image)
        except ImageNotFound:
            logger.info("Pulling image %s (this may take a while)…", image)
            client.images.pull(image)
            logger.info("Image %s pulled successfully", image)
