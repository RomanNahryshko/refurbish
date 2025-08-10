'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Package, 
  Smartphone, 
  Wrench, 
  ClipboardCheck, 
  PackageSearch,
  BarChart3,
  Users,
  FileText,
  Upload,
  QrCode,
  Search,
  Settings,
  AlertCircle
} from 'lucide-react'

export default function MockupOverviewPage() {
  // Using batch-1 as demo batch for testing dynamic pages
  const demoBatchId = 'batch-1'
  const demoDeviceId = 'device-1'
  const demoInternalId = '00000001'
  
  const modules = [
    {
      title: 'Batch Intake',
      description: 'Manage incoming phone batches, Dr. Phone imports, and label generation',
      icon: Package,
      color: 'bg-blue-500',
      pages: [
        { name: 'Batch List', href: '/batch-intake', status: 'ready' },
        { name: 'Create Batch', href: '/batch-intake/create', status: 'ready' },
        { name: 'Import Dr. Phone Data (Demo Batch)', href: `/batch-intake/${demoBatchId}/import`, status: 'ready' },
        { name: 'Generate Labels (Demo Batch)', href: `/batch-intake/${demoBatchId}/labels`, status: 'ready' },
        { name: 'View Batch Devices (Demo Batch)', href: `/devices?batch=${demoBatchId}`, status: 'ready' },
      ]
    },
    {
      title: 'Devices',
      description: 'Track devices through the refurbishment process',
      icon: Smartphone,
      color: 'bg-green-500',
      pages: [
        { name: 'Device List & Search', href: '/devices', status: 'ready' },
        { name: 'Device Job Sheet (Demo)', href: `/devices/${demoInternalId}`, status: 'ready' },
      ]
    },
    {
      title: 'Quality Control',
      description: 'Initial and final QC checks with grading',
      icon: ClipboardCheck,
      color: 'bg-purple-500',
      pages: [
        { name: 'QC Queue', href: '/qc', status: 'ready' },
        { name: 'Final QC Form (Demo)', href: `/qc/${demoInternalId}`, status: 'ready' },
        { name: 'Initial QC (in Batch Intake)', href: `/batch-intake/${demoBatchId}/import`, status: 'ready' },
      ]
    },
    {
      title: 'Repair Management',
      description: 'Create and manage repair jobs with queue system',
      icon: Wrench,
      color: 'bg-orange-500',
      pages: [
        { name: 'Repair Queue', href: '/repair-jobs', status: 'partial' },
        { name: 'Create Repairs', href: '/create-repairs-demo', status: 'pending' },
        { name: 'Technician View', href: '/technician-view', status: 'pending' },
        { name: 'Parts Usage', href: '/parts-usage-demo', status: 'pending' },
      ]
    },
    {
      title: 'Inventory',
      description: 'Manage spare parts and stock levels',
      icon: PackageSearch,
      color: 'bg-indigo-500',
      pages: [
        { name: 'Parts List', href: '/inventory', status: 'partial' },
        { name: 'Supplier Management', href: '/suppliers', status: 'ready' },
        { name: 'Add Stock', href: '/add-stock-demo', status: 'pending' },
        { name: 'Low Stock Alert', href: '/low-stock-demo', status: 'pending' },
        { name: 'Stock History', href: '/stock-history-demo', status: 'pending' },
      ]
    },
    {
      title: 'Admin & Reporting',
      description: 'User management and KPI dashboards',
      icon: BarChart3,
      color: 'bg-red-500',
      pages: [
        { name: 'Dashboard', href: '/dashboard', status: 'pending' },
        { name: 'User Management', href: '/admin/users', status: 'ready' },
        { name: 'Production Metrics', href: '/metrics-demo', status: 'pending' },
        { name: 'Reports', href: '/reports-demo', status: 'pending' },
      ]
    }
  ]

  const workflows = [
    {
      title: 'Device Intake Flow',
      steps: [
        'Create new batch',
        'Import Dr. Phone data (CSV/Excel)',
        'Review and modify faults',
        'Generate and print labels',
        'Physical labeling of devices'
      ]
    },
    {
      title: 'Repair Flow',
      steps: [
        'Initial QC identifies issues',
        'Operations Manager creates repair tasks',
        'Technicians self-select from queue',
        'Record parts usage',
        'Mark repair complete'
      ]
    },
    {
      title: 'Quality Control Flow',
      steps: [
        'Initial QC after intake',
        'Identify and document faults',
        'After repairs: Final QC',
        'Grade assignment (A/B/C)',
        'Loop back to repair if needed'
      ]
    }
  ]

  const dataValidation = [
    { item: 'User roles match schema', status: 'valid' },
    { item: 'Technician levels (L1/L2/L3)', status: 'valid' },
    { item: 'Device status workflow', status: 'valid' },
    { item: 'Repair types match requirements', status: 'valid' },
    { item: 'QC test tracking', status: 'valid' },
    { item: 'Internal ID generation (8-digit)', status: 'valid' },
    { item: 'Soft deletes on critical tables', status: 'valid' },
    { item: 'Stock level tracking', status: 'valid' },
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">ReMobile Refurbish - System Overview</h1>
        <p className="text-xl text-muted-foreground">
          Complete mockup of all modules and workflows
        </p>
        <Badge variant="outline" className="text-lg px-4 py-1">
          MVP Scope - UI Validation Phase
        </Badge>
      </div>



      {/* Modules Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">System Modules</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Card key={module.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${module.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="mt-4">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.pages.map((page) => (
                      <div key={page.name} className="flex items-center justify-between">
                        <Link href={page.href} className="cursor-pointer">
                          <Button variant="link" className="p-0 h-auto font-normal">
                            {page.name}
                          </Button>
                        </Link>
                        <Badge 
                          variant={
                            page.status === 'ready' ? 'default' : 
                            page.status === 'partial' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {page.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Workflows */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Key Workflows</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.title}>
              <CardHeader>
                <CardTitle className="text-lg">{workflow.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {workflow.steps.map((step, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="font-semibold text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Schema Validation */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Schema Validation Checklist</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {dataValidation.map((item) => (
                <div key={item.item} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    item.status === 'valid' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm">{item.item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>




    </div>
  )
}