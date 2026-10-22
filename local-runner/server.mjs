// Optional local Julia execution. Runs arbitrary learner source as the logged-in OS user.
// NOT A SANDBOX: only launch on your own computer and run code you trust.
import {createServer} from "node:http";
import {randomBytes, timingSafeEqual} from "node:crypto";
import {spawn} from "node:child_process";
import {mkdtemp,writeFile,readdir,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

export const MAX_CODE_BYTES=50000;
export const MAX_FIGURE_BYTES=5*1024*1024;
export const MAX_OUTPUT_BYTES=25000;
export const RUN_TIMEOUT_MS=120000;
export const DEFAULT_ORIGINS=[
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "https://julia.thiepn.dev",
  "https://julia-thiepn-project.vercel.app"
];
export const JULIA_DIAGNOSTIC_SOURCE = [
  "using Pkg",
  'println("JULIA_LAB_DIAGNOSTIC_V1")',
  'println("julia_version=", VERSION)',
  'println("platform=", Sys.iswindows() ? "windows" : Sys.isapple() ? "macos" : "linux")',
  'println("architecture=", Sys.ARCH)',
  'println("active_project=", Base.active_project() === nothing ? "none" : "present")',
  'for name in ("LinearAlgebra", "Test", "Plots", "PrettyTables")',
  '    println("package_", name, "=", Base.find_package(name) === nothing ? "missing" : "available")',
  'end'
].join("\n");
const PNG_MAGIC=Buffer.from([137,80,78,71,13,10,26,10]);
const allowedName=/^[A-Za-z0-9][A-Za-z0-9_.-]*\.(png|svg)$/i;
export function validateSource(body){
  if(!body || typeof body!=="object" || Array.isArray(body) || typeof body.code!=="string" ||
    body.code.trim().length===0 || Buffer.byteLength(body.code,"utf8")>MAX_CODE_BYTES)
    return {ok:false,error:"Julia source must be nonempty and no larger than 50 KB."};
  return {ok:true,code:body.code};
}
export function validateOrigin(origin, allowed=DEFAULT_ORIGINS){
  return typeof origin==="string" && allowed.includes(origin);
}
function eqToken(actual,expected){
  if(typeof actual!=="string")return false;
  const a=Buffer.from(actual),b=Buffer.from(expected);
  return a.length===b.length && timingSafeEqual(a,b);
}
function collect(stream){
  let total=0;const chunks=[];
  stream.on("data",chunk=>{
    if(total<MAX_OUTPUT_BYTES){const kept=chunk.subarray(0,MAX_OUTPUT_BYTES-total);chunks.push(kept);total+=kept.length;}
  });
  return ()=>Buffer.concat(chunks).toString("utf8");
}
export async function executeJulia(code,{juliaCommand=process.env.JULIA_LAB_JULIA||"julia",timeoutMs=RUN_TIMEOUT_MS}={}){
  const dir=await mkdtemp(join(tmpdir(),"julia-lab-run-"));
  try{
    await writeFile(join(dir,"exercise.jl"),code,{encoding:"utf8",mode:0o600});
    const result=await new Promise((resolve)=>{
      let settled=false,timedOut=false,spawnError=null;
      const child=spawn(juliaCommand,["--startup-file=no","--history-file=no","--color=no","exercise.jl"],{
        cwd:dir,stdio:["ignore","pipe","pipe"],windowsHide:true,
        env:{...process.env,GKSwstype:"100"},detached:process.platform!=="win32"
      });
      const stdout=collect(child.stdout),stderr=collect(child.stderr);
      const timer=setTimeout(()=>{
        timedOut=true;
        try{
          if(process.platform!=="win32")process.kill(-child.pid,"SIGKILL");
          else child.kill("SIGKILL");
        }catch{}
      },timeoutMs);
      child.once("error",error=>{spawnError=error;});
      child.once("close",(exitCode,signal)=>{
        if(settled)return;settled=true;clearTimeout(timer);
        resolve({ok:exitCode===0&&!timedOut&&!spawnError,exitCode,signal,timedOut,
          stdout:stdout(),stderr:spawnError?String(spawnError.message)+"\n"+stderr():stderr()});
      });
    });
    const figures=[];
    const names=(await readdir(dir)).filter(n=>allowedName.test(n)).sort();
    let totalBytes=0;
    for(const name of names){
      if(figures.length===3)break;
      const buffer=await readFile(join(dir,name));
      if(!buffer.length || buffer.length>MAX_FIGURE_BYTES || totalBytes+buffer.length>MAX_FIGURE_BYTES)continue;
      const png=/\.png$/i.test(name);
      if(png&&!buffer.subarray(0,8).equals(PNG_MAGIC))continue;
      if(!png&&!buffer.toString("utf8").includes("<svg"))continue;
      figures.push({name,mimeType:png?"image/png":"image/svg+xml",base64:buffer.toString("base64")});
      totalBytes+=buffer.length;
    }
    return {...result,figures};
  }finally{await rm(dir,{recursive:true,force:true,maxRetries:2,retryDelay:100});}
}
export function createLocalRunner({token=randomBytes(24).toString("hex"),origins=DEFAULT_ORIGINS,
  execute=executeJulia}={}){
  if(typeof token!=="string"||token.length<16)throw Error("Runner token must have at least 16 characters.");
  let busy=false;
  const server=createServer(async(req,res)=>{
    const origin=req.headers.origin;
    res.setHeader("Cache-Control","no-store");
    res.setHeader("X-Content-Type-Options","nosniff");
    if(!validateOrigin(origin,origins)){res.writeHead(403);res.end();return;}
    res.setHeader("Access-Control-Allow-Origin",origin);
    res.setHeader("Vary","Origin");
    res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Authorization, Content-Type");
    const send=(status,payload)=>{
      res.writeHead(status,{"Content-Type":"application/json; charset=utf-8"});
      res.end(JSON.stringify(payload));
    };
    if(req.method==="OPTIONS"){res.writeHead(204);res.end();return;}
    if(req.method!=="POST"||!["/run","/diagnose"].includes(req.url)){send(404,{error:"Unknown runner endpoint."});return;}
    const auth=req.headers.authorization;
    if(!eqToken(auth?.startsWith("Bearer ")?auth.slice(7):null,token)){
      send(401,{error:"Invalid session access code."});return;
    }
    if(busy){send(409,{error:"Julia is still running another program."});return;}
    if(req.url==="/diagnose"){
      busy=true;
      try{const result=await execute(JULIA_DIAGNOSTIC_SOURCE);send(200,{...result,figures:[]});}
      catch(error){send(500,{error:"Julia diagnostics could not complete: "+String(error.message||error)});}
      finally{busy=false;}
      return;
    }
    if(!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"]||"")){
      send(415,{error:"Expected a JSON request."});return;
    }
    let bytes=0,chunks=[];
    try{
      for await(const part of req){
        bytes+=part.length;
        if(bytes>MAX_CODE_BYTES*2){send(413,{error:"Request is too large."});return;}
        chunks.push(part);
      }
      const parsed=JSON.parse(Buffer.concat(chunks).toString("utf8"));
      const checked=validateSource(parsed);
      if(!checked.ok){send(400,{error:checked.error});return;}
      if(busy){send(409,{error:"Julia is still running another program."});return;}
      busy=true;
      try{send(200,await execute(checked.code));}
      catch(error){send(500,{error:"Local Julia could not complete: "+String(error.message||error)});}
      finally{busy=false;}
    }catch{
      if(!res.writableEnded)send(400,{error:"Request body must contain valid JSON."});
    }
  });
  return {server,token,listen:({port=8765,host="127.0.0.1"}={})=>new Promise((resolve,reject)=>{
    server.once("error",reject);
    server.listen(port,host,()=>{server.off("error",reject);resolve(server.address());});
  }),close:()=>new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const runner=createLocalRunner();
  const port=Number(process.env.JULIA_LAB_RUNNER_PORT||8765);
  const extra=(process.env.JULIA_LAB_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);
  // The explicit overrides are only accepted when supplied by the machine owner.
  if(!Number.isInteger(port)||port<1024||port>65535)throw Error("Invalid runner port.");
  const configured=extra.length?createLocalRunner({origins:[...DEFAULT_ORIGINS,...extra]}):runner;
  await configured.listen({port});
  console.log("Julia Lab local runner on http://127.0.0.1:"+port);
  console.log("Session access code: "+configured.token);
  console.log("Only paste this code into Julia Lab. This is NOT a sandbox. Stop with Ctrl+C.");
}
