export {};
declare global {interface Window {noctys?:{
 checkUpdate():Promise<{current:string;available:string|null}>;
 downloadUpdate():Promise<{version:string}>;
 installUpdate():Promise<boolean>;
 getConnection():Promise<import('../lib/team-connection').TeamConnection|null>;
 setConnection(value:import('../lib/team-connection').TeamConnection):Promise<void>;
 keyStatus():Promise<boolean>;setKey(key:string):Promise<void>;
 callActive(active:boolean):Promise<void>;
 faceit(path:string):Promise<any>;login(credentials:Record<string,unknown>):Promise<any>;
}}}
