import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PHOTO_BUCKET, PHOTO_PREFIX, photoPath, preparePhoto } from '@/lib/website-photos';

export function PhotoPicker({ value, onChange, label, id, name, onBusyChange }: {
  value: string; onChange: (value: string) => void; label: string; id?: string; name?: string; onBusyChange?: (busy: boolean) => void;
}) {
  const generatedId = useId();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  useEffect(() => {
    let active = true;
    const path = photoPath(value);
    setPreview(path ? '' : value);
    if (path) void supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600).then(({ data }) => {
      if (active) setPreview(data?.signedUrl ?? '');
    });
    return () => { active = false; };
  }, [value]);
  async function upload(selected: File) {
    setBusy(true); onBusyChange?.(true); setError('');
    try {
      const blob = await preparePhoto(selected);
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error('Please sign in again before uploading.');
      const path = `${auth.user.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw new Error('Photo could not be uploaded. Please try again.');
      onChange(PHOTO_PREFIX + path);
    } catch (e) { setError(e instanceof Error ? e.message : 'Photo could not be uploaded.'); }
    finally { setBusy(false); onBusyChange?.(false); if (file.current) file.current.value = ''; }
  }
  return <div className="space-y-3">
    <Input id={id ?? generatedId} name={name} aria-label={`${label} link`} value={value} onChange={e => onChange(e.target.value)} placeholder="https://…" disabled={busy}/>
    <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" className="sr-only" aria-label={`Choose Photo for ${label}`} disabled={busy} onChange={e => { const selected = e.target.files?.[0]; if (selected) void upload(selected); }}/>
    <Button type="button" variant="outline" disabled={busy} onClick={() => file.current?.click()}><ImagePlus/>{busy ? 'Uploading…' : 'Choose Photo'}</Button>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {preview && <img src={preview} alt={label} className="max-h-48 max-w-full rounded-lg object-contain"/>}
  </div>;
}

export function PhotoFormField({ defaultValue, label }: { defaultValue?: string | null | undefined; label: string }) {
  const [value, setValue] = useState(defaultValue ?? '');
  const [busy, setBusy] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const form = container.current?.closest('form');
    if (!form) return;
    const preventSave = (event: Event) => { if (busy) { event.preventDefault(); event.stopPropagation(); } };
    form.addEventListener('submit', preventSave, true);
    return () => form.removeEventListener('submit', preventSave, true);
  }, [busy]);
  return <div ref={container}><PhotoPicker value={value} onChange={setValue} name="image_url" label={label} onBusyChange={setBusy}/></div>;
}

export function PhotoPreview({ value, label }: { value: string; label: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let active = true;
    const path = photoPath(value);
    setSrc(path ? '' : value);
    if (path) void supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600).then(({ data }) => { if (active) setSrc(data?.signedUrl ?? ''); });
    return () => { active = false; };
  }, [value]);
  return src ? <img src={src} alt={label} className="max-h-64 max-w-full rounded-lg object-contain"/> : null;
}