import type { DeviceReport, ManualHardware as ManualHardwareRequest } from '@gameplay/contracts'

import type { ManualHardware, ManualHardwareInput } from '@/modules/hardware/model/manual-hardware.schema'

/** Form values (undefined = left empty) to the API body, where empty is null. */
function toManualRequest(values: ManualHardware): ManualHardwareRequest {
  return {
    cpuModel: values.cpuModel ?? null,
    ramGb: values.ramGb ?? null,
    gpuModel: values.gpuModel ?? null,
    vramGb: values.vramGb ?? null,
    connectionType: values.connection ?? null,
    internetDownloadMbps: values.downloadMbps ?? null,
    internetUploadMbps: values.uploadMbps ?? null,
  }
}

const text = (value: string | number | null | undefined) => (value === null || value === undefined ? '' : String(value))

/** The saved manual data as the form's text fields. */
function toManualDefaults(manual: DeviceReport['manual']): ManualHardwareInput {
  return {
    cpuModel: text(manual?.cpuModel),
    ramGb: text(manual?.ramGb),
    gpuModel: text(manual?.gpuModel),
    vramGb: text(manual?.vramGb),
    connection: manual?.connectionType ?? '',
    downloadMbps: text(manual?.internetDownloadMbps),
    uploadMbps: text(manual?.internetUploadMbps),
  }
}

export { toManualDefaults, toManualRequest }
