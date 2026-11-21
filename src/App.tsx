import {useEffect,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {ShieldCheck,LoaderCircle} from 'lucide-react';
import {supabase} from './supabase';
import Dashboard from './Dashboard';
export default function App(){
const [session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false),[signup,setSignup]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
useEffect(()=>{if(!supabase){setReady(true);return;}let active=true;supabase.auth.getSession().then(({data,error})=>{if(active){setSession(data.session);setReady(true);if(error)setError(error.message)}}).catch(e=>{if(active){setError(e.message);setReady(true)}});const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,value)=>{if(active)setSession(value)});return()=>{active=false;subscription.unsubscribe()}},[]);
async function submit(e:React.FormEvent<HTMLFormElement>){
e.preventDefault();if(!supabase)return;setBusy(true);setError('');setMessage('');
const form=new FormData(e.currentTarget),email=String(form.get('email')),password=String(form.get('password'));
try{if(signup){const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin}});if(error)throw error;if(!data.session)setMessage('Check your email to confirm your account, then sign in.');}else{const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;}}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
if(!ready)return <div className="auth-shell"><LoaderCircle className="spin" aria-label="Loading"/></div>;
if(session)return <Dashboard displayName={session.user.email?.split('@')[0]||'there'} onSignOut={()=>supabase?.auth.signOut()}/>;
return <div className="auth-shell"><section className="auth-card"><a className="brand" href="/"><span className="brandmark"><ShieldCheck size={25}/></span><span>expiry<span className="brand-light">pocket</span><small>A LITTLE LESS TO REMEMBER</small></span></a><p className="eyebrow">YOUR EVERYDAY, ORGANISED</p><h1>{signup?'A home for your paperwork.':'Welcome to your pocket.'}</h1><p>Keep documents, expiry dates, and renewal reminders together. On your computer and your phone.</p>{!supabase?<div className="error">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to connect your project.</div>:<form onSubmit={submit}><label>Email address<input autoComplete="email" name="email" type="email" placeholder="you@example.com" required/></label><label>Password<input autoComplete={signup?'new-password':'current-password'} name="password" type="password" minLength={8} placeholder="At least 8 characters" required/></label><button className="primary" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:null}{signup?'Create account':'Sign in'}</button></form>}{error&&<div className="error" role="alert">{error}</div>}{message&&<div className="notice" role="status">{message}</div>}<button className="text-button" onClick={()=>{setSignup(!signup);setError('');setMessage('')}}>{signup?'Already have an account? Sign in':'New here? Create your account'}</button></section></div>
}
