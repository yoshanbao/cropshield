import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {actorForRequest,safeError} from '@/lib/workspace';
import {readImage,isSafeFilename} from '@/lib/imageStorage';
export const runtime='nodejs';export const dynamic='force-dynamic';
// Preserve access to legacy photos while using the same current-account checks
// as new photos. Legacy expert labels grant no special permissions.
export async function GET(_request:Request,{params}:{params:{id:string}}){try{
 const actor=await actorForRequest();
 const found=await prisma.case.findFirst({where:{id:params.id,...(actor.role==='Worker'?{farmerId:actor.id}:{})},select:{imagePath:true}});
 if(!found?.imagePath||!isSafeFilename(found.imagePath))return NextResponse.json({error:'Image unavailable.'},{status:404});
 try{const {bytes,mimeType}=await readImage(found.imagePath);return new NextResponse(new Uint8Array(bytes),{headers:{'Content-Type':mimeType,'Cache-Control':'private, no-store'}});}catch{return NextResponse.json({error:'Image unavailable.'},{status:404});}
 }catch(e){const r=safeError(e);return NextResponse.json({error:r.error},{status:r.status});}}
