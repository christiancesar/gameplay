# gameplay-audio-capture

Helper of the Windows app: the sound of the computer without the Gameplay itself (or only one process), as PCM on stdout. See `plans/[pending]-desktop-electron/tickets/DESK-09-audio-do-sistema-windows.md`.

```
gameplay-audio-capture exclude <pid>   everything except that process and its children
gameplay-audio-capture include <pid>   only that process and its children
gameplay-audio-capture window <hwnd>   only the process that owns that window, and its children
```

- Output: PCM s16le, 48000 Hz, 2 channels, until stdin is closed.
- Messages on stderr. Exit code 0 on a clean stop, 1 when the capture could not start, 2 on a bad call.
- WASAPI process loopback in polling mode (the event mode is refused on Windows 10 build 19044).

## Build

`./build.sh` (needs `mingw-w64`: `sudo apt install mingw-w64`). The result is `build/gameplay-audio-capture.exe`, ignored by git, and the Forge config copies it into the Windows package.
