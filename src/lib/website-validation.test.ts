import {describe,it,expect} from 'vitest';
import {validateField,offeringSchema} from './website-validation';
import fields from './website-fields.json';
const offering={category:'birthday',name:'Package',description:'',price_cents:22500,pricing_note:'+ GST',capacity:'8–60 People',value_note:'',tag:'',features:['2 hours of unlimited bowling'],note:'',sort_order:1,is_active:true,is_archived:false,verified:true};
describe('Staff website content rules',()=>{
 it('uses the existing bowling number for telephone actions',()=>expect(validateField('contact.phone','(780) 632-2695')).toBe('(780) 632-2695'));
 it('rejects invalid telephone values',()=>expect(()=>validateField('contact.phone','abc')).toThrow());
 it('preserves the independently supplied snack bar number',()=>expect(validateField('contact.snack_phone','780-632-7665')).toBe('780-632-7665'));
 it('allows existing uploaded photos',()=>{const field=fields.find(f=>f.key==='home.hero');expect(validateField('home.hero',field?.value??'')).toBe(field?.value);});
 it('rejects unsafe image links',()=>expect(()=>validateField('home.hero','javascript:alert(1)')).toThrow());
 it('rejects arbitrary external button destinations',()=>expect(()=>validateField('home.activity0.destination','https://example.com')).toThrow());
 it('rejects public inquiry destinations',()=>expect(()=>validateField('home.activity0.destination','/inquiries')).toThrow());
 it('preserves the verified Galaxy package amount and guest guidance',()=>{const row=offeringSchema.parse(offering);expect(row.price_cents).toBe(22500);expect(row.capacity).toBe('8–60 People');});
 it('requires verification before publishing an offering',()=>expect(()=>offeringSchema.parse({...offering,verified:false})).toThrow());
 it('rejects negative prices',()=>expect(()=>offeringSchema.parse({...offering,price_cents:-1})).toThrow());
 it('requires whole cents',()=>expect(()=>offeringSchema.parse({...offering,price_cents:123.45})).toThrow());
 it('protects six-lane facts from content edits',()=>expect(()=>validateField('home.039','8 lanes')).toThrow());
});

import { validateField as vf } from './website-validation';
describe('newsletter signup link', () => {
  it('accepts an empty link (signup hidden)', () => expect(vf('contact.newsletter_url', '')).toBe(''));
  it('accepts a secure link', () => expect(vf('contact.newsletter_url', 'https://example.com/signup')).toBe('https://example.com/signup'));
  it('rejects an insecure link', () => expect(() => vf('contact.newsletter_url', 'http://example.com')).toThrow());
});
