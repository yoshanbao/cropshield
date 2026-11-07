import {redirect} from 'next/navigation';import {requirePageActor} from '@/lib/pageAccess';
export default async function LibraryAlias(){await requirePageActor('Administrator');redirect('/admin');}
