import type {PrismaClient} from '@prisma/client';import bcrypt from 'bcryptjs';
import {DEMO_ACCOUNTS} from '../src/lib/demoAccounts';
export async function seedDemoAccounts(prisma:PrismaClient){
 for(const account of DEMO_ACCOUNTS){
  const existing=await prisma.user.findUnique({where:{id:account.id}});
  if(existing&&!existing.isDemo)throw new Error('A demo account ID is already used by a real account. No password was changed.');
  const data={name:account.name,email:account.email,role:account.role,active:true,isDemo:true,passwordHash:await bcrypt.hash(account.password,12)};
  await prisma.user.upsert({where:{id:account.id},create:{id:account.id,...data},update:data});
 }
}
