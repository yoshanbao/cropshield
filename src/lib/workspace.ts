import { auth } from '@/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { type NextRequest } from 'next/server';
import { type CropCase, type Observation, type Screening, today } from './monitoring';
import { type DemoUser, type LibraryEntry } from './demo';
import { isSupportedCrop } from './crops';

export class FarmError extends Error { constructor(message: string, public status = 400) { super(message); } }
export type Actor = DemoUser & { isDemo: boolean };
export const jsonValue = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));
export function localDemoAvailable(request: Request): boolean {
 const host = request.headers.get('host')?.split(':')[0];
 return ['localhost','127.0.0.1','[::1]'].includes(host || '') && (process.env.NODE_ENV !== 'production' || process.env.CROPSHIELD_LOCAL_DEMO === 'true');
}
export function assertOrigin(request: Request) {
 const origin=request.headers.get('origin'); if(!origin)return;
 const url=new URL(request.url);url.host=request.headers.get('host')||url.host;
 if(origin!==url.origin)throw new FarmError('Please submit this request from CropShield.',403);
}
export async function actorForRequest(): Promise<Actor> {
 const session=await auth(); if(!session?.user?.id||session.authVersion!=='email-password-v1')throw new FarmError('Sign in to open your farm workspace.',401);
 const user=await prisma.user.findUnique({where:{id:session.user.id},select:{id:true,name:true,role:true,active:true,isDemo:true}});
 if(user?.isDemo&&!localDemoAvailable({headers:headers()} as Request))throw new FarmError('Local demo accounts are disabled on this host. Sign in with a farm account.',403);
 if(!user?.active)throw new FarmError('Your account is unavailable. Ask the administrator to restore access.',403);
 return {id:user.id,name:user.name,active:user.active,isDemo:user.isDemo,role:user.role==='ADMIN'?'Administrator':user.role==='OWNER'?'Owner':'Worker'};
}
export function scopeFor(actor: Actor): Prisma.FarmCaseWhereInput {return actor.role==='Worker'?{OR:[{createdById:actor.id},{assignments:{some:{userId:actor.id}}}]}:{};}
export function requireAdmin(actor: Actor) {if(actor.role!=='Administrator')throw new FarmError('Only the administrator can change reference content or user access.',403);}
export async function bodyOf(request: NextRequest): Promise<Record<string,unknown>> {
 assertOrigin(request);if(Number(request.headers.get('content-length')||0)>150000)throw new FarmError('This form is too large. Upload photographs separately.',413);
 try{const body=await request.json();if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();return body;}catch{throw new FarmError('The submitted form could not be read.');}
}
export function textField(value: unknown, label: string, max=2000, required=false): string {
 if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new FarmError(`Check ${label}${required?' — this field is required':''}.`);
 return value.trim();
}
export function validDate(value: unknown, label='observation date', allowEmpty=false): Date | null {
 if(allowEmpty&&!value)return null;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new FarmError(`Choose a valid ${label}.`);
 const d=new Date(value+'T00:00:00.000Z');if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==value)throw new FarmError(`Choose a valid ${label}.`);return d;
}
export const SAMPLE_IMAGES=['/images/demo-rice-first.svg','/images/demo-rice-later.svg','/images/demo-okra-first.svg'];
export async function photoFields(value: unknown, actor: Actor, sample: boolean, required=false): Promise<{photoId?: string;samplePath?: string}> {
 if(!value){if(required)throw new FarmError('Attach an initial crop photograph.');return {};}
 if(typeof value!=='string')throw new FarmError('Choose a valid crop photograph.');
 if(sample&&actor.isDemo&&SAMPLE_IMAGES.includes(value))return{samplePath:value};
 const id=value.match(/^\/api\/images\/([a-zA-Z0-9-]+)$/)?.[1];if(!id)throw new FarmError('Upload the photograph before saving the observation.');
 const image=await prisma.farmImage.findFirst({where:{id,uploaderId:actor.id},select:{id:true}});if(!image)throw new FarmError('This photograph is unavailable to your account.',403);
 return{photoId:id};
}
export const caseInclude={creator:{select:{name:true}},observations:{include:{author:{select:{name:true}}},orderBy:[{date:'asc' as const},{createdAt:'asc' as const}]},assignments:true,statusEvents:{orderBy:{createdAt:'asc' as const}}} satisfies Prisma.FarmCaseInclude;
type LoadedCase=Prisma.FarmCaseGetPayload<{include:typeof caseInclude}>;
export function serializeCase(row: LoadedCase): CropCase {
 return {id:row.id,crop:row.crop as CropCase['crop'],area:row.area,sampleLabel:row.sampleLabel,plantAge:row.plantAge||'',recordedBy:row.creator.name,createdById:row.createdById,assignedTo:row.assignments.map(x=>x.userId),status:row.status==='OPEN'?'Open':row.status==='CLOSED'?'Closed':'Monitoring',nextFollowUp:row.nextFollowUp?.toISOString().slice(0,10)||'',createdAt:row.createdAt.toISOString(),screening:row.screening as unknown as Screening,sample:row.sample,walkthrough:row.walkthrough,revision:row.revision,observations:row.observations.map(o=>({id:o.id,date:o.date.toISOString().slice(0,10),symptoms:o.symptoms,actions:o.actions,change:o.change as Observation['change'],photo:o.photoId?'/api/images/'+o.photoId:o.samplePath||undefined,recordedBy:o.author.name})),statusHistory:row.statusEvents.map(e=>({status:e.status as CropCase['status'],date:e.createdAt.toISOString(),reason:e.reason}))};
}
export async function casesFor(actor: Actor) {return(await prisma.farmCase.findMany({where:scopeFor(actor),include:caseInclude,orderBy:{createdAt:'desc'}})).map(serializeCase);}
export async function permittedCase(id: string, actor: Actor, update=false) {
 if(update&&actor.role==='Administrator')throw new FarmError('Administrators maintain content and access. A farm user updates observations.',403);
 const c=await prisma.farmCase.findFirst({where:{id,...scopeFor(actor)},include:caseInclude});if(!c)throw new FarmError('This case is not available to your account.',404);return c;
}
export async function libraryFromDb(): Promise<LibraryEntry[]> {return(await prisma.cropCondition.findMany({orderBy:[{crop:'asc'},{kind:'asc'},{name:'asc'}]})).map(g=>({...g,crop:g.crop as LibraryEntry['crop'],kind:g.kind as 'Disease'|'Pest',reviewStatus:g.reviewStatus as LibraryEntry['reviewStatus'],reviewedAt:g.reviewedAt?.toISOString().slice(0,10)||'',limitations:g.limitations||undefined}));}
export function assertCrop(value: unknown) {if(!isSupportedCrop(value))throw new FarmError('Choose one of the eight supported crops.');return value;}
export function checkObservationDate(value: unknown, initial?: string) {const date=validDate(value)!;const str=date.toISOString().slice(0,10);if(str>today()||(initial&&str<initial))throw new FarmError('Observation dates must be between the initial observation and today.');return date;}
export function safeError(e: unknown) {
 if(e instanceof FarmError)return{error:e.message,status:e.status};
 if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2002')return{error:'This submission is already being saved. Reopen the case before trying again.',status:409};
 return{error:'The database request could not complete. Your form is retained; try again.',status:503};
}
