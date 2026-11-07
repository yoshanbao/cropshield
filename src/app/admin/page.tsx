import ProtectedWorkspace from '@/components/cropshield/ProtectedWorkspace';
export const dynamic='force-dynamic';
export default function AdminPage({searchParams}:{searchParams:{view?:string}}){return <ProtectedWorkspace role="Administrator" view={searchParams.view}/>;}
