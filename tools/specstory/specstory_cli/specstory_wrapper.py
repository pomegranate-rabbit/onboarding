#!/usr/bin/env python3

import os
import sys
import subprocess
import time
import glob
from pathlib import Path
import shutil
import signal
import json
from typing import List, Optional

# Dynamically find specstory-real, handling homebrew upgrades
def is_wrapper_script(path):
    """Check if a given path is the wrapper script (bash or Python)."""
    if not path or not os.path.exists(path):
        return False
    
    path_abs = os.path.abspath(path)
    wrapper_bash = os.path.abspath(os.path.expanduser("~/bin/specstory"))
    wrapper_py = os.path.abspath(os.path.expanduser("~/.specstory_wrapper/specstory_wrapper.py"))
    
    if path_abs == wrapper_bash or path_abs == wrapper_py:
        return True
    
    # Check file content
    with open(path, 'r') as f:
        content = f.read(500)
        if 'specstory_wrapper.py' in content:
            return True
    
    return False

def find_real_specstory():
    """Find the real specstory binary, handling homebrew version changes."""
    # Get the wrapper's own path to exclude it from PATH searches
    wrapper_path = os.path.expanduser("~/bin/specstory")
    wrapper_dir = os.path.dirname(os.path.abspath(wrapper_path))
    
    # Respect environment override first (set by the installer wrapper when renaming isn't possible)
    env_path = os.environ.get("SPECSTORY_ORIGINAL") or os.environ.get("SPECSTORY_REAL") or os.environ.get("ORIGINAL_SPECSTORY")
    if env_path:
        # Expand user home directory if present
        env_path = os.path.expanduser(env_path)
        
        # If it's an absolute path and exists, validate it's not the wrapper
        if os.path.isabs(env_path):
            if os.path.exists(env_path):
                if not is_wrapper_script(env_path):
                    return os.path.abspath(env_path)
            # If absolute path doesn't exist, continue to fallback methods
        else:
            # Relative path: try to resolve it in PATH (excluding wrapper directory)
            path_env = os.environ.get("PATH", "")
            # Remove wrapper directory from PATH temporarily
            path_parts = path_env.split(os.pathsep)
            filtered_path = os.pathsep.join([p for p in path_parts if p != wrapper_dir and p != os.path.expanduser("~/bin")])
            old_path = os.environ.get("PATH")
            try:
                os.environ["PATH"] = filtered_path
                resolved = shutil.which(env_path)
                if resolved:
                    resolved_abs = os.path.abspath(resolved)
                    if not is_wrapper_script(resolved_abs):
                        return resolved_abs
            finally:
                if old_path:
                    os.environ["PATH"] = old_path
                else:
                    os.environ.pop("PATH", None)

    try:
        prefix = subprocess.check_output(
            ["brew", "--prefix"],
            text=True,
            stderr=subprocess.DEVNULL
        ).strip()
        real_path = os.path.join(prefix, "bin", "specstory-real")
        # If specstory-real exists and is valid, use it
        if os.path.exists(real_path):
            # Check if it's a broken symlink
            if os.path.islink(real_path):
                try:
                    os.stat(real_path)  # Will raise if symlink is broken
                    return real_path
                except OSError:
                    # Broken symlink, fix it
                    pass
            else:
                return real_path

        # specstory-real doesn't exist or is broken, find the current version
        specstory_path = subprocess.check_output(
            ["brew", "--prefix", "specstory"],
            text=True,
            stderr=subprocess.DEVNULL
        ).strip()

        real_bin = os.path.join(specstory_path, "bin", "specstory")

        # Create/update the specstory-real symlink
        if os.path.exists(real_path) or os.path.islink(real_path):
            os.remove(real_path)
        os.symlink(real_bin, real_path)

        return real_path
    except Exception:
        # Fallback: try to find specstory in PATH (may be the system binary)
        resolved = shutil.which("specstory")
        if resolved:
            return resolved
        # Final fallback name used by older installers
        return "specstory-real"

REAL = find_real_specstory()
HIST_DIR = ".specstory/history"
TS_DIR = ".specstory/timestamps"

