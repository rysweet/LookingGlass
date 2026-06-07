from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from importlib.metadata import PackageNotFoundError, distribution
from pathlib import Path


DIST_NAME = "alice-web-prototype-amplihack"
DEFAULT_REPO_URL = "https://github.com/rysweet/alice-web-prototype.git"
NODE_HEAP_OPTION = "--max-old-space-size=32768"

SCENARIOS = {
    "a3p-statement-simple": {
        "description": "A3P parser/writer statement inventory contract",
        "runner": "vitest",
        "pattern": (
            "keeps parser-recognized statement kinds explicit|"
            "keeps writer round-trip coverage cases in exact parity with SUPPORTED_A3P_STATEMENT_KINDS"
        ),
    },
    "a3p-statement-integration": {
        "description": "A3P statement round-trip, lowering, and fail-loud coverage",
        "runner": "vitest",
        "pattern": (
            "round-trips parser-recognized|"
            "lowers VariableAssignment statements|"
            "lowers EventListener statements|"
            "rejects TS-only ForEach statements|"
            "throws instead of dropping unsupported statement kinds"
        ),
    },
    "server-api-simple": {
        "description": "Server API health, default launch, and screenshot contract",
        "runner": "server-api-simple",
    },
    "server-api-complex": {
        "description": "Server API edit/save/run/template error integration contract",
        "runner": "server-api-complex",
    },
}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="amplihack",
        description="Run alice-web-prototype outside-in validation scenarios from a uvx-installed branch.",
    )
    parser.add_argument("command", choices=sorted(SCENARIOS))
    parser.add_argument(
        "--no-install",
        action="store_true",
        help="Skip npm ci when node_modules already exists in the cached checkout.",
    )
    args = parser.parse_args(argv)

    scenario = SCENARIOS[args.command]
    repo = ensure_checkout()
    ensure_tool("npm")
    ensure_tool("npx")

    print(f"Scenario: {scenario['description']}", flush=True)
    print(f"Checkout: {repo}", flush=True)

    if not args.no_install:
        run(["npm", "ci", "--no-audit", "--no-fund", "--silent"], cwd=repo)
    elif not (repo / "node_modules").exists():
        raise SystemExit("--no-install was used, but cached node_modules does not exist")

    env = with_node_options(os.environ.copy())
    runner = scenario["runner"]
    if runner == "vitest":
        run_vitest_scenario(repo, env, scenario["pattern"])
    elif runner == "server-api-simple":
        run_server_api_simple(repo, env)
    elif runner == "server-api-complex":
        run_server_api_complex(repo, env)
    else:
        raise SystemExit(f"Unknown scenario runner: {runner}")
    return 0


def run_vitest_scenario(repo: Path, env: dict[str, str], pattern: str) -> None:
    command = [
        "npx",
        "vitest",
        "run",
        "test/a3p-writer.test.ts",
        "-t",
        pattern,
    ]
    print(f"Command: NODE_OPTIONS={env['NODE_OPTIONS']} {' '.join(command)}", flush=True)
    run(command, cwd=repo, env=env)


def run_server_api_simple(repo: Path, env: dict[str, str]) -> None:
    build_server(repo, env)
    evidence_dir = Path(tempfile.mkdtemp(prefix="alice-step13-simple-"))
    port = find_available_port()
    server = start_server(repo, port, evidence_dir, env)
    try:
        health = wait_for_health(port, server)
        expect_keys(health, ["status", "launched", "pid", "uptime", "runtime"])
        expect_equal(health["status"], "running", "health status")
        expect_equal(health["launched"], False, "health launched flag before launch")
        expect_equal(health["runtime"], "typescript-web-prototype", "runtime")
        print_json("Health", health)

        launch_status, launch = request_json(port, "POST", "/api/launch", {})
        expect_equal(launch_status, 200, "launch HTTP status")
        expect_keys(launch, ["status", "project", "projectName", "sceneObjectCount"])
        expect_equal(launch["status"], "launched", "launch status")
        expect_equal(launch["project"], None, "launch project")
        expect_equal(launch["projectName"], "Program", "launch projectName")
        expect_equal(launch["sceneObjectCount"], 2, "launch sceneObjectCount")
        print_json("Launch", launch)

        screenshot_status, screenshot = request_json(port, "GET", "/api/screenshot")
        expect_equal(screenshot_status, 200, "screenshot HTTP status")
        expect_equal(screenshot["status"], "captured", "screenshot status")
        expect_path_exists(Path(str(screenshot["path"])), "screenshot artifact")
        print_json("Screenshot", screenshot)
        print(f"PASS server-api-simple evidenceDir={evidence_dir}", flush=True)
    finally:
        stop_server(server)


