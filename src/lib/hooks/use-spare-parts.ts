import { useQuery } from '@tanstack/react-query'
import { getAllParts } from '@/lib/api/inventory-client'

export function useSpareParts() {
  return useQuery({
    queryKey: ['spare-parts'],
    queryFn: getAllParts,
  })
}
