import { useQuery } from '@tanstack/react-query';
import type { Offering } from './website-validation';
export { validateField, offeringSchema, safeDestinations } from './website-validation';
export type { Offering } from './website-validation';
import { supabase } from '@/integrations/supabase/client';
import fields from './website-fields.json';
import { formatCents } from './food-order';
export const WEBSITE_FIELDS = fields;
export const defaults = Object.fromEntries(fields.map(f => [f.key, f.value]));
export const pageNames: Record<string,string> = {home:'Home Page',about:'About & Facility Information',bowling:'Bowling & Prices',glow:'Glow Bowling',parties:'Parties & Group Bookings',rentals:'Rentals & Meeting Rooms',leagues:'Bowling Leagues',menu:'Snack Bar Page',events:'Events Page',announcements:'Announcements Page',hours:'Hours Page',contact:'Contact Information',book:'Book a Lane Page'};
export function useWebsiteContent() {
 const query=useQuery({queryKey:['content','website'],queryFn:async()=>{const {data,error}=await supabase.from('website_content').select('key,value');if(error)throw error;return Object.fromEntries(data.map(f=>[f.key,f.value]));},initialData:{} as Record<string,string>,staleTime:0});
 return {...query,text:(key:string,fallback='')=>query.data?.[key] ?? defaults[key] ?? fallback, visible:(key:string)=> (query.data?.[key] ?? defaults[key] ?? 'true')!=='false'};
}
export function useBusiness() {
 const {text}=useWebsiteContent();
 return {name:text('contact.name'),tagline:text('contact.tagline'),phone:text('contact.phone'),snackPhone:text('contact.snack_phone'),address:text('contact.address'),email:text('contact.email'),mapQuery:encodeURIComponent(text('contact.mapQuery')),hoursNote:text('contact.hours_note'),lanes:6};
}
export function telephone(phone:string) {return `tel:${phone.replace(/[^\d+]/g,'')}`;}
export function useOfferings(category:Offering['category'],staff=false) {return useQuery({queryKey:['content','offerings',category,staff],queryFn:async()=>{let q=supabase.from('website_offerings').select('*').eq('category',category).order('sort_order');if(!staff)q=q.eq('is_active',true).eq('is_archived',false).eq('verified',true);const {data,error}=await q;if(error)throw error;return data as Offering[];}});}
export function packageDisplay(p:Offering){return {...p,price:`${formatCents(p.price_cents)}${p.pricing_note?' '+p.pricing_note:''}`,value:p.value_note,includes:p.features};}
