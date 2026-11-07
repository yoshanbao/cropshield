import {NextRequest,NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';import {prisma} from '@/lib/prisma';
import {bodyOf,safeError} from '@/lib/workspace';
import {validateAccountInput,AccountValidationError} from '@/lib/accountValidation';
import {checkRateLimit,pruneRateLimitBuckets} from '@/lib/rateLimit';
import {Prisma} from '@prisma/client';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{
  const body=await bodyOf(req);const data=validateAccountInput(body);
  pruneRateLimitBuckets(60000);if(!checkRateLimit('register',10,60000).allowed)return NextResponse.json({error:'Too many registration attempts. Wait a minute and try again.'},{status:429});
  await prisma.user.create({data:{name:data.name,email:data.email,passwordHash:await bcrypt.hash(data.password,12),role:'WORKER',active:true,isDemo:false}});
  return NextResponse.json({registered:true},{status:201});
 }catch(e){
  if(e instanceof AccountValidationError)return NextResponse.json({error:e.message,fields:e.fields},{status:400});
  if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2002')return NextResponse.json({error:'An account already uses this email. Log in or use another email.',fields:{email:'This email is already registered.'}},{status:409});
  const r=safeError(e);return NextResponse.json({error:r.error},{status:r.status});
 }}
