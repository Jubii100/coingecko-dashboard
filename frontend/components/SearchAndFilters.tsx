"use client"

import * as React from "react"
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchFilters } from "@/lib/types"

interface SearchAndFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  isLoading?: boolean
}

export function SearchAndFilters({ 
  filters, 
  onFiltersChange, 
  isLoading = false 
}: SearchAndFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value
    })
  }

  const handleSortChange = (newSortBy: SearchFilters['sortBy']) => {
    let newSortOrder: 'asc' | 'desc' = 'desc'
    
    // If clicking the same sort field, toggle order
    if (filters.sortBy === newSortBy) {
      newSortOrder = filters.sortOrder === 'desc' ? 'asc' : 'desc'
    } else {
      // Default sort order for different fields
      newSortOrder = newSortBy === 'change' ? 'desc' : 'desc'
    }

    onFiltersChange({
      ...filters,
      sortBy: newSortBy,
      sortOrder: newSortOrder
    })
  }

  const getSortIcon = (sortBy: SearchFilters['sortBy']) => {
    if (filters.sortBy !== sortBy) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    
    return filters.sortOrder === 'desc' ? 
      <ArrowDown className="h-4 w-4" /> : 
      <ArrowUp className="h-4 w-4" />
  }

  const getSortButtonVariant = (sortBy: SearchFilters['sortBy']) => {
    return filters.sortBy === sortBy ? 'default' : 'ghost'
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cryptocurrencies..."
          value={filters.search}
          onChange={handleSearchChange}
          className="pl-10"
          disabled={isLoading}
        />
      </div>

      {/* Sort Controls */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Sort by:</span>
        
        <Button
          variant={getSortButtonVariant('market_cap')}
          size="sm"
          onClick={() => handleSortChange('market_cap')}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          Market Cap
          {getSortIcon('market_cap')}
        </Button>

        <Button
          variant={getSortButtonVariant('price')}
          size="sm"
          onClick={() => handleSortChange('price')}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          Price
          {getSortIcon('price')}
        </Button>

        <Button
          variant={getSortButtonVariant('volume')}
          size="sm"
          onClick={() => handleSortChange('volume')}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          Volume
          {getSortIcon('volume')}
        </Button>

        <Button
          variant={getSortButtonVariant('change')}
          size="sm"
          onClick={() => handleSortChange('change')}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          24h Change
          {getSortIcon('change')}
        </Button>
      </div>

      {/* Results Info */}
      {filters.search && (
        <div className="text-sm text-muted-foreground">
          Searching for: "{filters.search}"
        </div>
      )}
    </div>
  )
}
