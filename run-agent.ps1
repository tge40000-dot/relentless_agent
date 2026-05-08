# Relentless Agent Launcher
# This script launches the agent and optional control panel

# Self-invocation fix: if called from cmd, re-run with PowerShell
if ($PSCommandPath -eq $null) {
    powershell -ExecutionPolicy Bypass -File "$PSCommandPath" $args
    exit
}
