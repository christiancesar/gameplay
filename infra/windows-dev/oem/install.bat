@echo off
rem Runs once, at the end of the first Windows install (dockur copies this folder to C:\OEM).
rem The work is in provision.ps1; its output goes to C:\OEM\provision.log.
powershell -NoProfile -ExecutionPolicy Bypass -File C:\OEM\provision.ps1 > C:\OEM\provision.log 2>&1
