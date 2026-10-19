import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url)),port=Number(process.env.PORT||4191);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
 const filename=path.resolve(root,`.${pathname==='/'?'/index.html':pathname}`),relative=path.relative(root,filename);
 if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(/[\\/]/).some(segment=>segment.startsWith('.'))){res.writeHead(403);res.end();return;}
 try{const info=await stat(filename);if(!info.isFile())throw new Error('not a file');res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')res.end();else res.end(await readFile(filename));}
 catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Infinity Ring local preview listening at http://127.0.0.1:${port}/`));
