#!/bin/sh
# pre-commit: block alert/confirm/prompt + console.log in web code
if grep -nE '(^|[^.a-zA-Z])(alert|confirm|prompt)\(' "$@" 2>/dev/null; then
  echo "X  Found alert()/confirm()/prompt() — use ConfirmDialog / toast (memory/feedback_no_browser_alert)"
  exit 1
fi
if grep -nE 'console\.log' "$@" 2>/dev/null; then
  echo "X  Found console.log — remove debug logs (use console.warn/error if needed)"
  exit 1
fi
exit 0
