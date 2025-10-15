'use client'

import { toast } from 'sonner'

interface Device {
  id: string
  internal_id: string
  imei: string
  brand?: string
  model?: string
  serial_number?: string
  color?: string
  storage_capacity?: string
}

interface Batch {
  batch_number: string
}

export function useLabelPrinter(devices: Device[], batch?: Batch) {
  const printHtml = (content: string) => {
    const printWindow = window.open('', '_blank', 'width=400,height=200')
    if (!printWindow) return

    setTimeout(() => {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Label</title>
            <style>
              @page {
                size: 80mm 40.2mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                width: 80mm;
                height: 50mm;
                display: flex;
                align-items: center;
                background: white;
              }
              .label {
                page-break-inside: avoid;
              }
            </style>
          </head>
          <body>
            <div class="label">
              ${content}
            </div>
          </body>
        </html>
      `)

      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      setTimeout(() => {
        printWindow.close()
      }, 200)
    }, 50)
  }

  const printLabel = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId)
    if (!device) {
      toast.error('Device not found')
      return
    }

    const labelContent = `
      <div style="
        width: 100mm; 
        height: 50mm; 
        padding: 16px;
        font-family: monospace;
        font-size: 12px;
        border: 2px dashed #a1a1a1;
        box-sizing: border-box;
        background: white;
        color: black;
      ">
        <div style="
          font-weight: bold; 
          font-size: 16px; 
          margin-bottom: 8px;
          border-bottom: 1px solid #a1a1a1;
          padding-bottom: 12px;
          text-align: center;
        ">REMOBILE REFURBISH</div>
        <div style="display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
          <div style="display: flex; flex-direction: column; gap: 5px">
            <div><strong>ID:</strong> ${device.internal_id}</div>
            <div><strong>IMEI:</strong> ${device.imei}</div>
            <div><strong>Model:</strong> ${device.brand || ''} ${device.model || ''}</div>
            ${device.color || device.storage_capacity ? `<div><strong>Specs:</strong> ${device.color && device.storage_capacity ? `${device.color} • ${device.storage_capacity}` : device.color || device.storage_capacity}</div>` : ''}
            <div><strong>S/N:</strong> ${device.serial_number || 'N/A'}</div>
          </div>
          <div>
            <div style="text-align:center; font-size:10px; line-height: 50px;border-top: 1px solid #a1a1a1;">
              ${new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    `

    printHtml(labelContent)
  }

  const printAllLabels = () => {
    if (!batch) {
      toast.error('Batch information not available')
      return
    }
    if (devices.length === 0) {
      toast.error('No devices to print')
      return
    }

    const allLabelsContent = `
      <div style="
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 10px;
        background: white;
        color: black;
        padding: 10px;
      ">Batch: ${batch.batch_number} - ${devices.length} devices</div>
      ${devices
        .map(
          (device) => `
        <div style="
          width: 100mm; 
          height: 50mm; 
          padding: 5mm;
          font-family: monospace;
          font-size: 12px;
          border: 1px solid #000;
          box-sizing: border-box;
          background: white;
          color: black;
          margin-bottom: 5mm;
          page-break-inside: avoid;
        ">
          <div style="
            text-align: center; 
            font-weight: bold; 
            font-size: 16px; 
            margin-bottom: 8px;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
          ">REMOBILE REFURBISH</div>
          <div><strong>ID:</strong> ${device.internal_id}</div>
          <div><strong>IMEI:</strong> ${device.imei}</div>
          <div><strong>Model:</strong> ${device.brand || ''} ${device.model || ''}</div>
          ${device.color || device.storage_capacity ? `<div><strong>Specs:</strong> ${device.color && device.storage_capacity ? `${device.color} • ${device.storage_capacity}` : device.color || device.storage_capacity}</div>` : ''}
          <div><strong>S/N:</strong> ${device.serial_number || 'N/A'}</div>
          <div style="text-align:center; font-size:10px; margin-top:8px;">
            ${new Date().toLocaleDateString()}
          </div>
        </div>
      `
        )
        .join('')}
    `

    printHtml(allLabelsContent)
  }

  return { printLabel, printAllLabels }
}
