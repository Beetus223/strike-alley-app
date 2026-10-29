import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { preparePhoto, PHOTO_BUCKET } from '@/lib/website-photos';
import { IMAGE_SIZES, type ImageAlign, type ImageSize } from '@/lib/newsletter';

export const NEWSLETTER_BUCKET = 'newsletter-images';
type Picked = { bucket: string; path: string; preview: string; name: string };
type GalleryItem = { path: string; name: string; url: string };

async function listBucket(bucket: string): Promise<GalleryItem[]> {
  const { data: folders } = await supabase.storage.from(bucket).list('', { limit: 100 });
  const items: { path: string; name: string; created: string }[] = [];
  for (const folder of folders ?? []) {
    if (folder.id) continue; // top-level files are not expected
    const { data: files } = await supabase.storage.from(bucket).list(folder.name, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
    for (const f of files ?? []) if (f.id && f.name.endsWith('.jpg')) items.push({ path: `${folder.name}/${f.name}`, name: f.name, created: f.created_at ?? '' });
  }
  items.sort((a, b) => b.created.localeCompare(a.created));
  const top = items.slice(0, 60);
  if (!top.length) return [];
  const { data: signed } = await supabase.storage.from(bucket).createSignedUrls(top.map(i => i.path), 3600);
  return top.map((item, index) => ({ path: item.path, name: item.created ? new Date(item.created).toLocaleDateString() : item.name, url: signed?.[index]?.signedUrl ?? '' })).filter(i => i.url);
}

export function NewsletterImagePicker({ open, onOpenChange, onInsert }: {
  open: boolean; onOpenChange: (open: boolean) => void;
  onInsert: (path: string, alt: string, size: ImageSize, align: ImageAlign) => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [size, setSize] = useState<ImageSize>('full');
  const [align, setAlign] = useState<ImageAlign>('center');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [gallery, setGallery] = useState<Record<string, GalleryItem[] | 'loading' | 'error'>>({});

  useEffect(() => { if (!open) { reset(); } }, [open]);
  useEffect(() => () => { if (picked?.bucket === 'local') URL.revokeObjectURL(picked.preview); }, [picked]);
  function reset() { setPicked(null); setLocalFile(null); setAlt(''); setSize('full'); setAlign('center'); setError(''); if (file.current) file.current.value = ''; }
  function loadGallery(bucket: string) {
    if (gallery[bucket] && gallery[bucket] !== 'error') return;
    setGallery(g => ({ ...g, [bucket]: 'loading' }));
    listBucket(bucket).then(items => setGallery(g => ({ ...g, [bucket]: items }))).catch(() => setGallery(g => ({ ...g, [bucket]: 'error' })));
  }
  function chooseLocal(selected: File) {
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) { setError('Choose a JPEG, PNG or WebP photo.'); return; }
    if (selected.size > 10 * 1024 * 1024) { setError('Choose a photo smaller than 10 MB.'); return; }
    setLocalFile(selected);
    setPicked({ bucket: 'local', path: '', preview: URL.createObjectURL(selected), name: selected.name });
  }
  async function insert() {
    if (!picked) return;
    if (!alt.trim()) { setError('Add a short description of the photo for people who can’t see it.'); return; }
    setBusy(true); setError('');
    try {
      let path = picked.path;
      if (picked.bucket !== NEWSLETTER_BUCKET) {
        let blob: Blob;
        if (picked.bucket === 'local') { if (!localFile) throw new Error('Choose the photo again.'); blob = await preparePhoto(localFile); }
        else {
          const { data, error: downloadError } = await supabase.storage.from(picked.bucket).download(picked.path);
          if (downloadError || !data) throw new Error('That website photo could not be copied.');
          blob = data;
        }
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error('Please sign in again before uploading.');
        path = `${auth.user.id}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage.from(NEWSLETTER_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
        if (uploadError) throw new Error('Photo could not be uploaded. Please try again.');
        setGallery(g => { const next = { ...g }; delete next[NEWSLETTER_BUCKET]; return next; });
      }
      onInsert(path, alt.trim(), size, align);
      onOpenChange(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Photo could not be added.'); }
    finally { setBusy(false); }
  }
  const grid = (bucket: string) => {
    const state = gallery[bucket];
    if (!state || state === 'loading') return <p className="text-sm text-muted-foreground">Loading photos…</p>;
    if (state === 'error') return <p role="alert" className="text-sm text-destructive">Photos could not be loaded.</p>;
    if (!state.length) return <p className="text-sm text-muted-foreground">No photos here yet.</p>;
    return <ul className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
      {state.map(item => <li key={item.path}><button type="button" onClick={() => { setError(''); setLocalFile(null); setPicked({ bucket, path: item.path, preview: item.url, name: item.name }); }} aria-pressed={picked?.path === item.path} className={`w-full rounded-md border p-1 text-left text-xs ${picked?.path === item.path ? 'border-primary ring-2 ring-primary' : 'border-border'}`}>
        <img src={item.url} alt="" className="aspect-video w-full rounded object-cover" loading="lazy" /><span className="mt-1 block truncate text-muted-foreground">{item.name}</span>
      </button></li>)}
    </ul>;
  };
  return <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}>
    <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
      <DialogHeader><DialogTitle>Add image</DialogTitle><DialogDescription>Choose a photo, check the preview, then insert it where your cursor is.</DialogDescription></DialogHeader>
      {!picked ? <Tabs defaultValue="device" onValueChange={value => { if (value !== 'device') loadGallery(value); }}>
        <TabsList className="flex h-auto flex-wrap"><TabsTrigger value="device">Browse files</TabsTrigger><TabsTrigger value={NEWSLETTER_BUCKET}>Newsletter photos</TabsTrigger><TabsTrigger value={PHOTO_BUCKET}>Website photos</TabsTrigger></TabsList>
        <TabsContent value="device" className="space-y-2 pt-3">
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose a photo from this device" onChange={e => { const f = e.target.files?.[0]; if (f) chooseLocal(f); }} />
          <Button type="button" variant="outline" className="w-full" onClick={() => file.current?.click()}><Upload />Browse files or photos</Button>
          <p className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 10 MB. On a phone this opens your photo library.</p>
        </TabsContent>
        <TabsContent value={NEWSLETTER_BUCKET} className="pt-3">{grid(NEWSLETTER_BUCKET)}</TabsContent>
        <TabsContent value={PHOTO_BUCKET} className="pt-3">{grid(PHOTO_BUCKET)}<p className="mt-2 text-xs text-muted-foreground">A copy is made for the newsletter; the website photo itself isn’t changed.</p></TabsContent>
      </Tabs> : <div className="space-y-4">
        <div className="relative"><img src={picked.preview} alt="Selected photo preview" className="max-h-60 w-full rounded-lg object-contain" />
          <Button type="button" size="icon" variant="secondary" className="absolute right-2 top-2" aria-label="Remove selected photo" onClick={reset} disabled={busy}><X /></Button></div>
        <div className="space-y-2"><Label htmlFor="newsletter-image-alt">Photo description</Label><Input id="newsletter-image-alt" value={alt} maxLength={120} onChange={e => setAlt(e.target.value)} placeholder="e.g. Kids bowling at a birthday party" /></div>
        <fieldset className="space-y-2"><legend className="text-sm font-medium">Size</legend><div className="flex flex-wrap gap-2">
          {(Object.keys(IMAGE_SIZES) as ImageSize[]).map(key => <Button key={key} type="button" size="sm" variant={size === key ? 'secondary' : 'outline'} aria-pressed={size === key} onClick={() => setSize(key)}>{key === 'full' ? 'Full width' : key[0]!.toUpperCase() + key.slice(1)}</Button>)}
        </div></fieldset>
        <fieldset className="space-y-2"><legend className="text-sm font-medium">Alignment</legend><div className="flex flex-wrap gap-2">
          {(['left', 'center', 'right'] as ImageAlign[]).map(key => <Button key={key} type="button" size="sm" variant={align === key ? 'secondary' : 'outline'} aria-pressed={align === key} onClick={() => setAlign(key)}>{key[0]!.toUpperCase() + key.slice(1)}</Button>)}
        </div></fieldset>
        <div className="flex flex-wrap gap-2"><Button type="button" onClick={() => void insert()} disabled={busy}><ImagePlus />{busy ? 'Adding…' : 'Insert image'}</Button><Button type="button" variant="outline" onClick={reset} disabled={busy}>Replace photo</Button><Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button></div>
      </div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </DialogContent>
  </Dialog>;
}
