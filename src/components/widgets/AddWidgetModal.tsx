'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Image as ImageIcon, Type, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createWidget } from '@/lib/actions/widgets'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AddWidgetModalProps {
  isOpen: boolean
  onClose: () => void
}

type WidgetType = 'text' | 'image'

export function AddWidgetModal({ isOpen, onClose }: AddWidgetModalProps) {
  const [widgetType, setWidgetType] = useState<WidgetType>('text')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (widgetType === 'text' && !content.trim()) {
      toast.error('Please enter some content')
      return
    }

    if (widgetType === 'image' && !imageFile) {
      toast.error('Please select an image')
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl: string | null = null

      // Upload image if present
      if (imageFile) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          toast.error('Not authenticated')
          return
        }

        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('widgets')
          .upload(fileName, imageFile)

        if (uploadError) {
          toast.error(uploadError.message || 'Failed to upload image')
          console.error('Storage upload error:', uploadError)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('widgets')
          .getPublicUrl(uploadData.path)

        imageUrl = publicUrl
      }

      // Create widget
      const formData = new FormData()
      formData.set('type', widgetType)
      formData.set('content', content)
      if (imageUrl) {
        formData.set('imageUrl', imageUrl)
      }

      const result = await createWidget(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Widget added!')
        resetForm()
        onClose()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setContent('')
    setImageFile(null)
    setImagePreview(null)
    setWidgetType('text')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-[70] safe-area-inset-bottom"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <h2 className="text-lg font-semibold">Add Widget</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2 px-4 pb-4">
              <Button
                variant={widgetType === 'text' ? 'default' : 'outline'}
                onClick={() => setWidgetType('text')}
                className="flex-1 active-scale"
              >
                <Type className="w-4 h-4 mr-2" />
                Text
              </Button>
              <Button
                variant={widgetType === 'image' ? 'default' : 'outline'}
                onClick={() => setWidgetType('image')}
                className="flex-1 active-scale"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </Button>
            </div>

            {/* Content area */}
            <div className="px-4 pb-4 space-y-4">
              {/* Image upload */}
              {widgetType === 'image' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full rounded-xl object-cover max-h-48"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Tap to upload an image
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Text input */}
              <Textarea
                placeholder={
                  widgetType === 'image'
                    ? 'Add a caption (optional)...'
                    : "What's on your mind?"
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="resize-none"
                maxLength={500}
              />

              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  {widgetType === 'text'
                    ? 'Your interests will be detected automatically'
                    : 'Add a caption to help find similar interests'}
                </span>
                <span>{content.length}/500</span>
              </div>
            </div>

            {/* Submit button */}
            <div className="px-4 pb-6">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 text-base font-medium active-scale"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Widget'
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
