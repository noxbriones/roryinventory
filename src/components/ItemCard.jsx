import React, { useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { LOW_STOCK_THRESHOLD } from '../utils/constants'
import { Package, Tag } from 'lucide-react'

const ItemCard = ({ item, onEdit }) => {
  const lowStockThreshold = item.lowStockLevel || LOW_STOCK_THRESHOLD
  const isLowStock = item.quantity < lowStockThreshold
  const isOutOfStock = item.quantity === 0
  
  const stockBadgeVariant = useMemo(() => {
    if (isOutOfStock) return 'destructive'
    if (isLowStock) return 'warning'
    return 'success'
  }, [isOutOfStock, isLowStock])

  const stockLabel = useMemo(() => {
    if (isOutOfStock) return 'Out of Stock'
    if (isLowStock) return 'Low Stock'
    return 'In Stock'
  }, [isOutOfStock, isLowStock])

  const borderColor = useMemo(() => {
    if (isOutOfStock) return 'border-l-red-500'
    if (isLowStock) return 'border-l-yellow-500'
    return 'border-l-green-500'
  }, [isOutOfStock, isLowStock])

  const handleEdit = useCallback(() => {
    onEdit(item)
  }, [item, onEdit])


  const iconColor = useMemo(() => {
    if (isOutOfStock) return 'text-red-500'
    if (isLowStock) return 'text-yellow-500'
    return 'text-green-500'
  }, [isOutOfStock, isLowStock])

  return (
    <Card className={`${borderColor} border-l-4`}>
      <CardHeader className="!px-4 sm:!px-6 !pt-4 sm:!pt-6 !pb-0">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
          <CardTitle 
            className="text-lg sm:text-xl break-words pr-2 cursor-pointer hover:text-primary transition-colors"
            onClick={handleEdit}
          >
            {item.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
        {/* Single line: Quantity, Category, Stock Status */}
        <div className="flex items-center gap-3 sm:gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-1.5">
            <Package className={`h-4 w-4 ${iconColor}`} />
            <span className={`font-semibold ${iconColor}`}>
              {item.quantity}
            </span>
          </div>
          
          {item.category && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{item.category}</span>
            </div>
          )}
          
          <div className="ml-auto">
            <Badge variant={stockBadgeVariant} className="text-xs shrink-0">{stockLabel}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default React.memo(ItemCard)

