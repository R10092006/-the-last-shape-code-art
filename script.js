const canvas = document.getElementById("art");
const ctx = canvas.getContext("2d");
let W, H, dpr, particles = [], mouse = {x:-1000,y:-1000};
function resize(){
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  canvas.width = W*dpr; canvas.height = H*dpr;
  canvas.style.width = W+"px"; canvas.style.height = H+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  particles = Array.from({length:Math.min(105,Math.floor(W/10))},()=>({
    x:Math.random()*W,y:Math.random()*H,
    r:Math.random()*1.8+.3,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,
    a:Math.random()*.55+.12,phase:Math.random()*Math.PI*2
  }));
}
function draw(){
  ctx.clearRect(0,0,W,H);
  // distant red arena glow
  const g=ctx.createRadialGradient(W*.5,H*.52,0,W*.5,H*.52,Math.max(W,H)*.72);
  g.addColorStop(0,"rgba(103,8,31,.18)");g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // perspective floor grid
  const horizon=H*.69;
  ctx.save();ctx.strokeStyle="rgba(255,35,75,.13)";ctx.lineWidth=1;
  for(let i=-12;i<=12;i++){
    ctx.beginPath();ctx.moveTo(W/2+i*15,horizon);ctx.lineTo(W/2+i*W*.11,H);ctx.stroke();
  }
  for(let j=0;j<13;j++){
    const y=horizon+Math.pow(j/12,2)*H*.34;
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
  }
  ctx.restore();
  // drifting sparks with mouse interaction
  particles.forEach(p=>{
    p.x+=p.vx;p.y+=p.vy;p.phase+=.015;
    if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
    const dx=mouse.x-p.x,dy=mouse.y-p.y,dist=Math.hypot(dx,dy);
    if(dist<110){p.x-=dx/(dist||1)*.35;p.y-=dy/(dist||1)*.35;}
    ctx.beginPath();ctx.arc(p.x,p.y,p.r+Math.sin(p.phase)*.4,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,${65+Math.floor(p.a*70)},${95+Math.floor(p.a*50)},${p.a})`;ctx.fill();
  });
  // three floating geometric emblems
  const t=performance.now()*.00035;
  const symbols=[["○",W*.16,H*.31],["△",W*.84,H*.28],["□",W*.82,H*.72]];
  symbols.forEach(([s,x,y],i)=>{
    ctx.save();ctx.translate(x,y+Math.sin(t*2+i)*9);ctx.rotate(Math.sin(t+i)*.08);
    ctx.font=`${Math.max(30,Math.min(64,W*.055))}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.shadowColor="#ff244d";ctx.shadowBlur=25;ctx.fillStyle="rgba(255,48,83,.17)";ctx.fillText(s,0,0);ctx.restore();
  });
  requestAnimationFrame(draw);
}
window.addEventListener("resize",resize);
window.addEventListener("pointermove",e=>mouse={x:e.clientX,y:e.clientY});
resize();draw();

const $=id=>document.getElementById(id);
const hero=$("hero"),game=$("gamePanel"),result=$("result");
let timeLeft=30,timerId=null,progress=0,started=false,soundOn=false,audioCtx=null;
const path=$("tracePath"), cookie=$("trianglePath"), stage=$("stage");
function show(el){[hero,game,result].forEach(x=>x.classList.add("hidden"));el.classList.remove("hidden");}
function startGame(){clearInterval(timerId);timeLeft=30;progress=0;started=true;$("timer").textContent=timeLeft;$("progressBar").style.width="0%";$("gameMessage").textContent="FOLLOW THE EDGE. DON'T BREAK THE LINE.";path.style.strokeDashoffset="700";$("resultTitle").innerHTML='YOU <span>SURVIVED.</span>';show(game);timerId=setInterval(()=>{timeLeft--;$("timer").textContent=timeLeft;if(timeLeft<=0)finish(false);},1000);}
function finish(win){clearInterval(timerId);started=false;show(result);$("resultSymbol").textContent=win?"△":"×";$("resultTitle").innerHTML=win?'YOU <span>SURVIVED.</span>':'ELIMINATED.';$("resultText").textContent=win?"Precision is your power. You conquered the honeycomb.":"Time ran out. The arena waits for another attempt.";if(soundOn)tone(win?660:130,.25);}
function tone(freq,duration){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;o.type="sine";g.gain.setValueAtTime(.045,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);}catch(e){}}
function updateProgress(e){
  if(!started)return;
  const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
  const cx=r.width/2,cy=r.height/2,scale=Math.min(310,r.height*.8)/400;
  // triangle perimeter proximity; points are in SVG viewBox coordinates
  const pts=[[200,78],[306,285],[94,285],[200,78]].map(([a,b])=>[cx+(a-200)*scale,cy+(b-200)*scale]);
  let best=999;
  for(let i=0;i<3;i++){
    const [ax,ay]=pts[i],[bx,by]=pts[i+1],vx=bx-ax,vy=by-ay;
    const t=Math.max(0,Math.min(1,((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy)));
    best=Math.min(best,Math.hypot(x-(ax+t*vx),y-(ay+t*vy)));
  }
  if(best<22){progress=Math.min(100,progress+1.2);$("progressBar").style.width=progress+"%";path.style.strokeDashoffset=700-(progress/100)*700;$("gameMessage").textContent=progress>=100?"THE SHAPE IS COMPLETE.":"GOOD. KEEP YOUR HAND STEADY.";document.querySelector(".cookie-art").classList.add("tracing");if(soundOn&&Math.round(progress)%12===0)tone(340+progress*3,.06);if(progress>=100)finish(true);}
  else document.querySelector(".cookie-art").classList.remove("tracing");
}
$("enterBtn").addEventListener("click",startGame);
$("againBtn").addEventListener("click",startGame);
$("resetBtn").addEventListener("click",startGame);
stage.addEventListener("pointermove",updateProgress);
$("aboutBtn").addEventListener("click",()=>$("aboutModal").classList.remove("hidden"));
$("closeAbout").addEventListener("click",()=>$("aboutModal").classList.add("hidden"));
$("aboutModal").addEventListener("click",e=>{if(e.target===$("aboutModal"))$("aboutModal").classList.add("hidden");});
$("soundToggle").addEventListener("click",()=>{soundOn=!soundOn;$("soundToggle").textContent="SOUND: "+(soundOn?"ON":"OFF");if(soundOn)tone(440,.12);});
window.addEventListener("keydown",e=>{if(e.key==="Escape"){clearInterval(timerId);started=false;show(hero);$("aboutModal").classList.add("hidden");}});
