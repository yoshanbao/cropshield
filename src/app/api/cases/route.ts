import {NextRequest,NextResponse} from 'next/server';
import {createHash} from 'node:crypto';
import {prisma} from '@/lib/prisma';
import {actorForRequest,bodyOf,assertCrop,textField,checkObservationDate,validDate,photoFields,jsonValue,caseInclude,serializeCase,FarmError,safeError} from '@/lib/workspace';
import type {Screening} from '@/lib/monitoring';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){try{
 const actor=await actorForRequest();const body=await bodyOf(req);
 if(actor.role==='Administrator')throw new FarmError('A farm user must create crop cases.',403);
 const c=(body.case||{}) as Record<string,unknown>;
 const id=textField(c.id,'case ID',100,true);const crop=assertCrop(c.crop);
 const area=textField(c.area,'plant or crop area',120,true);const sampleLabel=textField(c.sampleLabel,'plant / sample label',80,true);const plantAge=textField(c.plantAge||'','plant age',60);
 if(!Array.isArray(c.observations)||c.observations.length!==1)throw new FarmError('Start with one initial observation. Add follow-ups after saving.');
 const o=c.observations[0] as Record<string,unknown>;const date=checkObservationDate(o.date);const symptoms=textField(o.symptoms,'visible symptoms',2000,true);const actions=textField(o.actions||'','actions',2000);
 const sample=c.sample===true&&actor.isDemo;const photo=await photoFields(o.photo,actor,sample,true);const next=validDate(c.nextFollowUp,'next follow-up date',true);
 if(next&&next<date)throw new FarmError('The next follow-up cannot be before this observation.');
 const screeningId=c.screeningId?textField(c.screeningId,'screening ID',100,true):'';
 const submissionHash=createHash('sha256').update(JSON.stringify([actor.id,crop,area,sampleLabel,plantAge,date.toISOString(),symptoms,actions,photo.photoId||photo.samplePath,next?.toISOString()||'',screeningId,sample,c.walkthrough===true])).digest('hex');
 const existing=await prisma.farmCase.findUnique({where:{id},include:caseInclude});
 if(existing){
  if(existing.createdById!==actor.id||existing.submissionHash!==submissionHash)throw new FarmError('This submission was already saved with different details. Open the saved case in My cases, or start a new observation.',409);
  await prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM \`User\` WHERE id = ${actor.id} FOR UPDATE`;await tx.farmDraft.deleteMany({where:{userId:actor.id,data:{path:'$.id',equals:id}}});});
  return NextResponse.json({case:serializeCase(existing)});
 }
 let screening:Screening={state:'NOT_SCREENED',observations:[]};
 if(screeningId){const result=await prisma.farmScreening.findFirst({where:{id:screeningId,userId:actor.id,state:'COMPLETE'}});const fingerprint=createHash('sha256').update(JSON.stringify([crop,symptoms,o.photo])).digest('hex');if(!result?.result||result.fingerprint!==fingerprint)throw new FarmError('The crop details changed after screening. Screen again or save without a result.');screening=result.result as unknown as Screening;}
 const saved=await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM \`User\` WHERE id = ${actor.id} FOR UPDATE`;
  const row=await tx.farmCase.create({data:{id,crop,area,sampleLabel,plantAge,createdById:actor.id,status:'OPEN',nextFollowUp:next,submissionHash,screening:jsonValue(screening),sample:sample||!!screening.demo,walkthrough:c.walkthrough===true,observations:{create:{id:textField(o.id||id+'-initial','observation ID',150,true),date,symptoms,actions,change:'Not yet assessed',authorId:actor.id,...photo}}},include:caseInclude});
  await tx.farmDraft.deleteMany({where:{userId:actor.id,data:{path:'$.id',equals:id}}});
  return row;
 });
 return NextResponse.json({case:serializeCase(saved)},{status:201});
 }catch(e){const r=safeError(e);return NextResponse.json({error:r.error},{status:r.status});}}
