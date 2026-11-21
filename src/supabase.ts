import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL, key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;
export type Doc={id:string;name:string;category:string;reference:string;expires:string;days:number;notes:string;fileName:string|null;fileKey:string|null};
const map=(d:any):Doc=>({...d,fileName:d.file_name,fileKey:d.file_key});
function client(){if(!supabase)throw Error('Supabase is not configured.');return supabase}
export async function listDocuments(){const {data,error}=await client().from('documents').select('*').order('expires');if(error)throw Error(error.message+' — If this is a new project, run supabase/schema.sql first.');return (data||[]).map(map)}
export async function createDocument(form:FormData){
const db=client();const {data:{user}}=await db.auth.getUser();if(!user)throw Error('Please sign in again.');
const name=String(form.get('name')||'').trim(),category=String(form.get('category')||''),expires=String(form.get('expires')||''),days=Number(form.get('days')),notes=String(form.get('notes')||'').trim(),reference=String(form.get('reference')||'').trim();
if(!name||!/^\d{4}-\d{2}-\d{2}$/.test(expires)||!Number.isFinite(Date.parse(expires))||new Date(expires).toISOString().slice(0,10)!==expires)throw Error('Check the name and expiry date.');
const id=crypto.randomUUID(),file=form.get('file');let file_key:string|null=null,file_name:string|null=null;
if(file instanceof File&&file.size){
if(file.size>5*1024*1024||!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Use a PDF, JPG, PNG or WebP up to 5 MB.');
file_key=user.id+'/'+id;file_name=file.name;
const {error}=await db.storage.from('documents').upload(file_key,file,{contentType:file.type,upsert:false});if(error)throw error;
}
const {data,error}=await db.from('documents').insert({id,user_id:user.id,name,category,expires,days,notes,reference,file_key,file_name}).select().single();
if(error){if(file_key)await db.storage.from('documents').remove([file_key]);throw error;}return map(data);
}
export async function deleteDocument(doc:Doc){
const db=client();
if(doc.fileKey){const {error}=await db.storage.from('documents').remove([doc.fileKey]);if(error)throw error;}
const {error}=await db.from('documents').delete().eq('id',doc.id);if(error)throw error;
}
export async function downloadDocument(doc:Doc){
if(!doc.fileKey)return;const {data,error}=await client().storage.from('documents').download(doc.fileKey);if(error)throw error;
const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=doc.fileName||'document';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
