'use client'

import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { SparePart } from '@/lib/types/business-types'

interface StockLevelBadgeProps {
  part: SparePart
  showPercentage?: boolean
}

export function getStockStatus(part: SparePart): 'low' | 'medium' | 'good' {
  const { quantity_in_stock, minimum_stock_level } = part
  const minLevel = minimum_stock_level || 0
  
  if (quantity_in_stock <= minLevel) return 'low'
  if (quantity_in_stock <= minLevel * 2) return 'medium'
  return 'good'
}

export function StockLevelBadge({ part, showPercentage = false }: StockLevelBadgeProps) {
  const status = getStockStatus(part)
  const { quantity_in_stock, minimum_stock_level } = part
  
  const variants = {
    low: 'destructive',
    medium: 'secondary', 
    good: 'default'
  } as const
  
  const icons = {
    low: <AlertTriangle className="h-3 w-3" />,
    medium: <Clock className="h-3 w-3" />,
    good: <CheckCircle className="h-3 w-3" />
  }

  const getPercentage = () => {
    if (!minimum_stock_level || minimum_stock_level === 0) return null
    return Math.round((quantity_in_stock / minimum_stock_level) * 100)
  }

  const percentage = showPercentage ? getPercentage() : null

  return (
    <Badge variant={variants[status]} className="gap-1">
      {icons[status]}
      {quantity_in_stock}
      {minimum_stock_level && ` / ${minimum_stock_level}`}
      {percentage !== null && ` (${percentage}%)`}
    </Badge>
  )
}