POLL_INTERVAL = 0.1

def read_lines_text(path: str) -> List[str]:
    """Read a text file into normalized lines (LF) with UTF-8 decoding and ignore errors."""
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    return text.split('\n')

def find_conversation_header_indices(lines: List[str]) -> List[int]:
    """Find indices of User/Agent header blocks."""
    indices: List[int] = []
    for i, line in enumerate(lines):
        if line.startswith('_**') and line.endswith('**_') and ('User' in line or 'Agent' in line):
            indices.append(i)
    return indices

def first_meaningful_line_after(lines: List[str], start_idx: int) -> str:
    """Return first non-empty, non-separator line following a header. Fallback to header line."""
    for j in range(start_idx + 1, len(lines)):
        content = lines[j].strip()
        if not content or content == '---':
            continue
        return content
    return lines[start_idx].strip() if start_idx < len(lines) else ''


def get_timestamp_file_for_md(md_path: str) -> str:
    """Given an absolute markdown path, return the absolute timestamps file path alongside it."""
    md_abs = os.path.abspath(md_path)
    history_dir = os.path.dirname(md_abs)  # .../.specstory/history
    specstory_dir = os.path.dirname(history_dir)  # .../.specstory
    ts_dir_for_file = os.path.join(specstory_dir, "timestamps")
    os.makedirs(ts_dir_for_file, exist_ok=True)
    base = Path(md_abs).stem
    return os.path.join(ts_dir_for_file, f"{base}.timestamps")

def get_most_recent_md_file():
    """Get the most recently created .md file in the current project's history directory."""
    md_files = glob.glob(f"{HIST_DIR}/*.md")
    if not md_files:
        return None
    latest_rel = max(md_files, key=os.path.getmtime)
    return os.path.abspath(latest_rel)

def start_watcher(before_file, before_mtime):
    """Start the background watcher that logs timestamp|first-line for new User/Agent entries."""
    # Pre-create pidfile so the parent can reliably wait for it to populate
    Path(f"/tmp/specstory_watcher_{os.getpid()}" ).touch()

    pid = os.fork()
    if pid != 0:
        # Parent process
        return

    # Child process - detach from parent
    os.setsid()

    # Determine which history file to watch by detecting any md whose mtime increases
    # since startup, or any new md that appears. This supports both new sessions and resumes.
    def list_md_files():
        files = glob.glob(f"{HIST_DIR}/*.md")
        return [os.path.abspath(p) for p in files]

    # Snapshot initial mtimes
    initial_mtimes = {}
    for p in list_md_files():
        initial_mtimes[p] = os.path.getmtime(p)

    new_file = None
    start_wait = time.time()
    while new_file is None:
        candidates = []
        for p in list_md_files():
            mt = os.path.getmtime(p)
            if p not in initial_mtimes:
                candidates.append((p, mt))
            elif mt > (initial_mtimes.get(p, 0.0) + 1e-6):
                candidates.append((p, mt))
        if candidates:
            # Choose the most recently modified candidate
            candidates.sort(key=lambda t: t[1], reverse=True)
            new_file = candidates[0][0]
            break

        time.sleep(POLL_INTERVAL)

    # Create timestamp file for the new md file (next to the md's .specstory)
    new_file = os.path.abspath(new_file)
    logfile = get_timestamp_file_for_md(new_file)
    Path(logfile).touch()

    # Write PID metadata so parent can stop this watcher
    pidfile = f"/tmp/specstory_watcher_{os.getppid()}"
    with open(pidfile, 'w') as f:
        f.write(json.dumps({"pid": os.getpid(), "target": new_file}))

    # Inline watcher loop: ensure timestamps exist for new history files and
    # append new entries for all markdown files in this history directory
    while True:
        # Detect and initialize new markdown files by creating their timestamps files
        md_files = list_md_files()
        for md_path in md_files:
            ts_path = get_timestamp_file_for_md(md_path)
            if not os.path.exists(ts_path):
                Path(ts_path).touch()

        # For each md, compute headers with meaningful content and append new timestamps
        ts_now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        for md_path in md_files:
            ts_path = get_timestamp_file_for_md(md_path)

            # Read existing entries
            existing = []
            if os.path.exists(ts_path):
                with open(ts_path, 'r') as f:
                    existing = [ln.strip() for ln in f if ln.strip()]

            # Compute snippets for headers-with-content
            lines = read_lines_text(md_path)
            hdrs = find_conversation_header_indices(lines)
            snippets = []
            for idx in hdrs:
                header_txt = lines[idx].strip() if idx < len(lines) else ''
                snippet = first_meaningful_line_after(lines, idx)
                if snippet and snippet != header_txt and snippet != '---':
                    snippets.append(snippet)

            # Append only newly appeared entries
            if len(existing) < len(snippets):
                with open(ts_path, 'a') as out:
                    for i in range(len(existing), len(snippets)):
                        out.write(f"{ts_now}|{snippets[i]}\n")

        time.sleep(POLL_INTERVAL)


