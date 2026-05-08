<#
.SYNOPSIS
    Creates a "portable-style" package of an installed Windows app:
    - Copies install folder to a target (e.g., USB)
    - Exports basic registry config for the app
    - Generates a launcher script to restore config and run the app

.NOTES
    This will NOT work for:
    - Drivers, services, kernel hooks
    - Heavy suites (Office, Adobe CC, AV, etc.)
    - Apps with hardware-locked licensing

    Best for:
    - Utilities, tools, editors, viewers, simple apps
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$AppName,              # DisplayName fragment, e.g. "VLC", "Notepad++"

    [Parameter(Mandatory = $true)]
    [string]$DestinationRoot,      # e.g. "E:\PortableApps"

    [switch]$Force                 # Overwrite existing portable folder if present
)

function Write-Info($msg)  { Write-Host "[*] $msg" -ForegroundColor Cyan }
function Write-Warn($msg)  { Write-Host "[!] $msg" -ForegroundColor Yellow }
function Write-Err($msg)   { Write-Host "[X] $msg" -ForegroundColor Red }

function Get-UninstallEntries {
    param([string]$NameFragment)

    $paths = @(
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall",
        "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall"
    )

    $entries = foreach ($p in $paths) {
        if (Test-Path $p) {
            Get-ItemProperty -Path "$p\*" -ErrorAction SilentlyContinue |
                Where-Object {
                    $_.DisplayName -and
                    $_.DisplayName -like "*$NameFragment*"
                }
        }
    }

    return $entries
}

function Select-App {
    param($Entries)

    if (-not $Entries -or $Entries.Count -eq 0) {
        Write-Err "No installed app found matching '$AppName'."
        return $null
    }

    if ($Entries.Count -eq 1) {
        return $Entries[0]
    }

    Write-Info "Multiple matches found:"
    $i = 1
    foreach ($e in $Entries) {
        Write-Host " [$i] $($e.DisplayName)  ($($e.PSPath))"
        $i++
    }

    do {
        $choice = Read-Host "Select app number"
    } while (-not ($choice -as [int]) -or $choice -lt 1 -or $choice -gt $Entries.Count)

    return $Entries[$choice - 1]
}

function Resolve-InstallPath {
    param($Entry)

    $candidates = @()

    if ($Entry.InstallLocation -and (Test-Path $Entry.InstallLocation)) {
        $candidates += $Entry.InstallLocation
    }

    if ($Entry.DisplayIcon) {
        $iconPath = $Entry.DisplayIcon.Split(",")[0].Trim('"')
        if (Test-Path $iconPath) {
            $candidates += (Split-Path $iconPath -Parent)
        }
    }

    if ($Entry.UninstallString) {
        $uninst = $Entry.UninstallString.Split(" ")[0].Trim('"')
        if (Test-Path $uninst) {
            $candidates += (Split-Path $uninst -Parent)
        }
    }

    $candidates = $candidates | Select-Object -Unique

    if ($candidates.Count -eq 0) {
        Write-Err "Could not resolve install path for '$($Entry.DisplayName)'."
        return $null
    }

    if ($candidates.Count -eq 1) {
        return $candidates[0]
    }

    Write-Info "Multiple possible install folders:"
    $i = 1
    foreach ($c in $candidates) {
        Write-Host " [$i] $c"
        $i++
    }

    do {
        $choice = Read-Host "Select folder number"
    } while (-not ($choice -as [int]) -or $choice -lt 1 -or $choice -gt $candidates.Count)

    return $candidates[$choice - 1]
}

