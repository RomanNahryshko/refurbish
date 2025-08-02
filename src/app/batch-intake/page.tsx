import { Button } from '@/components/ui/button'
import { BatchList } from '@/modules/batch-intake/components/batch-list'

export default function BatchIntakePage() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batch Intake</h1>
          <p className="text-muted-foreground mt-2">
            Register new phone batches from suppliers
          </p>
        </div>
        <Button>Create New Batch</Button>
      </div>
      
      <BatchList />
    </div>
  )
} 