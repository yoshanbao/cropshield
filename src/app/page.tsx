import {redirect} from 'next/navigation';
import {requirePageActor,roleHome,allowedView} from '@/lib/pageAccess';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:{view?:string;id?:string;action?:string}}){
 const actor=await requirePageActor();if(!allowedView(actor.role,searchParams.view))redirect('/access-denied');
 const query=new URLSearchParams();for(const key of ['view','id','action'] as const){const value=searchParams[key];if(typeof value==='string')query.set(key,value);}
 redirect(roleHome(actor.role)+(query.size?'?'+query.toString():''));
}