function Copy-AppFiles {
    param(
        [string]$SourcePath,
        [string]$TargetPath
    )

    if (Test-Path $TargetPath) {
        if (-not $Force) {
            Write-Warn "Target '$TargetPath' already exists. Use -Force to overwrite."
            return $false
        }
        Write-Warn "Removing existing '$TargetPath'..."
        Remove-Item -Path $TargetPath -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Info "Copying files..."
    robocopy $SourcePath $TargetPath /E /COPYALL /R:1 /W:1 | Out-Null

    if (-not (Test-Path $TargetPath)) {
        Write-Err "Copy failed."
        return $false
    }

    return $true
}

function Export-AppRegistry {
    param(
        $Entry,
        [string]$PortableFolder
    )

    $regOut = Join-Path $PortableFolder "app-registry.reg"
    $regKeys = @()

    # Uninstall key
    $uninstallKey = $Entry.PSPath -replace "Microsoft.PowerShell.Core\\Registry::", ""
    if ($uninstallKey) {
        $regKeys += $uninstallKey
    }

    # Try some HKCU software keys by name fragment
    $hkcuSoft = "HKCU:\Software"
    if (Test-Path $hkcuSoft) {
        $matches = Get-ChildItem $hkcuSoft -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -like "*$($Entry.DisplayName)*" -or $_.PSChildName -like "*$($Entry.DisplayName)*" }

        foreach ($m in $matches) {
            $regKeys += ($m.Name -replace "HKEY_CURRENT_USER", "HKCU")
        }
    }

    $regKeys = $regKeys | Select-Object -Unique

    if ($regKeys.Count -eq 0) {
        Write-Warn "No obvious registry keys found to export. Skipping registry export."
        return $null
    }

    Write-Info "Exporting registry keys..."
    $tmpList = Join-Path $env:TEMP "portable_reg_keys_$($Entry.DisplayName).txt"
    $regKeys | Out-File -FilePath $tmpList -Encoding ASCII

    $regContent = @()
    $regContent += "Windows Registry Editor Version 5.00"
    $regContent += ""

    foreach ($k in $regKeys) {
        Write-Info "  Exporting $k"
        $tmpReg = Join-Path $env:TEMP "portable_single_$($Entry.DisplayName).reg"
        & reg.exe export "$k" "$tmpReg" /y | Out-Null 2>&1

        if (Test-Path $tmpReg) {
            $lines = Get-Content $tmpReg
            # Skip header line for merged file
            $regContent += ($lines | Where-Object { $_ -ne "Windows Registry Editor Version 5.00" })
            Remove-Item $tmpReg -Force -ErrorAction SilentlyContinue
        }
    }

    $regContent | Set-Content -Path $regOut -Encoding Unicode
    Remove-Item $tmpList -Force -ErrorAction SilentlyContinue

    Write-Info "Registry exported to: $regOut"
    return $regOut
}

function New-PortableLauncher {
    param(
        [string]$PortableFolder,
        [string]$MainExeRelative,
        [string]$RegFilePath
    )

    $launcher = Join-Path $PortableFolder "Run-Portable.cmd"

    $cmd = @()
    $cmd += "@echo off"
    $cmd += "setlocal"
    $cmd += "cd /d %~dp0"
    $cmd += ""
    if ($RegFilePath) {
        $regFileName = Split-Path $RegFilePath -Leaf
        $cmd += "echo Importing registry settings..."
        $cmd += "reg import ""%~dp0%regFileName%"" >nul 2>&1"
        $cmd += ""
    }
    $cmd += "echo Launching app..."
    $cmd += "start """" ""%~dp0$MainExeRelative"""
    $cmd += "endlocal"
    $cmd | Set-Content -Path $launcher -Encoding ASCII

    Write-Info "Launcher created: $launcher"
}

# ---------------- MAIN ----------------

Write-Info "Searching for app matching '$AppName'..."
$entries = Get-UninstallEntries -NameFragment $AppName
$app = Select-App -Entries $entries
if (-not $app) { exit 1 }

Write-Info "Selected: $($app.DisplayName)"

$installPath = Resolve-InstallPath -Entry $app
if (-not $installPath) { exit 1 }

Write-Info "Install folder: $installPath"

# Portable folder name
$sanitizedName = ($app.DisplayName -replace '[^\w\s-]', '').Trim() -replace '\s+', '_'
$portableFolder = Join-Path $DestinationRoot $sanitizedName

Write-Info "Portable target: $portableFolder"

if (-not (Test-Path $DestinationRoot)) {
    Write-Info "Creating destination root: $DestinationRoot"
    New-Item -Path $DestinationRoot -ItemType Directory -Force | Out-Null
}

if (-not (Copy-AppFiles -SourcePath $installPath -TargetPath $portableFolder)) {
    exit 1
}

# Try to guess main EXE
$exes = Get-ChildItem -Path $portableFolder -Filter *.exe -Recurse -ErrorAction SilentlyContinue |
    Sort-Object Length |
    Select-Object -First 10

if (-not $exes -or $exes.Count -eq 0) {
    Write-Warn "No EXE files found in portable folder. You will need to run manually."
    $mainExeRel = $null
} else {
    Write-Info "Possible main executables:"
    $i = 1
    foreach ($e in $exes) {
        $rel = $e.FullName.Substring($portableFolder.Length).TrimStart('\')
        Write-Host " [$i] $rel"
        $i++
    }

    do {
        $choice = Read-Host "Select main EXE number (or press Enter to skip launcher)"
        if ([string]::IsNullOrWhiteSpace($choice)) {
            $mainExeRel = $null
            break
        }
    } while (-not ($choice -as [int]) -or $choice -lt 1 -or $choice -gt $exes.Count)

    if ($choice) {
        $mainExeRel = $exes[$choice - 1].FullName.Substring($portableFolder.Length).TrimStart('\')
    }
}

$regFile = Export-AppRegistry -Entry $app -PortableFolder $portableFolder

if ($mainExeRel) {
    New-PortableLauncher -PortableFolder $portableFolder -MainExeRelative $mainExeRel -RegFilePath $regFile
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " Portable package created:" -ForegroundColor Green
Write-Host " $portableFolder" -ForegroundColor Green
Write-Host ""
Write-Host " Copy this folder to USB and run:" -ForegroundColor Green
Write-Host "   Run-Portable.cmd" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
