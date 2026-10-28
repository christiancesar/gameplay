# Makes the VM reachable by SSH with a key and keeps a desktop session alive, so the host can run the app
# and read its logs. Dev VM only: the account (dev/dev) matches docker-compose.yml.
$ErrorActionPreference = 'Stop'
$oem = $PSScriptRoot

function Install-OpenSshServer {
  try {
    Add-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0' | Out-Null
  } catch {
    Write-Output "Windows capability failed ($_), falling back to the Win32-OpenSSH release"
    $zip = Join-Path $env:TEMP 'OpenSSH-Win64.zip'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest 'https://github.com/PowerShell/Win32-OpenSSH/releases/latest/download/OpenSSH-Win64.zip' -OutFile $zip
    Expand-Archive $zip -DestinationPath $env:ProgramFiles -Force
    & "$env:ProgramFiles\OpenSSH-Win64\install-sshd.ps1"
  }
}

Install-OpenSshServer

# The first start creates C:\ProgramData\ssh and its default sshd_config.
Set-Service sshd -StartupType Automatic
Start-Service sshd
Stop-Service sshd

# Key only. Members of Administrators read their keys from this file, which must belong to them alone.
$keys = 'C:\ProgramData\ssh\administrators_authorized_keys'
Copy-Item "$oem\authorized_keys" $keys -Force
icacls $keys /inheritance:r /grant 'Administrators:F' /grant 'SYSTEM:F' | Out-Null
$config = 'C:\ProgramData\ssh\sshd_config'
(Get-Content $config) -replace '^#?PasswordAuthentication .*', 'PasswordAuthentication no' | Set-Content $config

# Commands from the host land in PowerShell.
New-Item -Path 'HKLM:\SOFTWARE\OpenSSH' -Force | Out-Null
New-ItemProperty -Path 'HKLM:\SOFTWARE\OpenSSH' -Name DefaultShell -Value 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -PropertyType String -Force | Out-Null

New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 -ErrorAction SilentlyContinue | Out-Null
Start-Service sshd

# A desktop session must exist after a reboot (the app and the screen capture need one), and it must not lock.
$winlogon = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
Set-ItemProperty $winlogon AutoAdminLogon '1'
Set-ItemProperty $winlogon DefaultUserName 'dev'
Set-ItemProperty $winlogon DefaultPassword 'dev'
powercfg /change monitor-timeout-ac 0
powercfg /change standby-timeout-ac 0

Write-Output 'Provisioned'
