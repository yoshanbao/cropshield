import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {actorForRequest,bodyOf,jsonValue,assertOrigin,safeError,FarmError,photoFields} from '@/lib/workspace';
export const dynamic='force-dynamic';
export async function PUT(req:NextRequest){try{
 const actor=await actorForRequest();const body=await bodyOf(req);
 if(actor.role==='Administrator')throw new FarmError('Farm users can save crop drafts.',403);
 const data=body.draft;if(!data||typeof data!=='object'||Array.isArray(data))throw new FarmError('Draft could not be read.');
 const d=data as Record<string,unknown>;
 if(typeof d.id!=='string'||d.id.length>100||JSON.stringify(d).length>30000)throw new FarmError('Draft is too large. Upload images separately.');
 if(d.photo)await photoFields(d.photo,actor,actor.isDemo);
 const result=await prisma.$transaction(async tx=>{
  // Serialize draft writes with case creation for the same account.
  await tx.$queryRaw`SELECT id FROM \`User\` WHERE id = ${actor.id} FOR UPDATE`;
  if(await tx.farmCase.findFirst({where:{id:d.id as string,createdById:actor.id},select:{id:true}}))return{saved:false,completed:true};
  await tx.farmDraft.upsert({where:{userId:actor.id},create:{userId:actor.id,data:jsonValue(d)},update:{data:jsonValue(d)}});
  return{saved:true};
 });
 return NextResponse.json(result);
 }catch(e){const r=safeError(e);return NextResponse.json({error:r.error},{status:r.status});}}
export async function DELETE(req:NextRequest){try{assertOrigin(req);const actor=await actorForRequest();await prisma.farmDraft.deleteMany({where:{userId:actor.id}});return NextResponse.json({discarded:true});}catch(e){const r=safeError(e);return NextResponse.json({error:r.error},{status:r.status});}}
