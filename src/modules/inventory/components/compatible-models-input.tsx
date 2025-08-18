'use client'

import { useState, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'

interface CompatibleModelsInputProps {
  value?: string[]
  onChange: (models: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export function CompatibleModelsInput({
  value = [],
  onChange,
  placeholder = "Type model and press Enter...",
  disabled = false
}: CompatibleModelsInputProps) {
  const [inputValue, setInputValue] = useState('')

  const addModel = (model: string) => {
    const trimmedModel = model.trim()
    if (trimmedModel && !value.includes(trimmedModel)) {
      onChange([...value, trimmedModel])
      setInputValue('')
    }
  }

  const removeModel = (modelToRemove: string) => {
    onChange(value.filter(model => model !== modelToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addModel(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last model if input is empty and backspace is pressed
      removeModel(value[value.length - 1])
    }
  }

  const handleAddClick = () => {
    addModel(inputValue)
  }

  return (
    <div className="space-y-3">
      {/* Input field */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          disabled={disabled || !inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Display current models as badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((model, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {model}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeModel(model)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Helper text */}
      <p className="text-sm text-muted-foreground">
        Type a device model and press Enter to add. Click the X to remove.
      </p>
    </div>
  )
}
