import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { validateField, offeringSchema } from './website-validation';
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

export const getPublishedWebsite=createServerFn({method:'GET'}).handler(async()=>{
 const url=process.env['SUPABASE_URL'];const key=process.env['SUPABASE_PUBLISHABLE_KEY'];
 if(!url||!key)return {content:[],offerings:[]};
 const {createClient}=await import('@supabase/supabase-js');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers);if(key.startsWith('sb_')&&headers.get('Authorization')===`Bearer ${key}`)headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers});}}});
 const [content,offerings]=await Promise.all([client.from('website_content').select('key,value'),client.from('website_offerings').select('*').eq('is_active',true).eq('is_archived',false).eq('verified',true).order('sort_order')]);
 if(content.error||offerings.error)return {content:[],offerings:[]};
 return {content:content.data,offerings:offerings.data};
});
