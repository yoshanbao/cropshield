import {NextRequest,NextResponse} from 'next/server';import {createHash,randomUUID} from 'node:crypto';
import {prisma} from '@/lib/prisma';import {actorForRequest,bodyOf,assertCrop,textField,FarmError,safeError,jsonValue,libraryFromDb,photoFields,SAMPLE_IMAGES,localDemoAvailable} from '@/lib/workspace';
import {screeningInputKey,type ScreeningInput} from '@/lib/casePresentation';
import {screenPilot,PilotServiceError} from '@/lib/pilotGemini';import {checkRateLimit,pruneRateLimitBuckets} from '@/lib/rateLimit';import {resolveCatalogScreening} from '@/lib/catalog';import type {Screening} from '@/lib/monitoring';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
export async function POST(req:NextRequest){let claimId='';let claimToken='';try{
 const actor=await actorForRequest();const b=await bodyOf(req);if(actor.role==='Administrator')throw new FarmError('Switch to a farm user to check a crop.',403);
 const id=textField(b.id,'submission ID',100,true);const crop=assertCrop(b.crop);const symptoms=textField(b.symptoms,'visible symptoms',2000,true);const photo=textField(b.photo,'photograph reference',200,true);
 const mode=b.mode==='demo'?'demo':'live';const scenario=mode==='demo'?String(b.scenario||'supported'):null;const demoKind=b.demoKind==='Pest'?'Pest':'Disease';const cacheScenario=mode==='demo'?scenario+':'+demoKind:null;
 if(mode==='demo'&&(!actor.isDemo||!localDemoAvailable(req)))throw new FarmError('Demo screening is available only in the labeled local demo.',403);
 if(mode==='live'&&!photo.startsWith('/api/images/'))throw new FarmError('Upload a real JPEG, PNG, or WebP photo to run image detection. Sample illustrations work only in demo mode.');
 await photoFields(photo,actor,mode==='demo',true);
 const fingerprint=createHash('sha256').update(JSON.stringify([crop,symptoms,photo])).digest('hex');
 if(await prisma.farmCase.findUnique({where:{id},select:{id:true}}))throw new FarmError('This case is already saved. Start a new check to screen another image.',409);
 const existing=await prisma.farmScreening.findUnique({where:{id}});if(existing&&existing.userId!==actor.id)throw new FarmError('This submission is unavailable.',404);
 if(existing?.state==='COMPLETE'&&existing.fingerprint===fingerprint&&existing.mode===mode&&existing.scenario===cacheScenario)return NextResponse.json({screening:existing.result,screeningId:id,cached:true});
 if(existing?.state==='PENDING'&&Date.now()-existing.updatedAt.getTime()<90000)throw new FarmError('This image is already being checked. Keep the draft and wait for the result.',409);
 pruneRateLimitBuckets(60000);if(!checkRateLimit('screen:'+actor.id,6,60000).allowed)throw new FarmError('Please wait a minute before checking another image. Your draft is saved.',429);
 const token=randomUUID();const data={fingerprint,mode,scenario:cacheScenario,claimToken:token,state:'PENDING',result:null};
 if(existing){const claimed=await prisma.farmScreening.updateMany({where:{id,updatedAt:existing.updatedAt},data:{...data,result:undefined}});if(!claimed.count)throw new FarmError('This submission is already being processed.',409);}else await prisma.farmScreening.create({data:{id,userId:actor.id,...data,result:undefined}});
 claimId=id;claimToken=token;
 const library=await libraryFromDb();let screening:Screening;
 if(mode==='demo'){
  if(photo.startsWith('/images/')&&!SAMPLE_IMAGES.includes(photo))throw new FarmError('Use an available demo image.');
  await new Promise(r=>setTimeout(r,400));if(scenario==='service-error')throw new FarmError('Demo temporary service error. Your details and image are saved. Select Retry check to try again.',503);
  const kind=demoKind;const preferred=kind==='Disease'?(crop==='Rice'?'rice-blast':crop==='Corn'?'corn-rust':''):'';const g=library.find(g=>g.id===preferred&&g.crop===crop&&g.enabled&&g.kind===kind)||library.find(g=>g.crop===crop&&g.enabled&&g.kind===kind);
  screening={...resolveCatalogScreening(crop,scenario==='unclear'?{state:'UNCLEAR_IMAGE',observations:['Demo result: the image is unclear. Take a closer, well-lit photograph.']}:{state:g?'MATCHED':'COVERAGE_LIMITED',conditionId:g?.id,observations:['Demo result only. This sample image was not analyzed by Gemini.']},library),demo:true};
 }else{
  const imageId=photo.match(/^\/api\/images\/([a-zA-Z0-9-]+)$/)?.[1];const image=imageId?await prisma.farmImage.findFirst({where:{id:imageId,uploaderId:actor.id}}):null;if(!image)throw new FarmError('This uploaded photograph is not available to your account.',403);
  const enabled=library.filter(g=>g.crop===crop&&g.enabled);screening=enabled.length?await screenPilot(crop,symptoms,Buffer.from(image.bytes),image.mimeType,{catalog:enabled}):{state:'COVERAGE_LIMITED',observations:[]};
 }
 await prisma.farmScreening.updateMany({where:{id,claimToken:token,state:'PENDING'},data:{state:'COMPLETE',result:jsonValue(screening)}});
 return NextResponse.json({screening,screeningId:id},{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(claimId)await prisma.farmScreening.updateMany({where:{id:claimId,claimToken},data:{state:'FAILED'}}).catch(()=>{});const r=safeError(e);const message=e instanceof Error&&'status'in e?e.message:r.error;return NextResponse.json({error:message},{status:e instanceof PilotServiceError?e.status:r.status});}}

// Recover only the result belonging to this account's unchanged, unsaved draft.
// Reading this endpoint never starts a Gemini request.
export async function GET(req:NextRequest){try{
 const actor=await actorForRequest();
 const id=textField(req.nextUrl.searchParams.get('id'),'submission ID',100,true);
 const stored=await prisma.farmDraft.findUnique({where:{userId:actor.id}});
 const d=stored?.data as (ScreeningInput&{id?:string})|null;
 if(!d||d.id!==id||typeof d.crop!=='string'||typeof d.symptoms!=='string'||typeof d.photo!=='string')return NextResponse.json({result:null},{headers:{'Cache-Control':'no-store'}});
 const [saved,result]=await Promise.all([prisma.farmCase.findUnique({where:{id},select:{id:true}}),prisma.farmScreening.findFirst({where:{id,userId:actor.id,state:'COMPLETE'}})]);
 const mode=d.mode==='demo'?'demo':'live';
 const scenario=mode==='demo'?(d.scenario||'supported')+':'+(d.demoKind==='Pest'?'Pest':'Disease'):null;
 const fingerprint=createHash('sha256').update(JSON.stringify([d.crop,d.symptoms.trim(),d.photo])).digest('hex');
 const matches=!saved&&result?.result&&result.fingerprint===fingerprint&&result.mode===mode&&result.scenario===scenario;
 return NextResponse.json({result:matches?{screening:result.result,screeningId:id,inputKey:screeningInputKey(d)}:null},{headers:{'Cache-Control':'no-store'}});
 }catch(e){const r=safeError(e);return NextResponse.json({error:r.error},{status:r.status});}}
