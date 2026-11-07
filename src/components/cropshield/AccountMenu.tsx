'use client';
import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {ChevronDown,LogOut,X,UserRound} from 'lucide-react';
import type {DemoUser} from '@/lib/demo';

type Account=DemoUser&{isDemo?:boolean};
export default function AccountMenu({actor,disabled,onSignOut}:{
  actor:Account;disabled:boolean;
  onSignOut:()=>Promise<void>;
}) {
  const dialog=useRef<HTMLDialogElement>(null);const [open,setOpen]=useState(false);
  const demo=actor.isDemo;
  const role=actor.role==='Administrator'?'Admin':actor.role;
  useEffect(()=>{
    if(!open)return;
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    return()=>{document.body.style.overflow=previous;};
  },[open]);
  function show(){if(disabled)return;dialog.current?.showModal();setOpen(true);}
  function close(){dialog.current?.close();setOpen(false);}
  function containFocus(event:KeyboardEvent<HTMLDialogElement>){
    if(event.key!=='Tab')return;
    const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]')).filter(el=>el.getClientRects().length>0);
    const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
  return <>
    <button type="button" className="account-trigger" aria-label="Open account options" aria-describedby="account-current" aria-haspopup="dialog" aria-expanded={open} disabled={disabled} onClick={show}>
      <span id="account-current" className="sr-only">{actor.name}, {actor.role}{demo?', local demo account':''}</span><span className="account-avatar" aria-hidden="true"><UserRound size={18}/></span>
      <span className="account-trigger-role">{role}</span>{demo&&<span className="account-demo-label">Demo</span>}<ChevronDown size={16} aria-hidden="true"/>
    </button>
    <dialog ref={dialog} className="account-dialog" aria-labelledby="account-title" onKeyDown={containFocus} onClose={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)close();}}>
      <div className="account-panel">
        <div className="account-panel-heading"><h2 id="account-title">Your account</h2><button type="button" className="icon-button" aria-label="Close account options" onClick={close}><X size={21} aria-hidden="true"/></button></div>
        <div className="account-person"><span className="account-avatar" aria-hidden="true"><UserRound size={23}/></span><div><strong>{actor.name}</strong><span>{actor.role} · Ja-ron Fish Farm</span></div></div>
        <button className="account-sign-out" type="button" disabled={disabled} onClick={()=>{close();void onSignOut();}}><LogOut size={19} aria-hidden="true"/>Sign out</button>
      </div>
    </dialog>
  </>;
}
