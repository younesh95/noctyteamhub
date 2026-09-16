export {};
declare global {interface Window {noctys?:{
 keyStatus():Promise<boolean>;setKey(key:string):Promise<void>;
 faceit(path:string):Promise<any>;login(credentials:Record<string,unknown>):Promise<any>;
}}}
