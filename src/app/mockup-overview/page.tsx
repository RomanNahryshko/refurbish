'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Package, Smartphone, Wrench, ClipboardCheck, PackageSearch, BarChart3 } from 'lucide-react';

export default function MockupOverviewPage() {
  // Using batch-1 as demo batch for testing dynamic pages
  const demoBatchId = 'batch-1'
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
        { name: 'Edit Batch (Demo)', href: `/batch-intake/${demoBatchId}/edit`, status: 'ready' },
        { name: 'Import Dr. Phone Data (Demo)', href: `/batch-intake/${demoBatchId}/import`, status: 'ready' },
        { name: 'Generate Labels (Demo)', href: `/batch-intake/${demoBatchId}/labels`, status: 'ready' },
        { name: 'View Batch Devices (Demo)', href: `/batch-intake/${demoBatchId}/devices`, status: 'ready' },
      ]
    },
    {
      title: 'Device Tracking',
      description: 'Central device management, status tracking and job sheets',
      icon: Smartphone,
      color: 'bg-green-500',
      pages: [
        { name: 'Device List', href: '/devices', status: 'ready' },
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
      ]
    },
    {
      title: 'Repair Jobs',
      description: 'Queue-based repair management',
      icon: Wrench,
      color: 'bg-orange-500',
      pages: [
        { name: 'Repair Queue', href: '/repair-jobs', status: 'ready' },
      ]
    },
    {
      title: 'Inventory',
      description: 'Spare parts and stock management',
      icon: PackageSearch,
      color: 'bg-indigo-500',
      pages: [
        { name: 'Parts Inventory', href: '/inventory', status: 'minimal' },
      ]
    },
    {
      title: 'Suppliers',
      description: 'Supplier management',
      icon: Users,
      color: 'bg-cyan-500',
      pages: [
        { name: 'Supplier List', href: '/suppliers', status: 'ready' },
      ]
    },
    {
      title: 'Admin & Reporting',
      description: 'User management, KPIs and production metrics',
      icon: BarChart3,
      color: 'bg-red-500',
      pages: [
        { name: 'Dashboard', href: '/dashboard', status: 'partial' },
        { name: 'Admin Panel', href: '/admin', status: 'ready' },
        { name: 'User Management', href: '/admin/users', status: 'ready' },
        { name: 'Create User', href: '/admin/users/create', status: 'ready' },
      ]
    }
  ]

  const deviceStatuses = [
    { status: 'received', description: 'Device received in batch' },
    { status: 'initial_qc', description: 'Undergoing initial quality control' },
    { status: 'awaiting_repair', description: 'Waiting for repair assignment' },
    { status: 'in_repair', description: 'Active repair in progress' },
    { status: 'final_qc', description: 'Undergoing final quality control' },
    { status: 'graded', description: 'QC passed, grade assigned' },
  ]

  const repairTaskStatuses = [
    { status: 'pending', description: 'Task created, not started' },
    { status: 'in_progress', description: 'Technician working on task' },
    { status: 'completed', description: 'Task successfully finished' },
  ]

  const userRoles = [
    { role: 'admin', description: 'System administrator' },
    { role: 'general_manager', description: 'Full system access, metrics' },
    { role: 'ops_manager', description: 'Intake, QC, task assignment' },
    { role: 'qc_controller', description: 'Quality control and grading' },
    { role: 'technician', description: 'Repair execution (L1/L2/L3)' },
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">System Overview - MVP</h1>
        <p className="text-xl text-muted-foreground">
          All modules, pages and their implementation status
        </p>
      </div>

      {/* Status Legend */}
      <div className="flex justify-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="default">ready</Badge>
          <span className="text-sm text-muted-foreground">Full UI/UX implementation</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">partial</Badge>
          <span className="text-sm text-muted-foreground">Partial implementation</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">minimal</Badge>
          <span className="text-sm text-muted-foreground">Placeholder only</span>
        </div>
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

      {/* System Configuration */}
      <div>
        <h2 className="text-2xl font-bold mb-4">System Configuration</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Device Statuses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Statuses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deviceStatuses.map((item) => (
                  <div key={item.status} className="flex justify-between text-sm">
                    <code className="font-mono">{item.status}</code>
                    <span className="text-muted-foreground text-xs">{item.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Repair Task Statuses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Repair Task Statuses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {repairTaskStatuses.map((item) => (
                  <div key={item.status} className="flex justify-between text-sm">
                    <code className="font-mono">{item.status}</code>
                    <span className="text-muted-foreground text-xs">{item.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userRoles.map((item) => (
                  <div key={item.role} className="flex justify-between text-sm">
                    <code className="font-mono">{item.role}</code>
                    <span className="text-muted-foreground text-xs">{item.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>




    </div>
  )
}