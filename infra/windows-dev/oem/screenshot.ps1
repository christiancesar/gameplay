# Saves the screen of the desktop session to a PNG. Run it with run-interactive.ps1, not directly over SSH.
param([string]$Path = 'C:\OEM\screenshot.png')
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
$bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
[System.Drawing.Graphics]::FromImage($bitmap).CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
