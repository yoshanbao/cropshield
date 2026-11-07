import {redirect} from 'next/navigation';
import {actorForRequest,FarmError,type Actor} from './workspace';
import {roleHome} from './accountValidation';
export async function currentPageActor():Promise<Actor|null>{try{return await actorForRequest();}catch(e){if(e instanceof FarmError&&(e.status===401||e.status===403))return null;throw e;}}
export async function requirePageActor(role?:Actor['role']){
  const actor=await currentPageActor();
  if(!actor)redirect('/login');
  if(role&&actor.role!==role)redirect('/access-denied');
  return actor;
}
export function allowedView(role:Actor['role'],view?:string){return view!=='admin'||role==='Administrator';}
export {roleHome};
