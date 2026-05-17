#!/usr/bin/env bash
# Mentivue deploy script — placeholder.
# Targets: app | workers
# Usage: bash infra/deploy.sh app
#
# Will SSH to Hetzner host, git pull, install deps, and reload the process.
# Filled in once production host is provisioned.

set -e

TARGET="${1:-}"
case "$TARGET" in
  app|workers)
    echo "Deploy target: $TARGET (not yet implemented)"
    ;;
  *)
    echo "Usage: $0 {app|workers}" >&2
    exit 1
    ;;
esac
