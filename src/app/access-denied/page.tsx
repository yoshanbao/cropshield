import Link from 'next/link';import {ShieldX} from 'lucide-react';
import {requirePageActor,roleHome} from '@/lib/pageAccess';
export const dynamic='force-dynamic';
export default async function AccessDenied(){const actor=await requirePageActor();return <main className="auth-page"><section className="auth-card"><ShieldX size={34} aria-hidden="true"/><h1>This page belongs to another role</h1><p>You are signed in as {actor.name}, a {actor.role.toLowerCase()}. Open the workspace assigned to your account.</p><Link className="btn primary full" href={roleHome(actor.role)}>Go to my workspace</Link></section></main>;}
