(self.webpackChunkaxidraw_web=self.webpackChunkaxidraw_web||[]).push([[337],{5374:function(e,t,n){"use strict";n.d(t,{G7:function(){return r},Hr:function(){return i},d4:function(){return o},Pz:function(){return a},x1:function(){return l}});const r="\r",i="\r\n",o="\n\r",a="OK\r\n",l=1},475:function(e,t,n){"use strict";n.d(t,{em:function(){return a.Z},hm:function(){return l},qb:function(){return s.Z},qs:function(){return u},r:function(){return c.Z},sm:function(){return d.Z},sp:function(){return m.Z}});var r=n(848),i=n(5374);(0,r.fA)("A","Get analog values",(function*(){const e=yield"A\r",t=yield*(0,r.Tb)(i.Hr,e);return(0,r.F7)(t,(e=>e.trim().substr(2).split(",").reduce(((e,t)=>{const[n,i]=t.split(":");return{...e,[(0,r.Hq)(n)]:(0,r.Hq)(i)}}),{})))}),{version:"2.2.3"});var o=n(1980);(0,r.fA)("AC","Analog configure",(function*(e,t){const n=yield`AC,${[e,t].join(",")}\r`;return yield*(0,o.Z)(n)}),{version:"2.2.3"}),(0,r.fA)("BL","Enter bootloader",(function*(){const e=yield"BL\r";return yield*(0,o.Z)(e)}),{version:"1.9.5"}),(0,r.fA)("C","Configure pin direction",(function*(e,t,n,r,i){const a=yield`C,${[e,t,n,r,i].join(",")}\r`;return yield*(0,o.Z)(a)})),(0,r.fA)("CK","Check input",(function*(e,t,n,o,a,l,s,u){const c=yield`CK,${[e,t,n,o,a,l,s,u].join(",")}\r`,d=yield*(0,r.Tb)(i.Pz,c);return(0,r.F7)(d,(e=>e.substring(0,e.length-6).split(/\s+/).map(((e,t)=>{const n=e.split("=")[1];return t<6?(0,r.Hq)(n):n}))))})),(0,r.fA)("CS","Clear step position",(function*(){const e=yield"CS\r";return yield*(0,o.Z)(e)}),{version:"2.4.3"}),(0,r.fA)("CU","Configure user options",(function*(e,t){const n=yield`CU,${[e,t].join(",")}\r`;return yield*(0,o.Z)(n)}));var a=n(3326);(0,r.fA)("ES","E stop",(function*(e){const t=yield(0,r.iW)("ES",e),n=yield*(0,r.Tb)(i.Pz,t);return(0,r.F7)(n,(e=>{const t=e.substring(0,e.length-6).split(",").map(r.Hq);return{interrupted:t[0],axis1:{steps:t[1],remain:t[3]},axis2:{steps:t[2],remain:t[4]}}}))}),{version:"2.2.7"});var l=(0,r.fA)("HM","Home or absolute move",(function*(e,t,n){const i=yield(0,r.iW)(`HM,${e}`,t,n);return yield*(0,o.Z)(i)}),{execution:i.x1,version:"2.6.2"});(0,r.fA)("I","Input (digital)",(function*(){const e=yield"I\r",t=yield*(0,r.Tb)(i.Hr,e);return(0,r.F7)(t,(e=>e.trim().substr(2).split(",").map(r.Hq)))})),(0,r.fA)("LM","Low-level move, step-limited",(function*(e,t,n,i,a,l,s){const u=yield(0,r.iW)(`LM,${[e,t,n,i,a,l].join(",")}`,s);return yield*(0,o.Z)(u)}),{execution:i.x1,version:"2.7.0"}),(0,r.fA)("LT","Low-level move, time-limited",(function*(e,t,n,i,a,l){const s=yield(0,r.iW)(`LT,${[e,t,n,i,a].join(",")}`,l);return yield*(0,o.Z)(s)}),{execution:i.x1,version:"2.7.0"}),(0,r.fA)("MR","Memory Read",(function*(e){const t=yield`MR,${e}\r`,n=yield*(0,r.Tb)(i.Hr,t);return(0,r.F7)(n,(e=>(0,r.Hq)(e.substr(3))))})),(0,r.fA)("MW","Memory Write",(function*(e,t){const n=yield`MW,${e},${t}\r`;return yield*(0,o.Z)(n)})),(0,r.fA)("ND","Node count decrement",(function*(){const e=yield"ND\r";return yield*(0,o.Z)(e)}),{version:"1.9.5"}),(0,r.fA)("NI","Node count increment",(function*(){const e=yield"NI\r";return yield*(0,o.Z)(e)}),{version:"1.9.5"}),(0,r.fA)("O","Output (digital)",(function*(e,t,n,i,a){const l=yield(0,r.iW)(`O,${e}`,t,n,i,a);return yield*(0,o.Z)(l)})),(0,r.fA)("PC","Pulse configure",(function*(e,t,n,i,a,l,s,u){const c=yield(0,r.iW)(`PC,${e},${t}`,n,i,a,l,s,u);return yield*(0,o.Z)(c)})),(0,r.fA)("PD","Pin direction",(function*(e,t,n){const r=yield`PD,${e},${t},${n}\r`;return yield*(0,o.Z)(r)})),(0,r.fA)("PG","Pulse go",(function*(e){const t=yield`PG,${e}\r`;return yield*(0,o.Z)(t)})),(0,r.fA)("PI","Pin input",(function*(e,t){const n=yield`PI,${e},${t}\r`,o=yield*(0,r.Tb)(i.Hr,n);return(0,r.F7)(o,(e=>(0,r.Hq)(e.substr(3))))})),(0,r.fA)("PO","Pin output",(function*(e,t,n){const r=yield`PO,${e},${t},${n}\r`;return yield*(0,o.Z)(r)}));var s=n(8315);(0,r.fA)("QC","Query current",(function*(){const e=yield"QC\r",t=yield*(0,r.Tb)(i.Pz,e);return(0,r.F7)(t,(e=>{const t=e.substring(0,e.length-6).split(",").map((e=>((0,r.Hq)(e)/1023*3.3).toFixed(2)));return{ra0:{voltage:t[0],maxCurrent:(t[0]/1.76).toFixed(2)},vPlus:{voltage:(9.2*t[1]+.3).toFixed(2)}}}))}),{version:"2.2.3"}),(0,r.fA)("QE","Query motor enable",(function*(){const e=yield"QE\r",t=yield*(0,r.Tb)(i.Pz,e);return(0,r.F7)(t,(e=>e.substring(0,e.length-6).split(",").map(r.Hq)))}),{version:"2.8.0"}),(0,r.fA)("QG","Query general",(function*(){const e=yield"QG\r",t=yield*(0,r.Tb)(i.Hr,e);return(0,r.F7)(t,(e=>{const t=(0,r.Hq)(e);return{fifo:(1&t)>0,mtr2:(2&t)>0,mtr1:(4&t)>0,cmd:(8&t)>0,pen:(16&t)>0,prg:(32&t)>0,rb2:(64&t)>0,rb5:(128&t)>0}}))}),{version:"2.6.2"}),(0,r.fA)("QL","Query layer",(function*(){const e=yield"QL\r",t=yield*(0,r.Tb)(i.Pz,e);return(0,r.F7)(t,(e=>(0,r.Hq)(e)))}),{version:"1.9.2"}),(0,r.fA)("QM","Query motors",(function*(){const e=yield"QM\r",t=yield*(0,r.Tb)(i.d4,e);return(0,r.F7)(t,(e=>{const t=e.trim().substr(3).split(",").map(r.Hq);return{command:t[0],motor1:t[1],motor2:t[2],fifo:t[3]}}))}),{version:"2.4.4"}),(0,r.fA)("QN","Query node count",(function*(){const e=yield"QN\r",t=yield*(0,r.Tb)(i.Pz,e);return(0,r.F7)(t,(e=>(0,r.Hq)(e)))}),{version:"1.9.2"}),(0,r.fA)("QP","Query pen",(function*(){const e=yield"QP\r",t=yield*(0,r.Tb)(i.Pz,e);return(0,r.F7)(t,(e=>(0,r.Hq)(e)))}),{version:"1.9.0"}),(0,r.fA)("QR","Query RC Servo power state",(function*(){const e=yield"QR\r",t=yield*(0,r.Tb)(i.Pz,e);return(0,r.F7)(t,(e=>(0,r.Hq)(e)))}),{version:"2.6.0"});var u=(0,r.fA)("QS","Query step position",(function*(){const e=yield"QS\r",t=yield*(0,r.Tb)(i.Pz,e);return(0,r.F7)(t,(e=>{const t=e.substring(0,e.length-6).split(",").map(r.Hq);return{a1:t[0],a2:t[1]}}))}),{version:"2.4.3"});(0,r.fA)("QT","Query EBB nickname tag",(function*(){const e=yield"QT\r",t=yield*(0,r.Tb)(i.Pz,e);return(0,r.F7)(t,(e=>e.substring(0,e.length-6)))}),{version:"2.5.4"});var c=n(5707);(0,r.fA)("RB","Reboot",(function*(){return"RB\r"}),{version:"2.5.4"}),(0,r.fA)("S2","General RC Servo output",(function*(e,t,n,i){const a=yield(0,r.iW)(`S2,${e},${t}`,n,i);return yield*(0,o.Z)(a)}),{execution:i.x1,version:"2.2.0"}),(0,r.fA)("SC","Stepper and Servo mode configure",(function*(e,t){const n=yield`SC,${e},${t}\r`;return yield*(0,o.Z)(n)})),(0,r.fA)("SE","Set engraver",(function*(e,t,n){const i=yield(0,r.iW)(`SE,${e}`,t,n);return yield*(0,o.Z)(i)}),{execution:i.x1,version:"2.1.0"}),(0,r.fA)("SL","Set layer",(function*(e){const t=yield`SL,${e}\r`;return yield*(0,o.Z)(t)}),{version:"1.9.2"});var d=n(1632);(0,r.fA)("SN","Set node count",(function*(e){const t=yield`SN,${e}\r`;return yield*(0,o.Z)(t)}),{version:"1.9.5"});var m=n(1519);(0,r.fA)("SR","Set RC Servo power timeout",(function*(e,t){const n=yield(0,r.iW)(`SR,${e}`,t);return yield*(0,o.Z)(n)}),{version:"2.6.0"}),(0,r.fA)("ST","Set EBB nickname tag",(function*(e){const t=yield`ST,${e}\r`;return yield*(0,o.Z)(t)}),{version:"2.5.5"}),(0,r.fA)("T","Timed analog/digital read",(function*(e,t){const n=yield`T,${e},${t}\r`;return yield*(0,o.Z)(n)})),(0,r.fA)("TP","Toggle pen",(function*(e){const t=yield(0,r.iW)("TP",e);return yield*(0,o.Z)(t)}),{version:"1.9.0"}),n(2206),(0,r.fA)("XM","Stepper move, mixed-axis geometries",(function*(e,t,n){const r=yield`XM,${e},${t},${n}\r`;return yield*(0,o.Z)(r)}),{execution:i.x1,version:"2.3.0"})},8337:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return W}});var r={};n.r(r),n.d(r,{theWheelOnTheBus:function(){return L},twinkleTwinkleLittleStar:function(){return M}});var i=n(7294),o=n(6370),a=n(4184),l=n.n(a),s=n(3379),u=n.n(s),c=n(7795),d=n.n(c),m=n(695),f=n.n(m),p=n(9216),y=n.n(p),b=n(1573),v={styleTagTransform:function(e,t){if(t.styleSheet)t.styleSheet.cssText=e;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(e))}},setAttributes:function(e){var t=n.nc;t&&e.setAttribute("nonce",t)},insert:function(e){var t=f()("head");if(!t)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");t.appendChild(e)}};v.domAPI=d(),v.insertStyleElement=y(),u()(b.Z,v);var C=b.Z&&b.Z.locals?b.Z.locals:void 0,h=n(2105),A=n(2888),E={styleTagTransform:function(e,t){if(t.styleSheet)t.styleSheet.cssText=e;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(e))}},setAttributes:function(e){var t=n.nc;t&&e.setAttribute("nonce",t)},insert:function(e){var t=f()("head");if(!t)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");t.appendChild(e)}};E.domAPI=d(),E.insertStyleElement=y(),u()(A.Z,E);var g=A.Z&&A.Z.locals?A.Z.locals:void 0,q=()=>i.createElement("div",{className:g.root},i.createElement("p",null,"AxiDraw Web © 2021 mutoo.im"),i.createElement("p",null,"Build: ","production")),G=n(5697),x=n.n(G),w=n(2221),Z=n(5589),S=n(475),T=n(9062);const j=(e,t,n)=>({title:e,channel1:t,channel2:n}),P=e=>e.flatMap((e=>e)),$=["C","C#","D","Eb","E","F","F#","G","G#","A","Bb","B"],F=(e,t)=>{const n=$.indexOf(e);return-1===n?0:55*2**((60+12*(t-4)+n-33)/12)},Q={w:4,h:2,q:1,e:.5,s:.25},D=e=>{const t=e.match(/^([whqes]+)([0DA]|[CFG]#?|[EB]b?)(\d)?$/);if(!t)throw new Error(`Can not parse note: ${e}`);const[n,r,i,o]=t;return{beats:r.split("").reduce(((e,t)=>e+Q[t]),0),frequency:F(i,parseInt(o,10))}},N=e=>{var t;return null!==(t=null==e?void 0:e.beats)&&void 0!==t?t:Number.MAX_VALUE},H=e=>{var t;return null!==(t=null==e?void 0:e.beats)&&void 0!==t?t:Number.MIN_VALUE};var M=j("Twinkle twinkle little star",P([["qC5","qC5","qG5","qG5","qA5","qA5","hG5"],["qF5","qF5","qE5","qE5","qD5","qD5","hC5"],["qG5","qG5","qF5","qF5","qE5","qE5","hD5"],["qG5","qG5","qF5","qF5","qE5","qE5","hD5"],["qC5","qC5","qG5","qG5","qA5","qA5","hG5"],["qF5","qF5","qE5","qE5","qD5","qD5","hC5"]]),P([["eC4","eG4","eE4","eG4","eC4","eG4","eE4","eG4","eC4","eA4","eD4","eA4","eC4","eG4","eE4","eG4"],["eC4","eA4","eD4","eA4","eC4","eG4","eE4","eG4","eA3","eG4","eD4","eG4","eC4","eG4","eE4","eG4"],["eC4","eG4","eE4","eG4","eC4","eA4","eF4","eA4","eC3","eG4","eE4","eG4","eA3","eG4","eD4","eG4"],["eC4","eG4","eE4","eG4","eC4","eA4","eF4","eA4","eC3","eG4","eE4","eG4","eA3","eG4","eD4","eG4"],["eC4","eG4","eE4","eG4","eC4","eG4","eE4","eG4","eC4","eA4","eD4","eA4","eC4","eG4","eE4","eG4"],["eC4","eA4","eD4","eA4","eC4","eG4","eE4","eG4","eA3","eG4","eD4","eG4","eC4","eG4","eE4","eG4"]])),L=j("The wheels on the bus",P([["eG4"],["eC5","sC5","sC5","eC5","eE5","eG5","eE5","qC5"],["eD5","eD5","qD5","eB4","eA4","esG4","sG4"],["eC5","sC5","sC5","eC5","eE5","eG5","eE5","qC5"],["qD5","esG4","sG4","qeC5"]]),[]);const k=Object.keys(r),R=({device:e})=>{const[t,n]=(0,i.useState)(k[0]),[o,a]=(0,i.useState)(""),[l,s]=(0,i.useState)(""),[u,c]=(0,i.useState)(88),[d,m]=(0,i.useState)(1),[f,p]=(0,i.useState)(!1),[y,b]=(0,i.useState)(!1),v=(0,i.useRef)(!1),[C,A]=(0,i.useState)("");(0,i.useEffect)((()=>{const e=r[t];e&&(a(e.channel1.join(", ")),s(e.channel2.join(", ")))}),[t]);const E=(0,i.useCallback)((async t=>{t.preventDefault();try{const t=function(e,t){const n=60/t,r=(e=>{const t=[],n={beats:0,i:0,j:0},{channel1:r,channel2:i}=e;for(;;){const e=r[n.i],o=i[n.j];if(!e&&!o)break;const a=Math.min(N(e),N(o));Math.max(H(e),H(o))!==a||n.ii||n.jj?o?e?(n.ii?n.ii-=a:n.ii=e.beats-a,n.jj?n.jj-=a:n.jj=o.beats-a,n.beats=a,t.push({...n}),0===n.ii&&(n.i+=1),0===n.jj&&(n.j+=1)):(n.i=null,n.jj?(n.beats=n.jj,n.jj=0):n.beats=o.beats,t.push({...n}),n.j+=1):(n.j=null,n.ii?(n.beats=n.ii,n.ii=0):n.beats=e.beats,t.push({...n}),n.i+=1):(n.beats=a,t.push({...n}),n.i+=1,n.j+=1)}return t})(e);return r.map(((t,i)=>{const{beats:o,i:a,j:l}=t,{frequency:s}=e.channel1[a]||{frequency:0},u=s*n*o|0,{frequency:c}=e.channel2[l]||{frequency:0},d=c*n*o|0,m=1e3*n*o|0,f=r[i-1];return{duration:m,step1:u,step2:d,continue1:(null==f?void 0:f.i)===a,continue2:(null==f?void 0:f.j)===l}}))}({channel1:o.split(", ").filter(Boolean).map(D),channel2:l.split(", ").filter(Boolean).map(D)},u);b(!0),await e.executeCommand(S.r),await e.executeCommand(S.em,d,d),await e.executeCommand(S.sp,f?0:1,500);for(const n of(e=>{let t=1,n=1;return e.map((e=>{const{step1:r,step2:i,duration:o}=e;return e.continue1||(t*=-1),e.continue2||(n*=-1),{step1:r*t,step2:i*n,duration:o}}))})(t)){if(await e.executeCommand(S.qb)||v.current)return await e.executeCommand(S.r),await e.executeCommand(S.sp,1,500),void(v.current=!1);await e.executeCommand(S.sm,n.duration,n.step1,n.step2)}await e.executeCommand(S.sp,1,500),await(0,T.g)(2e3);const n=await e.executeCommand(S.qs),r=Math.sqrt(n.a1**2+n.a2**2),i=1e3,a=r/i*1e3;await e.executeCommand(S.hm,i),await(0,T.g)(a),await e.executeCommand(S.r)}catch(e){A(e.toString())}finally{b(!1)}}),[e,d,u,f,o,l]);return i.createElement("form",{className:h.Z.root,onSubmit:E},i.createElement("h3",null,"Midi Commander"),i.createElement("p",null,"Compose notes and send commands to device."),i.createElement("label",{className:h.Z.inputLabel},i.createElement("span",null,"Song:"),i.createElement("select",{defaultValue:t,onChange:e=>n(e.target.value),disabled:y},k.map((e=>i.createElement("option",{key:e,value:e},r[e].title))))),i.createElement("label",{className:h.Z.inputLabel},i.createElement("span",null,"Channel 1:"),i.createElement("textarea",{rows:"3",disabled:y,value:o,onChange:e=>a(e.target.value)})),i.createElement("label",{className:h.Z.inputLabel},i.createElement("span",null,"Channel 2:"),i.createElement("textarea",{rows:"3",disabled:y,value:l,onChange:e=>s(e.target.value)})),i.createElement("div",{className:"grid grid-cols-2 gap-6"},i.createElement("label",{className:h.Z.inputLabel},i.createElement("span",null,"Beats Per Minute:"),i.createElement("input",{type:"number",min:10,max:200,value:u,disabled:y,onChange:e=>c(e.target.value)})),i.createElement("label",{className:h.Z.inputLabel},i.createElement("span",null,"Motor Mode:"),i.createElement("input",{type:"number",min:1,max:5,value:d,disabled:y,onChange:e=>m(e.target.value)}))),i.createElement("label",{className:h.Z.checkboxLabel},i.createElement("input",{type:"checkbox",disabled:y,checked:f,onChange:e=>p(e.target.checked)})," ",i.createElement("span",null,"PenDown")),i.createElement(w.Z,{variant:"primary",type:y?"button":"submit",onClick:()=>{y&&(v.current=!0)}},y?"Stop":"Play"),i.createElement(Z.Z,{type:"info"},"Tip: You could also press the PRG button on device to stop playing."),i.createElement("label",{className:h.Z.inputLabel},i.createElement("span",null,"Results:"),i.createElement("textarea",{rows:"3",defaultValue:C,readOnly:!0})))};R.propTypes={device:x().object.isRequired};var B=R,W=()=>{const[e,t]=(0,i.useState)(null);return i.createElement(i.Fragment,null,i.createElement("div",{className:l()(h.Z.root,C.root)},i.createElement(o.Z,{onConnected:t,onDisconnected:()=>t(null)}),e&&i.createElement(B,{device:e})),i.createElement(q,null))}},9062:function(e,t,n){"use strict";n.d(t,{g:function(){return r},V:function(){return i}});const r=e=>new Promise((t=>{setTimeout(t,e)})),i=(e,t)=>new Promise(((n,r)=>{setTimeout((()=>{r(new Error(t))}),e)}))},2888:function(e,t,n){"use strict";var r=n(3645),i=n.n(r)()((function(e){return e[1]}));i.push([e.id,".-q3JF{--tw-text-opacity:1;color:rgba(204,204,204,var(--tw-text-opacity));font-family:Roboto,sans-serif;font-size:.875rem;line-height:1.25rem;margin-bottom:2rem;margin-top:2rem;text-align:center}",""]),i.locals={root:"-q3JF"},t.Z=i},1573:function(e,t,n){"use strict";var r=n(3645),i=n.n(r)()((function(e){return e[1]}));i.push([e.id,"._1j8A1{--tw-bg-opacity:1;--tw-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04);background-color:rgba(255,255,255,var(--tw-bg-opacity));box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow);margin-bottom:2rem;margin-left:auto;margin-right:auto;padding:2rem}@media (min-width:768px){._1j8A1{margin-top:2rem}}._1j8A1{display:grid;gap:1.5rem;grid-template-columns:repeat(1,minmax(0,1fr))}@media (min-width:768px){._1j8A1{max-width:600px}}",""]),i.locals={root:"_1j8A1"},t.Z=i}}]);