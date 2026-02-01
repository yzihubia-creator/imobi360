'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { useCreateDeal } from '@/hooks/use-deal-mutations'

export function NewDealDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const createDeal = useCreateDeal()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const dealData: { title: string; value?: number } = {
      title: title.trim(),
    }

    if (value.trim()) {
      const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''))
      if (!isNaN(numericValue)) {
        dealData.value = numericValue
      }
    }

    createDeal.mutate(dealData, {
      onSuccess: () => {
        setTitle('')
        setValue('')
        setOpen(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription>
            Add a new deal to your pipeline
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter deal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value (optional)</Label>
            <Input
              id="value"
              type="number"
              placeholder="0.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createDeal.isPending || !title.trim()}>
              {createDeal.isPending ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