def run_server_api_complex(repo: Path, env: dict[str, str]) -> None:
    build_server(repo, env)
    evidence_dir = Path(tempfile.mkdtemp(prefix="alice-step13-complex-"))
    port = find_available_port()
    server = start_server(repo, port, evidence_dir, env)
    try:
        health = wait_for_health(port, server)
        expect_equal(health["launched"], False, "initial launch state")

        run_status, run_before_launch = request_json(port, "POST", "/api/world/run", {})
        expect_equal(run_status, 400, "run-before-launch HTTP status")
        expect_equal(
            run_before_launch,
            {"error": "Not launched. Call POST /api/launch first."},
            "run-before-launch error contract",
        )
        print_json("Run before launch", run_before_launch)

        launch_status, launch = request_json(port, "POST", "/api/launch", {})
        expect_equal(launch_status, 200, "launch HTTP status")
        expect_equal(launch["sceneObjectCount"], 2, "default launch object count")

        add_status, added = request_json(
            port,
            "POST",
            "/api/scene/add-object",
            {"className": "org.lgna.story.SBiped", "name": "bunny"},
        )
        expect_equal(add_status, 200, "add-object HTTP status")
        expect_equal(added["status"], "added", "add-object status")
        expect_equal(added["sceneFieldCountAfter"], 3, "add-object count")
        scene_artifact = read_json_artifact(Path(str(added["evidenceArtifact"])))
        expect_equal(
            scene_artifact["schema_version"],
            "eatme.alice-scene-object-added/v1",
            "scene evidence schema",
        )
        print_json("Add object", added)

        edit_status, edit = request_json(
            port,
            "POST",
            "/api/code/edit-procedure",
            {
                "procedureSelector": "scene.myFirstMethod",
                "editSpec": "append-comment:outside-in marker",
            },
        )
        expect_equal(edit_status, 200, "edit-procedure HTTP status")
        expect_equal(
            edit["schema_version"],
            "eatme.alice-first-lesson-code-editor-action-proof-result/v1",
            "edit response schema",
        )
        expect_equal(edit["status"], "proved", "edit status")
        edit_artifact = read_json_artifact(Path(str(edit["evidenceArtifact"])))
        expect_equal(edit_artifact["marker"], "outside-in marker", "edit marker artifact")
        expect_path_exists(evidence_dir / "edited-project.a3p", "edited project artifact")
        print_json("Edit procedure", edit)

        save_status, save = request_json(
            port,
            "POST",
            "/api/project/save",
            {"saveSelector": "scene.myFirstMethod"},
        )
        expect_equal(save_status, 200, "project-save HTTP status")
        expect_equal(save["schema_version"], "eatme.alice-project-save-result/v1", "save response schema")
        expect_equal(save["status"], "saved", "save status")
        save_artifact = read_json_artifact(Path(str(save["evidenceArtifact"])))
        expect_equal(save_artifact["saved_file_exists"], True, "save evidence file flag")
        expect_path_exists(evidence_dir / "project-save" / "saved-project.a3p", "saved project artifact")
        print_json("Project save", save)

        world_status, world = request_json(port, "POST", "/api/world/run", {})
        expect_equal(world_status, 200, "world-run HTTP status")
        expect_equal(world["schema_version"], "eatme.alice-run-world-result/v1", "world response schema")
        expect_equal(world["status"], "completed", "world status")
        expect_equal(world["scene_object_count"], 3, "world scene object count")
        if not isinstance(world["execution_log"], list):
            raise SystemExit("world execution_log must be an array")
        read_json_artifact(Path(str(world["evidenceArtifact"])))
        print_json("World run", world)

        template_status, template_error = request_json(
            port,
            "POST",
            "/api/project/new",
            {"templateId": "does-not-exist"},
        )
        expect_equal(template_status, 400, "invalid-template HTTP status")
        expect_equal(template_error["error"], "Unknown template: does-not-exist", "template error message")
        if "blank" not in template_error["availableTemplates"]:
            raise SystemExit("invalid-template availableTemplates must include blank")
        print_json("Invalid template", template_error)

        screenshot_status, screenshot = request_json(port, "GET", "/api/screenshot")
        expect_equal(screenshot_status, 200, "screenshot HTTP status")
        expect_equal(screenshot["status"], "captured", "screenshot status")
        expect_path_exists(Path(str(screenshot["path"])), "screenshot artifact")
        print_json("Screenshot", screenshot)
        print(f"PASS server-api-complex evidenceDir={evidence_dir}", flush=True)
    finally:
        stop_server(server)


