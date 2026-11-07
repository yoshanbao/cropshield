import {Suspense} from 'react';
import {redirect} from 'next/navigation';
import {requirePageActor,allowedView} from '@/lib/pageAccess';
import type {Actor} from '@/lib/workspace';
import CropShieldApp from './App';
export default async function ProtectedWorkspace({role,view}:{role:Actor['role'];view?:string}){
  const actor=await requirePageActor(role);
  if(!allowedView(actor.role,view))redirect('/access-denied');
  return <Suspense fallback={<div className="loading-workspace">Opening CropShield…</div>}><CropShieldApp defaultView={role==='Administrator'?'admin':role==='Owner'?'cases':'screen'}/></Suspense>;
}
