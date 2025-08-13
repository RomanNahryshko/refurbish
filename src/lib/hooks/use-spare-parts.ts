import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api/inventory'

export function useSpareParts() {
  return useQuery({
    queryKey: ['spare-parts'],
    queryFn: inventoryApi.getAllParts,
  })
}
