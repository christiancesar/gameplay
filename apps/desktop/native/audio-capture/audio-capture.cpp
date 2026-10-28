// gameplay-audio-capture: the sound of the computer, minus (or only) one process tree, as raw PCM on stdout.
//
//   gameplay-audio-capture exclude <pid>    everything except that process and its children
//   gameplay-audio-capture include <pid>    only that process and its children
//
// Output: PCM s16le, 48000 Hz, 2 channels, until stdin is closed (the app that started it is gone or stopped it).
// Messages go to stderr, one per line. Exit code 0 on a clean stop, 1 when the capture could not start.
//
// Uses the WASAPI process loopback (ActivateAudioInterfaceAsync with VAD\Process_Loopback), in polling mode: the
// event driven mode is refused on Windows 10 build 19044.
#include <windows.h>
#include <initguid.h>
#include <mmdeviceapi.h>
#include <audioclient.h>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cstdint>

// audioclientactivationparams.h is not in mingw-w64.
typedef enum {
  PROCESS_LOOPBACK_MODE_INCLUDE_TARGET_PROCESS_TREE = 0,
  PROCESS_LOOPBACK_MODE_EXCLUDE_TARGET_PROCESS_TREE = 1
} PROCESS_LOOPBACK_MODE;
typedef struct {
  DWORD TargetProcessId;
  PROCESS_LOOPBACK_MODE ProcessLoopbackMode;
} AUDIOCLIENT_PROCESS_LOOPBACK_PARAMS;
typedef enum { AUDIOCLIENT_ACTIVATION_TYPE_DEFAULT = 0, AUDIOCLIENT_ACTIVATION_TYPE_PROCESS_LOOPBACK = 1 } AUDIOCLIENT_ACTIVATION_TYPE;
typedef struct {
  AUDIOCLIENT_ACTIVATION_TYPE ActivationType;
  AUDIOCLIENT_PROCESS_LOOPBACK_PARAMS ProcessLoopbackParams;
} AUDIOCLIENT_ACTIVATION_PARAMS;
#define VAD_PROCESS_LOOPBACK L"VAD\\Process_Loopback"

DEFINE_GUID(IID_IAgileObjectLocal, 0x94ea2b94, 0xe9cc, 0x49e0, 0xc0, 0xff, 0xee, 0x64, 0xca, 0x8f, 0x5b, 0x90);

extern "C" HRESULT WINAPI ActivateAudioInterfaceAsync(LPCWSTR, REFIID, PROPVARIANT*,
                                                      IActivateAudioInterfaceCompletionHandler*,
                                                      IActivateAudioInterfaceAsyncOperation**);

static const int SAMPLE_RATE = 48000;
static const int CHANNELS = 2;
static volatile LONG g_stop = 0;

// The completion handler must be agile: answering IAgileObject (a marker with only the IUnknown methods) is enough.
class Handler : public IActivateAudioInterfaceCompletionHandler {
 public:
  HANDLE done = CreateEventW(nullptr, TRUE, FALSE, nullptr);
  IActivateAudioInterfaceAsyncOperation* op = nullptr;
  ULONG STDMETHODCALLTYPE AddRef() override { return 1; }
  ULONG STDMETHODCALLTYPE Release() override { return 1; }
  HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void** out) override {
    if (riid == IID_IUnknown || riid == IID_IActivateAudioInterfaceCompletionHandler || riid == IID_IAgileObjectLocal) {
      *out = this;
      return S_OK;
    }
    *out = nullptr;
    return E_NOINTERFACE;
  }
  HRESULT STDMETHODCALLTYPE ActivateCompleted(IActivateAudioInterfaceAsyncOperation* operation) override {
    op = operation;
    SetEvent(done);
    return S_OK;
  }
};

// The app that started this process holds the other end of stdin: when it closes, or dies, so does this capture.
static DWORD WINAPI watchStdin(LPVOID) {
  HANDLE in = GetStdHandle(STD_INPUT_HANDLE);
  char buffer[64];
  DWORD read = 0;
  while (ReadFile(in, buffer, sizeof(buffer), &read, nullptr) && read > 0) {
  }
  InterlockedExchange(&g_stop, 1);
  return 0;
}

