import ProtectedWorkspace from '@/components/cropshield/ProtectedWorkspace';
export const dynamic='force-dynamic';
export default function OwnerPage({searchParams}:{searchParams:{view?:string}}){return <ProtectedWorkspace role="Owner" view={searchParams.view}/>;}
