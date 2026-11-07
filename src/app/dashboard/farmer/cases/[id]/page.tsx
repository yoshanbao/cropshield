import {redirect} from 'next/navigation';import {requirePageActor} from '@/lib/pageAccess';
export default async function CaseAlias({params}:{params:{id:string}}){await requirePageActor('Worker');redirect('/worker?view=case&id='+encodeURIComponent(params.id));}