static IAudioClient* activate(DWORD pid, bool include) {
  AUDIOCLIENT_ACTIVATION_PARAMS params = {};
  params.ActivationType = AUDIOCLIENT_ACTIVATION_TYPE_PROCESS_LOOPBACK;
  params.ProcessLoopbackParams.TargetProcessId = pid;
  params.ProcessLoopbackParams.ProcessLoopbackMode =
      include ? PROCESS_LOOPBACK_MODE_INCLUDE_TARGET_PROCESS_TREE : PROCESS_LOOPBACK_MODE_EXCLUDE_TARGET_PROCESS_TREE;
  PROPVARIANT variant = {};
  variant.vt = VT_BLOB;
  variant.blob.cbSize = sizeof(params);
  variant.blob.pBlobData = reinterpret_cast<BYTE*>(&params);

  Handler* handler = new Handler();
  IActivateAudioInterfaceAsyncOperation* async = nullptr;
  HRESULT hr = ActivateAudioInterfaceAsync(VAD_PROCESS_LOOPBACK, IID_IAudioClient, &variant, handler, &async);
  if (FAILED(hr)) {
    fprintf(stderr, "activate failed: 0x%08lx\n", static_cast<unsigned long>(hr));
    return nullptr;
  }
  WaitForSingleObject(handler->done, 5000);
  HRESULT activateHr = E_FAIL;
  IUnknown* unknown = nullptr;
  hr = handler->op ? handler->op->GetActivateResult(&activateHr, &unknown) : E_FAIL;
  if (FAILED(hr) || FAILED(activateHr)) {
    fprintf(stderr, "activate result failed: 0x%08lx 0x%08lx\n", static_cast<unsigned long>(hr),
            static_cast<unsigned long>(activateHr));
    return nullptr;
  }
  IAudioClient* client = nullptr;
  unknown->QueryInterface(IID_IAudioClient, reinterpret_cast<void**>(&client));
  return client;
}

static bool writeAll(HANDLE out, const BYTE* data, DWORD size) {
  while (size > 0) {
    DWORD written = 0;
    if (!WriteFile(out, data, size, &written, nullptr) || written == 0) return false;
    data += written;
    size -= written;
  }
  return true;
}

int main(int argc, char** argv) {
  if (argc < 3 || (strcmp(argv[1], "include") != 0 && strcmp(argv[1], "exclude") != 0)) {
    fprintf(stderr, "usage: gameplay-audio-capture <include|exclude> <pid>\n");
    return 2;
  }
  const bool include = argv[1][0] == 'i';
  const DWORD pid = static_cast<DWORD>(atoi(argv[2]));
  CoInitializeEx(nullptr, COINIT_MULTITHREADED);

  IAudioClient* client = activate(pid, include);
  if (!client) return 1;

  WAVEFORMATEX format = {};
  format.wFormatTag = WAVE_FORMAT_PCM;
  format.nChannels = CHANNELS;
  format.nSamplesPerSec = SAMPLE_RATE;
  format.wBitsPerSample = 16;
  format.nBlockAlign = format.nChannels * format.wBitsPerSample / 8;
  format.nAvgBytesPerSec = format.nSamplesPerSec * format.nBlockAlign;
  HRESULT hr = client->Initialize(
      AUDCLNT_SHAREMODE_SHARED, AUDCLNT_STREAMFLAGS_LOOPBACK | AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM | AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY,
      10000000, 0, &format, nullptr);
  if (FAILED(hr)) {
    fprintf(stderr, "initialize failed: 0x%08lx\n", static_cast<unsigned long>(hr));
    return 1;
  }
  IAudioCaptureClient* capture = nullptr;
  hr = client->GetService(IID_IAudioCaptureClient, reinterpret_cast<void**>(&capture));
  if (FAILED(hr)) {
    fprintf(stderr, "get service failed: 0x%08lx\n", static_cast<unsigned long>(hr));
    return 1;
  }

  HANDLE out = GetStdHandle(STD_OUTPUT_HANDLE);
  CreateThread(nullptr, 0, watchStdin, nullptr, 0, nullptr);
  client->Start();
  fprintf(stderr, "capturing (%s %lu)\n", argv[1], static_cast<unsigned long>(pid));

  static BYTE silence[48000 * 4];
  while (!g_stop) {
    Sleep(10);
    UINT32 packet = 0;
    while (!g_stop && SUCCEEDED(capture->GetNextPacketSize(&packet)) && packet > 0) {
      BYTE* data = nullptr;
      UINT32 frames = 0;
      DWORD flags = 0;
      if (FAILED(capture->GetBuffer(&data, &frames, &flags, nullptr, nullptr))) break;
      const DWORD bytes = frames * format.nBlockAlign;
      bool ok;
      if (flags & AUDCLNT_BUFFERFLAGS_SILENT) {
        ok = bytes <= sizeof(silence) && writeAll(out, silence, bytes);
      } else {
        ok = writeAll(out, data, bytes);
      }
      capture->ReleaseBuffer(frames);
      if (!ok) InterlockedExchange(&g_stop, 1);
    }
  }
  client->Stop();
  return 0;
}
