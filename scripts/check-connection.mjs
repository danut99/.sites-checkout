import fs from 'node:fs';
process.loadEnvFile('.env.local');
const origin=process.env.VITE_SUPABASE_URL;
const headers={apikey:process.env.VITE_SUPABASE_PUBLISHABLE_KEY};
const settings=await fetch(origin+'/auth/v1/settings',{headers});
console.log('Supabase Auth HTTP',settings.status);
if(settings.ok){const s=await settings.json();console.log('Email sign-in enabled:',Boolean(s.external?.email));console.log('Google sign-in enabled:',Boolean(s.external?.google));console.log('Email signup without confirmation:',Boolean(s.mailer_autoconfirm));}
const tables=await fetch(origin+'/rest/v1/documents?select=id&limit=0',{headers});
console.log('Anonymous documents query HTTP',tables.status);
if(!tables.ok){const e=await tables.json();console.log('Database status:',e.code||'unknown',e.message||'');}

