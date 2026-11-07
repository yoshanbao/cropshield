import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import {prisma} from '@/lib/prisma';
import {authConfig} from '@/auth.config';
import {checkRateLimit,pruneRateLimitBuckets} from '@/lib/rateLimit';
// Equalize the password-check path for unknown accounts without storing a usable password.
const unavailableHash=bcrypt.hashSync('unavailable-account-'+process.pid,10);
export const {handlers,auth,signIn,signOut}=NextAuth({
  ...authConfig,
  providers:[Credentials({
    credentials:{email:{label:'Email',type:'email'},password:{label:'Password',type:'password'}},
    async authorize(credentials,request){
      // Passwordless demo IDs are deliberately unsupported.
      const email=typeof credentials?.email==='string'?credentials.email.trim().toLowerCase():'';
      const password=typeof credentials?.password==='string'?credentials.password:'';
      if(!email||email.length>254||!password||new TextEncoder().encode(password).length>72)return null;
      pruneRateLimitBuckets(60000);
      if(!checkRateLimit('login:'+email,15,60000).allowed)return null;
      const user=await prisma.user.findUnique({where:{email}});
      const valid=await bcrypt.compare(password,user?.passwordHash||unavailableHash);
      if(!user?.active||!valid)return null;
      if(user.isDemo){const host=request.headers.get('host')?.split(':')[0];if(!['localhost','127.0.0.1'].includes(host||'')||(process.env.NODE_ENV==='production'&&process.env.CROPSHIELD_LOCAL_DEMO!=='true'))return null;}
      return{id:user.id,email:user.email,name:user.name,role:user.role};
    },
  })],
});
