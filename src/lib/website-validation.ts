import { z } from 'zod';
import fields from './website-fields.json';
export const safeDestinations=['/bowling','/leagues','/parties','/rentals','/hours','/events','/contact','/glow','/menu','/announcements'];
export function validateField(key: string, value: string) {
 const field = fields.find(f=>f.key===key);
 if (!field || ('protected' in field && field.protected)) throw new Error('This field is not editable.');
 z.string().max(6000).parse(value);
 if (field.kind==='phone' && !/^\+?[\d ()-]{10,25}$/.test(value)) throw new Error('Enter a valid phone number.');
 if (field.kind==='email') z.string().email('Enter a valid email address.').parse(value);
 if (field.kind==='image' && value && !/^https:\/\//.test(value) && !fields.some(f=>f.kind==='image'&&f.value===value)) throw new Error('Images must use a secure https link.');
 if (field.kind==='boolean' && !['true','false'].includes(value)) throw new Error('Choose show or hide.');
 if(field.kind==='destination'&&!safeDestinations.includes(value))throw new Error('Choose an existing public page.');
 return value;
}
export const offeringSchema=z.object({id:z.string().uuid().optional(),category:z.enum(['birthday','party-lanes','rental']),name:z.string().trim().min(1,'Name is required.').max(150),description:z.string().max(3000),price_cents:z.number().int().min(0).max(10000000),pricing_note:z.string().max(500),capacity:z.string().max(500),value_note:z.string().max(500),tag:z.string().max(100),features:z.array(z.string().trim().min(1).max(500)).max(40),note:z.string().max(2000),sort_order:z.number().int().min(0).max(10000),is_active:z.boolean(),is_archived:z.boolean(),verified:z.boolean()}).refine(v=>!v.is_active||v.verified,'Confirm the details before publishing.');
export type Offering=z.infer<typeof offeringSchema>;
