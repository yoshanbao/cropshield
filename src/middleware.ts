import {NextRequest,NextResponse} from 'next/server';
// Fast redirect only: cookie presence is NOT authorization. Every protected
// server page verifies the signed session and current DB role in pageAccess.ts;
// every protected API independently checks actorForRequest().
export function middleware(request:NextRequest){
 const names=['authjs.session-token','__Secure-authjs.session-token','next-auth.session-token','__Secure-next-auth.session-token'];
 const hasCookie=request.cookies.getAll().some(c=>names.some(name=>c.name===name||c.name.startsWith(name+'.')));
 if(!hasCookie)return NextResponse.redirect(new URL('/login',request.url));
 return NextResponse.next();
}
export const config={matcher:['/','/worker/:path*','/owner/:path*','/admin/:path*','/dashboard/:path*','/screen','/access-denied']};
