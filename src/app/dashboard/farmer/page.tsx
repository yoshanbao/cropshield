import {redirect} from 'next/navigation';import {requirePageActor} from '@/lib/pageAccess';
export default async function WorkerAlias(){await requirePageActor('Worker');redirect('/worker?view=cases');}
