import { describe, expect, it } from 'vitest'

import { manualReport } from '../../view-models/test/hardware-seed'

import { toManualDefaults, toManualRequest } from './manual-hardware.mapper'

describe('toManualRequest', () => {
  it('sends empty fields as null and renames the connection and plan fields', () => {
    expect(
      toManualRequest({
        cpuModel: 'Ryzen 7',
        ramGb: 16.5,
        gpuModel: undefined,
        vramGb: undefined,
        connection: 'wifi',
        downloadMbps: 300,
        uploadMbps: undefined,
      }),
    ).toEqual({
      cpuModel: 'Ryzen 7',
      ramGb: 16.5,
      gpuModel: null,
      vramGb: null,
      connectionType: 'wifi',
      internetDownloadMbps: 300,
      internetUploadMbps: null,
    })
  })
})

describe('toManualDefaults', () => {
  it('turns the saved manual data into form text', () => {
    expect(toManualDefaults(manualReport.manual)).toEqual({
      cpuModel: 'Ryzen 7 5800X',
      ramGb: '32',
      gpuModel: '',
      vramGb: '8',
      connection: 'wired',
      downloadMbps: '500',
      uploadMbps: '',
    })
  })

  it('is all empty without manual data', () => {
    expect(toManualDefaults(null)).toEqual({
      cpuModel: '',
      ramGb: '',
      gpuModel: '',
      vramGb: '',
      connection: '',
      downloadMbps: '',
      uploadMbps: '',
    })
  })
})
