const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png'};
http.createServer((req,res)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  if (pathname === '/api/ocr' && req.method === 'GET') {
    fs.readFile(path.join(root,'ocr-data.json'),'utf8',(error,data)=>{
      if(error && error.code!=='ENOENT'){res.writeHead(500).end();return;}
      res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(data||'{}');
    });
    return;
  }
  if (pathname === '/api/ocr' && req.method === 'POST') {
    let body='';
    req.on('data',chunk=>{body+=chunk;if(body.length>2_000_000){req.destroy();}});
    req.on('end',()=>{
      try {
        const value=JSON.parse(body);
        if(!value||typeof value!=='object'||Array.isArray(value)) throw new Error('invalid data');
        fs.writeFile(path.join(root,'ocr-data.json'),JSON.stringify(value,null,2),'utf8',error=>{
          if(error){res.writeHead(500).end('Could not save OCR');return;}
          res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'}).end('{"saved":true}');
        });
      } catch { res.writeHead(400).end('Invalid OCR data'); }
    });
    return;
  }
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) && file !== path.join(root,'index.html')) { res.writeHead(403).end('Forbidden'); return; }
  fs.readFile(file,(error,data)=>{
    if(error){res.writeHead(error.code==='ENOENT'?404:500).end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(data);
  });
}).listen(8765,'127.0.0.1',()=>console.log('Biblioteca disponible en http://127.0.0.1:8765'));
