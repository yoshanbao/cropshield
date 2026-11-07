// Published credentials are exclusively for isolated, local capstone demonstrations.
// These accounts never use passwordless role switching.
export const DEMO_ACCOUNTS=[
 {id:'worker-1',name:'Demo worker 1',role:'WORKER' as const,label:'Worker',email:'worker-1@demo.cropshield.local',password:'WorkerDemo123!'},
 {id:'worker-2',name:'Demo worker 2',role:'WORKER' as const,label:'Worker 2',email:'worker-2@demo.cropshield.local',password:'WorkerDemo123!'},
 {id:'owner',name:'Demo farm owner',role:'OWNER' as const,label:'Owner',email:'owner@demo.cropshield.local',password:'OwnerDemo123!'},
 {id:'admin',name:'Demo administrator',role:'ADMIN' as const,label:'Admin',email:'admin@demo.cropshield.local',password:'AdminDemo123!'},
];
