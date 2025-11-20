import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import dayjs from 'dayjs'
import { PDF_CONFIG, REPAIR_TYPE_LABELS } from '@/lib/constants'
import type { ReportData } from '@/lib/types/device-refurbishing-report'

function addPDFHeader(doc: jsPDF, reportData: ReportData) {
  const { leftMargin } = PDF_CONFIG
  
  doc.setFontSize(18)
  doc.text('Device Refurbishing Report', leftMargin, 20)
  doc.setFontSize(12)
  doc.text(
    `Date Range: ${dayjs(reportData.dateFrom).format('DD MMM YYYY')} - ${dayjs(reportData.dateTo).format('DD MMM YYYY')}`,
    leftMargin,
    28
  )
}

function addPDFSummary(doc: jsPDF, reportData: ReportData): number {
  const { leftMargin } = PDF_CONFIG
  let startY = 38

  doc.setFontSize(14)
  doc.text('Summary', leftMargin, startY)
  startY += 8
  doc.setFontSize(11)
  doc.text(`Devices Repaired: ${reportData.devicesCount}`, leftMargin, startY)
  startY += 6
  doc.text(`Jobs Completed: ${reportData.jobsCount}`, leftMargin, startY)
  startY += 10

  return startY
}

function addPDFTable(
  doc: jsPDF,
  title: string,
  headers: string[],
  data: string[][],
  startY: number
): number {
  const { leftMargin, rightMargin, pageWidth, columnWidths } = PDF_CONFIG
  const tableWidth = pageWidth - leftMargin - rightMargin

  doc.setFontSize(14)
  doc.text(title, leftMargin, startY)
  startY += 8

  autoTable(doc, {
    head: [headers],
    body: data,
    startY,
    margin: { left: leftMargin, right: rightMargin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66] },
    columnStyles: {
      0: { cellWidth: tableWidth * columnWidths.large },
      1: { cellWidth: tableWidth * columnWidths.medium },
      2: { cellWidth: tableWidth * columnWidths.small }
    }
  })

  return (doc as any).lastAutoTable.finalY + 10
}

export function exportReportToPDF(reportData: ReportData) {
  const doc = new jsPDF()
  
  addPDFHeader(doc, reportData)
  let currentY = addPDFSummary(doc, reportData)

  // By Technician
  if (reportData.byTechnician.length > 0) {
    const techData = reportData.byTechnician.map(tech => [
      `${tech.technicianName}${tech.technicianLevel ? ` (${tech.technicianLevel})` : ''}`,
      tech.jobs.toString(),
      tech.devices.toString()
    ])
    currentY = addPDFTable(doc, 'By Technician', ['Technician', 'Jobs', 'Devices'], techData, currentY)
  }

  // By Model/Brand
  if (reportData.byModelBrand.length > 0) {
    const modelData = reportData.byModelBrand.map(item => [
      item.brand,
      item.model,
      item.jobs.toString()
    ])
    currentY = addPDFTable(doc, 'By Model/Brand', ['Brand', 'Model', 'Jobs'], modelData, currentY)
  }

  // By Repair Type
  if (reportData.byRepairType.length > 0) {
    const repairData = reportData.byRepairType.map(item => [
      REPAIR_TYPE_LABELS[item.repairType] || item.repairType,
      item.jobs.toString(),
      ''
    ])
    currentY = addPDFTable(doc, 'By Repair Type', ['Repair Type', 'Jobs', ''], repairData, currentY)
  }

  // By Batch
  if (reportData.byBatch.length > 0) {
    const batchData = reportData.byBatch.map(item => [
      item.batchNumber,
      item.devices.toString(),
      item.jobs.toString()
    ])
    addPDFTable(doc, 'By Batch', ['Batch', 'Devices', 'Jobs'], batchData, currentY)
  }

  const fileName = `device-refurbishing-report_${dayjs().format('YYYY-MM-DD')}.pdf`
  doc.save(fileName)
}

