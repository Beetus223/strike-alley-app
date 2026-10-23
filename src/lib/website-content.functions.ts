import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { validateField, offeringSchema } from './website-content';
export const saveWebsiteDraft = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({fields:z.array(z.object({key:z.string(),value:z.string()})).max(350),publish:z.boolean()}).parse(input)).handler(async({data,context})=>{
 for(const f of data.fields)validateField(f.key,f.value);
 if(data.fields.length===0)throw new Error('No changes to save.');
 const {error}=await context.supabase.from('website_drafts').upsert(data.fields,{onConflict:'key'});if(error)throw new Error('Changes could not be saved. Your entries are still here.');
 if(data.publish){const result=await context.supabase.rpc('website_publish',{p_keys:data.fields.map(f=>f.key)});if(result.error)throw new Error('Draft saved, but publishing failed. Please try again.');}
 return {saved:true};
});
export const saveOffering=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>offeringSchema.parse(input)).handler(async({data,context})=>{
 const {id,...values}=data; const query=id?context.supabase.from('website_offerings').update(values).eq('id',id):context.supabase.from('website_offerings').insert(values);const {data:rows,error}=await query.select('id');if(error||!rows?.length)throw new Error('Package could not be saved. Check your access and try again.');return {saved:true,id:rows[0]?.id};
});
