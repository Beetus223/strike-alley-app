import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import fields from './website-fields.json';
import { formatCents } from './food-order';
export const WEBSITE_FIELDS = fields;
export const defaults = Object.fromEntries(fields.map(f => [f.key, f.value]));
export const pageNames: Record<string,string> = {home:'Home Page',about:'About & Facility Information',bowling:'Bowling & Prices',glow:'Glow Bowling',parties:'Parties & Group Bookings',rentals:'Rentals & Meeting Rooms',leagues:'Bowling Leagues',menu:'Snack Bar Page',events:'Events Page',announcements:'Announcements Page',hours:'Hours Page',contact:'Contact Information',book:'Book a Lane Page'};
export function validateField(key: string, value: string) {
 const field = fields.find(f=>f.key===key);
 if (!field || ('protected' in field && field.protected)) throw new Error('This field is not editable.');
 z.string().max(6000).parse(value);
 if (field.kind==='phone' && !/^\+?[\d ()-]{10,25}$/.test(value)) throw new Error('Enter a valid phone number.');
 if (field.kind==='email') z.string().email('Enter a valid email address.').parse(value);
 if (field.kind==='image' && value && !/^https:\/\//.test(value) && !fields.some(f=>f.kind==='image'&&f.value===value)) throw new Error('Images must use a secure https link.');
 if (field.kind==='boolean' && !['true','false'].includes(value)) throw new Error('Choose show or hide.');
 return value;
}
export function useWebsiteContent() {
 const query=useQuery({queryKey:['content','website'],queryFn:async()=>{const {data,error}=await supabase.from('website_content').select('key,value');if(error)throw error;return Object.fromEntries(data.map(f=>[f.key,f.value]));},initialData:{} as Record<string,string>,staleTime:0});
 return {...query,text:(key:string,fallback='')=>query.data?.[key] ?? defaults[key] ?? fallback, visible:(key:string)=> (query.data?.[key] ?? defaults[key] ?? 'true')!=='false'};
}
export function useBusiness() {
 const {text}=useWebsiteContent();
 return {name:text('contact.name'),tagline:text('contact.tagline'),phone:text('contact.phone'),snackPhone:text('contact.snack_phone'),address:text('contact.address'),email:text('contact.email'),mapQuery:encodeURIComponent(text('contact.mapQuery')),hoursNote:text('contact.hours_note'),lanes:6};
}
export function telephone(phone:string) {return `tel:${phone.replace(/[^\d+]/g,'')}`;}
export const offeringSchema=z.object({id:z.string().uuid().optional(),category:z.enum(['birthday','party-lanes','rental']),name:z.string().trim().min(1,'Name is required.').max(150),description:z.string().max(3000),price_cents:z.number().int().min(0).max(10000000),pricing_note:z.string().max(500),capacity:z.string().max(500),value_note:z.string().max(500),tag:z.string().max(100),features:z.array(z.string().trim().min(1).max(500)).max(40),note:z.string().max(2000),sort_order:z.number().int().min(0).max(10000),is_active:z.boolean(),is_archived:z.boolean(),verified:z.boolean()}).refine(v=>!v.is_active||v.verified,'Confirm the details before publishing.');
export type Offering=z.infer<typeof offeringSchema>;
export function useOfferings(category:Offering['category'],staff=false) {return useQuery({queryKey:['content','offerings',category,staff],queryFn:async()=>{let q=supabase.from('website_offerings').select('*').eq('category',category).order('sort_order');if(!staff)q=q.eq('is_active',true).eq('is_archived',false).eq('verified',true);const {data,error}=await q;if(error)throw error;return data as Offering[];}});}
export function packageDisplay(p:Offering){return {...p,price:`${formatCents(p.price_cents)}${p.pricing_note?' '+p.pricing_note:''}`,value:p.value_note,includes:p.features};}