def ensure_checkout() -> Path:
    source_override = os.environ.get("ALICE_WEB_SOURCE")
    if source_override:
        repo = Path(source_override).expanduser().resolve()
        validate_repo(repo)
        return repo

    source_repo = Path(__file__).resolve().parent
    if (source_repo / "package.json").exists():
        return source_repo

    direct_url = read_direct_url()
    repo_url = direct_url.get("url") or DEFAULT_REPO_URL
    vcs_info = direct_url.get("vcs_info") or {}
    commit = vcs_info.get("commit_id")
    revision = commit or vcs_info.get("requested_revision") or "unknown"

    cache_dir = cache_root() / safe_cache_name(repo_url, revision)
    if not (cache_dir / "package.json").exists():
        clone_checkout(repo_url, revision, commit, cache_dir)

    validate_repo(cache_dir)
    return cache_dir


def read_direct_url() -> dict[str, object]:
    try:
        text = distribution(DIST_NAME).read_text("direct_url.json")
    except PackageNotFoundError:
        text = None
    if not text:
        return {"url": DEFAULT_REPO_URL, "vcs_info": {"requested_revision": "main"}}
    return json.loads(text)


def clone_checkout(repo_url: str, revision: str, commit: str | None, target: Path) -> None:
    ensure_tool("git")
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_name(f"{target.name}.tmp")
    if partial.exists():
        shutil.rmtree(partial)

    if commit:
        run(["git", "clone", "--no-checkout", repo_url, str(partial)], cwd=target.parent)
        run(["git", "checkout", commit], cwd=partial)
    else:
        run(["git", "clone", "--depth", "1", "--branch", revision, repo_url, str(partial)], cwd=target.parent)

    if target.exists():
        shutil.rmtree(target)
    partial.rename(target)


def validate_repo(repo: Path) -> None:
    missing = [name for name in ["package.json", "package-lock.json", "test/a3p-writer.test.ts"] if not (repo / name).exists()]
    if missing:
        raise SystemExit(f"{repo} is not an alice-web-prototype checkout; missing {', '.join(missing)}")


def build_server(repo: Path, env: dict[str, str]) -> None:
    command = ["npm", "run", "--silent", "build:server"]
    print(f"Command: NODE_OPTIONS={env['NODE_OPTIONS']} {' '.join(command)}", flush=True)
    run(command, cwd=repo, env=env)


