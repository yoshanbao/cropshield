import bcrypt from 'bcryptjs';import {Prisma} from '@prisma/client';import {validateAccountInput,AccountValidationError,databaseRole} from '@/lib/accountValidation';
import {NextRequest,NextResponse} from 'next/server';import {prisma} from '@/lib/prisma';import {actorForRequest,requireAdmin,bodyOf,FarmError,safeError} from '@/lib/workspace';
export const dynamic='force-dynamic';
export async function PATCH(req:NextRequest){try{const actor=await actorForRequest();requireAdmin(actor);const b=await bodyOf(req);const u=b.user as {id?:string;role?:string;active?:boolean};if(!u?.id||!['Worker','Owner','Administrator'].includes(u.role||'')||typeof u.active!=='boolean')throw new FarmError('Choose a valid user role and access status.');if(u.id===actor.id&&(!u.active||u.role!=='Administrator'))throw new FarmError('Keep your own administrator access enabled.');await prisma.user.update({where:{id:u.id},data:{role:u.role==='Owner'?'OWNER':u.role==='Administrator'?'ADMIN':'WORKER',active:u.active}});return NextResponse.json({saved:true});}catch(e){const r=safeError(e);return NextResponse.json({error:r.error},{status:r.status});}}

export async function POST(req:NextRequest){try{
 const actor=await actorForRequest();requireAdmin(actor);
 const body=await bodyOf(req);const data=validateAccountInput(body,true);
 const user=await prisma.user.create({data:{name:data.name,email:data.email,role:databaseRole(data.role),active:true,isDemo:false,passwordHash:await bcrypt.hash(data.password,12)},select:{id:true,name:true,email:true,role:true,active:true,isDemo:true}});
 return NextResponse.json({user:{...user,role:data.role,assignable:data.role==='Worker'}},{status:201});
 }catch(e){
  if(e instanceof AccountValidationError)return NextResponse.json({error:e.message,fields:e.fields},{status:400});
  if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2002')return NextResponse.json({error:'This email is already registered.',fields:{email:'Use another email address.'}},{status:409});
  const r=safeError(e);return NextResponse.json({error:r.error},{status:r.status});
 }}
