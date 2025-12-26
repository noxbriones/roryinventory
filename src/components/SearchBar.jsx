import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { useInventory } from '../context/InventoryContext'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select } from './ui/select'
import { Search, Filter } from 'lucide-react'
import { debounce } from '../services/requestQueue'

const SearchBar = () => {
  const {
    searchQuery,
    filterCategory,
    filterStockLevel,
    categories,
    setSearchQuery,
    setFilterCategory,
    setFilterStockLevel
  } = useInventory()

  // Local state for immediate input feedback
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  // Sync local state with context when context changes externally
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  // Debounced search handler - updates context after user stops typing
  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    [setSearchQuery]
  )

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    // Update local state immediately for responsive UI
    setLocalSearchQuery(value)
    // Debounce the context update to reduce filtering operations
    debouncedSetSearchQuery(value)
  }, [debouncedSetSearchQuery])

  const handleCategoryChange = useCallback((e) => {
    setFilterCategory(e.target.value)
  }, [setFilterCategory])

  const handleStockLevelChange = useCallback((e) => {
    setFilterStockLevel(e.target.value)
  }, [setFilterStockLevel])

  return (
    <Card className="mb-4 sm:mb-6">
      <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <h3 className="text-base sm:text-lg font-semibold">Search & Filter</h3>
          </div>
          
          <div className="flex flex-row gap-3 sm:gap-4">
            <div className="space-y-2 flex-[2_1_0%] min-w-0">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name, SKU, or category..."
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 flex-[1_1_0%] min-w-0">
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                value={filterCategory}
                onChange={handleCategoryChange}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2 flex-[1_1_0%] min-w-0">
              <Label htmlFor="stockLevel">Status</Label>
              <Select
                id="stockLevel"
                value={filterStockLevel}
                onChange={handleStockLevelChange}
              >
                <option value="all">All Items</option>
                <option value="low">Low Stock</option>
                <option value="in-stock">In Stock</option>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default React.memo(SearchBar)

