import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Eye, Save, Send, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WEBSITE_FIELDS, pageNames, defaults, validateField } from '@/lib/website-content';
import { saveWebsiteDraft } from '@/lib/website-content.functions';

export function WebsiteEditor(){
 const qc=useQueryClient();const save=useServerFn(saveWebsiteDraft);
 const [page,setPage]=useState('home');const [values,setValues]=useState<Record<string,string>>({});const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');const [preview,setPreview]=useState(false);
 const published=useQuery({queryKey:['content','website'],queryFn:async()=>{const {data,error}=await supabase.from('website_content').select('key,value');if(error)throw error;return Object.fromEntries(data.map(f=>[f.key,f.value]));}});
 const draft=useQuery({queryKey:['content','website-drafts'],queryFn:async()=>{const {data,error}=await supabase.from('website_drafts').select('key,value');if(error)throw error;return Object.fromEntries(data.map(f=>[f.key,f.value]));}});
 const fields=WEBSITE_FIELDS.filter(f=>f.page===page&&!('protected' in f&&f.protected));
 const value=(key:string)=>values[key]??draft.data?.[key]??published.data?.[key]??defaults[key]??'';
 function change(key:string,v:string){setValues(old=>({...old,[key]:v}));setMessage('');setError('');}
 async function submit(publish:boolean){setError('');setMessage('');try{const entries=fields.map(f=>({key:f.key,value:value(f.key)}));for(const f of entries)validateField(f.key,f.value);setBusy(true);await save({data:{fields:entries,publish}});await qc.invalidateQueries({queryKey:['content']});setValues({});setMessage(publish?'Changes published. The public page is updated.':'Draft saved. The public page has not changed.');}catch(e){setError(e instanceof Error?e.message:'Changes could not be saved.');}finally{setBusy(false);}}
 return <div className="space-y-6"><div className="flex flex-wrap items-end gap-4"><div className="w-full max-w-sm space-y-2"><Label htmlFor="website-section">Manage Website</Label><Select value={page} onValueChange={v=>{if(Object.keys(values).length&&!confirm('Leave this section without saving your changes?'))return;setPage(v);setValues({});setError('');setMessage('');}}><SelectTrigger id="website-section" className="min-h-12"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(pageNames).map(([key,name])=><SelectItem key={key} value={key}>{name}</SelectItem>)}</SelectContent></Select></div><Button asChild variant="outline"><a href={page==='home'?'/':`/${page}`} target="_blank" rel="noreferrer"><Eye/>View public page</a></Button></div>
 {page==='contact'&&<p role="note" className="text-sm text-muted-foreground">Confirm the public email and both phone numbers before changing them. The snack bar currently uses a different number.</p>}
 {(published.isError||draft.isError)&&<p role="alert" className="text-destructive">Existing content could not load. Refresh before editing.</p>}
 <form onSubmit={e=>{e.preventDefault();void submit(false);}} className="space-y-6">
 {fields.map(f=><div key={f.key} className="space-y-2"><Label htmlFor={f.key}>{f.label}</Label>{f.kind==='boolean'?<div className="flex items-center gap-3"><Switch id={f.key} checked={value(f.key)==='true'} onCheckedChange={v=>change(f.key,String(v))}/><span>{value(f.key)==='true'?'Shown':'Hidden'}</span></div>:f.kind==='image'?<><Input id={f.key} type="text" value={value(f.key)} onChange={e=>change(f.key,e.target.value)} placeholder="https://…"/><Select onValueChange={v=>change(f.key,v)}><SelectTrigger aria-label={`Choose existing photo for ${f.label}`}><SelectValue placeholder="Choose an existing photo"/></SelectTrigger><SelectContent>{WEBSITE_FIELDS.filter(i=>i.kind==='image').map(i=><SelectItem key={i.key} value={i.value}>{i.label}</SelectItem>)}</SelectContent></Select>{value(f.key)&&<img src={value(f.key)} alt={f.label} className="max-h-48 max-w-full rounded-lg object-contain"/>}</>:f.kind==='phone'||f.kind==='email'||value(f.key).length<100&&f.kind!=='list'?<Input id={f.key} type={f.kind==='email'?'email':f.kind==='phone'?'tel':'text'} value={value(f.key)} onChange={e=>change(f.key,e.target.value)} maxLength={6000}/>:<Textarea id={f.key} value={value(f.key)} onChange={e=>change(f.key,e.target.value)} rows={4} maxLength={6000}/>}</div>)}
 {error&&<p role="alert" className="text-destructive">{error}</p>}{message&&<p role="status" className="font-medium text-primary">{message}</p>}
 <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border bg-background py-4"><Button type="submit" disabled={busy||published.isError||draft.isError}><Save/>{busy?'Saving…':'Save Draft'}</Button><Button type="button" variant="secondary" onClick={()=>setPreview(true)}><Eye/>Preview</Button><Button type="button" onClick={()=>void submit(true)} disabled={busy||published.isError||draft.isError}><Send/>Publish Changes</Button><Button type="button" variant="outline" onClick={()=>{if(confirm('Discard unsaved changes?')){setValues({});setError('');setMessage('');}}}><RotateCcw/>Cancel</Button></div></form>
 <Dialog open={preview} onOpenChange={setPreview}><DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{pageNames[page]} — Preview</DialogTitle></DialogHeader><div className="space-y-5">{fields.filter(f=>f.kind!=='boolean').map(f=><div key={f.key}><p className="mb-1 text-xs text-muted-foreground">{f.label}</p>{f.kind==='image'?<img src={value(f.key)} alt={f.label} className="max-h-64 rounded-lg"/>:<p className="whitespace-pre-line">{value(f.key)}</p>}</div>)}</div><Button onClick={()=>setPreview(false)}>Close Preview</Button></DialogContent></Dialog>
 </div>;
}
