import {headers} from 'next/headers';import {redirect} from 'next/navigation';
import AuthForm from '@/components/cropshield/AuthForm';
import {currentPageActor,roleHome} from '@/lib/pageAccess';import {localDemoAvailable} from '@/lib/workspace';
export const dynamic='force-dynamic';
export default async function Login({searchParams}:{searchParams:{registered?:string;loggedOut?:string}}){const actor=await currentPageActor();if(actor)redirect(roleHome(actor.role));return <AuthForm key="login" mode="login" showDemoAccounts={localDemoAvailable({headers:headers()} as Request)} registered={searchParams.registered==='1'} loggedOut={searchParams.loggedOut==='1'}/>;}
