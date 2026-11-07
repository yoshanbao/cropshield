export type AccountRole='Worker'|'Owner'|'Administrator';
export class AccountValidationError extends Error {
  constructor(public fields:Record<string,string>){super('Check the highlighted account details.');}
}
export function validateAccountInput(raw:Record<string,unknown>, privileged=false){
  const fields:Record<string,string>={};
  const name=typeof raw.name==='string'?raw.name.trim():'';
  const email=typeof raw.email==='string'?raw.email.trim().toLowerCase():'';
  const password=typeof raw.password==='string'?raw.password:'';
  const confirmation=typeof raw.confirmPassword==='string'?raw.confirmPassword:'';
  const role=typeof raw.role==='string'?raw.role:'Worker';
  if(name.length<2||name.length>80||/[\u0000-\u001f]/.test(name))fields.name='Use a name between 2 and 80 characters.';
  if(email.length>191||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fields.email='Enter a valid email address.';
  if(password.length<10)fields.password='Use at least 10 characters.';
  else if(new TextEncoder().encode(password).length>72)fields.password='This password is too long. Use a shorter password.';
  if(password!==confirmation)fields.confirmPassword='The passwords do not match.';
  if(!['Worker','Owner','Administrator'].includes(role)||(!privileged&&role!=='Worker'))fields.role=privileged?'Choose Worker, Owner, or Administrator.':'Public registration creates a worker account. An administrator manages other roles.';
  if(Object.keys(fields).length)throw new AccountValidationError(fields);
  return{name,email,password,role:role as AccountRole};
}
export function databaseRole(role:AccountRole){return role==='Administrator'?'ADMIN' as const:role==='Owner'?'OWNER' as const:'WORKER' as const;}
export function roleHome(role:string){return role==='ADMIN'||role==='Administrator'?'/admin':role==='OWNER'||role==='Owner'?'/owner':'/worker';}
