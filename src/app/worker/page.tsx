import ProtectedWorkspace from '@/components/cropshield/ProtectedWorkspace';
export const dynamic='force-dynamic';
export default function WorkerPage({searchParams}:{searchParams:{view?:string}}){return <ProtectedWorkspace role="Worker" view={searchParams.view}/>;}