def merge_timestamps(target_md=None):
    """Insert timestamps into the markdown headers from the corresponding timestamps file.
    If target_md is provided, that file is used; otherwise the latest md in history is used.
    """
    if target_md:
        latest_md = os.path.abspath(target_md)
    else:
        latest_md = get_most_recent_md_file()
    if not latest_md:
        return

    latest_md = os.path.abspath(latest_md)
    timestamp_file = get_timestamp_file_for_md(latest_md)

    # Ensure timestamp file exists; do not early-return on empty as we may need to backfill
    os.makedirs(os.path.dirname(timestamp_file), exist_ok=True)
    if not os.path.exists(timestamp_file):
        Path(timestamp_file).touch()

    # Consider interactive only if there is at least one User block with content
    has_user_content = False
    in_user_block = False
    with open(latest_md, 'r') as md_in:
        for raw_line in md_in:
            line = raw_line.rstrip('\n')
            if line.startswith('_**') and line.endswith('**_'):
                in_user_block = line.startswith('_**User')
                continue
            if in_user_block:
                if line.strip() and line.strip() != '---':
                    has_user_content = True
                    break

    # If no user content, don't merge timestamps; clear any noise
    if not has_user_content:
        # Clear any noise written by the watcher during startup/shutdown
        with open(timestamp_file, 'w'):
            pass
        return

    # Backfill any missing timestamps for headers that have content but weren't logged (e.g., watcher stopped early)
    md_lines = read_lines_text(latest_md)
    header_idxs = find_conversation_header_indices(md_lines)
    # Only count headers which have meaningful content following
    headers_with_content = []
    for h in header_idxs:
        header_txt = md_lines[h].strip() if h < len(md_lines) else ''
        snippet = first_meaningful_line_after(md_lines, h)
        if snippet and snippet != header_txt and snippet != '---':
            headers_with_content.append((h, snippet))

    with open(timestamp_file, 'r') as f:
        existing = [ln.strip() for ln in f if ln.strip()]

    if len(existing) < len(headers_with_content):
        # Append missing timestamps with the corresponding snippets
        now_ts = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        with open(timestamp_file, 'a') as f:
            for i in range(len(existing), len(headers_with_content)):
                _, snippet = headers_with_content[i]
                f.write(f"{now_ts}|{snippet}\n")

    # Read timestamps
    with open(timestamp_file, 'r') as f:
        raw = [line.strip() for line in f if line.strip()]
    timestamps = []
    last = None
    for ts in raw:
        if ts != last:
            timestamps.append(ts)
            last = ts

    # Process the markdown file
    temp_file = f"{latest_md}.tmp"
    timestamp_index = 0

    with open(latest_md, 'r') as md_in, open(temp_file, 'w') as md_out:
        for line in md_in:
            line = line.rstrip('\n')
            # Check if this line is a User or Agent header
            if line.startswith('_**') and ('User' in line or 'Agent' in line) and line.endswith('**_'):
                # Extract the role (User or Agent...)
                role = line[3:-3]  # Remove _** and **_

                # Get the next timestamp if available
                if timestamp_index < len(timestamps) and timestamps[timestamp_index]:
                    ts_line = timestamps[timestamp_index]
                    ts_display = ts_line.split('|', 1)[0].strip()
                    md_out.write(f"_**{role} ({ts_display})**_\n")
                    timestamp_index += 1
                else:
                    md_out.write(line + '\n')
            else:
                md_out.write(line + '\n')

    # Replace original with updated file
    shutil.move(temp_file, latest_md)

