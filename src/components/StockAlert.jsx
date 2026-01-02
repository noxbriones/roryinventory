import React, { useState, useCallback, useMemo } from 'react'
import { useInventory } from '../context/InventoryContext'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Button } from './ui/button'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

const StockAlert = () => {
  const { lowStockItems } = useInventory()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const displayedItems = useMemo(() => lowStockItems.slice(0, 5), [lowStockItems])
  const remainingCount = useMemo(() => Math.max(0, lowStockItems.length - 5), [lowStockItems])

  if (lowStockItems.length === 0) {
    return null
  }

  const itemCountText = `${lowStockItems.length} item${lowStockItems.length !== 1 ? 's' : ''} ${lowStockItems.length === 1 ? 'has' : 'have'} quantity below their low stock threshold:`

  return (
    <Alert variant="warning" className="mb-4 sm:mb-6 text-sm sm:text-base">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <AlertTitle className="text-base sm:text-lg mb-0">Low Stock Alert</AlertTitle>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-6 sm:ml-7">
              {itemCountText}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="h-6 w-6 p-0 shrink-0 mt-0.5"
            aria-label={isCollapsed ? 'Expand alert' : 'Collapse alert'}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <ChevronUp className="h-4 w-4 transition-transform duration-200" />
            )}
          </Button>
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
          }`}
        >
          <AlertDescription className="text-sm sm:text-base pt-2">
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
              {displayedItems.map(item => {
                const threshold = item.lowStockLevel || 10
                return (
                  <li key={item.id} className="break-words">
                    <strong>{item.name}</strong> - {item.quantity} remaining (threshold: {threshold})
                  </li>
                )
              })}
              {remainingCount > 0 && (
                <li className="text-muted-foreground">
                  ...and {remainingCount} more
                </li>
              )}
            </ul>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}

export default React.memo(StockAlert)

