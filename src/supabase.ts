import {createClient} from '@supabase/supabase-js';
import {dateOnly,normalizeReminders} from './reminder-utils';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export async function getAuthSettings():Promise<{external?:{google?:boolean;email?:boolean};mailer_autoconfirm?:boolean}>{if(!url||!key)throw Error('Conectarea nu este disponibilă momentan.');const response=await fetch(url+'/auth/v1/settings',{headers:{apikey:key},cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Nu am putut verifica setările contului. Încearcă din nou.');return response.json()}
export type Doc={id:string;name:string;category:string;reference:string;expires:string;days:number;reminderDays?:number[];version?:number;notes:string;fileName:string|null;fileKey:string|null};
export type Revision={id:string;expires:string;renewed_at:string;file_name:string|null;file_key:string|null};
const map=(d:any):Doc=>({...d,reminderDays:normalizeReminders(d.reminder_days,d.days),days:Math.max(...normalizeReminders(d.reminder_days,d.days)),fileName:d.file_name,fileKey:d.file_key});
function client(){if(!supabase)throw Error('Conexiunea la baza de date nu este configurată.');return supabase}
export async function listDocuments(){const {data,error}=await client().from('documents').select('*').order('expires');if(error)throw error;return (data||[]).map(map)}
export async function hasReminderSchema(){const {error}=await client().from('documents').select('reminder_days,version').limit(0);return !error}
function documentValues(form:FormData,multiple:boolean){
 const name=String(form.get('name')||'').trim(),category=String(form.get('category')||''),expires=String(form.get('expires')||''),notes=String(form.get('notes')||'').trim(),reference=String(form.get('reference')||'').trim();
 const leads=normalizeReminders(form.getAll('reminder_days').length?form.getAll('reminder_days'):[Number(form.get('days')||30)]);
 if(!name||name.length>120||!dateOnly(expires)||!['Vehicles','Personal','Home','Health','Other'].includes(category)||notes.length>2000||reference.length>120)throw Error('Verifică numele, categoria și data expirării.');
 if(!multiple&&(leads.length>1||leads[0]===0))throw Error('Alertele multiple necesită actualizarea bazei de date.');
 return {name,category,expires,days:Math.max(1,...leads),notes,reference,...(multiple?{reminder_days:leads}:{})};
}
export async function createDocument(form:FormData,multiple=false){
 const db=client(),{data:{user}}=await db.auth.getUser();if(!user)throw Error('Intră din nou în cont.');const values=documentValues(form,multiple),id=crypto.randomUUID(),file=form.get('file');let file_key:string|null=null,file_name:string|null=null;
 if(file instanceof File&&file.size){if(file.size>5*1024*1024||!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Alege un PDF, JPG, PNG sau WebP de maximum 5 MB.');file_key=user.id+'/'+id;file_name=file.name;const {error}=await db.storage.from('documents').upload(file_key,file,{contentType:file.type,upsert:false});if(error)throw error;}
 const {data,error}=await db.from('documents').insert({id,user_id:user.id,...values,file_key,file_name}).select().single();if(error){if(file_key)await db.storage.from('documents').remove([file_key]);throw error}return map(data);
}
export async function updateDocument(doc:Doc,form:FormData,multiple=false){let query=client().from('documents').update(documentValues(form,multiple)).eq('id',doc.id);query=typeof doc.version==='number'?query.eq('version',doc.version):query.eq('expires',doc.expires);const {data,error}=await query.select().maybeSingle();if(error)throw error;if(!data)throw Error('Actul a fost modificat în altă fereastră. Reîncarcă pagina înainte de a salva.');return map(data)}
export async function renewDocument(doc:Doc,expires:string){if(!dateOnly(expires)||expires<=doc.expires)throw Error('Alege o dată nouă, după data expirării curente.');const {data,error}=await client().rpc('renew_document',{document_id:doc.id,new_expiry:expires,expected_version:doc.version});if(error)throw error;return map(data)}
export async function listRevisions(id:string){const {data,error}=await client().from('document_revisions').select('id,expires,renewed_at,file_name,file_key').eq('document_id',id).order('renewed_at',{ascending:false});if(error)throw error;return (data||[]) as Revision[]}
export async function deleteDocument(doc:Doc){const db=client();if(doc.fileKey){const {error}=await db.storage.from('documents').remove([doc.fileKey]);if(error)throw error}const {error}=await db.from('documents').delete().eq('id',doc.id);if(error)throw error}
export async function downloadDocument(doc:Doc){if(!doc.fileKey)return;const {data,error}=await client().storage.from('documents').download(doc.fileKey);if(error)throw error;const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=doc.fileName||'document';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

