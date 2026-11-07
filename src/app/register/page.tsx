import {redirect} from 'next/navigation';import AuthForm from '@/components/cropshield/AuthForm';import {currentPageActor,roleHome} from '@/lib/pageAccess';
export const dynamic='force-dynamic';
export default async function Register(){const actor=await currentPageActor();if(actor)redirect(roleHome(actor.role));return <AuthForm key="register" mode="register"/>;}
