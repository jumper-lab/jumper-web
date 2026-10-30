#!/usr/bin/env bash
set -euo pipefail
# Execute on vps-ops only, after review. No credentials or WhatsApp sessions copied.
test "$(id -un)" = ops
source_dir="$(cd "$(dirname "$0")" && pwd)"
target=/home/ops/workspace/beto-agents/agents/00Tasks-notion-calendar/scripts
test -x /home/ops/workspace/beto-agents/shared/send-approved-whatsapp-alert.sh
install -m 644 "$source_dir/publish-watch.py" "$target/publish-watch.py"
sudo install -m 644 "$source_dir/00tasks-publish-watch.service" "$source_dir/00tasks-publish-watch.timer" /etc/systemd/system/
sudo systemd-analyze verify /etc/systemd/system/00tasks-publish-watch.service /etc/systemd/system/00tasks-publish-watch.timer
sudo systemctl daemon-reload
sudo systemctl enable --now 00tasks-publish-watch.timer
sudo systemctl start 00tasks-publish-watch.service
systemctl show 00tasks-publish-watch.service -p Result -p ExecMainStatus
