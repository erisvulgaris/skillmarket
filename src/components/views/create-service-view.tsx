'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Image as ImageIcon, X, Plus, Tag } from 'lucide-react'
import { toast } from 'sonner'

type Category = { id: string; name: string }

export function CreateServiceView() {
  const { setView } = useApp()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    price: '',
    deliveryDays: '3',
    tags: [] as string[],
    skills: [] as string[],
    images: [] as string[],
    faqs: [] as { q: string; a: string }[],
  })
  const [tagInput, setTagInput] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<{ categories: Category[] }>('/api/marketplace/categories').then((d) => setCategories(d.categories)).catch(() => {})
  }, [])

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t) && form.tags.length < 10) {
      setForm({ ...form, tags: [...form.tags, t] })
      setTagInput('')
    }
  }
  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.skills.includes(s) && form.skills.length < 15) {
      setForm({ ...form, skills: [...form.skills, s] })
      setSkillInput('')
    }
  }

  const submit = async () => {
    if (form.title.length < 5) return toast.error('Title too short')
    if (form.description.length < 20) return toast.error('Description too short')
    const price = Number(form.price)
    if (!price || price <= 0) return toast.error('Invalid price')

    setLoading(true)
    try {
      await api.post('/api/services/create', {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId || undefined,
        price,
        deliveryDays: Number(form.deliveryDays),
        tags: form.tags,
        skills: form.skills,
        images: form.images,
        faqs: form.faqs,
      })
      toast.success('Service published!')
      setView('profile')
    } catch (e: any) {
      toast.error(e.message || 'Failed to create service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('profile')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">Create Service</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-32">
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="I will design a premium logo…" maxLength={120} />
            <p className="text-[10px] text-muted-foreground text-right">{form.title.length}/120</p>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what you offer in detail…" className="min-h-[120px]" maxLength={5000} />
            <p className="text-[10px] text-muted-foreground text-right">{form.description.length}/5000</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Price (SC) *</Label>
              <Input type="number" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="100" />
            </div>
            <div className="space-y-2">
              <Label>Delivery (days)</Label>
              <Input type="number" inputMode="numeric" value={form.deliveryDays} onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full h-10 rounded-xl bg-background border border-border px-3 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag…" />
              <Button type="button" variant="outline" onClick={addTag}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs">
                  <Tag className="h-3 w-3" />{t}
                  <button onClick={() => setForm({ ...form, tags: form.tags.filter((x) => x !== t) })}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex gap-2">
              <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add skill…" />
              <Button type="button" variant="outline" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                  {s}
                  <button onClick={() => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Service Images ({form.images.length}/8)</Label>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                for (const file of files) {
                  if (form.images.length >= 8) break
                  const fd = new FormData()
                  fd.append('file', file)
                  try {
                    setUploading(true)
                    const res = await fetch('/api/uploads', { method: 'POST', body: fd, credentials: 'include' })
                    const json = await res.json()
                    if (json.success) {
                      setForm((prev) => ({ ...prev, images: [...prev.images, json.data.url] }))
                    } else {
                      toast.error(json.error || 'Upload failed')
                    }
                  } catch (err: any) {
                    toast.error(err.message || 'Upload failed')
                  } finally {
                    setUploading(false)
                  }
                }
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || form.images.length >= 8}
              className="w-full aspect-[3/1] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Uploading…</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs font-medium">Tap to upload images</span>
                  <span className="text-[10px]">PNG, JPG, WebP up to 5MB</span>
                </>
              )}
            </button>
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Button onClick={submit} disabled={loading} className="w-full rounded-2xl h-12">
          {loading ? 'Publishing…' : 'Publish Service'}
        </Button>
      </div>
    </div>
  )
}