def merge_all_timestamps():
    """Merge timestamps into all markdown files in the history directory."""
    md_files = glob.glob(f"{HIST_DIR}/*.md")
    for md_path in md_files:
        merge_timestamps(md_path)


def stop_watcher():
    """Stop the background watcher started by this process and remove its pidfile."""
    pidfile = f"/tmp/specstory_watcher_{os.getpid()}"
    # Wait briefly for the pidfile to be populated if watcher is still starting

    deadline = time.time() + 2.0
    pid_text = None
    while time.time() < deadline:
        if os.path.exists(pidfile):
            with open(pidfile, 'r') as f:
                pid_text = f.read().strip()
            if pid_text:
                break
        time.sleep(0.1)

    if not pid_text:
        # Nothing to stop; clean up any empty pidfile
        if os.path.exists(pidfile):
            os.remove(pidfile)
        return

    # Try JSON metadata first
    target = None
    try:
        meta = json.loads(pid_text)
        pid = int(meta.get("pid"))
        target = meta.get("target")
    except Exception:
        pid = int(pid_text)

    # Attempt graceful stop
    try:
        os.killpg(pid, signal.SIGTERM)
    except Exception:
        os.kill(pid, signal.SIGTERM)

    # If still alive, escalate
    time.sleep(0.2)
    os.kill(pid, 0)
    try:
        os.killpg(pid, signal.SIGKILL)
    except Exception:
        os.kill(pid, signal.SIGKILL)

    if os.path.exists(pidfile):
        os.remove(pidfile)


def print_specstory_banner():
    """Print a banner indicating specstory recording is active."""
    # ANSI color codes
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    RESET = "\033[0m"
    BOLD = "\033[1m"
    
    print(f"{CYAN}╭{'─' * 50}╮{RESET}")
    print(f"{CYAN}│{RESET} {GREEN}{BOLD}📝 SpecStory Recording Active{RESET}{'':>20}{CYAN}│{RESET}")
    print(f"{CYAN}│{RESET}    Session will be logged to .specstory/{'':>9}{CYAN}│{RESET}")
    print(f"{CYAN}╰{'─' * 50}╯{RESET}")
    print()


def main():
    """Entry point: start watcher, run real tool, then merge timestamps."""
    os.makedirs(TS_DIR, exist_ok=True)

    # Show indicator that specstory is active (only for 'run' commands)
    if len(sys.argv) > 1 and sys.argv[1] == 'run':
        print_specstory_banner()

    # Do not kill other watchers at startup to avoid stopping active sessions

    # Get timestamp of most recent existing file (if any)
    before_file = get_most_recent_md_file()
    before_mtime = None
    if before_file:
        before_mtime = os.path.getmtime(before_file)
    # Start watcher in background
    start_watcher(before_file, before_mtime)

    # Run SpecStory in foreground
    result = subprocess.run([REAL] + sys.argv[1:])
    status = result.returncode

    # Give watcher time to finish writing
    time.sleep(POLL_INTERVAL * 5)

    # Capture target md before stopping watcher
    pidfile = f"/tmp/specstory_watcher_{os.getpid()}"
    target_md = None
    if os.path.exists(pidfile):
        with open(pidfile, 'r') as f:
            content = f.read().strip()
        if content:
            meta = json.loads(content)
            target_md = meta.get("target")

    # Stop the watcher before modifying the markdown so it doesn't record the merge
    stop_watcher()
    time.sleep(POLL_INTERVAL * 2)

    # Merge timestamps into all markdown files (multiple files can change per session)
    merge_all_timestamps()

    sys.exit(status)

if __name__ == "__main__":
    main()