def find_available_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def start_server(
    repo: Path,
    port: int,
    evidence_dir: Path,
    env: dict[str, str],
) -> subprocess.Popen[str]:
    evidence_dir.mkdir(parents=True, exist_ok=True)
    command = [
        "node",
        "dist-server/cli.js",
        "serve",
        "--port",
        str(port),
        "--evidence-dir",
        str(evidence_dir),
    ]
    print(f"Command: {' '.join(command)}", flush=True)
    return subprocess.Popen(
        command,
        cwd=repo,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def stop_server(process: subprocess.Popen[str]) -> None:
    if process.poll() is None:
        process.terminate()
        try:
            output, _ = process.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            output, _ = process.communicate(timeout=5)
    else:
        output = process.stdout.read() if process.stdout else ""

    if output.strip():
        print("Server output:", flush=True)
        print(output.strip(), flush=True)


def wait_for_health(port: int, process: subprocess.Popen[str]) -> dict[str, object]:
    deadline = time.time() + 10
    last_error: Exception | None = None
    while time.time() < deadline:
        if process.poll() is not None:
            output = process.stdout.read() if process.stdout else ""
            raise SystemExit(f"server exited before health check passed\n{output}")
        try:
            status, body = request_json(port, "GET", "/api/health")
            if status == 200:
                return body
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as err:
            last_error = err
        time.sleep(0.1)
    raise SystemExit(f"Timed out waiting for /api/health: {last_error}")


def request_json(
    port: int,
    method: str,
    path: str,
    payload: dict[str, object] | None = None,
) -> tuple[int, dict[str, object]]:
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = urllib.request.Request(
        f"http://127.0.0.1:{port}{path}",
        data=data,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            return response.status, parse_json_response(response.read())
    except urllib.error.HTTPError as err:
        return err.code, parse_json_response(err.read())


def parse_json_response(data: bytes) -> dict[str, object]:
    text = data.decode("utf-8")
    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise SystemExit(f"Expected JSON object response, got: {text}")
    return parsed


def read_json_artifact(path: Path) -> dict[str, object]:
    expect_path_exists(path, "JSON artifact")
    with path.open("r", encoding="utf-8") as handle:
        parsed = json.load(handle)
    if not isinstance(parsed, dict):
        raise SystemExit(f"Expected JSON object artifact at {path}")
    return parsed


def expect_keys(value: dict[str, object], keys: list[str]) -> None:
    actual = sorted(value.keys())
    expected = sorted(keys)
    if actual != expected:
        raise SystemExit(f"Expected keys {expected}, got {actual}")


def expect_equal(actual: object, expected: object, label: str) -> None:
    if actual != expected:
        raise SystemExit(f"{label}: expected {expected!r}, got {actual!r}")


def expect_path_exists(path: Path, label: str) -> None:
    if not path.exists():
        raise SystemExit(f"{label} does not exist: {path}")


def print_json(label: str, value: dict[str, object]) -> None:
    print(f"{label}: {json.dumps(value, sort_keys=True)}", flush=True)


def cache_root() -> Path:
    base = os.environ.get("XDG_CACHE_HOME")
    root = Path(base).expanduser() if base else Path.home() / ".cache"
    return root / "alice-web-prototype" / "uvx-checkouts"


def safe_cache_name(repo_url: str, revision: str) -> str:
    tail = repo_url.rstrip("/").split("/")[-1].removesuffix(".git")
    safe_revision = re.sub(r"[^A-Za-z0-9_.-]+", "-", revision)[:64]
    return f"{tail}-{safe_revision}"


def merge_node_options(current: str | None) -> str:
    if current and NODE_HEAP_OPTION in current.split():
        return current
    return f"{NODE_HEAP_OPTION} {current}".strip() if current else NODE_HEAP_OPTION


def with_node_options(env: dict[str, str]) -> dict[str, str]:
    env["NODE_OPTIONS"] = merge_node_options(env.get("NODE_OPTIONS"))
    return env


def ensure_tool(name: str) -> None:
    if shutil.which(name) is None:
        raise SystemExit(f"Required tool not found on PATH: {name}")


def run(command: list[str], cwd: Path, env: dict[str, str] | None = None) -> None:
    completed = subprocess.run(command, cwd=cwd, env=env)
    if completed.returncode != 0:
        raise SystemExit(completed.returncode)


if __name__ == "__main__":
    raise SystemExit(main())
