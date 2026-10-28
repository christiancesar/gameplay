# Starts a program in the desktop session of the user "dev". SSH commands run in session 0, which has no
# desktop, so an app started from there cannot open windows or capture the screen.
# Usage: run-interactive.ps1 -Program 'C:\gameplay-win32-x64\gameplay.exe' [-Arguments '...']
param([Parameter(Mandatory)][string]$Program, [string]$Arguments = '')
$ErrorActionPreference = 'Stop'
$name = 'gameplay-interactive'
$action = if ($Arguments) { New-ScheduledTaskAction -Execute $Program -Argument $Arguments } else { New-ScheduledTaskAction -Execute $Program }
$principal = New-ScheduledTaskPrincipal -UserId 'dev' -LogonType Interactive -RunLevel Highest
Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $name -Action $action -Principal $principal | Out-Null
Start-ScheduledTask -TaskName $name
