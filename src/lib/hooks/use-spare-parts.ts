import { QueryFunction, useQuery } from '@tanstack/react-query'
import { getAllParts } from '@/lib/api/inventory-client'
import { SparePart } from '../types/business-types'

export function useSpareParts() {
  return useQuery({
    queryKey: ['spare-parts'],
    queryFn: getAllParts as QueryFunction<SparePart[], string[]>,
  })
}
