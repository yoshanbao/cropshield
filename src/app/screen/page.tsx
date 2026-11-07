import {redirect} from 'next/navigation';import {requirePageActor,roleHome} from '@/lib/pageAccess';
export default async function ScreenAlias(){const actor=await requirePageActor();if(actor.role==='Administrator')redirect('/access-denied');redirect(roleHome(actor.role)+'?view=screen');}
