(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(r){if(r.ep)return;r.ep=!0;const s=e(r);fetch(r.href,s)}})();/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Gs="170",ni={ROTATE:0,DOLLY:1,PAN:2},ti={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},sl=0,ua=1,al=2,vo=1,ol=2,Je=3,xn=0,Se=1,tn=2,gn=0,ii=1,fa=2,da=3,pa=4,ll=5,Pn=100,cl=101,hl=102,ul=103,fl=104,dl=200,pl=201,ml=202,_l=203,ts=204,es=205,gl=206,vl=207,xl=208,Sl=209,Ml=210,yl=211,El=212,bl=213,Tl=214,ns=0,is=1,rs=2,oi=3,ss=4,as=5,os=6,ls=7,Vs=0,wl=1,Al=2,vn=0,Rl=1,Cl=2,Pl=3,Dl=4,Ll=5,Il=6,Ul=7,xo=300,li=301,ci=302,cs=303,hs=304,mr=306,us=1e3,Ln=1001,fs=1002,Oe=1003,Nl=1004,Ui=1005,He=1006,Sr=1007,In=1008,sn=1009,So=1010,Mo=1011,Ti=1012,Ws=1013,Un=1014,en=1015,Ai=1016,Xs=1017,Ys=1018,hi=1020,yo=35902,Eo=1021,bo=1022,Fe=1023,To=1024,wo=1025,ri=1026,ui=1027,Ao=1028,qs=1029,Ro=1030,js=1031,Zs=1033,sr=33776,ar=33777,or=33778,lr=33779,ds=35840,ps=35841,ms=35842,_s=35843,gs=36196,vs=37492,xs=37496,Ss=37808,Ms=37809,ys=37810,Es=37811,bs=37812,Ts=37813,ws=37814,As=37815,Rs=37816,Cs=37817,Ps=37818,Ds=37819,Ls=37820,Is=37821,cr=36492,Us=36494,Ns=36495,Co=36283,Fs=36284,Os=36285,Bs=36286,Fl=3200,Ol=3201,Po=0,Bl=1,_n="",Ae="srgb",di="srgb-linear",_r="linear",Jt="srgb",kn=7680,ma=519,zl=512,kl=513,Hl=514,Do=515,Gl=516,Vl=517,Wl=518,Xl=519,_a=35044,ga="300 es",nn=2e3,fr=2001;class Bn{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const r=this._listeners[t];if(r!==void 0){const s=r.indexOf(e);s!==-1&&r.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const r=n.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,t);t.target=null}}}const fe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],hr=Math.PI/180,zs=180/Math.PI;function Ri(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(fe[i&255]+fe[i>>8&255]+fe[i>>16&255]+fe[i>>24&255]+"-"+fe[t&255]+fe[t>>8&255]+"-"+fe[t>>16&15|64]+fe[t>>24&255]+"-"+fe[e&63|128]+fe[e>>8&255]+"-"+fe[e>>16&255]+fe[e>>24&255]+fe[n&255]+fe[n>>8&255]+fe[n>>16&255]+fe[n>>24&255]).toLowerCase()}function _e(i,t,e){return Math.max(t,Math.min(e,i))}function Yl(i,t){return(i%t+t)%t}function Mr(i,t,e){return(1-e)*i+e*t}function vi(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function ve(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const ql={DEG2RAD:hr};class Ht{constructor(t=0,e=0){Ht.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6],this.y=r[1]*e+r[4]*n+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(_e(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),r=Math.sin(e),s=this.x-t.x,o=this.y-t.y;return this.x=s*n-o*r+t.x,this.y=s*r+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class kt{constructor(t,e,n,r,s,o,a,l,h){kt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,r,s,o,a,l,h)}set(t,e,n,r,s,o,a,l,h){const d=this.elements;return d[0]=t,d[1]=r,d[2]=a,d[3]=e,d[4]=s,d[5]=l,d[6]=n,d[7]=o,d[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,r=e.elements,s=this.elements,o=n[0],a=n[3],l=n[6],h=n[1],d=n[4],p=n[7],m=n[2],u=n[5],v=n[8],g=r[0],f=r[3],c=r[6],M=r[1],E=r[4],y=r[7],D=r[2],L=r[5],P=r[8];return s[0]=o*g+a*M+l*D,s[3]=o*f+a*E+l*L,s[6]=o*c+a*y+l*P,s[1]=h*g+d*M+p*D,s[4]=h*f+d*E+p*L,s[7]=h*c+d*y+p*P,s[2]=m*g+u*M+v*D,s[5]=m*f+u*E+v*L,s[8]=m*c+u*y+v*P,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],o=t[4],a=t[5],l=t[6],h=t[7],d=t[8];return e*o*d-e*a*h-n*s*d+n*a*l+r*s*h-r*o*l}invert(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],o=t[4],a=t[5],l=t[6],h=t[7],d=t[8],p=d*o-a*h,m=a*l-d*s,u=h*s-o*l,v=e*p+n*m+r*u;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);const g=1/v;return t[0]=p*g,t[1]=(r*h-d*n)*g,t[2]=(a*n-r*o)*g,t[3]=m*g,t[4]=(d*e-r*l)*g,t[5]=(r*s-a*e)*g,t[6]=u*g,t[7]=(n*l-h*e)*g,t[8]=(o*e-n*s)*g,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,r,s,o,a){const l=Math.cos(s),h=Math.sin(s);return this.set(n*l,n*h,-n*(l*o+h*a)+o+t,-r*h,r*l,-r*(-h*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(yr.makeScale(t,e)),this}rotate(t){return this.premultiply(yr.makeRotation(-t)),this}translate(t,e){return this.premultiply(yr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let r=0;r<9;r++)if(e[r]!==n[r])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const yr=new kt;function Lo(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function dr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function jl(){const i=dr("canvas");return i.style.display="block",i}const va={};function Ei(i){i in va||(va[i]=!0,console.warn(i))}function Zl(i,t,e){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}setTimeout(s,e)})}function Kl(i){const t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function $l(i){const t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const Xt={enabled:!0,workingColorSpace:di,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===Jt&&(i.r=rn(i.r),i.g=rn(i.g),i.b=rn(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===Jt&&(i.r=si(i.r),i.g=si(i.g),i.b=si(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===_n?_r:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function rn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function si(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const xa=[.64,.33,.3,.6,.15,.06],Sa=[.2126,.7152,.0722],Ma=[.3127,.329],ya=new kt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Ea=new kt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Xt.define({[di]:{primaries:xa,whitePoint:Ma,transfer:_r,toXYZ:ya,fromXYZ:Ea,luminanceCoefficients:Sa,workingColorSpaceConfig:{unpackColorSpace:Ae},outputColorSpaceConfig:{drawingBufferColorSpace:Ae}},[Ae]:{primaries:xa,whitePoint:Ma,transfer:Jt,toXYZ:ya,fromXYZ:Ea,luminanceCoefficients:Sa,outputColorSpaceConfig:{drawingBufferColorSpace:Ae}}});let Hn;class Jl{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Hn===void 0&&(Hn=dr("canvas")),Hn.width=t.width,Hn.height=t.height;const n=Hn.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Hn}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=dr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const r=n.getImageData(0,0,t.width,t.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=rn(s[o]/255)*255;return n.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(rn(e[n]/255)*255):e[n]=rn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Ql=0;class Io{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ql++}),this.uuid=Ri(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(Er(r[o].image)):s.push(Er(r[o]))}else s=Er(r);n.url=s}return e||(t.images[this.uuid]=n),n}}function Er(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Jl.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let tc=0;class Me extends Bn{constructor(t=Me.DEFAULT_IMAGE,e=Me.DEFAULT_MAPPING,n=Ln,r=Ln,s=He,o=In,a=Fe,l=sn,h=Me.DEFAULT_ANISOTROPY,d=_n){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:tc++}),this.uuid=Ri(),this.name="",this.source=new Io(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=h,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Ht(0,0),this.repeat=new Ht(1,1),this.center=new Ht(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new kt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==xo)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case us:t.x=t.x-Math.floor(t.x);break;case Ln:t.x=t.x<0?0:1;break;case fs:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case us:t.y=t.y-Math.floor(t.y);break;case Ln:t.y=t.y<0?0:1;break;case fs:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Me.DEFAULT_IMAGE=null;Me.DEFAULT_MAPPING=xo;Me.DEFAULT_ANISOTROPY=1;class re{constructor(t=0,e=0,n=0,r=1){re.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,r){return this.x=t,this.y=e,this.z=n,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,r=this.z,s=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*r+o[12]*s,this.y=o[1]*e+o[5]*n+o[9]*r+o[13]*s,this.z=o[2]*e+o[6]*n+o[10]*r+o[14]*s,this.w=o[3]*e+o[7]*n+o[11]*r+o[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,r,s;const l=t.elements,h=l[0],d=l[4],p=l[8],m=l[1],u=l[5],v=l[9],g=l[2],f=l[6],c=l[10];if(Math.abs(d-m)<.01&&Math.abs(p-g)<.01&&Math.abs(v-f)<.01){if(Math.abs(d+m)<.1&&Math.abs(p+g)<.1&&Math.abs(v+f)<.1&&Math.abs(h+u+c-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const E=(h+1)/2,y=(u+1)/2,D=(c+1)/2,L=(d+m)/4,P=(p+g)/4,N=(v+f)/4;return E>y&&E>D?E<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(E),r=L/n,s=P/n):y>D?y<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(y),n=L/r,s=N/r):D<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(D),n=P/s,r=N/s),this.set(n,r,s,e),this}let M=Math.sqrt((f-v)*(f-v)+(p-g)*(p-g)+(m-d)*(m-d));return Math.abs(M)<.001&&(M=1),this.x=(f-v)/M,this.y=(p-g)/M,this.z=(m-d)/M,this.w=Math.acos((h+u+c-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class ec extends Bn{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new re(0,0,t,e),this.scissorTest=!1,this.viewport=new re(0,0,t,e);const r={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:He,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const s=new Me(r,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);s.flipY=!1,s.generateMipmaps=n.generateMipmaps,s.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=t,this.textures[r].image.height=e,this.textures[r].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,r=t.textures.length;n<r;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new Io(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Nn extends ec{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Uo extends Me{constructor(t=null,e=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:r},this.magFilter=Oe,this.minFilter=Oe,this.wrapR=Ln,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class nc extends Me{constructor(t=null,e=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:r},this.magFilter=Oe,this.minFilter=Oe,this.wrapR=Ln,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Fn{constructor(t=0,e=0,n=0,r=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=r}static slerpFlat(t,e,n,r,s,o,a){let l=n[r+0],h=n[r+1],d=n[r+2],p=n[r+3];const m=s[o+0],u=s[o+1],v=s[o+2],g=s[o+3];if(a===0){t[e+0]=l,t[e+1]=h,t[e+2]=d,t[e+3]=p;return}if(a===1){t[e+0]=m,t[e+1]=u,t[e+2]=v,t[e+3]=g;return}if(p!==g||l!==m||h!==u||d!==v){let f=1-a;const c=l*m+h*u+d*v+p*g,M=c>=0?1:-1,E=1-c*c;if(E>Number.EPSILON){const D=Math.sqrt(E),L=Math.atan2(D,c*M);f=Math.sin(f*L)/D,a=Math.sin(a*L)/D}const y=a*M;if(l=l*f+m*y,h=h*f+u*y,d=d*f+v*y,p=p*f+g*y,f===1-a){const D=1/Math.sqrt(l*l+h*h+d*d+p*p);l*=D,h*=D,d*=D,p*=D}}t[e]=l,t[e+1]=h,t[e+2]=d,t[e+3]=p}static multiplyQuaternionsFlat(t,e,n,r,s,o){const a=n[r],l=n[r+1],h=n[r+2],d=n[r+3],p=s[o],m=s[o+1],u=s[o+2],v=s[o+3];return t[e]=a*v+d*p+l*u-h*m,t[e+1]=l*v+d*m+h*p-a*u,t[e+2]=h*v+d*u+a*m-l*p,t[e+3]=d*v-a*p-l*m-h*u,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,r){return this._x=t,this._y=e,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,r=t._y,s=t._z,o=t._order,a=Math.cos,l=Math.sin,h=a(n/2),d=a(r/2),p=a(s/2),m=l(n/2),u=l(r/2),v=l(s/2);switch(o){case"XYZ":this._x=m*d*p+h*u*v,this._y=h*u*p-m*d*v,this._z=h*d*v+m*u*p,this._w=h*d*p-m*u*v;break;case"YXZ":this._x=m*d*p+h*u*v,this._y=h*u*p-m*d*v,this._z=h*d*v-m*u*p,this._w=h*d*p+m*u*v;break;case"ZXY":this._x=m*d*p-h*u*v,this._y=h*u*p+m*d*v,this._z=h*d*v+m*u*p,this._w=h*d*p-m*u*v;break;case"ZYX":this._x=m*d*p-h*u*v,this._y=h*u*p+m*d*v,this._z=h*d*v-m*u*p,this._w=h*d*p+m*u*v;break;case"YZX":this._x=m*d*p+h*u*v,this._y=h*u*p+m*d*v,this._z=h*d*v-m*u*p,this._w=h*d*p-m*u*v;break;case"XZY":this._x=m*d*p-h*u*v,this._y=h*u*p-m*d*v,this._z=h*d*v+m*u*p,this._w=h*d*p+m*u*v;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,r=Math.sin(n);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],r=e[4],s=e[8],o=e[1],a=e[5],l=e[9],h=e[2],d=e[6],p=e[10],m=n+a+p;if(m>0){const u=.5/Math.sqrt(m+1);this._w=.25/u,this._x=(d-l)*u,this._y=(s-h)*u,this._z=(o-r)*u}else if(n>a&&n>p){const u=2*Math.sqrt(1+n-a-p);this._w=(d-l)/u,this._x=.25*u,this._y=(r+o)/u,this._z=(s+h)/u}else if(a>p){const u=2*Math.sqrt(1+a-n-p);this._w=(s-h)/u,this._x=(r+o)/u,this._y=.25*u,this._z=(l+d)/u}else{const u=2*Math.sqrt(1+p-n-a);this._w=(o-r)/u,this._x=(s+h)/u,this._y=(l+d)/u,this._z=.25*u}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(_e(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const r=Math.min(1,e/n);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,r=t._y,s=t._z,o=t._w,a=e._x,l=e._y,h=e._z,d=e._w;return this._x=n*d+o*a+r*h-s*l,this._y=r*d+o*l+s*a-n*h,this._z=s*d+o*h+n*l-r*a,this._w=o*d-n*a-r*l-s*h,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,r=this._y,s=this._z,o=this._w;let a=o*t._w+n*t._x+r*t._y+s*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=r,this._z=s,this;const l=1-a*a;if(l<=Number.EPSILON){const u=1-e;return this._w=u*o+e*this._w,this._x=u*n+e*this._x,this._y=u*r+e*this._y,this._z=u*s+e*this._z,this.normalize(),this}const h=Math.sqrt(l),d=Math.atan2(h,a),p=Math.sin((1-e)*d)/h,m=Math.sin(e*d)/h;return this._w=o*p+this._w*m,this._x=n*p+this._x*m,this._y=r*p+this._y*m,this._z=s*p+this._z*m,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(t),r*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class nt{constructor(t=0,e=0,n=0){nt.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(ba.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(ba.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*r,this.y=s[1]*e+s[4]*n+s[7]*r,this.z=s[2]*e+s[5]*n+s[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,r=this.z,s=t.elements,o=1/(s[3]*e+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*r+s[12])*o,this.y=(s[1]*e+s[5]*n+s[9]*r+s[13])*o,this.z=(s[2]*e+s[6]*n+s[10]*r+s[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,r=this.z,s=t.x,o=t.y,a=t.z,l=t.w,h=2*(o*r-a*n),d=2*(a*e-s*r),p=2*(s*n-o*e);return this.x=e+l*h+o*p-a*d,this.y=n+l*d+a*h-s*p,this.z=r+l*p+s*d-o*h,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*r,this.y=s[1]*e+s[5]*n+s[9]*r,this.z=s[2]*e+s[6]*n+s[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,r=t.y,s=t.z,o=e.x,a=e.y,l=e.z;return this.x=r*l-s*a,this.y=s*o-n*l,this.z=n*a-r*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return br.copy(this).projectOnVector(t),this.sub(br)}reflect(t){return this.sub(br.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(_e(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,r=this.z-t.z;return e*e+n*n+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const r=Math.sin(e)*t;return this.x=r*Math.sin(n),this.y=Math.cos(e)*t,this.z=r*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const br=new nt,ba=new Fn;class Ci{constructor(t=new nt(1/0,1/0,1/0),e=new nt(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Le.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Le.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Le.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,Le):Le.fromBufferAttribute(s,o),Le.applyMatrix4(t.matrixWorld),this.expandByPoint(Le);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ni.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ni.copy(n.boundingBox)),Ni.applyMatrix4(t.matrixWorld),this.union(Ni)}const r=t.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Le),Le.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(xi),Fi.subVectors(this.max,xi),Gn.subVectors(t.a,xi),Vn.subVectors(t.b,xi),Wn.subVectors(t.c,xi),cn.subVectors(Vn,Gn),hn.subVectors(Wn,Vn),En.subVectors(Gn,Wn);let e=[0,-cn.z,cn.y,0,-hn.z,hn.y,0,-En.z,En.y,cn.z,0,-cn.x,hn.z,0,-hn.x,En.z,0,-En.x,-cn.y,cn.x,0,-hn.y,hn.x,0,-En.y,En.x,0];return!Tr(e,Gn,Vn,Wn,Fi)||(e=[1,0,0,0,1,0,0,0,1],!Tr(e,Gn,Vn,Wn,Fi))?!1:(Oi.crossVectors(cn,hn),e=[Oi.x,Oi.y,Oi.z],Tr(e,Gn,Vn,Wn,Fi))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Le).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Le).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(qe[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),qe[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),qe[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),qe[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),qe[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),qe[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),qe[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),qe[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(qe),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const qe=[new nt,new nt,new nt,new nt,new nt,new nt,new nt,new nt],Le=new nt,Ni=new Ci,Gn=new nt,Vn=new nt,Wn=new nt,cn=new nt,hn=new nt,En=new nt,xi=new nt,Fi=new nt,Oi=new nt,bn=new nt;function Tr(i,t,e,n,r){for(let s=0,o=i.length-3;s<=o;s+=3){bn.fromArray(i,s);const a=r.x*Math.abs(bn.x)+r.y*Math.abs(bn.y)+r.z*Math.abs(bn.z),l=t.dot(bn),h=e.dot(bn),d=n.dot(bn);if(Math.max(-Math.max(l,h,d),Math.min(l,h,d))>a)return!1}return!0}const ic=new Ci,Si=new nt,wr=new nt;class Ks{constructor(t=new nt,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):ic.setFromPoints(t).getCenter(n);let r=0;for(let s=0,o=t.length;s<o;s++)r=Math.max(r,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Si.subVectors(t,this.center);const e=Si.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),r=(n-this.radius)*.5;this.center.addScaledVector(Si,r/n),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(wr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Si.copy(t.center).add(wr)),this.expandByPoint(Si.copy(t.center).sub(wr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const je=new nt,Ar=new nt,Bi=new nt,un=new nt,Rr=new nt,zi=new nt,Cr=new nt;class No{constructor(t=new nt,e=new nt(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,je)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=je.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(je.copy(this.origin).addScaledVector(this.direction,e),je.distanceToSquared(t))}distanceSqToSegment(t,e,n,r){Ar.copy(t).add(e).multiplyScalar(.5),Bi.copy(e).sub(t).normalize(),un.copy(this.origin).sub(Ar);const s=t.distanceTo(e)*.5,o=-this.direction.dot(Bi),a=un.dot(this.direction),l=-un.dot(Bi),h=un.lengthSq(),d=Math.abs(1-o*o);let p,m,u,v;if(d>0)if(p=o*l-a,m=o*a-l,v=s*d,p>=0)if(m>=-v)if(m<=v){const g=1/d;p*=g,m*=g,u=p*(p+o*m+2*a)+m*(o*p+m+2*l)+h}else m=s,p=Math.max(0,-(o*m+a)),u=-p*p+m*(m+2*l)+h;else m=-s,p=Math.max(0,-(o*m+a)),u=-p*p+m*(m+2*l)+h;else m<=-v?(p=Math.max(0,-(-o*s+a)),m=p>0?-s:Math.min(Math.max(-s,-l),s),u=-p*p+m*(m+2*l)+h):m<=v?(p=0,m=Math.min(Math.max(-s,-l),s),u=m*(m+2*l)+h):(p=Math.max(0,-(o*s+a)),m=p>0?s:Math.min(Math.max(-s,-l),s),u=-p*p+m*(m+2*l)+h);else m=o>0?-s:s,p=Math.max(0,-(o*m+a)),u=-p*p+m*(m+2*l)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,p),r&&r.copy(Ar).addScaledVector(Bi,m),u}intersectSphere(t,e){je.subVectors(t.center,this.origin);const n=je.dot(this.direction),r=je.dot(je)-n*n,s=t.radius*t.radius;if(r>s)return null;const o=Math.sqrt(s-r),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,r,s,o,a,l;const h=1/this.direction.x,d=1/this.direction.y,p=1/this.direction.z,m=this.origin;return h>=0?(n=(t.min.x-m.x)*h,r=(t.max.x-m.x)*h):(n=(t.max.x-m.x)*h,r=(t.min.x-m.x)*h),d>=0?(s=(t.min.y-m.y)*d,o=(t.max.y-m.y)*d):(s=(t.max.y-m.y)*d,o=(t.min.y-m.y)*d),n>o||s>r||((s>n||isNaN(n))&&(n=s),(o<r||isNaN(r))&&(r=o),p>=0?(a=(t.min.z-m.z)*p,l=(t.max.z-m.z)*p):(a=(t.max.z-m.z)*p,l=(t.min.z-m.z)*p),n>l||a>r)||((a>n||n!==n)&&(n=a),(l<r||r!==r)&&(r=l),r<0)?null:this.at(n>=0?n:r,e)}intersectsBox(t){return this.intersectBox(t,je)!==null}intersectTriangle(t,e,n,r,s){Rr.subVectors(e,t),zi.subVectors(n,t),Cr.crossVectors(Rr,zi);let o=this.direction.dot(Cr),a;if(o>0){if(r)return null;a=1}else if(o<0)a=-1,o=-o;else return null;un.subVectors(this.origin,t);const l=a*this.direction.dot(zi.crossVectors(un,zi));if(l<0)return null;const h=a*this.direction.dot(Rr.cross(un));if(h<0||l+h>o)return null;const d=-a*un.dot(Cr);return d<0?null:this.at(d/o,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class se{constructor(t,e,n,r,s,o,a,l,h,d,p,m,u,v,g,f){se.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,r,s,o,a,l,h,d,p,m,u,v,g,f)}set(t,e,n,r,s,o,a,l,h,d,p,m,u,v,g,f){const c=this.elements;return c[0]=t,c[4]=e,c[8]=n,c[12]=r,c[1]=s,c[5]=o,c[9]=a,c[13]=l,c[2]=h,c[6]=d,c[10]=p,c[14]=m,c[3]=u,c[7]=v,c[11]=g,c[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new se().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,r=1/Xn.setFromMatrixColumn(t,0).length(),s=1/Xn.setFromMatrixColumn(t,1).length(),o=1/Xn.setFromMatrixColumn(t,2).length();return e[0]=n[0]*r,e[1]=n[1]*r,e[2]=n[2]*r,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,r=t.y,s=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(r),h=Math.sin(r),d=Math.cos(s),p=Math.sin(s);if(t.order==="XYZ"){const m=o*d,u=o*p,v=a*d,g=a*p;e[0]=l*d,e[4]=-l*p,e[8]=h,e[1]=u+v*h,e[5]=m-g*h,e[9]=-a*l,e[2]=g-m*h,e[6]=v+u*h,e[10]=o*l}else if(t.order==="YXZ"){const m=l*d,u=l*p,v=h*d,g=h*p;e[0]=m+g*a,e[4]=v*a-u,e[8]=o*h,e[1]=o*p,e[5]=o*d,e[9]=-a,e[2]=u*a-v,e[6]=g+m*a,e[10]=o*l}else if(t.order==="ZXY"){const m=l*d,u=l*p,v=h*d,g=h*p;e[0]=m-g*a,e[4]=-o*p,e[8]=v+u*a,e[1]=u+v*a,e[5]=o*d,e[9]=g-m*a,e[2]=-o*h,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const m=o*d,u=o*p,v=a*d,g=a*p;e[0]=l*d,e[4]=v*h-u,e[8]=m*h+g,e[1]=l*p,e[5]=g*h+m,e[9]=u*h-v,e[2]=-h,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const m=o*l,u=o*h,v=a*l,g=a*h;e[0]=l*d,e[4]=g-m*p,e[8]=v*p+u,e[1]=p,e[5]=o*d,e[9]=-a*d,e[2]=-h*d,e[6]=u*p+v,e[10]=m-g*p}else if(t.order==="XZY"){const m=o*l,u=o*h,v=a*l,g=a*h;e[0]=l*d,e[4]=-p,e[8]=h*d,e[1]=m*p+g,e[5]=o*d,e[9]=u*p-v,e[2]=v*p-u,e[6]=a*d,e[10]=g*p+m}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(rc,t,sc)}lookAt(t,e,n){const r=this.elements;return Ee.subVectors(t,e),Ee.lengthSq()===0&&(Ee.z=1),Ee.normalize(),fn.crossVectors(n,Ee),fn.lengthSq()===0&&(Math.abs(n.z)===1?Ee.x+=1e-4:Ee.z+=1e-4,Ee.normalize(),fn.crossVectors(n,Ee)),fn.normalize(),ki.crossVectors(Ee,fn),r[0]=fn.x,r[4]=ki.x,r[8]=Ee.x,r[1]=fn.y,r[5]=ki.y,r[9]=Ee.y,r[2]=fn.z,r[6]=ki.z,r[10]=Ee.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,r=e.elements,s=this.elements,o=n[0],a=n[4],l=n[8],h=n[12],d=n[1],p=n[5],m=n[9],u=n[13],v=n[2],g=n[6],f=n[10],c=n[14],M=n[3],E=n[7],y=n[11],D=n[15],L=r[0],P=r[4],N=r[8],b=r[12],T=r[1],F=r[5],R=r[9],U=r[13],S=r[2],B=r[6],et=r[10],k=r[14],$=r[3],Q=r[7],lt=r[11],H=r[15];return s[0]=o*L+a*T+l*S+h*$,s[4]=o*P+a*F+l*B+h*Q,s[8]=o*N+a*R+l*et+h*lt,s[12]=o*b+a*U+l*k+h*H,s[1]=d*L+p*T+m*S+u*$,s[5]=d*P+p*F+m*B+u*Q,s[9]=d*N+p*R+m*et+u*lt,s[13]=d*b+p*U+m*k+u*H,s[2]=v*L+g*T+f*S+c*$,s[6]=v*P+g*F+f*B+c*Q,s[10]=v*N+g*R+f*et+c*lt,s[14]=v*b+g*U+f*k+c*H,s[3]=M*L+E*T+y*S+D*$,s[7]=M*P+E*F+y*B+D*Q,s[11]=M*N+E*R+y*et+D*lt,s[15]=M*b+E*U+y*k+D*H,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],r=t[8],s=t[12],o=t[1],a=t[5],l=t[9],h=t[13],d=t[2],p=t[6],m=t[10],u=t[14],v=t[3],g=t[7],f=t[11],c=t[15];return v*(+s*l*p-r*h*p-s*a*m+n*h*m+r*a*u-n*l*u)+g*(+e*l*u-e*h*m+s*o*m-r*o*u+r*h*d-s*l*d)+f*(+e*h*p-e*a*u-s*o*p+n*o*u+s*a*d-n*h*d)+c*(-r*a*d-e*l*p+e*a*m+r*o*p-n*o*m+n*l*d)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],o=t[4],a=t[5],l=t[6],h=t[7],d=t[8],p=t[9],m=t[10],u=t[11],v=t[12],g=t[13],f=t[14],c=t[15],M=p*f*h-g*m*h+g*l*u-a*f*u-p*l*c+a*m*c,E=v*m*h-d*f*h-v*l*u+o*f*u+d*l*c-o*m*c,y=d*g*h-v*p*h+v*a*u-o*g*u-d*a*c+o*p*c,D=v*p*l-d*g*l-v*a*m+o*g*m+d*a*f-o*p*f,L=e*M+n*E+r*y+s*D;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const P=1/L;return t[0]=M*P,t[1]=(g*m*s-p*f*s-g*r*u+n*f*u+p*r*c-n*m*c)*P,t[2]=(a*f*s-g*l*s+g*r*h-n*f*h-a*r*c+n*l*c)*P,t[3]=(p*l*s-a*m*s-p*r*h+n*m*h+a*r*u-n*l*u)*P,t[4]=E*P,t[5]=(d*f*s-v*m*s+v*r*u-e*f*u-d*r*c+e*m*c)*P,t[6]=(v*l*s-o*f*s-v*r*h+e*f*h+o*r*c-e*l*c)*P,t[7]=(o*m*s-d*l*s+d*r*h-e*m*h-o*r*u+e*l*u)*P,t[8]=y*P,t[9]=(v*p*s-d*g*s-v*n*u+e*g*u+d*n*c-e*p*c)*P,t[10]=(o*g*s-v*a*s+v*n*h-e*g*h-o*n*c+e*a*c)*P,t[11]=(d*a*s-o*p*s-d*n*h+e*p*h+o*n*u-e*a*u)*P,t[12]=D*P,t[13]=(d*g*r-v*p*r+v*n*m-e*g*m-d*n*f+e*p*f)*P,t[14]=(v*a*r-o*g*r-v*n*l+e*g*l+o*n*f-e*a*f)*P,t[15]=(o*p*r-d*a*r+d*n*l-e*p*l-o*n*m+e*a*m)*P,this}scale(t){const e=this.elements,n=t.x,r=t.y,s=t.z;return e[0]*=n,e[4]*=r,e[8]*=s,e[1]*=n,e[5]*=r,e[9]*=s,e[2]*=n,e[6]*=r,e[10]*=s,e[3]*=n,e[7]*=r,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,r))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),r=Math.sin(e),s=1-n,o=t.x,a=t.y,l=t.z,h=s*o,d=s*a;return this.set(h*o+n,h*a-r*l,h*l+r*a,0,h*a+r*l,d*a+n,d*l-r*o,0,h*l-r*a,d*l+r*o,s*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,r,s,o){return this.set(1,n,s,0,t,1,o,0,e,r,1,0,0,0,0,1),this}compose(t,e,n){const r=this.elements,s=e._x,o=e._y,a=e._z,l=e._w,h=s+s,d=o+o,p=a+a,m=s*h,u=s*d,v=s*p,g=o*d,f=o*p,c=a*p,M=l*h,E=l*d,y=l*p,D=n.x,L=n.y,P=n.z;return r[0]=(1-(g+c))*D,r[1]=(u+y)*D,r[2]=(v-E)*D,r[3]=0,r[4]=(u-y)*L,r[5]=(1-(m+c))*L,r[6]=(f+M)*L,r[7]=0,r[8]=(v+E)*P,r[9]=(f-M)*P,r[10]=(1-(m+g))*P,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,n){const r=this.elements;let s=Xn.set(r[0],r[1],r[2]).length();const o=Xn.set(r[4],r[5],r[6]).length(),a=Xn.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),t.x=r[12],t.y=r[13],t.z=r[14],Ie.copy(this);const h=1/s,d=1/o,p=1/a;return Ie.elements[0]*=h,Ie.elements[1]*=h,Ie.elements[2]*=h,Ie.elements[4]*=d,Ie.elements[5]*=d,Ie.elements[6]*=d,Ie.elements[8]*=p,Ie.elements[9]*=p,Ie.elements[10]*=p,e.setFromRotationMatrix(Ie),n.x=s,n.y=o,n.z=a,this}makePerspective(t,e,n,r,s,o,a=nn){const l=this.elements,h=2*s/(e-t),d=2*s/(n-r),p=(e+t)/(e-t),m=(n+r)/(n-r);let u,v;if(a===nn)u=-(o+s)/(o-s),v=-2*o*s/(o-s);else if(a===fr)u=-o/(o-s),v=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=p,l[12]=0,l[1]=0,l[5]=d,l[9]=m,l[13]=0,l[2]=0,l[6]=0,l[10]=u,l[14]=v,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,r,s,o,a=nn){const l=this.elements,h=1/(e-t),d=1/(n-r),p=1/(o-s),m=(e+t)*h,u=(n+r)*d;let v,g;if(a===nn)v=(o+s)*p,g=-2*p;else if(a===fr)v=s*p,g=-1*p;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*h,l[4]=0,l[8]=0,l[12]=-m,l[1]=0,l[5]=2*d,l[9]=0,l[13]=-u,l[2]=0,l[6]=0,l[10]=g,l[14]=-v,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let r=0;r<16;r++)if(e[r]!==n[r])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Xn=new nt,Ie=new se,rc=new nt(0,0,0),sc=new nt(1,1,1),fn=new nt,ki=new nt,Ee=new nt,Ta=new se,wa=new Fn;class We{constructor(t=0,e=0,n=0,r=We.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,r=this._order){return this._x=t,this._y=e,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const r=t.elements,s=r[0],o=r[4],a=r[8],l=r[1],h=r[5],d=r[9],p=r[2],m=r[6],u=r[10];switch(e){case"XYZ":this._y=Math.asin(_e(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-d,u),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(m,h),this._z=0);break;case"YXZ":this._x=Math.asin(-_e(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(a,u),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-p,s),this._z=0);break;case"ZXY":this._x=Math.asin(_e(m,-1,1)),Math.abs(m)<.9999999?(this._y=Math.atan2(-p,u),this._z=Math.atan2(-o,h)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-_e(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(m,u),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,h));break;case"YZX":this._z=Math.asin(_e(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,h),this._y=Math.atan2(-p,s)):(this._x=0,this._y=Math.atan2(a,u));break;case"XZY":this._z=Math.asin(-_e(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(m,h),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-d,u),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Ta.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Ta,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return wa.setFromEuler(this),this.setFromQuaternion(wa,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}We.DEFAULT_ORDER="XYZ";class Fo{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let ac=0;const Aa=new nt,Yn=new Fn,Ze=new se,Hi=new nt,Mi=new nt,oc=new nt,lc=new Fn,Ra=new nt(1,0,0),Ca=new nt(0,1,0),Pa=new nt(0,0,1),Da={type:"added"},cc={type:"removed"},qn={type:"childadded",child:null},Pr={type:"childremoved",child:null};class pe extends Bn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:ac++}),this.uuid=Ri(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=pe.DEFAULT_UP.clone();const t=new nt,e=new We,n=new Fn,r=new nt(1,1,1);function s(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new se},normalMatrix:{value:new kt}}),this.matrix=new se,this.matrixWorld=new se,this.matrixAutoUpdate=pe.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Fo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Yn.setFromAxisAngle(t,e),this.quaternion.multiply(Yn),this}rotateOnWorldAxis(t,e){return Yn.setFromAxisAngle(t,e),this.quaternion.premultiply(Yn),this}rotateX(t){return this.rotateOnAxis(Ra,t)}rotateY(t){return this.rotateOnAxis(Ca,t)}rotateZ(t){return this.rotateOnAxis(Pa,t)}translateOnAxis(t,e){return Aa.copy(t).applyQuaternion(this.quaternion),this.position.add(Aa.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Ra,t)}translateY(t){return this.translateOnAxis(Ca,t)}translateZ(t){return this.translateOnAxis(Pa,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Ze.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Hi.copy(t):Hi.set(t,e,n);const r=this.parent;this.updateWorldMatrix(!0,!1),Mi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ze.lookAt(Mi,Hi,this.up):Ze.lookAt(Hi,Mi,this.up),this.quaternion.setFromRotationMatrix(Ze),r&&(Ze.extractRotation(r.matrixWorld),Yn.setFromRotationMatrix(Ze),this.quaternion.premultiply(Yn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Da),qn.child=t,this.dispatchEvent(qn),qn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(cc),Pr.child=t,this.dispatchEvent(Pr),Pr.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Ze.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Ze.multiply(t.parent.matrixWorld)),t.applyMatrix4(Ze),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Da),qn.child=t,this.dispatchEvent(qn),qn.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,r=this.children.length;n<r;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Mi,t,oc),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Mi,lc,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let h=0,d=l.length;h<d;h++){const p=l[h];s(t.shapes,p)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,h=this.material.length;l<h;l++)a.push(s(t.materials,this.material[l]));r.material=a}else r.material=s(t.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];r.animations.push(s(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),h=o(t.textures),d=o(t.images),p=o(t.shapes),m=o(t.skeletons),u=o(t.animations),v=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),h.length>0&&(n.textures=h),d.length>0&&(n.images=d),p.length>0&&(n.shapes=p),m.length>0&&(n.skeletons=m),u.length>0&&(n.animations=u),v.length>0&&(n.nodes=v)}return n.object=r,n;function o(a){const l=[];for(const h in a){const d=a[h];delete d.metadata,l.push(d)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const r=t.children[n];this.add(r.clone())}return this}}pe.DEFAULT_UP=new nt(0,1,0);pe.DEFAULT_MATRIX_AUTO_UPDATE=!0;pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Ue=new nt,Ke=new nt,Dr=new nt,$e=new nt,jn=new nt,Zn=new nt,La=new nt,Lr=new nt,Ir=new nt,Ur=new nt,Nr=new re,Fr=new re,Or=new re;class Ne{constructor(t=new nt,e=new nt,n=new nt){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,r){r.subVectors(n,e),Ue.subVectors(t,e),r.cross(Ue);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(t,e,n,r,s){Ue.subVectors(r,e),Ke.subVectors(n,e),Dr.subVectors(t,e);const o=Ue.dot(Ue),a=Ue.dot(Ke),l=Ue.dot(Dr),h=Ke.dot(Ke),d=Ke.dot(Dr),p=o*h-a*a;if(p===0)return s.set(0,0,0),null;const m=1/p,u=(h*l-a*d)*m,v=(o*d-a*l)*m;return s.set(1-u-v,v,u)}static containsPoint(t,e,n,r){return this.getBarycoord(t,e,n,r,$e)===null?!1:$e.x>=0&&$e.y>=0&&$e.x+$e.y<=1}static getInterpolation(t,e,n,r,s,o,a,l){return this.getBarycoord(t,e,n,r,$e)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,$e.x),l.addScaledVector(o,$e.y),l.addScaledVector(a,$e.z),l)}static getInterpolatedAttribute(t,e,n,r,s,o){return Nr.setScalar(0),Fr.setScalar(0),Or.setScalar(0),Nr.fromBufferAttribute(t,e),Fr.fromBufferAttribute(t,n),Or.fromBufferAttribute(t,r),o.setScalar(0),o.addScaledVector(Nr,s.x),o.addScaledVector(Fr,s.y),o.addScaledVector(Or,s.z),o}static isFrontFacing(t,e,n,r){return Ue.subVectors(n,e),Ke.subVectors(t,e),Ue.cross(Ke).dot(r)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,r){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,n,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Ue.subVectors(this.c,this.b),Ke.subVectors(this.a,this.b),Ue.cross(Ke).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Ne.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Ne.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,r,s){return Ne.getInterpolation(t,this.a,this.b,this.c,e,n,r,s)}containsPoint(t){return Ne.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Ne.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,r=this.b,s=this.c;let o,a;jn.subVectors(r,n),Zn.subVectors(s,n),Lr.subVectors(t,n);const l=jn.dot(Lr),h=Zn.dot(Lr);if(l<=0&&h<=0)return e.copy(n);Ir.subVectors(t,r);const d=jn.dot(Ir),p=Zn.dot(Ir);if(d>=0&&p<=d)return e.copy(r);const m=l*p-d*h;if(m<=0&&l>=0&&d<=0)return o=l/(l-d),e.copy(n).addScaledVector(jn,o);Ur.subVectors(t,s);const u=jn.dot(Ur),v=Zn.dot(Ur);if(v>=0&&u<=v)return e.copy(s);const g=u*h-l*v;if(g<=0&&h>=0&&v<=0)return a=h/(h-v),e.copy(n).addScaledVector(Zn,a);const f=d*v-u*p;if(f<=0&&p-d>=0&&u-v>=0)return La.subVectors(s,r),a=(p-d)/(p-d+(u-v)),e.copy(r).addScaledVector(La,a);const c=1/(f+g+m);return o=g*c,a=m*c,e.copy(n).addScaledVector(jn,o).addScaledVector(Zn,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Oo={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},dn={h:0,s:0,l:0},Gi={h:0,s:0,l:0};function Br(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class qt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ae){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Xt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,r=Xt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Xt.toWorkingColorSpace(this,r),this}setHSL(t,e,n,r=Xt.workingColorSpace){if(t=Yl(t,1),e=_e(e,0,1),n=_e(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,o=2*n-s;this.r=Br(o,s,t+1/3),this.g=Br(o,s,t),this.b=Br(o,s,t-1/3)}return Xt.toWorkingColorSpace(this,r),this}setStyle(t,e=Ae){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ae){const n=Oo[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=rn(t.r),this.g=rn(t.g),this.b=rn(t.b),this}copyLinearToSRGB(t){return this.r=si(t.r),this.g=si(t.g),this.b=si(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ae){return Xt.fromWorkingColorSpace(de.copy(this),t),Math.round(_e(de.r*255,0,255))*65536+Math.round(_e(de.g*255,0,255))*256+Math.round(_e(de.b*255,0,255))}getHexString(t=Ae){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Xt.workingColorSpace){Xt.fromWorkingColorSpace(de.copy(this),e);const n=de.r,r=de.g,s=de.b,o=Math.max(n,r,s),a=Math.min(n,r,s);let l,h;const d=(a+o)/2;if(a===o)l=0,h=0;else{const p=o-a;switch(h=d<=.5?p/(o+a):p/(2-o-a),o){case n:l=(r-s)/p+(r<s?6:0);break;case r:l=(s-n)/p+2;break;case s:l=(n-r)/p+4;break}l/=6}return t.h=l,t.s=h,t.l=d,t}getRGB(t,e=Xt.workingColorSpace){return Xt.fromWorkingColorSpace(de.copy(this),e),t.r=de.r,t.g=de.g,t.b=de.b,t}getStyle(t=Ae){Xt.fromWorkingColorSpace(de.copy(this),t);const e=de.r,n=de.g,r=de.b;return t!==Ae?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(t,e,n){return this.getHSL(dn),this.setHSL(dn.h+t,dn.s+e,dn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(dn),t.getHSL(Gi);const n=Mr(dn.h,Gi.h,e),r=Mr(dn.s,Gi.s,e),s=Mr(dn.l,Gi.l,e);return this.setHSL(n,r,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,r=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*r,this.g=s[1]*e+s[4]*n+s[7]*r,this.b=s[2]*e+s[5]*n+s[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const de=new qt;qt.NAMES=Oo;let hc=0;class Pi extends Bn{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:hc++}),this.uuid=Ri(),this.name="",this.blending=ii,this.side=xn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ts,this.blendDst=es,this.blendEquation=Pn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new qt(0,0,0),this.blendAlpha=0,this.depthFunc=oi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ma,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=kn,this.stencilZFail=kn,this.stencilZPass=kn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ii&&(n.blending=this.blending),this.side!==xn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==ts&&(n.blendSrc=this.blendSrc),this.blendDst!==es&&(n.blendDst=this.blendDst),this.blendEquation!==Pn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==oi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==ma&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==kn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==kn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==kn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const o=[];for(const a in s){const l=s[a];delete l.metadata,o.push(l)}return o}if(e){const s=r(t.textures),o=r(t.images);s.length>0&&(n.textures=s),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const r=e.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class Bo extends Pi{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new qt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new We,this.combine=Vs,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const ae=new nt,Vi=new Ht;class Ge{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=_a,this.updateRanges=[],this.gpuType=en,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[t+r]=e.array[n+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Vi.fromBufferAttribute(this,e),Vi.applyMatrix3(t),this.setXY(e,Vi.x,Vi.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)ae.fromBufferAttribute(this,e),ae.applyMatrix3(t),this.setXYZ(e,ae.x,ae.y,ae.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)ae.fromBufferAttribute(this,e),ae.applyMatrix4(t),this.setXYZ(e,ae.x,ae.y,ae.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ae.fromBufferAttribute(this,e),ae.applyNormalMatrix(t),this.setXYZ(e,ae.x,ae.y,ae.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ae.fromBufferAttribute(this,e),ae.transformDirection(t),this.setXYZ(e,ae.x,ae.y,ae.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=vi(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=ve(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=vi(e,this.array)),e}setX(t,e){return this.normalized&&(e=ve(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=vi(e,this.array)),e}setY(t,e){return this.normalized&&(e=ve(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=vi(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ve(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=vi(e,this.array)),e}setW(t,e){return this.normalized&&(e=ve(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=ve(e,this.array),n=ve(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,r){return t*=this.itemSize,this.normalized&&(e=ve(e,this.array),n=ve(n,this.array),r=ve(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=r,this}setXYZW(t,e,n,r,s){return t*=this.itemSize,this.normalized&&(e=ve(e,this.array),n=ve(n,this.array),r=ve(r,this.array),s=ve(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=r,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==_a&&(t.usage=this.usage),t}}class zo extends Ge{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class ko extends Ge{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Ve extends Ge{constructor(t,e,n){super(new Float32Array(t),e,n)}}let uc=0;const we=new se,zr=new pe,Kn=new nt,be=new Ci,yi=new Ci,he=new nt;class Mn extends Bn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:uc++}),this.uuid=Ri(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Lo(t)?ko:zo)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new kt().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return we.makeRotationFromQuaternion(t),this.applyMatrix4(we),this}rotateX(t){return we.makeRotationX(t),this.applyMatrix4(we),this}rotateY(t){return we.makeRotationY(t),this.applyMatrix4(we),this}rotateZ(t){return we.makeRotationZ(t),this.applyMatrix4(we),this}translate(t,e,n){return we.makeTranslation(t,e,n),this.applyMatrix4(we),this}scale(t,e,n){return we.makeScale(t,e,n),this.applyMatrix4(we),this}lookAt(t){return zr.lookAt(t),zr.updateMatrix(),this.applyMatrix4(zr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Kn).negate(),this.translate(Kn.x,Kn.y,Kn.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let r=0,s=t.length;r<s;r++){const o=t[r];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Ve(n,3))}else{for(let n=0,r=e.count;n<r;n++){const s=t[n];e.setXYZ(n,s.x,s.y,s.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ci);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new nt(-1/0,-1/0,-1/0),new nt(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,r=e.length;n<r;n++){const s=e[n];be.setFromBufferAttribute(s),this.morphTargetsRelative?(he.addVectors(this.boundingBox.min,be.min),this.boundingBox.expandByPoint(he),he.addVectors(this.boundingBox.max,be.max),this.boundingBox.expandByPoint(he)):(this.boundingBox.expandByPoint(be.min),this.boundingBox.expandByPoint(be.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ks);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new nt,1/0);return}if(t){const n=this.boundingSphere.center;if(be.setFromBufferAttribute(t),e)for(let s=0,o=e.length;s<o;s++){const a=e[s];yi.setFromBufferAttribute(a),this.morphTargetsRelative?(he.addVectors(be.min,yi.min),be.expandByPoint(he),he.addVectors(be.max,yi.max),be.expandByPoint(he)):(be.expandByPoint(yi.min),be.expandByPoint(yi.max))}be.getCenter(n);let r=0;for(let s=0,o=t.count;s<o;s++)he.fromBufferAttribute(t,s),r=Math.max(r,n.distanceToSquared(he));if(e)for(let s=0,o=e.length;s<o;s++){const a=e[s],l=this.morphTargetsRelative;for(let h=0,d=a.count;h<d;h++)he.fromBufferAttribute(a,h),l&&(Kn.fromBufferAttribute(t,h),he.add(Kn)),r=Math.max(r,n.distanceToSquared(he))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,r=e.normal,s=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ge(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let N=0;N<n.count;N++)a[N]=new nt,l[N]=new nt;const h=new nt,d=new nt,p=new nt,m=new Ht,u=new Ht,v=new Ht,g=new nt,f=new nt;function c(N,b,T){h.fromBufferAttribute(n,N),d.fromBufferAttribute(n,b),p.fromBufferAttribute(n,T),m.fromBufferAttribute(s,N),u.fromBufferAttribute(s,b),v.fromBufferAttribute(s,T),d.sub(h),p.sub(h),u.sub(m),v.sub(m);const F=1/(u.x*v.y-v.x*u.y);isFinite(F)&&(g.copy(d).multiplyScalar(v.y).addScaledVector(p,-u.y).multiplyScalar(F),f.copy(p).multiplyScalar(u.x).addScaledVector(d,-v.x).multiplyScalar(F),a[N].add(g),a[b].add(g),a[T].add(g),l[N].add(f),l[b].add(f),l[T].add(f))}let M=this.groups;M.length===0&&(M=[{start:0,count:t.count}]);for(let N=0,b=M.length;N<b;++N){const T=M[N],F=T.start,R=T.count;for(let U=F,S=F+R;U<S;U+=3)c(t.getX(U+0),t.getX(U+1),t.getX(U+2))}const E=new nt,y=new nt,D=new nt,L=new nt;function P(N){D.fromBufferAttribute(r,N),L.copy(D);const b=a[N];E.copy(b),E.sub(D.multiplyScalar(D.dot(b))).normalize(),y.crossVectors(L,b);const F=y.dot(l[N])<0?-1:1;o.setXYZW(N,E.x,E.y,E.z,F)}for(let N=0,b=M.length;N<b;++N){const T=M[N],F=T.start,R=T.count;for(let U=F,S=F+R;U<S;U+=3)P(t.getX(U+0)),P(t.getX(U+1)),P(t.getX(U+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ge(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let m=0,u=n.count;m<u;m++)n.setXYZ(m,0,0,0);const r=new nt,s=new nt,o=new nt,a=new nt,l=new nt,h=new nt,d=new nt,p=new nt;if(t)for(let m=0,u=t.count;m<u;m+=3){const v=t.getX(m+0),g=t.getX(m+1),f=t.getX(m+2);r.fromBufferAttribute(e,v),s.fromBufferAttribute(e,g),o.fromBufferAttribute(e,f),d.subVectors(o,s),p.subVectors(r,s),d.cross(p),a.fromBufferAttribute(n,v),l.fromBufferAttribute(n,g),h.fromBufferAttribute(n,f),a.add(d),l.add(d),h.add(d),n.setXYZ(v,a.x,a.y,a.z),n.setXYZ(g,l.x,l.y,l.z),n.setXYZ(f,h.x,h.y,h.z)}else for(let m=0,u=e.count;m<u;m+=3)r.fromBufferAttribute(e,m+0),s.fromBufferAttribute(e,m+1),o.fromBufferAttribute(e,m+2),d.subVectors(o,s),p.subVectors(r,s),d.cross(p),n.setXYZ(m+0,d.x,d.y,d.z),n.setXYZ(m+1,d.x,d.y,d.z),n.setXYZ(m+2,d.x,d.y,d.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)he.fromBufferAttribute(t,e),he.normalize(),t.setXYZ(e,he.x,he.y,he.z)}toNonIndexed(){function t(a,l){const h=a.array,d=a.itemSize,p=a.normalized,m=new h.constructor(l.length*d);let u=0,v=0;for(let g=0,f=l.length;g<f;g++){a.isInterleavedBufferAttribute?u=l[g]*a.data.stride+a.offset:u=l[g]*d;for(let c=0;c<d;c++)m[v++]=h[u++]}return new Ge(m,d,p)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Mn,n=this.index.array,r=this.attributes;for(const a in r){const l=r[a],h=t(l,n);e.setAttribute(a,h)}const s=this.morphAttributes;for(const a in s){const l=[],h=s[a];for(let d=0,p=h.length;d<p;d++){const m=h[d],u=t(m,n);l.push(u)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const h=o[a];e.addGroup(h.start,h.count,h.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const h in l)l[h]!==void 0&&(t[h]=l[h]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const h=n[l];t.data.attributes[l]=h.toJSON(t.data)}const r={};let s=!1;for(const l in this.morphAttributes){const h=this.morphAttributes[l],d=[];for(let p=0,m=h.length;p<m;p++){const u=h[p];d.push(u.toJSON(t.data))}d.length>0&&(r[l]=d,s=!0)}s&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const r=t.attributes;for(const h in r){const d=r[h];this.setAttribute(h,d.clone(e))}const s=t.morphAttributes;for(const h in s){const d=[],p=s[h];for(let m=0,u=p.length;m<u;m++)d.push(p[m].clone(e));this.morphAttributes[h]=d}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let h=0,d=o.length;h<d;h++){const p=o[h];this.addGroup(p.start,p.count,p.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Ia=new se,Tn=new No,Wi=new Ks,Ua=new nt,Xi=new nt,Yi=new nt,qi=new nt,kr=new nt,ji=new nt,Na=new nt,Zi=new nt;class Ce extends pe{constructor(t=new Mn,e=new Bo){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const r=e[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(t,e){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(r,t);const a=this.morphTargetInfluences;if(s&&a){ji.set(0,0,0);for(let l=0,h=s.length;l<h;l++){const d=a[l],p=s[l];d!==0&&(kr.fromBufferAttribute(p,t),o?ji.addScaledVector(kr,d):ji.addScaledVector(kr.sub(e),d))}e.add(ji)}return e}raycast(t,e){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Wi.copy(n.boundingSphere),Wi.applyMatrix4(s),Tn.copy(t.ray).recast(t.near),!(Wi.containsPoint(Tn.origin)===!1&&(Tn.intersectSphere(Wi,Ua)===null||Tn.origin.distanceToSquared(Ua)>(t.far-t.near)**2))&&(Ia.copy(s).invert(),Tn.copy(t.ray).applyMatrix4(Ia),!(n.boundingBox!==null&&Tn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Tn)))}_computeIntersections(t,e,n){let r;const s=this.geometry,o=this.material,a=s.index,l=s.attributes.position,h=s.attributes.uv,d=s.attributes.uv1,p=s.attributes.normal,m=s.groups,u=s.drawRange;if(a!==null)if(Array.isArray(o))for(let v=0,g=m.length;v<g;v++){const f=m[v],c=o[f.materialIndex],M=Math.max(f.start,u.start),E=Math.min(a.count,Math.min(f.start+f.count,u.start+u.count));for(let y=M,D=E;y<D;y+=3){const L=a.getX(y),P=a.getX(y+1),N=a.getX(y+2);r=Ki(this,c,t,n,h,d,p,L,P,N),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=f.materialIndex,e.push(r))}}else{const v=Math.max(0,u.start),g=Math.min(a.count,u.start+u.count);for(let f=v,c=g;f<c;f+=3){const M=a.getX(f),E=a.getX(f+1),y=a.getX(f+2);r=Ki(this,o,t,n,h,d,p,M,E,y),r&&(r.faceIndex=Math.floor(f/3),e.push(r))}}else if(l!==void 0)if(Array.isArray(o))for(let v=0,g=m.length;v<g;v++){const f=m[v],c=o[f.materialIndex],M=Math.max(f.start,u.start),E=Math.min(l.count,Math.min(f.start+f.count,u.start+u.count));for(let y=M,D=E;y<D;y+=3){const L=y,P=y+1,N=y+2;r=Ki(this,c,t,n,h,d,p,L,P,N),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=f.materialIndex,e.push(r))}}else{const v=Math.max(0,u.start),g=Math.min(l.count,u.start+u.count);for(let f=v,c=g;f<c;f+=3){const M=f,E=f+1,y=f+2;r=Ki(this,o,t,n,h,d,p,M,E,y),r&&(r.faceIndex=Math.floor(f/3),e.push(r))}}}}function fc(i,t,e,n,r,s,o,a){let l;if(t.side===Se?l=n.intersectTriangle(o,s,r,!0,a):l=n.intersectTriangle(r,s,o,t.side===xn,a),l===null)return null;Zi.copy(a),Zi.applyMatrix4(i.matrixWorld);const h=e.ray.origin.distanceTo(Zi);return h<e.near||h>e.far?null:{distance:h,point:Zi.clone(),object:i}}function Ki(i,t,e,n,r,s,o,a,l,h){i.getVertexPosition(a,Xi),i.getVertexPosition(l,Yi),i.getVertexPosition(h,qi);const d=fc(i,t,e,n,Xi,Yi,qi,Na);if(d){const p=new nt;Ne.getBarycoord(Na,Xi,Yi,qi,p),r&&(d.uv=Ne.getInterpolatedAttribute(r,a,l,h,p,new Ht)),s&&(d.uv1=Ne.getInterpolatedAttribute(s,a,l,h,p,new Ht)),o&&(d.normal=Ne.getInterpolatedAttribute(o,a,l,h,p,new nt),d.normal.dot(n.direction)>0&&d.normal.multiplyScalar(-1));const m={a,b:l,c:h,normal:new nt,materialIndex:0};Ne.getNormal(Xi,Yi,qi,m.normal),d.face=m,d.barycoord=p}return d}class pi extends Mn{constructor(t=1,e=1,n=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:r,heightSegments:s,depthSegments:o};const a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);const l=[],h=[],d=[],p=[];let m=0,u=0;v("z","y","x",-1,-1,n,e,t,o,s,0),v("z","y","x",1,-1,n,e,-t,o,s,1),v("x","z","y",1,1,t,n,e,r,o,2),v("x","z","y",1,-1,t,n,-e,r,o,3),v("x","y","z",1,-1,t,e,n,r,s,4),v("x","y","z",-1,-1,t,e,-n,r,s,5),this.setIndex(l),this.setAttribute("position",new Ve(h,3)),this.setAttribute("normal",new Ve(d,3)),this.setAttribute("uv",new Ve(p,2));function v(g,f,c,M,E,y,D,L,P,N,b){const T=y/P,F=D/N,R=y/2,U=D/2,S=L/2,B=P+1,et=N+1;let k=0,$=0;const Q=new nt;for(let lt=0;lt<et;lt++){const H=lt*F-U;for(let W=0;W<B;W++){const _t=W*T-R;Q[g]=_t*M,Q[f]=H*E,Q[c]=S,h.push(Q.x,Q.y,Q.z),Q[g]=0,Q[f]=0,Q[c]=L>0?1:-1,d.push(Q.x,Q.y,Q.z),p.push(W/P),p.push(1-lt/N),k+=1}}for(let lt=0;lt<N;lt++)for(let H=0;H<P;H++){const W=m+H+B*lt,_t=m+H+B*(lt+1),X=m+(H+1)+B*(lt+1),J=m+(H+1)+B*lt;l.push(W,_t,J),l.push(_t,X,J),$+=6}a.addGroup(u,$,b),u+=$,m+=k}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new pi(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function fi(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const r=i[e][n];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=r.clone():Array.isArray(r)?t[e][n]=r.slice():t[e][n]=r}}return t}function me(i){const t={};for(let e=0;e<i.length;e++){const n=fi(i[e]);for(const r in n)t[r]=n[r]}return t}function dc(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Ho(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Xt.workingColorSpace}const pc={clone:fi,merge:me};var mc=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,_c=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Sn extends Pi{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=mc,this.fragmentShader=_c,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=fi(t.uniforms),this.uniformsGroups=dc(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?e.uniforms[r]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[r]={type:"m4",value:o.toArray()}:e.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Go extends pe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new se,this.projectionMatrix=new se,this.projectionMatrixInverse=new se,this.coordinateSystem=nn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const pn=new nt,Fa=new Ht,Oa=new Ht;class Re extends Go{constructor(t=50,e=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=zs*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(hr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return zs*2*Math.atan(Math.tan(hr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){pn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(pn.x,pn.y).multiplyScalar(-t/pn.z),pn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(pn.x,pn.y).multiplyScalar(-t/pn.z)}getViewSize(t,e){return this.getViewBounds(t,Fa,Oa),e.subVectors(Oa,Fa)}setViewOffset(t,e,n,r,s,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(hr*.5*this.fov)/this.zoom,n=2*e,r=this.aspect*n,s=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,h=o.fullHeight;s+=o.offsetX*r/l,e-=o.offsetY*n/h,r*=o.width/l,n*=o.height/h}const a=this.filmOffset;a!==0&&(s+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const $n=-90,Jn=1;class gc extends pe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Re($n,Jn,t,e);r.layers=this.layers,this.add(r);const s=new Re($n,Jn,t,e);s.layers=this.layers,this.add(s);const o=new Re($n,Jn,t,e);o.layers=this.layers,this.add(o);const a=new Re($n,Jn,t,e);a.layers=this.layers,this.add(a);const l=new Re($n,Jn,t,e);l.layers=this.layers,this.add(l);const h=new Re($n,Jn,t,e);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,r,s,o,a,l]=e;for(const h of e)this.remove(h);if(t===nn)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===fr)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const h of e)this.add(h),h.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,l,h,d]=this.children,p=t.getRenderTarget(),m=t.getActiveCubeFace(),u=t.getActiveMipmapLevel(),v=t.xr.enabled;t.xr.enabled=!1;const g=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,r),t.render(e,s),t.setRenderTarget(n,1,r),t.render(e,o),t.setRenderTarget(n,2,r),t.render(e,a),t.setRenderTarget(n,3,r),t.render(e,l),t.setRenderTarget(n,4,r),t.render(e,h),n.texture.generateMipmaps=g,t.setRenderTarget(n,5,r),t.render(e,d),t.setRenderTarget(p,m,u),t.xr.enabled=v,n.texture.needsPMREMUpdate=!0}}class Vo extends Me{constructor(t,e,n,r,s,o,a,l,h,d){t=t!==void 0?t:[],e=e!==void 0?e:li,super(t,e,n,r,s,o,a,l,h,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class vc extends Nn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},r=[n,n,n,n,n,n];this.texture=new Vo(r,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:He}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new pi(5,5,5),s=new Sn({name:"CubemapFromEquirect",uniforms:fi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Se,blending:gn});s.uniforms.tEquirect.value=e;const o=new Ce(r,s),a=e.minFilter;return e.minFilter===In&&(e.minFilter=He),new gc(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,r){const s=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,r);t.setRenderTarget(s)}}const Hr=new nt,xc=new nt,Sc=new kt;class mn{constructor(t=new nt(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,r){return this.normal.set(t,e,n),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const r=Hr.subVectors(n,e).cross(xc.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(Hr),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:e.copy(t.start).addScaledVector(n,s)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Sc.getNormalMatrix(t),r=this.coplanarPoint(Hr).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const wn=new Ks,$i=new nt;class $s{constructor(t=new mn,e=new mn,n=new mn,r=new mn,s=new mn,o=new mn){this.planes=[t,e,n,r,s,o]}set(t,e,n,r,s,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=nn){const n=this.planes,r=t.elements,s=r[0],o=r[1],a=r[2],l=r[3],h=r[4],d=r[5],p=r[6],m=r[7],u=r[8],v=r[9],g=r[10],f=r[11],c=r[12],M=r[13],E=r[14],y=r[15];if(n[0].setComponents(l-s,m-h,f-u,y-c).normalize(),n[1].setComponents(l+s,m+h,f+u,y+c).normalize(),n[2].setComponents(l+o,m+d,f+v,y+M).normalize(),n[3].setComponents(l-o,m-d,f-v,y-M).normalize(),n[4].setComponents(l-a,m-p,f-g,y-E).normalize(),e===nn)n[5].setComponents(l+a,m+p,f+g,y+E).normalize();else if(e===fr)n[5].setComponents(a,p,g,E).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),wn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),wn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(wn)}intersectsSprite(t){return wn.center.set(0,0,0),wn.radius=.7071067811865476,wn.applyMatrix4(t.matrixWorld),this.intersectsSphere(wn)}intersectsSphere(t){const e=this.planes,n=t.center,r=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const r=e[n];if($i.x=r.normal.x>0?t.max.x:t.min.x,$i.y=r.normal.y>0?t.max.y:t.min.y,$i.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint($i)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Wo(){let i=null,t=!1,e=null,n=null;function r(s,o){e(s,o),n=i.requestAnimationFrame(r)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(r),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){i=s}}}function Mc(i){const t=new WeakMap;function e(a,l){const h=a.array,d=a.usage,p=h.byteLength,m=i.createBuffer();i.bindBuffer(l,m),i.bufferData(l,h,d),a.onUploadCallback();let u;if(h instanceof Float32Array)u=i.FLOAT;else if(h instanceof Uint16Array)a.isFloat16BufferAttribute?u=i.HALF_FLOAT:u=i.UNSIGNED_SHORT;else if(h instanceof Int16Array)u=i.SHORT;else if(h instanceof Uint32Array)u=i.UNSIGNED_INT;else if(h instanceof Int32Array)u=i.INT;else if(h instanceof Int8Array)u=i.BYTE;else if(h instanceof Uint8Array)u=i.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)u=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:m,type:u,bytesPerElement:h.BYTES_PER_ELEMENT,version:a.version,size:p}}function n(a,l,h){const d=l.array,p=l.updateRanges;if(i.bindBuffer(h,a),p.length===0)i.bufferSubData(h,0,d);else{p.sort((u,v)=>u.start-v.start);let m=0;for(let u=1;u<p.length;u++){const v=p[m],g=p[u];g.start<=v.start+v.count+1?v.count=Math.max(v.count,g.start+g.count-v.start):(++m,p[m]=g)}p.length=m+1;for(let u=0,v=p.length;u<v;u++){const g=p[u];i.bufferSubData(h,g.start*d.BYTES_PER_ELEMENT,d,g.start,g.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const d=t.get(a);(!d||d.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const h=t.get(a);if(h===void 0)t.set(a,e(a,l));else if(h.version<a.version){if(h.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,a,l),h.version=a.version}}return{get:r,remove:s,update:o}}class Di extends Mn{constructor(t=1,e=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:r};const s=t/2,o=e/2,a=Math.floor(n),l=Math.floor(r),h=a+1,d=l+1,p=t/a,m=e/l,u=[],v=[],g=[],f=[];for(let c=0;c<d;c++){const M=c*m-o;for(let E=0;E<h;E++){const y=E*p-s;v.push(y,-M,0),g.push(0,0,1),f.push(E/a),f.push(1-c/l)}}for(let c=0;c<l;c++)for(let M=0;M<a;M++){const E=M+h*c,y=M+h*(c+1),D=M+1+h*(c+1),L=M+1+h*c;u.push(E,y,L),u.push(y,D,L)}this.setIndex(u),this.setAttribute("position",new Ve(v,3)),this.setAttribute("normal",new Ve(g,3)),this.setAttribute("uv",new Ve(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Di(t.width,t.height,t.widthSegments,t.heightSegments)}}var yc=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ec=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,bc=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Tc=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,wc=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Ac=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Rc=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Cc=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Pc=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Dc=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Lc=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Ic=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Uc=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Nc=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Fc=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Oc=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Bc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,zc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,kc=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Hc=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Gc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Vc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Wc=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Xc=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Yc=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,qc=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,jc=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Zc=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Kc=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,$c=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Jc="gl_FragColor = linearToOutputTexel( gl_FragColor );",Qc=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,th=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,eh=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,nh=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ih=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,rh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,sh=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ah=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,oh=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,lh=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ch=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,hh=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,uh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,fh=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,dh=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,ph=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,mh=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,_h=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,gh=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,vh=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,xh=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Sh=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Mh=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,yh=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Eh=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,bh=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Th=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,wh=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ah=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Rh=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Ch=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Ph=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Dh=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Lh=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ih=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Uh=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Nh=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Fh=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Oh=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Bh=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,zh=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,kh=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Hh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Gh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Vh=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Wh=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Xh=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Yh=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,qh=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,jh=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Zh=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Kh=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,$h=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Jh=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Qh=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,tu=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,eu=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,nu=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,iu=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,ru=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,su=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,au=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,ou=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,lu=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,cu=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,hu=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,uu=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,fu=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,du=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,pu=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,mu=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,_u=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,gu=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,vu=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,xu=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Su=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Mu=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,yu=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Eu=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,bu=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tu=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,wu=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Au=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Ru=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Cu=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Pu=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Du=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Lu=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Iu=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Uu=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Nu=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Fu=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ou=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Bu=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zu=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,ku=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Hu=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Gu=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Vu=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Wu=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Xu=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Yu=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qu=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ju=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zu=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Ku=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$u=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ju=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Qu=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,tf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Gt={alphahash_fragment:yc,alphahash_pars_fragment:Ec,alphamap_fragment:bc,alphamap_pars_fragment:Tc,alphatest_fragment:wc,alphatest_pars_fragment:Ac,aomap_fragment:Rc,aomap_pars_fragment:Cc,batching_pars_vertex:Pc,batching_vertex:Dc,begin_vertex:Lc,beginnormal_vertex:Ic,bsdfs:Uc,iridescence_fragment:Nc,bumpmap_pars_fragment:Fc,clipping_planes_fragment:Oc,clipping_planes_pars_fragment:Bc,clipping_planes_pars_vertex:zc,clipping_planes_vertex:kc,color_fragment:Hc,color_pars_fragment:Gc,color_pars_vertex:Vc,color_vertex:Wc,common:Xc,cube_uv_reflection_fragment:Yc,defaultnormal_vertex:qc,displacementmap_pars_vertex:jc,displacementmap_vertex:Zc,emissivemap_fragment:Kc,emissivemap_pars_fragment:$c,colorspace_fragment:Jc,colorspace_pars_fragment:Qc,envmap_fragment:th,envmap_common_pars_fragment:eh,envmap_pars_fragment:nh,envmap_pars_vertex:ih,envmap_physical_pars_fragment:ph,envmap_vertex:rh,fog_vertex:sh,fog_pars_vertex:ah,fog_fragment:oh,fog_pars_fragment:lh,gradientmap_pars_fragment:ch,lightmap_pars_fragment:hh,lights_lambert_fragment:uh,lights_lambert_pars_fragment:fh,lights_pars_begin:dh,lights_toon_fragment:mh,lights_toon_pars_fragment:_h,lights_phong_fragment:gh,lights_phong_pars_fragment:vh,lights_physical_fragment:xh,lights_physical_pars_fragment:Sh,lights_fragment_begin:Mh,lights_fragment_maps:yh,lights_fragment_end:Eh,logdepthbuf_fragment:bh,logdepthbuf_pars_fragment:Th,logdepthbuf_pars_vertex:wh,logdepthbuf_vertex:Ah,map_fragment:Rh,map_pars_fragment:Ch,map_particle_fragment:Ph,map_particle_pars_fragment:Dh,metalnessmap_fragment:Lh,metalnessmap_pars_fragment:Ih,morphinstance_vertex:Uh,morphcolor_vertex:Nh,morphnormal_vertex:Fh,morphtarget_pars_vertex:Oh,morphtarget_vertex:Bh,normal_fragment_begin:zh,normal_fragment_maps:kh,normal_pars_fragment:Hh,normal_pars_vertex:Gh,normal_vertex:Vh,normalmap_pars_fragment:Wh,clearcoat_normal_fragment_begin:Xh,clearcoat_normal_fragment_maps:Yh,clearcoat_pars_fragment:qh,iridescence_pars_fragment:jh,opaque_fragment:Zh,packing:Kh,premultiplied_alpha_fragment:$h,project_vertex:Jh,dithering_fragment:Qh,dithering_pars_fragment:tu,roughnessmap_fragment:eu,roughnessmap_pars_fragment:nu,shadowmap_pars_fragment:iu,shadowmap_pars_vertex:ru,shadowmap_vertex:su,shadowmask_pars_fragment:au,skinbase_vertex:ou,skinning_pars_vertex:lu,skinning_vertex:cu,skinnormal_vertex:hu,specularmap_fragment:uu,specularmap_pars_fragment:fu,tonemapping_fragment:du,tonemapping_pars_fragment:pu,transmission_fragment:mu,transmission_pars_fragment:_u,uv_pars_fragment:gu,uv_pars_vertex:vu,uv_vertex:xu,worldpos_vertex:Su,background_vert:Mu,background_frag:yu,backgroundCube_vert:Eu,backgroundCube_frag:bu,cube_vert:Tu,cube_frag:wu,depth_vert:Au,depth_frag:Ru,distanceRGBA_vert:Cu,distanceRGBA_frag:Pu,equirect_vert:Du,equirect_frag:Lu,linedashed_vert:Iu,linedashed_frag:Uu,meshbasic_vert:Nu,meshbasic_frag:Fu,meshlambert_vert:Ou,meshlambert_frag:Bu,meshmatcap_vert:zu,meshmatcap_frag:ku,meshnormal_vert:Hu,meshnormal_frag:Gu,meshphong_vert:Vu,meshphong_frag:Wu,meshphysical_vert:Xu,meshphysical_frag:Yu,meshtoon_vert:qu,meshtoon_frag:ju,points_vert:Zu,points_frag:Ku,shadow_vert:$u,shadow_frag:Ju,sprite_vert:Qu,sprite_frag:tf},vt={common:{diffuse:{value:new qt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new kt}},envmap:{envMap:{value:null},envMapRotation:{value:new kt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new kt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new kt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new kt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new kt},normalScale:{value:new Ht(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new kt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new kt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new kt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new kt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new qt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new qt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0},uvTransform:{value:new kt}},sprite:{diffuse:{value:new qt(16777215)},opacity:{value:1},center:{value:new Ht(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}}},ke={basic:{uniforms:me([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.fog]),vertexShader:Gt.meshbasic_vert,fragmentShader:Gt.meshbasic_frag},lambert:{uniforms:me([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,vt.lights,{emissive:{value:new qt(0)}}]),vertexShader:Gt.meshlambert_vert,fragmentShader:Gt.meshlambert_frag},phong:{uniforms:me([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,vt.lights,{emissive:{value:new qt(0)},specular:{value:new qt(1118481)},shininess:{value:30}}]),vertexShader:Gt.meshphong_vert,fragmentShader:Gt.meshphong_frag},standard:{uniforms:me([vt.common,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.roughnessmap,vt.metalnessmap,vt.fog,vt.lights,{emissive:{value:new qt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Gt.meshphysical_vert,fragmentShader:Gt.meshphysical_frag},toon:{uniforms:me([vt.common,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.gradientmap,vt.fog,vt.lights,{emissive:{value:new qt(0)}}]),vertexShader:Gt.meshtoon_vert,fragmentShader:Gt.meshtoon_frag},matcap:{uniforms:me([vt.common,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,{matcap:{value:null}}]),vertexShader:Gt.meshmatcap_vert,fragmentShader:Gt.meshmatcap_frag},points:{uniforms:me([vt.points,vt.fog]),vertexShader:Gt.points_vert,fragmentShader:Gt.points_frag},dashed:{uniforms:me([vt.common,vt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Gt.linedashed_vert,fragmentShader:Gt.linedashed_frag},depth:{uniforms:me([vt.common,vt.displacementmap]),vertexShader:Gt.depth_vert,fragmentShader:Gt.depth_frag},normal:{uniforms:me([vt.common,vt.bumpmap,vt.normalmap,vt.displacementmap,{opacity:{value:1}}]),vertexShader:Gt.meshnormal_vert,fragmentShader:Gt.meshnormal_frag},sprite:{uniforms:me([vt.sprite,vt.fog]),vertexShader:Gt.sprite_vert,fragmentShader:Gt.sprite_frag},background:{uniforms:{uvTransform:{value:new kt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Gt.background_vert,fragmentShader:Gt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new kt}},vertexShader:Gt.backgroundCube_vert,fragmentShader:Gt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Gt.cube_vert,fragmentShader:Gt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Gt.equirect_vert,fragmentShader:Gt.equirect_frag},distanceRGBA:{uniforms:me([vt.common,vt.displacementmap,{referencePosition:{value:new nt},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Gt.distanceRGBA_vert,fragmentShader:Gt.distanceRGBA_frag},shadow:{uniforms:me([vt.lights,vt.fog,{color:{value:new qt(0)},opacity:{value:1}}]),vertexShader:Gt.shadow_vert,fragmentShader:Gt.shadow_frag}};ke.physical={uniforms:me([ke.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new kt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new kt},clearcoatNormalScale:{value:new Ht(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new kt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new kt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new kt},sheen:{value:0},sheenColor:{value:new qt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new kt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new kt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new kt},transmissionSamplerSize:{value:new Ht},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new kt},attenuationDistance:{value:0},attenuationColor:{value:new qt(0)},specularColor:{value:new qt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new kt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new kt},anisotropyVector:{value:new Ht},anisotropyMap:{value:null},anisotropyMapTransform:{value:new kt}}]),vertexShader:Gt.meshphysical_vert,fragmentShader:Gt.meshphysical_frag};const Ji={r:0,b:0,g:0},An=new We,ef=new se;function nf(i,t,e,n,r,s,o){const a=new qt(0);let l=s===!0?0:1,h,d,p=null,m=0,u=null;function v(M){let E=M.isScene===!0?M.background:null;return E&&E.isTexture&&(E=(M.backgroundBlurriness>0?e:t).get(E)),E}function g(M){let E=!1;const y=v(M);y===null?c(a,l):y&&y.isColor&&(c(y,1),E=!0);const D=i.xr.getEnvironmentBlendMode();D==="additive"?n.buffers.color.setClear(0,0,0,1,o):D==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||E)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function f(M,E){const y=v(E);y&&(y.isCubeTexture||y.mapping===mr)?(d===void 0&&(d=new Ce(new pi(1,1,1),new Sn({name:"BackgroundCubeMaterial",uniforms:fi(ke.backgroundCube.uniforms),vertexShader:ke.backgroundCube.vertexShader,fragmentShader:ke.backgroundCube.fragmentShader,side:Se,depthTest:!1,depthWrite:!1,fog:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(D,L,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(d)),An.copy(E.backgroundRotation),An.x*=-1,An.y*=-1,An.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(An.y*=-1,An.z*=-1),d.material.uniforms.envMap.value=y,d.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,d.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,d.material.uniforms.backgroundRotation.value.setFromMatrix4(ef.makeRotationFromEuler(An)),d.material.toneMapped=Xt.getTransfer(y.colorSpace)!==Jt,(p!==y||m!==y.version||u!==i.toneMapping)&&(d.material.needsUpdate=!0,p=y,m=y.version,u=i.toneMapping),d.layers.enableAll(),M.unshift(d,d.geometry,d.material,0,0,null)):y&&y.isTexture&&(h===void 0&&(h=new Ce(new Di(2,2),new Sn({name:"BackgroundMaterial",uniforms:fi(ke.background.uniforms),vertexShader:ke.background.vertexShader,fragmentShader:ke.background.fragmentShader,side:xn,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),Object.defineProperty(h.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(h)),h.material.uniforms.t2D.value=y,h.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,h.material.toneMapped=Xt.getTransfer(y.colorSpace)!==Jt,y.matrixAutoUpdate===!0&&y.updateMatrix(),h.material.uniforms.uvTransform.value.copy(y.matrix),(p!==y||m!==y.version||u!==i.toneMapping)&&(h.material.needsUpdate=!0,p=y,m=y.version,u=i.toneMapping),h.layers.enableAll(),M.unshift(h,h.geometry,h.material,0,0,null))}function c(M,E){M.getRGB(Ji,Ho(i)),n.buffers.color.setClear(Ji.r,Ji.g,Ji.b,E,o)}return{getClearColor:function(){return a},setClearColor:function(M,E=1){a.set(M),l=E,c(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,c(a,l)},render:g,addToRenderList:f}}function rf(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=m(null);let s=r,o=!1;function a(T,F,R,U,S){let B=!1;const et=p(U,R,F);s!==et&&(s=et,h(s.object)),B=u(T,U,R,S),B&&v(T,U,R,S),S!==null&&t.update(S,i.ELEMENT_ARRAY_BUFFER),(B||o)&&(o=!1,y(T,F,R,U),S!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(S).buffer))}function l(){return i.createVertexArray()}function h(T){return i.bindVertexArray(T)}function d(T){return i.deleteVertexArray(T)}function p(T,F,R){const U=R.wireframe===!0;let S=n[T.id];S===void 0&&(S={},n[T.id]=S);let B=S[F.id];B===void 0&&(B={},S[F.id]=B);let et=B[U];return et===void 0&&(et=m(l()),B[U]=et),et}function m(T){const F=[],R=[],U=[];for(let S=0;S<e;S++)F[S]=0,R[S]=0,U[S]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:F,enabledAttributes:R,attributeDivisors:U,object:T,attributes:{},index:null}}function u(T,F,R,U){const S=s.attributes,B=F.attributes;let et=0;const k=R.getAttributes();for(const $ in k)if(k[$].location>=0){const lt=S[$];let H=B[$];if(H===void 0&&($==="instanceMatrix"&&T.instanceMatrix&&(H=T.instanceMatrix),$==="instanceColor"&&T.instanceColor&&(H=T.instanceColor)),lt===void 0||lt.attribute!==H||H&&lt.data!==H.data)return!0;et++}return s.attributesNum!==et||s.index!==U}function v(T,F,R,U){const S={},B=F.attributes;let et=0;const k=R.getAttributes();for(const $ in k)if(k[$].location>=0){let lt=B[$];lt===void 0&&($==="instanceMatrix"&&T.instanceMatrix&&(lt=T.instanceMatrix),$==="instanceColor"&&T.instanceColor&&(lt=T.instanceColor));const H={};H.attribute=lt,lt&&lt.data&&(H.data=lt.data),S[$]=H,et++}s.attributes=S,s.attributesNum=et,s.index=U}function g(){const T=s.newAttributes;for(let F=0,R=T.length;F<R;F++)T[F]=0}function f(T){c(T,0)}function c(T,F){const R=s.newAttributes,U=s.enabledAttributes,S=s.attributeDivisors;R[T]=1,U[T]===0&&(i.enableVertexAttribArray(T),U[T]=1),S[T]!==F&&(i.vertexAttribDivisor(T,F),S[T]=F)}function M(){const T=s.newAttributes,F=s.enabledAttributes;for(let R=0,U=F.length;R<U;R++)F[R]!==T[R]&&(i.disableVertexAttribArray(R),F[R]=0)}function E(T,F,R,U,S,B,et){et===!0?i.vertexAttribIPointer(T,F,R,S,B):i.vertexAttribPointer(T,F,R,U,S,B)}function y(T,F,R,U){g();const S=U.attributes,B=R.getAttributes(),et=F.defaultAttributeValues;for(const k in B){const $=B[k];if($.location>=0){let Q=S[k];if(Q===void 0&&(k==="instanceMatrix"&&T.instanceMatrix&&(Q=T.instanceMatrix),k==="instanceColor"&&T.instanceColor&&(Q=T.instanceColor)),Q!==void 0){const lt=Q.normalized,H=Q.itemSize,W=t.get(Q);if(W===void 0)continue;const _t=W.buffer,X=W.type,J=W.bytesPerElement,mt=X===i.INT||X===i.UNSIGNED_INT||Q.gpuType===Ws;if(Q.isInterleavedBufferAttribute){const ut=Q.data,pt=ut.stride,Mt=Q.offset;if(ut.isInstancedInterleavedBuffer){for(let Pt=0;Pt<$.locationSize;Pt++)c($.location+Pt,ut.meshPerAttribute);T.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=ut.meshPerAttribute*ut.count)}else for(let Pt=0;Pt<$.locationSize;Pt++)f($.location+Pt);i.bindBuffer(i.ARRAY_BUFFER,_t);for(let Pt=0;Pt<$.locationSize;Pt++)E($.location+Pt,H/$.locationSize,X,lt,pt*J,(Mt+H/$.locationSize*Pt)*J,mt)}else{if(Q.isInstancedBufferAttribute){for(let ut=0;ut<$.locationSize;ut++)c($.location+ut,Q.meshPerAttribute);T.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let ut=0;ut<$.locationSize;ut++)f($.location+ut);i.bindBuffer(i.ARRAY_BUFFER,_t);for(let ut=0;ut<$.locationSize;ut++)E($.location+ut,H/$.locationSize,X,lt,H*J,H/$.locationSize*ut*J,mt)}}else if(et!==void 0){const lt=et[k];if(lt!==void 0)switch(lt.length){case 2:i.vertexAttrib2fv($.location,lt);break;case 3:i.vertexAttrib3fv($.location,lt);break;case 4:i.vertexAttrib4fv($.location,lt);break;default:i.vertexAttrib1fv($.location,lt)}}}}M()}function D(){N();for(const T in n){const F=n[T];for(const R in F){const U=F[R];for(const S in U)d(U[S].object),delete U[S];delete F[R]}delete n[T]}}function L(T){if(n[T.id]===void 0)return;const F=n[T.id];for(const R in F){const U=F[R];for(const S in U)d(U[S].object),delete U[S];delete F[R]}delete n[T.id]}function P(T){for(const F in n){const R=n[F];if(R[T.id]===void 0)continue;const U=R[T.id];for(const S in U)d(U[S].object),delete U[S];delete R[T.id]}}function N(){b(),o=!0,s!==r&&(s=r,h(s.object))}function b(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:N,resetDefaultState:b,dispose:D,releaseStatesOfGeometry:L,releaseStatesOfProgram:P,initAttributes:g,enableAttribute:f,disableUnusedAttributes:M}}function sf(i,t,e){let n;function r(h){n=h}function s(h,d){i.drawArrays(n,h,d),e.update(d,n,1)}function o(h,d,p){p!==0&&(i.drawArraysInstanced(n,h,d,p),e.update(d,n,p))}function a(h,d,p){if(p===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,h,0,d,0,p);let u=0;for(let v=0;v<p;v++)u+=d[v];e.update(u,n,1)}function l(h,d,p,m){if(p===0)return;const u=t.get("WEBGL_multi_draw");if(u===null)for(let v=0;v<h.length;v++)o(h[v],d[v],m[v]);else{u.multiDrawArraysInstancedWEBGL(n,h,0,d,0,m,0,p);let v=0;for(let g=0;g<p;g++)v+=d[g]*m[g];e.update(v,n,1)}}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function af(i,t,e,n){let r;function s(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){const P=t.get("EXT_texture_filter_anisotropic");r=i.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(P){return!(P!==Fe&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(P){const N=P===Ai&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(P!==sn&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&P!==en&&!N)}function l(P){if(P==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=e.precision!==void 0?e.precision:"highp";const d=l(h);d!==h&&(console.warn("THREE.WebGLRenderer:",h,"not supported, using",d,"instead."),h=d);const p=e.logarithmicDepthBuffer===!0,m=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),u=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_TEXTURE_SIZE),f=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),c=i.getParameter(i.MAX_VERTEX_ATTRIBS),M=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),E=i.getParameter(i.MAX_VARYING_VECTORS),y=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),D=v>0,L=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:h,logarithmicDepthBuffer:p,reverseDepthBuffer:m,maxTextures:u,maxVertexTextures:v,maxTextureSize:g,maxCubemapSize:f,maxAttributes:c,maxVertexUniforms:M,maxVaryings:E,maxFragmentUniforms:y,vertexTextures:D,maxSamples:L}}function of(i){const t=this;let e=null,n=0,r=!1,s=!1;const o=new mn,a=new kt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(p,m){const u=p.length!==0||m||n!==0||r;return r=m,n=p.length,u},this.beginShadows=function(){s=!0,d(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(p,m){e=d(p,m,0)},this.setState=function(p,m,u){const v=p.clippingPlanes,g=p.clipIntersection,f=p.clipShadows,c=i.get(p);if(!r||v===null||v.length===0||s&&!f)s?d(null):h();else{const M=s?0:n,E=M*4;let y=c.clippingState||null;l.value=y,y=d(v,m,E,u);for(let D=0;D!==E;++D)y[D]=e[D];c.clippingState=y,this.numIntersection=g?this.numPlanes:0,this.numPlanes+=M}};function h(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function d(p,m,u,v){const g=p!==null?p.length:0;let f=null;if(g!==0){if(f=l.value,v!==!0||f===null){const c=u+g*4,M=m.matrixWorldInverse;a.getNormalMatrix(M),(f===null||f.length<c)&&(f=new Float32Array(c));for(let E=0,y=u;E!==g;++E,y+=4)o.copy(p[E]).applyMatrix4(M,a),o.normal.toArray(f,y),f[y+3]=o.constant}l.value=f,l.needsUpdate=!0}return t.numPlanes=g,t.numIntersection=0,f}}function lf(i){let t=new WeakMap;function e(o,a){return a===cs?o.mapping=li:a===hs&&(o.mapping=ci),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===cs||a===hs)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const h=new vc(l.height);return h.fromEquirectangularTexture(i,o),t.set(o,h),o.addEventListener("dispose",r),e(h.texture,o.mapping)}else return null}}return o}function r(o){const a=o.target;a.removeEventListener("dispose",r);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function s(){t=new WeakMap}return{get:n,dispose:s}}class Xo extends Go{constructor(t=-1,e=1,n=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-t,o=n+t,a=r+e,l=r-e;if(this.view!==null&&this.view.enabled){const h=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=h*this.view.offsetX,o=s+h*this.view.width,a-=d*this.view.offsetY,l=a-d*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const ei=4,Ba=[.125,.215,.35,.446,.526,.582],Dn=20,Gr=new Xo,za=new qt;let Vr=null,Wr=0,Xr=0,Yr=!1;const Cn=(1+Math.sqrt(5))/2,Qn=1/Cn,ka=[new nt(-Cn,Qn,0),new nt(Cn,Qn,0),new nt(-Qn,0,Cn),new nt(Qn,0,Cn),new nt(0,Cn,-Qn),new nt(0,Cn,Qn),new nt(-1,1,-1),new nt(1,1,-1),new nt(-1,1,1),new nt(1,1,1)];class Ha{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,r=100){Vr=this._renderer.getRenderTarget(),Wr=this._renderer.getActiveCubeFace(),Xr=this._renderer.getActiveMipmapLevel(),Yr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,n,r,s),e>0&&this._blur(s,0,0,e),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Wa(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Va(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Vr,Wr,Xr),this._renderer.xr.enabled=Yr,t.scissorTest=!1,Qi(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===li||t.mapping===ci?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Vr=this._renderer.getRenderTarget(),Wr=this._renderer.getActiveCubeFace(),Xr=this._renderer.getActiveMipmapLevel(),Yr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:He,minFilter:He,generateMipmaps:!1,type:Ai,format:Fe,colorSpace:di,depthBuffer:!1},r=Ga(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ga(t,e,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=cf(s)),this._blurMaterial=hf(s,t,e)}return r}_compileMaterial(t){const e=new Ce(this._lodPlanes[0],t);this._renderer.compile(e,Gr)}_sceneToCubeUV(t,e,n,r){const a=new Re(90,1,e,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,p=d.autoClear,m=d.toneMapping;d.getClearColor(za),d.toneMapping=vn,d.autoClear=!1;const u=new Bo({name:"PMREM.Background",side:Se,depthWrite:!1,depthTest:!1}),v=new Ce(new pi,u);let g=!1;const f=t.background;f?f.isColor&&(u.color.copy(f),t.background=null,g=!0):(u.color.copy(za),g=!0);for(let c=0;c<6;c++){const M=c%3;M===0?(a.up.set(0,l[c],0),a.lookAt(h[c],0,0)):M===1?(a.up.set(0,0,l[c]),a.lookAt(0,h[c],0)):(a.up.set(0,l[c],0),a.lookAt(0,0,h[c]));const E=this._cubeSize;Qi(r,M*E,c>2?E:0,E,E),d.setRenderTarget(r),g&&d.render(v,a),d.render(t,a)}v.geometry.dispose(),v.material.dispose(),d.toneMapping=m,d.autoClear=p,t.background=f}_textureToCubeUV(t,e){const n=this._renderer,r=t.mapping===li||t.mapping===ci;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Wa()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Va());const s=r?this._cubemapMaterial:this._equirectMaterial,o=new Ce(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=t;const l=this._cubeSize;Qi(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,Gr)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const r=this._lodPlanes.length;for(let s=1;s<r;s++){const o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=ka[(r-s-1)%ka.length];this._blur(t,s-1,s,o,a)}e.autoClear=n}_blur(t,e,n,r,s){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,r,"latitudinal",s),this._halfBlur(o,t,n,n,r,"longitudinal",s)}_halfBlur(t,e,n,r,s,o,a){const l=this._renderer,h=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const d=3,p=new Ce(this._lodPlanes[r],h),m=h.uniforms,u=this._sizeLods[n]-1,v=isFinite(s)?Math.PI/(2*u):2*Math.PI/(2*Dn-1),g=s/v,f=isFinite(s)?1+Math.floor(d*g):Dn;f>Dn&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${Dn}`);const c=[];let M=0;for(let P=0;P<Dn;++P){const N=P/g,b=Math.exp(-N*N/2);c.push(b),P===0?M+=b:P<f&&(M+=2*b)}for(let P=0;P<c.length;P++)c[P]=c[P]/M;m.envMap.value=t.texture,m.samples.value=f,m.weights.value=c,m.latitudinal.value=o==="latitudinal",a&&(m.poleAxis.value=a);const{_lodMax:E}=this;m.dTheta.value=v,m.mipInt.value=E-n;const y=this._sizeLods[r],D=3*y*(r>E-ei?r-E+ei:0),L=4*(this._cubeSize-y);Qi(e,D,L,3*y,2*y),l.setRenderTarget(e),l.render(p,Gr)}}function cf(i){const t=[],e=[],n=[];let r=i;const s=i-ei+1+Ba.length;for(let o=0;o<s;o++){const a=Math.pow(2,r);e.push(a);let l=1/a;o>i-ei?l=Ba[o-i+ei-1]:o===0&&(l=0),n.push(l);const h=1/(a-2),d=-h,p=1+h,m=[d,d,p,d,p,p,d,d,p,p,d,p],u=6,v=6,g=3,f=2,c=1,M=new Float32Array(g*v*u),E=new Float32Array(f*v*u),y=new Float32Array(c*v*u);for(let L=0;L<u;L++){const P=L%3*2/3-1,N=L>2?0:-1,b=[P,N,0,P+2/3,N,0,P+2/3,N+1,0,P,N,0,P+2/3,N+1,0,P,N+1,0];M.set(b,g*v*L),E.set(m,f*v*L);const T=[L,L,L,L,L,L];y.set(T,c*v*L)}const D=new Mn;D.setAttribute("position",new Ge(M,g)),D.setAttribute("uv",new Ge(E,f)),D.setAttribute("faceIndex",new Ge(y,c)),t.push(D),r>ei&&r--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Ga(i,t,e){const n=new Nn(i,t,e);return n.texture.mapping=mr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Qi(i,t,e,n,r){i.viewport.set(t,e,n,r),i.scissor.set(t,e,n,r)}function hf(i,t,e){const n=new Float32Array(Dn),r=new nt(0,1,0);return new Sn({name:"SphericalGaussianBlur",defines:{n:Dn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Js(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:gn,depthTest:!1,depthWrite:!1})}function Va(){return new Sn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Js(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:gn,depthTest:!1,depthWrite:!1})}function Wa(){return new Sn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Js(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:gn,depthTest:!1,depthWrite:!1})}function Js(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function uf(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const l=a.mapping,h=l===cs||l===hs,d=l===li||l===ci;if(h||d){let p=t.get(a);const m=p!==void 0?p.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==m)return e===null&&(e=new Ha(i)),p=h?e.fromEquirectangular(a,p):e.fromCubemap(a,p),p.texture.pmremVersion=a.pmremVersion,t.set(a,p),p.texture;if(p!==void 0)return p.texture;{const u=a.image;return h&&u&&u.height>0||d&&u&&r(u)?(e===null&&(e=new Ha(i)),p=h?e.fromEquirectangular(a):e.fromCubemap(a),p.texture.pmremVersion=a.pmremVersion,t.set(a,p),a.addEventListener("dispose",s),p.texture):null}}}return a}function r(a){let l=0;const h=6;for(let d=0;d<h;d++)a[d]!==void 0&&l++;return l===h}function s(a){const l=a.target;l.removeEventListener("dispose",s);const h=t.get(l);h!==void 0&&(t.delete(l),h.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function ff(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let r;switch(n){case"WEBGL_depth_texture":r=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=i.getExtension(n)}return t[n]=r,r}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const r=e(n);return r===null&&Ei("THREE.WebGLRenderer: "+n+" extension not supported."),r}}}function df(i,t,e,n){const r={},s=new WeakMap;function o(p){const m=p.target;m.index!==null&&t.remove(m.index);for(const v in m.attributes)t.remove(m.attributes[v]);for(const v in m.morphAttributes){const g=m.morphAttributes[v];for(let f=0,c=g.length;f<c;f++)t.remove(g[f])}m.removeEventListener("dispose",o),delete r[m.id];const u=s.get(m);u&&(t.remove(u),s.delete(m)),n.releaseStatesOfGeometry(m),m.isInstancedBufferGeometry===!0&&delete m._maxInstanceCount,e.memory.geometries--}function a(p,m){return r[m.id]===!0||(m.addEventListener("dispose",o),r[m.id]=!0,e.memory.geometries++),m}function l(p){const m=p.attributes;for(const v in m)t.update(m[v],i.ARRAY_BUFFER);const u=p.morphAttributes;for(const v in u){const g=u[v];for(let f=0,c=g.length;f<c;f++)t.update(g[f],i.ARRAY_BUFFER)}}function h(p){const m=[],u=p.index,v=p.attributes.position;let g=0;if(u!==null){const M=u.array;g=u.version;for(let E=0,y=M.length;E<y;E+=3){const D=M[E+0],L=M[E+1],P=M[E+2];m.push(D,L,L,P,P,D)}}else if(v!==void 0){const M=v.array;g=v.version;for(let E=0,y=M.length/3-1;E<y;E+=3){const D=E+0,L=E+1,P=E+2;m.push(D,L,L,P,P,D)}}else return;const f=new(Lo(m)?ko:zo)(m,1);f.version=g;const c=s.get(p);c&&t.remove(c),s.set(p,f)}function d(p){const m=s.get(p);if(m){const u=p.index;u!==null&&m.version<u.version&&h(p)}else h(p);return s.get(p)}return{get:a,update:l,getWireframeAttribute:d}}function pf(i,t,e){let n;function r(m){n=m}let s,o;function a(m){s=m.type,o=m.bytesPerElement}function l(m,u){i.drawElements(n,u,s,m*o),e.update(u,n,1)}function h(m,u,v){v!==0&&(i.drawElementsInstanced(n,u,s,m*o,v),e.update(u,n,v))}function d(m,u,v){if(v===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,s,m,0,v);let f=0;for(let c=0;c<v;c++)f+=u[c];e.update(f,n,1)}function p(m,u,v,g){if(v===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let c=0;c<m.length;c++)h(m[c]/o,u[c],g[c]);else{f.multiDrawElementsInstancedWEBGL(n,u,0,s,m,0,g,0,v);let c=0;for(let M=0;M<v;M++)c+=u[M]*g[M];e.update(c,n,1)}}this.setMode=r,this.setIndex=a,this.render=l,this.renderInstances=h,this.renderMultiDraw=d,this.renderMultiDrawInstances=p}function mf(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(s/3);break;case i.LINES:e.lines+=a*(s/2);break;case i.LINE_STRIP:e.lines+=a*(s-1);break;case i.LINE_LOOP:e.lines+=a*s;break;case i.POINTS:e.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:n}}function _f(i,t,e){const n=new WeakMap,r=new re;function s(o,a,l){const h=o.morphTargetInfluences,d=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,p=d!==void 0?d.length:0;let m=n.get(a);if(m===void 0||m.count!==p){let T=function(){N.dispose(),n.delete(a),a.removeEventListener("dispose",T)};var u=T;m!==void 0&&m.texture.dispose();const v=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,f=a.morphAttributes.color!==void 0,c=a.morphAttributes.position||[],M=a.morphAttributes.normal||[],E=a.morphAttributes.color||[];let y=0;v===!0&&(y=1),g===!0&&(y=2),f===!0&&(y=3);let D=a.attributes.position.count*y,L=1;D>t.maxTextureSize&&(L=Math.ceil(D/t.maxTextureSize),D=t.maxTextureSize);const P=new Float32Array(D*L*4*p),N=new Uo(P,D,L,p);N.type=en,N.needsUpdate=!0;const b=y*4;for(let F=0;F<p;F++){const R=c[F],U=M[F],S=E[F],B=D*L*4*F;for(let et=0;et<R.count;et++){const k=et*b;v===!0&&(r.fromBufferAttribute(R,et),P[B+k+0]=r.x,P[B+k+1]=r.y,P[B+k+2]=r.z,P[B+k+3]=0),g===!0&&(r.fromBufferAttribute(U,et),P[B+k+4]=r.x,P[B+k+5]=r.y,P[B+k+6]=r.z,P[B+k+7]=0),f===!0&&(r.fromBufferAttribute(S,et),P[B+k+8]=r.x,P[B+k+9]=r.y,P[B+k+10]=r.z,P[B+k+11]=S.itemSize===4?r.w:1)}}m={count:p,texture:N,size:new Ht(D,L)},n.set(a,m),a.addEventListener("dispose",T)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let v=0;for(let f=0;f<h.length;f++)v+=h[f];const g=a.morphTargetsRelative?1:1-v;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",h)}l.getUniforms().setValue(i,"morphTargetsTexture",m.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",m.size)}return{update:s}}function gf(i,t,e,n){let r=new WeakMap;function s(l){const h=n.render.frame,d=l.geometry,p=t.get(l,d);if(r.get(p)!==h&&(t.update(p),r.set(p,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),r.get(l)!==h&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,h))),l.isSkinnedMesh){const m=l.skeleton;r.get(m)!==h&&(m.update(),r.set(m,h))}return p}function o(){r=new WeakMap}function a(l){const h=l.target;h.removeEventListener("dispose",a),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:s,dispose:o}}class Yo extends Me{constructor(t,e,n,r,s,o,a,l,h,d=ri){if(d!==ri&&d!==ui)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&d===ri&&(n=Un),n===void 0&&d===ui&&(n=hi),super(null,r,s,o,a,l,d,n,h),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:Oe,this.minFilter=l!==void 0?l:Oe,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const qo=new Me,Xa=new Yo(1,1),jo=new Uo,Zo=new nc,Ko=new Vo,Ya=[],qa=[],ja=new Float32Array(16),Za=new Float32Array(9),Ka=new Float32Array(4);function mi(i,t,e){const n=i[0];if(n<=0||n>0)return i;const r=t*e;let s=Ya[r];if(s===void 0&&(s=new Float32Array(r),Ya[r]=s),t!==0){n.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(s,a)}return s}function le(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function ce(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function gr(i,t){let e=qa[t];e===void 0&&(e=new Int32Array(t),qa[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function vf(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function xf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(le(e,t))return;i.uniform2fv(this.addr,t),ce(e,t)}}function Sf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(le(e,t))return;i.uniform3fv(this.addr,t),ce(e,t)}}function Mf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(le(e,t))return;i.uniform4fv(this.addr,t),ce(e,t)}}function yf(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(le(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),ce(e,t)}else{if(le(e,n))return;Ka.set(n),i.uniformMatrix2fv(this.addr,!1,Ka),ce(e,n)}}function Ef(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(le(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),ce(e,t)}else{if(le(e,n))return;Za.set(n),i.uniformMatrix3fv(this.addr,!1,Za),ce(e,n)}}function bf(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(le(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),ce(e,t)}else{if(le(e,n))return;ja.set(n),i.uniformMatrix4fv(this.addr,!1,ja),ce(e,n)}}function Tf(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function wf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(le(e,t))return;i.uniform2iv(this.addr,t),ce(e,t)}}function Af(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(le(e,t))return;i.uniform3iv(this.addr,t),ce(e,t)}}function Rf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(le(e,t))return;i.uniform4iv(this.addr,t),ce(e,t)}}function Cf(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Pf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(le(e,t))return;i.uniform2uiv(this.addr,t),ce(e,t)}}function Df(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(le(e,t))return;i.uniform3uiv(this.addr,t),ce(e,t)}}function Lf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(le(e,t))return;i.uniform4uiv(this.addr,t),ce(e,t)}}function If(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(Xa.compareFunction=Do,s=Xa):s=qo,e.setTexture2D(t||s,r)}function Uf(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTexture3D(t||Zo,r)}function Nf(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTextureCube(t||Ko,r)}function Ff(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTexture2DArray(t||jo,r)}function Of(i){switch(i){case 5126:return vf;case 35664:return xf;case 35665:return Sf;case 35666:return Mf;case 35674:return yf;case 35675:return Ef;case 35676:return bf;case 5124:case 35670:return Tf;case 35667:case 35671:return wf;case 35668:case 35672:return Af;case 35669:case 35673:return Rf;case 5125:return Cf;case 36294:return Pf;case 36295:return Df;case 36296:return Lf;case 35678:case 36198:case 36298:case 36306:case 35682:return If;case 35679:case 36299:case 36307:return Uf;case 35680:case 36300:case 36308:case 36293:return Nf;case 36289:case 36303:case 36311:case 36292:return Ff}}function Bf(i,t){i.uniform1fv(this.addr,t)}function zf(i,t){const e=mi(t,this.size,2);i.uniform2fv(this.addr,e)}function kf(i,t){const e=mi(t,this.size,3);i.uniform3fv(this.addr,e)}function Hf(i,t){const e=mi(t,this.size,4);i.uniform4fv(this.addr,e)}function Gf(i,t){const e=mi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Vf(i,t){const e=mi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Wf(i,t){const e=mi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Xf(i,t){i.uniform1iv(this.addr,t)}function Yf(i,t){i.uniform2iv(this.addr,t)}function qf(i,t){i.uniform3iv(this.addr,t)}function jf(i,t){i.uniform4iv(this.addr,t)}function Zf(i,t){i.uniform1uiv(this.addr,t)}function Kf(i,t){i.uniform2uiv(this.addr,t)}function $f(i,t){i.uniform3uiv(this.addr,t)}function Jf(i,t){i.uniform4uiv(this.addr,t)}function Qf(i,t,e){const n=this.cache,r=t.length,s=gr(e,r);le(n,s)||(i.uniform1iv(this.addr,s),ce(n,s));for(let o=0;o!==r;++o)e.setTexture2D(t[o]||qo,s[o])}function td(i,t,e){const n=this.cache,r=t.length,s=gr(e,r);le(n,s)||(i.uniform1iv(this.addr,s),ce(n,s));for(let o=0;o!==r;++o)e.setTexture3D(t[o]||Zo,s[o])}function ed(i,t,e){const n=this.cache,r=t.length,s=gr(e,r);le(n,s)||(i.uniform1iv(this.addr,s),ce(n,s));for(let o=0;o!==r;++o)e.setTextureCube(t[o]||Ko,s[o])}function nd(i,t,e){const n=this.cache,r=t.length,s=gr(e,r);le(n,s)||(i.uniform1iv(this.addr,s),ce(n,s));for(let o=0;o!==r;++o)e.setTexture2DArray(t[o]||jo,s[o])}function id(i){switch(i){case 5126:return Bf;case 35664:return zf;case 35665:return kf;case 35666:return Hf;case 35674:return Gf;case 35675:return Vf;case 35676:return Wf;case 5124:case 35670:return Xf;case 35667:case 35671:return Yf;case 35668:case 35672:return qf;case 35669:case 35673:return jf;case 5125:return Zf;case 36294:return Kf;case 36295:return $f;case 36296:return Jf;case 35678:case 36198:case 36298:case 36306:case 35682:return Qf;case 35679:case 36299:case 36307:return td;case 35680:case 36300:case 36308:case 36293:return ed;case 36289:case 36303:case 36311:case 36292:return nd}}class rd{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Of(e.type)}}class sd{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=id(e.type)}}class ad{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const r=this.seq;for(let s=0,o=r.length;s!==o;++s){const a=r[s];a.setValue(t,e[a.id],n)}}}const qr=/(\w+)(\])?(\[|\.)?/g;function $a(i,t){i.seq.push(t),i.map[t.id]=t}function od(i,t,e){const n=i.name,r=n.length;for(qr.lastIndex=0;;){const s=qr.exec(n),o=qr.lastIndex;let a=s[1];const l=s[2]==="]",h=s[3];if(l&&(a=a|0),h===void 0||h==="["&&o+2===r){$a(e,h===void 0?new rd(a,i,t):new sd(a,i,t));break}else{let p=e.map[a];p===void 0&&(p=new ad(a),$a(e,p)),e=p}}}class ur{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){const s=t.getActiveUniform(e,r),o=t.getUniformLocation(e,s.name);od(s,o,this)}}setValue(t,e,n,r){const s=this.map[e];s!==void 0&&s.setValue(t,n,r)}setOptional(t,e,n){const r=e[n];r!==void 0&&this.setValue(t,n,r)}static upload(t,e,n,r){for(let s=0,o=e.length;s!==o;++s){const a=e[s],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,r)}}static seqWithValue(t,e){const n=[];for(let r=0,s=t.length;r!==s;++r){const o=t[r];o.id in e&&n.push(o)}return n}}function Ja(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const ld=37297;let cd=0;function hd(i,t){const e=i.split(`
`),n=[],r=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let o=r;o<s;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const Qa=new kt;function ud(i){Xt._getMatrix(Qa,Xt.workingColorSpace,i);const t=`mat3( ${Qa.elements.map(e=>e.toFixed(4))} )`;switch(Xt.getTransfer(i)){case _r:return[t,"LinearTransferOETF"];case Jt:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function to(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),r=i.getShaderInfoLog(t).trim();if(n&&r==="")return"";const s=/ERROR: 0:(\d+)/.exec(r);if(s){const o=parseInt(s[1]);return e.toUpperCase()+`

`+r+`

`+hd(i.getShaderSource(t),o)}else return r}function fd(i,t){const e=ud(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function dd(i,t){let e;switch(t){case Rl:e="Linear";break;case Cl:e="Reinhard";break;case Pl:e="Cineon";break;case Dl:e="ACESFilmic";break;case Il:e="AgX";break;case Ul:e="Neutral";break;case Ll:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const tr=new nt;function pd(){Xt.getLuminanceCoefficients(tr);const i=tr.x.toFixed(4),t=tr.y.toFixed(4),e=tr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function md(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(bi).join(`
`)}function _d(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function gd(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(t,r),o=s.name;let a=1;s.type===i.FLOAT_MAT2&&(a=2),s.type===i.FLOAT_MAT3&&(a=3),s.type===i.FLOAT_MAT4&&(a=4),e[o]={type:s.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function bi(i){return i!==""}function eo(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function no(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const vd=/^[ \t]*#include +<([\w\d./]+)>/gm;function ks(i){return i.replace(vd,Sd)}const xd=new Map;function Sd(i,t){let e=Gt[t];if(e===void 0){const n=xd.get(t);if(n!==void 0)e=Gt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return ks(e)}const Md=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function io(i){return i.replace(Md,yd)}function yd(i,t,e,n){let r="";for(let s=parseInt(t);s<parseInt(e);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function ro(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Ed(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===vo?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===ol?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Je&&(t="SHADOWMAP_TYPE_VSM"),t}function bd(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case li:case ci:t="ENVMAP_TYPE_CUBE";break;case mr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Td(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case ci:t="ENVMAP_MODE_REFRACTION";break}return t}function wd(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Vs:t="ENVMAP_BLENDING_MULTIPLY";break;case wl:t="ENVMAP_BLENDING_MIX";break;case Al:t="ENVMAP_BLENDING_ADD";break}return t}function Ad(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Rd(i,t,e,n){const r=i.getContext(),s=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=Ed(e),h=bd(e),d=Td(e),p=wd(e),m=Ad(e),u=md(e),v=_d(s),g=r.createProgram();let f,c,M=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,v].filter(bi).join(`
`),f.length>0&&(f+=`
`),c=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,v].filter(bi).join(`
`),c.length>0&&(c+=`
`)):(f=[ro(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,v,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+d:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(bi).join(`
`),c=[ro(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,v,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",e.envMap?"#define "+p:"",m?"#define CUBEUV_TEXEL_WIDTH "+m.texelWidth:"",m?"#define CUBEUV_TEXEL_HEIGHT "+m.texelHeight:"",m?"#define CUBEUV_MAX_MIP "+m.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==vn?"#define TONE_MAPPING":"",e.toneMapping!==vn?Gt.tonemapping_pars_fragment:"",e.toneMapping!==vn?dd("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Gt.colorspace_pars_fragment,fd("linearToOutputTexel",e.outputColorSpace),pd(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(bi).join(`
`)),o=ks(o),o=eo(o,e),o=no(o,e),a=ks(a),a=eo(a,e),a=no(a,e),o=io(o),a=io(a),e.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,f=[u,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,c=["#define varying in",e.glslVersion===ga?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===ga?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+c);const E=M+f+o,y=M+c+a,D=Ja(r,r.VERTEX_SHADER,E),L=Ja(r,r.FRAGMENT_SHADER,y);r.attachShader(g,D),r.attachShader(g,L),e.index0AttributeName!==void 0?r.bindAttribLocation(g,0,e.index0AttributeName):e.morphTargets===!0&&r.bindAttribLocation(g,0,"position"),r.linkProgram(g);function P(F){if(i.debug.checkShaderErrors){const R=r.getProgramInfoLog(g).trim(),U=r.getShaderInfoLog(D).trim(),S=r.getShaderInfoLog(L).trim();let B=!0,et=!0;if(r.getProgramParameter(g,r.LINK_STATUS)===!1)if(B=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,g,D,L);else{const k=to(r,D,"vertex"),$=to(r,L,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(g,r.VALIDATE_STATUS)+`

Material Name: `+F.name+`
Material Type: `+F.type+`

Program Info Log: `+R+`
`+k+`
`+$)}else R!==""?console.warn("THREE.WebGLProgram: Program Info Log:",R):(U===""||S==="")&&(et=!1);et&&(F.diagnostics={runnable:B,programLog:R,vertexShader:{log:U,prefix:f},fragmentShader:{log:S,prefix:c}})}r.deleteShader(D),r.deleteShader(L),N=new ur(r,g),b=gd(r,g)}let N;this.getUniforms=function(){return N===void 0&&P(this),N};let b;this.getAttributes=function(){return b===void 0&&P(this),b};let T=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=r.getProgramParameter(g,ld)),T},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(g),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=cd++,this.cacheKey=t,this.usedTimes=1,this.program=g,this.vertexShader=D,this.fragmentShader=L,this}let Cd=0;class Pd{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,r=this._getShaderStage(e),s=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new Dd(t),e.set(t,n)),n}}class Dd{constructor(t){this.id=Cd++,this.code=t,this.usedTimes=0}}function Ld(i,t,e,n,r,s,o){const a=new Fo,l=new Pd,h=new Set,d=[],p=r.logarithmicDepthBuffer,m=r.vertexTextures;let u=r.precision;const v={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(b){return h.add(b),b===0?"uv":`uv${b}`}function f(b,T,F,R,U){const S=R.fog,B=U.geometry,et=b.isMeshStandardMaterial?R.environment:null,k=(b.isMeshStandardMaterial?e:t).get(b.envMap||et),$=k&&k.mapping===mr?k.image.height:null,Q=v[b.type];b.precision!==null&&(u=r.getMaxPrecision(b.precision),u!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",u,"instead."));const lt=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,H=lt!==void 0?lt.length:0;let W=0;B.morphAttributes.position!==void 0&&(W=1),B.morphAttributes.normal!==void 0&&(W=2),B.morphAttributes.color!==void 0&&(W=3);let _t,X,J,mt;if(Q){const Kt=ke[Q];_t=Kt.vertexShader,X=Kt.fragmentShader}else _t=b.vertexShader,X=b.fragmentShader,l.update(b),J=l.getVertexShaderID(b),mt=l.getFragmentShaderID(b);const ut=i.getRenderTarget(),pt=i.state.buffers.depth.getReversed(),Mt=U.isInstancedMesh===!0,Pt=U.isBatchedMesh===!0,It=!!b.map,Ut=!!b.matcap,Wt=!!k,_=!!b.aoMap,at=!!b.lightMap,Z=!!b.bumpMap,I=!!b.normalMap,C=!!b.displacementMap,z=!!b.emissiveMap,tt=!!b.metalnessMap,w=!!b.roughnessMap,x=b.anisotropy>0,O=b.clearcoat>0,j=b.dispersion>0,V=b.iridescence>0,K=b.sheen>0,dt=b.transmission>0,ct=x&&!!b.anisotropyMap,gt=O&&!!b.clearcoatMap,Vt=O&&!!b.clearcoatNormalMap,ht=O&&!!b.clearcoatRoughnessMap,Tt=V&&!!b.iridescenceMap,yt=V&&!!b.iridescenceThicknessMap,Lt=K&&!!b.sheenColorMap,wt=K&&!!b.sheenRoughnessMap,Nt=!!b.specularMap,Ot=!!b.specularColorMap,$t=!!b.specularIntensityMap,G=dt&&!!b.transmissionMap,xt=dt&&!!b.thicknessMap,st=!!b.gradientMap,ot=!!b.alphaMap,St=b.alphaTest>0,Et=!!b.alphaHash,Bt=!!b.extensions;let ie=vn;b.toneMapped&&(ut===null||ut.isXRRenderTarget===!0)&&(ie=i.toneMapping);const ue={shaderID:Q,shaderType:b.type,shaderName:b.name,vertexShader:_t,fragmentShader:X,defines:b.defines,customVertexShaderID:J,customFragmentShaderID:mt,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:u,batching:Pt,batchingColor:Pt&&U._colorsTexture!==null,instancing:Mt,instancingColor:Mt&&U.instanceColor!==null,instancingMorph:Mt&&U.morphTexture!==null,supportsVertexTextures:m,outputColorSpace:ut===null?i.outputColorSpace:ut.isXRRenderTarget===!0?ut.texture.colorSpace:di,alphaToCoverage:!!b.alphaToCoverage,map:It,matcap:Ut,envMap:Wt,envMapMode:Wt&&k.mapping,envMapCubeUVHeight:$,aoMap:_,lightMap:at,bumpMap:Z,normalMap:I,displacementMap:m&&C,emissiveMap:z,normalMapObjectSpace:I&&b.normalMapType===Bl,normalMapTangentSpace:I&&b.normalMapType===Po,metalnessMap:tt,roughnessMap:w,anisotropy:x,anisotropyMap:ct,clearcoat:O,clearcoatMap:gt,clearcoatNormalMap:Vt,clearcoatRoughnessMap:ht,dispersion:j,iridescence:V,iridescenceMap:Tt,iridescenceThicknessMap:yt,sheen:K,sheenColorMap:Lt,sheenRoughnessMap:wt,specularMap:Nt,specularColorMap:Ot,specularIntensityMap:$t,transmission:dt,transmissionMap:G,thicknessMap:xt,gradientMap:st,opaque:b.transparent===!1&&b.blending===ii&&b.alphaToCoverage===!1,alphaMap:ot,alphaTest:St,alphaHash:Et,combine:b.combine,mapUv:It&&g(b.map.channel),aoMapUv:_&&g(b.aoMap.channel),lightMapUv:at&&g(b.lightMap.channel),bumpMapUv:Z&&g(b.bumpMap.channel),normalMapUv:I&&g(b.normalMap.channel),displacementMapUv:C&&g(b.displacementMap.channel),emissiveMapUv:z&&g(b.emissiveMap.channel),metalnessMapUv:tt&&g(b.metalnessMap.channel),roughnessMapUv:w&&g(b.roughnessMap.channel),anisotropyMapUv:ct&&g(b.anisotropyMap.channel),clearcoatMapUv:gt&&g(b.clearcoatMap.channel),clearcoatNormalMapUv:Vt&&g(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ht&&g(b.clearcoatRoughnessMap.channel),iridescenceMapUv:Tt&&g(b.iridescenceMap.channel),iridescenceThicknessMapUv:yt&&g(b.iridescenceThicknessMap.channel),sheenColorMapUv:Lt&&g(b.sheenColorMap.channel),sheenRoughnessMapUv:wt&&g(b.sheenRoughnessMap.channel),specularMapUv:Nt&&g(b.specularMap.channel),specularColorMapUv:Ot&&g(b.specularColorMap.channel),specularIntensityMapUv:$t&&g(b.specularIntensityMap.channel),transmissionMapUv:G&&g(b.transmissionMap.channel),thicknessMapUv:xt&&g(b.thicknessMap.channel),alphaMapUv:ot&&g(b.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(I||x),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!B.attributes.uv&&(It||ot),fog:!!S,useFog:b.fog===!0,fogExp2:!!S&&S.isFogExp2,flatShading:b.flatShading===!0,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:p,reverseDepthBuffer:pt,skinning:U.isSkinnedMesh===!0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:H,morphTextureStride:W,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:b.dithering,shadowMapEnabled:i.shadowMap.enabled&&F.length>0,shadowMapType:i.shadowMap.type,toneMapping:ie,decodeVideoTexture:It&&b.map.isVideoTexture===!0&&Xt.getTransfer(b.map.colorSpace)===Jt,decodeVideoTextureEmissive:z&&b.emissiveMap.isVideoTexture===!0&&Xt.getTransfer(b.emissiveMap.colorSpace)===Jt,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===tn,flipSided:b.side===Se,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:Bt&&b.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Bt&&b.extensions.multiDraw===!0||Pt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return ue.vertexUv1s=h.has(1),ue.vertexUv2s=h.has(2),ue.vertexUv3s=h.has(3),h.clear(),ue}function c(b){const T=[];if(b.shaderID?T.push(b.shaderID):(T.push(b.customVertexShaderID),T.push(b.customFragmentShaderID)),b.defines!==void 0)for(const F in b.defines)T.push(F),T.push(b.defines[F]);return b.isRawShaderMaterial===!1&&(M(T,b),E(T,b),T.push(i.outputColorSpace)),T.push(b.customProgramCacheKey),T.join()}function M(b,T){b.push(T.precision),b.push(T.outputColorSpace),b.push(T.envMapMode),b.push(T.envMapCubeUVHeight),b.push(T.mapUv),b.push(T.alphaMapUv),b.push(T.lightMapUv),b.push(T.aoMapUv),b.push(T.bumpMapUv),b.push(T.normalMapUv),b.push(T.displacementMapUv),b.push(T.emissiveMapUv),b.push(T.metalnessMapUv),b.push(T.roughnessMapUv),b.push(T.anisotropyMapUv),b.push(T.clearcoatMapUv),b.push(T.clearcoatNormalMapUv),b.push(T.clearcoatRoughnessMapUv),b.push(T.iridescenceMapUv),b.push(T.iridescenceThicknessMapUv),b.push(T.sheenColorMapUv),b.push(T.sheenRoughnessMapUv),b.push(T.specularMapUv),b.push(T.specularColorMapUv),b.push(T.specularIntensityMapUv),b.push(T.transmissionMapUv),b.push(T.thicknessMapUv),b.push(T.combine),b.push(T.fogExp2),b.push(T.sizeAttenuation),b.push(T.morphTargetsCount),b.push(T.morphAttributeCount),b.push(T.numDirLights),b.push(T.numPointLights),b.push(T.numSpotLights),b.push(T.numSpotLightMaps),b.push(T.numHemiLights),b.push(T.numRectAreaLights),b.push(T.numDirLightShadows),b.push(T.numPointLightShadows),b.push(T.numSpotLightShadows),b.push(T.numSpotLightShadowsWithMaps),b.push(T.numLightProbes),b.push(T.shadowMapType),b.push(T.toneMapping),b.push(T.numClippingPlanes),b.push(T.numClipIntersection),b.push(T.depthPacking)}function E(b,T){a.disableAll(),T.supportsVertexTextures&&a.enable(0),T.instancing&&a.enable(1),T.instancingColor&&a.enable(2),T.instancingMorph&&a.enable(3),T.matcap&&a.enable(4),T.envMap&&a.enable(5),T.normalMapObjectSpace&&a.enable(6),T.normalMapTangentSpace&&a.enable(7),T.clearcoat&&a.enable(8),T.iridescence&&a.enable(9),T.alphaTest&&a.enable(10),T.vertexColors&&a.enable(11),T.vertexAlphas&&a.enable(12),T.vertexUv1s&&a.enable(13),T.vertexUv2s&&a.enable(14),T.vertexUv3s&&a.enable(15),T.vertexTangents&&a.enable(16),T.anisotropy&&a.enable(17),T.alphaHash&&a.enable(18),T.batching&&a.enable(19),T.dispersion&&a.enable(20),T.batchingColor&&a.enable(21),b.push(a.mask),a.disableAll(),T.fog&&a.enable(0),T.useFog&&a.enable(1),T.flatShading&&a.enable(2),T.logarithmicDepthBuffer&&a.enable(3),T.reverseDepthBuffer&&a.enable(4),T.skinning&&a.enable(5),T.morphTargets&&a.enable(6),T.morphNormals&&a.enable(7),T.morphColors&&a.enable(8),T.premultipliedAlpha&&a.enable(9),T.shadowMapEnabled&&a.enable(10),T.doubleSided&&a.enable(11),T.flipSided&&a.enable(12),T.useDepthPacking&&a.enable(13),T.dithering&&a.enable(14),T.transmission&&a.enable(15),T.sheen&&a.enable(16),T.opaque&&a.enable(17),T.pointsUvs&&a.enable(18),T.decodeVideoTexture&&a.enable(19),T.decodeVideoTextureEmissive&&a.enable(20),T.alphaToCoverage&&a.enable(21),b.push(a.mask)}function y(b){const T=v[b.type];let F;if(T){const R=ke[T];F=pc.clone(R.uniforms)}else F=b.uniforms;return F}function D(b,T){let F;for(let R=0,U=d.length;R<U;R++){const S=d[R];if(S.cacheKey===T){F=S,++F.usedTimes;break}}return F===void 0&&(F=new Rd(i,T,b,s),d.push(F)),F}function L(b){if(--b.usedTimes===0){const T=d.indexOf(b);d[T]=d[d.length-1],d.pop(),b.destroy()}}function P(b){l.remove(b)}function N(){l.dispose()}return{getParameters:f,getProgramCacheKey:c,getUniforms:y,acquireProgram:D,releaseProgram:L,releaseShaderCache:P,programs:d,dispose:N}}function Id(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function r(o,a,l){i.get(o)[a]=l}function s(){i=new WeakMap}return{has:t,get:e,remove:n,update:r,dispose:s}}function Ud(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function so(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function ao(){const i=[];let t=0;const e=[],n=[],r=[];function s(){t=0,e.length=0,n.length=0,r.length=0}function o(p,m,u,v,g,f){let c=i[t];return c===void 0?(c={id:p.id,object:p,geometry:m,material:u,groupOrder:v,renderOrder:p.renderOrder,z:g,group:f},i[t]=c):(c.id=p.id,c.object=p,c.geometry=m,c.material=u,c.groupOrder=v,c.renderOrder=p.renderOrder,c.z=g,c.group=f),t++,c}function a(p,m,u,v,g,f){const c=o(p,m,u,v,g,f);u.transmission>0?n.push(c):u.transparent===!0?r.push(c):e.push(c)}function l(p,m,u,v,g,f){const c=o(p,m,u,v,g,f);u.transmission>0?n.unshift(c):u.transparent===!0?r.unshift(c):e.unshift(c)}function h(p,m){e.length>1&&e.sort(p||Ud),n.length>1&&n.sort(m||so),r.length>1&&r.sort(m||so)}function d(){for(let p=t,m=i.length;p<m;p++){const u=i[p];if(u.id===null)break;u.id=null,u.object=null,u.geometry=null,u.material=null,u.group=null}}return{opaque:e,transmissive:n,transparent:r,init:s,push:a,unshift:l,finish:d,sort:h}}function Nd(){let i=new WeakMap;function t(n,r){const s=i.get(n);let o;return s===void 0?(o=new ao,i.set(n,[o])):r>=s.length?(o=new ao,s.push(o)):o=s[r],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function Fd(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new nt,color:new qt};break;case"SpotLight":e={position:new nt,direction:new nt,color:new qt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new nt,color:new qt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new nt,skyColor:new qt,groundColor:new qt};break;case"RectAreaLight":e={color:new qt,position:new nt,halfWidth:new nt,halfHeight:new nt};break}return i[t.id]=e,e}}}function Od(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ht};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ht};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ht,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let Bd=0;function zd(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function kd(i){const t=new Fd,e=Od(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new nt);const r=new nt,s=new se,o=new se;function a(h){let d=0,p=0,m=0;for(let b=0;b<9;b++)n.probe[b].set(0,0,0);let u=0,v=0,g=0,f=0,c=0,M=0,E=0,y=0,D=0,L=0,P=0;h.sort(zd);for(let b=0,T=h.length;b<T;b++){const F=h[b],R=F.color,U=F.intensity,S=F.distance,B=F.shadow&&F.shadow.map?F.shadow.map.texture:null;if(F.isAmbientLight)d+=R.r*U,p+=R.g*U,m+=R.b*U;else if(F.isLightProbe){for(let et=0;et<9;et++)n.probe[et].addScaledVector(F.sh.coefficients[et],U);P++}else if(F.isDirectionalLight){const et=t.get(F);if(et.color.copy(F.color).multiplyScalar(F.intensity),F.castShadow){const k=F.shadow,$=e.get(F);$.shadowIntensity=k.intensity,$.shadowBias=k.bias,$.shadowNormalBias=k.normalBias,$.shadowRadius=k.radius,$.shadowMapSize=k.mapSize,n.directionalShadow[u]=$,n.directionalShadowMap[u]=B,n.directionalShadowMatrix[u]=F.shadow.matrix,M++}n.directional[u]=et,u++}else if(F.isSpotLight){const et=t.get(F);et.position.setFromMatrixPosition(F.matrixWorld),et.color.copy(R).multiplyScalar(U),et.distance=S,et.coneCos=Math.cos(F.angle),et.penumbraCos=Math.cos(F.angle*(1-F.penumbra)),et.decay=F.decay,n.spot[g]=et;const k=F.shadow;if(F.map&&(n.spotLightMap[D]=F.map,D++,k.updateMatrices(F),F.castShadow&&L++),n.spotLightMatrix[g]=k.matrix,F.castShadow){const $=e.get(F);$.shadowIntensity=k.intensity,$.shadowBias=k.bias,$.shadowNormalBias=k.normalBias,$.shadowRadius=k.radius,$.shadowMapSize=k.mapSize,n.spotShadow[g]=$,n.spotShadowMap[g]=B,y++}g++}else if(F.isRectAreaLight){const et=t.get(F);et.color.copy(R).multiplyScalar(U),et.halfWidth.set(F.width*.5,0,0),et.halfHeight.set(0,F.height*.5,0),n.rectArea[f]=et,f++}else if(F.isPointLight){const et=t.get(F);if(et.color.copy(F.color).multiplyScalar(F.intensity),et.distance=F.distance,et.decay=F.decay,F.castShadow){const k=F.shadow,$=e.get(F);$.shadowIntensity=k.intensity,$.shadowBias=k.bias,$.shadowNormalBias=k.normalBias,$.shadowRadius=k.radius,$.shadowMapSize=k.mapSize,$.shadowCameraNear=k.camera.near,$.shadowCameraFar=k.camera.far,n.pointShadow[v]=$,n.pointShadowMap[v]=B,n.pointShadowMatrix[v]=F.shadow.matrix,E++}n.point[v]=et,v++}else if(F.isHemisphereLight){const et=t.get(F);et.skyColor.copy(F.color).multiplyScalar(U),et.groundColor.copy(F.groundColor).multiplyScalar(U),n.hemi[c]=et,c++}}f>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=vt.LTC_FLOAT_1,n.rectAreaLTC2=vt.LTC_FLOAT_2):(n.rectAreaLTC1=vt.LTC_HALF_1,n.rectAreaLTC2=vt.LTC_HALF_2)),n.ambient[0]=d,n.ambient[1]=p,n.ambient[2]=m;const N=n.hash;(N.directionalLength!==u||N.pointLength!==v||N.spotLength!==g||N.rectAreaLength!==f||N.hemiLength!==c||N.numDirectionalShadows!==M||N.numPointShadows!==E||N.numSpotShadows!==y||N.numSpotMaps!==D||N.numLightProbes!==P)&&(n.directional.length=u,n.spot.length=g,n.rectArea.length=f,n.point.length=v,n.hemi.length=c,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.pointShadow.length=E,n.pointShadowMap.length=E,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=M,n.pointShadowMatrix.length=E,n.spotLightMatrix.length=y+D-L,n.spotLightMap.length=D,n.numSpotLightShadowsWithMaps=L,n.numLightProbes=P,N.directionalLength=u,N.pointLength=v,N.spotLength=g,N.rectAreaLength=f,N.hemiLength=c,N.numDirectionalShadows=M,N.numPointShadows=E,N.numSpotShadows=y,N.numSpotMaps=D,N.numLightProbes=P,n.version=Bd++)}function l(h,d){let p=0,m=0,u=0,v=0,g=0;const f=d.matrixWorldInverse;for(let c=0,M=h.length;c<M;c++){const E=h[c];if(E.isDirectionalLight){const y=n.directional[p];y.direction.setFromMatrixPosition(E.matrixWorld),r.setFromMatrixPosition(E.target.matrixWorld),y.direction.sub(r),y.direction.transformDirection(f),p++}else if(E.isSpotLight){const y=n.spot[u];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(f),y.direction.setFromMatrixPosition(E.matrixWorld),r.setFromMatrixPosition(E.target.matrixWorld),y.direction.sub(r),y.direction.transformDirection(f),u++}else if(E.isRectAreaLight){const y=n.rectArea[v];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(f),o.identity(),s.copy(E.matrixWorld),s.premultiply(f),o.extractRotation(s),y.halfWidth.set(E.width*.5,0,0),y.halfHeight.set(0,E.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),v++}else if(E.isPointLight){const y=n.point[m];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(f),m++}else if(E.isHemisphereLight){const y=n.hemi[g];y.direction.setFromMatrixPosition(E.matrixWorld),y.direction.transformDirection(f),g++}}}return{setup:a,setupView:l,state:n}}function oo(i){const t=new kd(i),e=[],n=[];function r(d){h.camera=d,e.length=0,n.length=0}function s(d){e.push(d)}function o(d){n.push(d)}function a(){t.setup(e)}function l(d){t.setupView(e,d)}const h={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:r,state:h,setupLights:a,setupLightsView:l,pushLight:s,pushShadow:o}}function Hd(i){let t=new WeakMap;function e(r,s=0){const o=t.get(r);let a;return o===void 0?(a=new oo(i),t.set(r,[a])):s>=o.length?(a=new oo(i),o.push(a)):a=o[s],a}function n(){t=new WeakMap}return{get:e,dispose:n}}class Gd extends Pi{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Fl,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Vd extends Pi{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const Wd=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Xd=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Yd(i,t,e){let n=new $s;const r=new Ht,s=new Ht,o=new re,a=new Gd({depthPacking:Ol}),l=new Vd,h={},d=e.maxTextureSize,p={[xn]:Se,[Se]:xn,[tn]:tn},m=new Sn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ht},radius:{value:4}},vertexShader:Wd,fragmentShader:Xd}),u=m.clone();u.defines.HORIZONTAL_PASS=1;const v=new Mn;v.setAttribute("position",new Ge(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const g=new Ce(v,m),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=vo;let c=this.type;this.render=function(L,P,N){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||L.length===0)return;const b=i.getRenderTarget(),T=i.getActiveCubeFace(),F=i.getActiveMipmapLevel(),R=i.state;R.setBlending(gn),R.buffers.color.setClear(1,1,1,1),R.buffers.depth.setTest(!0),R.setScissorTest(!1);const U=c!==Je&&this.type===Je,S=c===Je&&this.type!==Je;for(let B=0,et=L.length;B<et;B++){const k=L[B],$=k.shadow;if($===void 0){console.warn("THREE.WebGLShadowMap:",k,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;r.copy($.mapSize);const Q=$.getFrameExtents();if(r.multiply(Q),s.copy($.mapSize),(r.x>d||r.y>d)&&(r.x>d&&(s.x=Math.floor(d/Q.x),r.x=s.x*Q.x,$.mapSize.x=s.x),r.y>d&&(s.y=Math.floor(d/Q.y),r.y=s.y*Q.y,$.mapSize.y=s.y)),$.map===null||U===!0||S===!0){const H=this.type!==Je?{minFilter:Oe,magFilter:Oe}:{};$.map!==null&&$.map.dispose(),$.map=new Nn(r.x,r.y,H),$.map.texture.name=k.name+".shadowMap",$.camera.updateProjectionMatrix()}i.setRenderTarget($.map),i.clear();const lt=$.getViewportCount();for(let H=0;H<lt;H++){const W=$.getViewport(H);o.set(s.x*W.x,s.y*W.y,s.x*W.z,s.y*W.w),R.viewport(o),$.updateMatrices(k,H),n=$.getFrustum(),y(P,N,$.camera,k,this.type)}$.isPointLightShadow!==!0&&this.type===Je&&M($,N),$.needsUpdate=!1}c=this.type,f.needsUpdate=!1,i.setRenderTarget(b,T,F)};function M(L,P){const N=t.update(g);m.defines.VSM_SAMPLES!==L.blurSamples&&(m.defines.VSM_SAMPLES=L.blurSamples,u.defines.VSM_SAMPLES=L.blurSamples,m.needsUpdate=!0,u.needsUpdate=!0),L.mapPass===null&&(L.mapPass=new Nn(r.x,r.y)),m.uniforms.shadow_pass.value=L.map.texture,m.uniforms.resolution.value=L.mapSize,m.uniforms.radius.value=L.radius,i.setRenderTarget(L.mapPass),i.clear(),i.renderBufferDirect(P,null,N,m,g,null),u.uniforms.shadow_pass.value=L.mapPass.texture,u.uniforms.resolution.value=L.mapSize,u.uniforms.radius.value=L.radius,i.setRenderTarget(L.map),i.clear(),i.renderBufferDirect(P,null,N,u,g,null)}function E(L,P,N,b){let T=null;const F=N.isPointLight===!0?L.customDistanceMaterial:L.customDepthMaterial;if(F!==void 0)T=F;else if(T=N.isPointLight===!0?l:a,i.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0){const R=T.uuid,U=P.uuid;let S=h[R];S===void 0&&(S={},h[R]=S);let B=S[U];B===void 0&&(B=T.clone(),S[U]=B,P.addEventListener("dispose",D)),T=B}if(T.visible=P.visible,T.wireframe=P.wireframe,b===Je?T.side=P.shadowSide!==null?P.shadowSide:P.side:T.side=P.shadowSide!==null?P.shadowSide:p[P.side],T.alphaMap=P.alphaMap,T.alphaTest=P.alphaTest,T.map=P.map,T.clipShadows=P.clipShadows,T.clippingPlanes=P.clippingPlanes,T.clipIntersection=P.clipIntersection,T.displacementMap=P.displacementMap,T.displacementScale=P.displacementScale,T.displacementBias=P.displacementBias,T.wireframeLinewidth=P.wireframeLinewidth,T.linewidth=P.linewidth,N.isPointLight===!0&&T.isMeshDistanceMaterial===!0){const R=i.properties.get(T);R.light=N}return T}function y(L,P,N,b,T){if(L.visible===!1)return;if(L.layers.test(P.layers)&&(L.isMesh||L.isLine||L.isPoints)&&(L.castShadow||L.receiveShadow&&T===Je)&&(!L.frustumCulled||n.intersectsObject(L))){L.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,L.matrixWorld);const U=t.update(L),S=L.material;if(Array.isArray(S)){const B=U.groups;for(let et=0,k=B.length;et<k;et++){const $=B[et],Q=S[$.materialIndex];if(Q&&Q.visible){const lt=E(L,Q,b,T);L.onBeforeShadow(i,L,P,N,U,lt,$),i.renderBufferDirect(N,null,U,lt,L,$),L.onAfterShadow(i,L,P,N,U,lt,$)}}}else if(S.visible){const B=E(L,S,b,T);L.onBeforeShadow(i,L,P,N,U,B,null),i.renderBufferDirect(N,null,U,B,L,null),L.onAfterShadow(i,L,P,N,U,B,null)}}const R=L.children;for(let U=0,S=R.length;U<S;U++)y(R[U],P,N,b,T)}function D(L){L.target.removeEventListener("dispose",D);for(const N in h){const b=h[N],T=L.target.uuid;T in b&&(b[T].dispose(),delete b[T])}}}const qd={[ns]:is,[rs]:os,[ss]:ls,[oi]:as,[is]:ns,[os]:rs,[ls]:ss,[as]:oi};function jd(i,t){function e(){let G=!1;const xt=new re;let st=null;const ot=new re(0,0,0,0);return{setMask:function(St){st!==St&&!G&&(i.colorMask(St,St,St,St),st=St)},setLocked:function(St){G=St},setClear:function(St,Et,Bt,ie,ue){ue===!0&&(St*=ie,Et*=ie,Bt*=ie),xt.set(St,Et,Bt,ie),ot.equals(xt)===!1&&(i.clearColor(St,Et,Bt,ie),ot.copy(xt))},reset:function(){G=!1,st=null,ot.set(-1,0,0,0)}}}function n(){let G=!1,xt=!1,st=null,ot=null,St=null;return{setReversed:function(Et){if(xt!==Et){const Bt=t.get("EXT_clip_control");xt?Bt.clipControlEXT(Bt.LOWER_LEFT_EXT,Bt.ZERO_TO_ONE_EXT):Bt.clipControlEXT(Bt.LOWER_LEFT_EXT,Bt.NEGATIVE_ONE_TO_ONE_EXT);const ie=St;St=null,this.setClear(ie)}xt=Et},getReversed:function(){return xt},setTest:function(Et){Et?ut(i.DEPTH_TEST):pt(i.DEPTH_TEST)},setMask:function(Et){st!==Et&&!G&&(i.depthMask(Et),st=Et)},setFunc:function(Et){if(xt&&(Et=qd[Et]),ot!==Et){switch(Et){case ns:i.depthFunc(i.NEVER);break;case is:i.depthFunc(i.ALWAYS);break;case rs:i.depthFunc(i.LESS);break;case oi:i.depthFunc(i.LEQUAL);break;case ss:i.depthFunc(i.EQUAL);break;case as:i.depthFunc(i.GEQUAL);break;case os:i.depthFunc(i.GREATER);break;case ls:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}ot=Et}},setLocked:function(Et){G=Et},setClear:function(Et){St!==Et&&(xt&&(Et=1-Et),i.clearDepth(Et),St=Et)},reset:function(){G=!1,st=null,ot=null,St=null,xt=!1}}}function r(){let G=!1,xt=null,st=null,ot=null,St=null,Et=null,Bt=null,ie=null,ue=null;return{setTest:function(Kt){G||(Kt?ut(i.STENCIL_TEST):pt(i.STENCIL_TEST))},setMask:function(Kt){xt!==Kt&&!G&&(i.stencilMask(Kt),xt=Kt)},setFunc:function(Kt,Pe,Xe){(st!==Kt||ot!==Pe||St!==Xe)&&(i.stencilFunc(Kt,Pe,Xe),st=Kt,ot=Pe,St=Xe)},setOp:function(Kt,Pe,Xe){(Et!==Kt||Bt!==Pe||ie!==Xe)&&(i.stencilOp(Kt,Pe,Xe),Et=Kt,Bt=Pe,ie=Xe)},setLocked:function(Kt){G=Kt},setClear:function(Kt){ue!==Kt&&(i.clearStencil(Kt),ue=Kt)},reset:function(){G=!1,xt=null,st=null,ot=null,St=null,Et=null,Bt=null,ie=null,ue=null}}}const s=new e,o=new n,a=new r,l=new WeakMap,h=new WeakMap;let d={},p={},m=new WeakMap,u=[],v=null,g=!1,f=null,c=null,M=null,E=null,y=null,D=null,L=null,P=new qt(0,0,0),N=0,b=!1,T=null,F=null,R=null,U=null,S=null;const B=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let et=!1,k=0;const $=i.getParameter(i.VERSION);$.indexOf("WebGL")!==-1?(k=parseFloat(/^WebGL (\d)/.exec($)[1]),et=k>=1):$.indexOf("OpenGL ES")!==-1&&(k=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),et=k>=2);let Q=null,lt={};const H=i.getParameter(i.SCISSOR_BOX),W=i.getParameter(i.VIEWPORT),_t=new re().fromArray(H),X=new re().fromArray(W);function J(G,xt,st,ot){const St=new Uint8Array(4),Et=i.createTexture();i.bindTexture(G,Et),i.texParameteri(G,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(G,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Bt=0;Bt<st;Bt++)G===i.TEXTURE_3D||G===i.TEXTURE_2D_ARRAY?i.texImage3D(xt,0,i.RGBA,1,1,ot,0,i.RGBA,i.UNSIGNED_BYTE,St):i.texImage2D(xt+Bt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,St);return Et}const mt={};mt[i.TEXTURE_2D]=J(i.TEXTURE_2D,i.TEXTURE_2D,1),mt[i.TEXTURE_CUBE_MAP]=J(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),mt[i.TEXTURE_2D_ARRAY]=J(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),mt[i.TEXTURE_3D]=J(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ut(i.DEPTH_TEST),o.setFunc(oi),Z(!1),I(ua),ut(i.CULL_FACE),_(gn);function ut(G){d[G]!==!0&&(i.enable(G),d[G]=!0)}function pt(G){d[G]!==!1&&(i.disable(G),d[G]=!1)}function Mt(G,xt){return p[G]!==xt?(i.bindFramebuffer(G,xt),p[G]=xt,G===i.DRAW_FRAMEBUFFER&&(p[i.FRAMEBUFFER]=xt),G===i.FRAMEBUFFER&&(p[i.DRAW_FRAMEBUFFER]=xt),!0):!1}function Pt(G,xt){let st=u,ot=!1;if(G){st=m.get(xt),st===void 0&&(st=[],m.set(xt,st));const St=G.textures;if(st.length!==St.length||st[0]!==i.COLOR_ATTACHMENT0){for(let Et=0,Bt=St.length;Et<Bt;Et++)st[Et]=i.COLOR_ATTACHMENT0+Et;st.length=St.length,ot=!0}}else st[0]!==i.BACK&&(st[0]=i.BACK,ot=!0);ot&&i.drawBuffers(st)}function It(G){return v!==G?(i.useProgram(G),v=G,!0):!1}const Ut={[Pn]:i.FUNC_ADD,[cl]:i.FUNC_SUBTRACT,[hl]:i.FUNC_REVERSE_SUBTRACT};Ut[ul]=i.MIN,Ut[fl]=i.MAX;const Wt={[dl]:i.ZERO,[pl]:i.ONE,[ml]:i.SRC_COLOR,[ts]:i.SRC_ALPHA,[Ml]:i.SRC_ALPHA_SATURATE,[xl]:i.DST_COLOR,[gl]:i.DST_ALPHA,[_l]:i.ONE_MINUS_SRC_COLOR,[es]:i.ONE_MINUS_SRC_ALPHA,[Sl]:i.ONE_MINUS_DST_COLOR,[vl]:i.ONE_MINUS_DST_ALPHA,[yl]:i.CONSTANT_COLOR,[El]:i.ONE_MINUS_CONSTANT_COLOR,[bl]:i.CONSTANT_ALPHA,[Tl]:i.ONE_MINUS_CONSTANT_ALPHA};function _(G,xt,st,ot,St,Et,Bt,ie,ue,Kt){if(G===gn){g===!0&&(pt(i.BLEND),g=!1);return}if(g===!1&&(ut(i.BLEND),g=!0),G!==ll){if(G!==f||Kt!==b){if((c!==Pn||y!==Pn)&&(i.blendEquation(i.FUNC_ADD),c=Pn,y=Pn),Kt)switch(G){case ii:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case fa:i.blendFunc(i.ONE,i.ONE);break;case da:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case pa:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",G);break}else switch(G){case ii:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case fa:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case da:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case pa:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",G);break}M=null,E=null,D=null,L=null,P.set(0,0,0),N=0,f=G,b=Kt}return}St=St||xt,Et=Et||st,Bt=Bt||ot,(xt!==c||St!==y)&&(i.blendEquationSeparate(Ut[xt],Ut[St]),c=xt,y=St),(st!==M||ot!==E||Et!==D||Bt!==L)&&(i.blendFuncSeparate(Wt[st],Wt[ot],Wt[Et],Wt[Bt]),M=st,E=ot,D=Et,L=Bt),(ie.equals(P)===!1||ue!==N)&&(i.blendColor(ie.r,ie.g,ie.b,ue),P.copy(ie),N=ue),f=G,b=!1}function at(G,xt){G.side===tn?pt(i.CULL_FACE):ut(i.CULL_FACE);let st=G.side===Se;xt&&(st=!st),Z(st),G.blending===ii&&G.transparent===!1?_(gn):_(G.blending,G.blendEquation,G.blendSrc,G.blendDst,G.blendEquationAlpha,G.blendSrcAlpha,G.blendDstAlpha,G.blendColor,G.blendAlpha,G.premultipliedAlpha),o.setFunc(G.depthFunc),o.setTest(G.depthTest),o.setMask(G.depthWrite),s.setMask(G.colorWrite);const ot=G.stencilWrite;a.setTest(ot),ot&&(a.setMask(G.stencilWriteMask),a.setFunc(G.stencilFunc,G.stencilRef,G.stencilFuncMask),a.setOp(G.stencilFail,G.stencilZFail,G.stencilZPass)),z(G.polygonOffset,G.polygonOffsetFactor,G.polygonOffsetUnits),G.alphaToCoverage===!0?ut(i.SAMPLE_ALPHA_TO_COVERAGE):pt(i.SAMPLE_ALPHA_TO_COVERAGE)}function Z(G){T!==G&&(G?i.frontFace(i.CW):i.frontFace(i.CCW),T=G)}function I(G){G!==sl?(ut(i.CULL_FACE),G!==F&&(G===ua?i.cullFace(i.BACK):G===al?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):pt(i.CULL_FACE),F=G}function C(G){G!==R&&(et&&i.lineWidth(G),R=G)}function z(G,xt,st){G?(ut(i.POLYGON_OFFSET_FILL),(U!==xt||S!==st)&&(i.polygonOffset(xt,st),U=xt,S=st)):pt(i.POLYGON_OFFSET_FILL)}function tt(G){G?ut(i.SCISSOR_TEST):pt(i.SCISSOR_TEST)}function w(G){G===void 0&&(G=i.TEXTURE0+B-1),Q!==G&&(i.activeTexture(G),Q=G)}function x(G,xt,st){st===void 0&&(Q===null?st=i.TEXTURE0+B-1:st=Q);let ot=lt[st];ot===void 0&&(ot={type:void 0,texture:void 0},lt[st]=ot),(ot.type!==G||ot.texture!==xt)&&(Q!==st&&(i.activeTexture(st),Q=st),i.bindTexture(G,xt||mt[G]),ot.type=G,ot.texture=xt)}function O(){const G=lt[Q];G!==void 0&&G.type!==void 0&&(i.bindTexture(G.type,null),G.type=void 0,G.texture=void 0)}function j(){try{i.compressedTexImage2D.apply(i,arguments)}catch(G){console.error("THREE.WebGLState:",G)}}function V(){try{i.compressedTexImage3D.apply(i,arguments)}catch(G){console.error("THREE.WebGLState:",G)}}function K(){try{i.texSubImage2D.apply(i,arguments)}catch(G){console.error("THREE.WebGLState:",G)}}function dt(){try{i.texSubImage3D.apply(i,arguments)}catch(G){console.error("THREE.WebGLState:",G)}}function ct(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(G){console.error("THREE.WebGLState:",G)}}function gt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(G){console.error("THREE.WebGLState:",G)}}function Vt(){try{i.texStorage2D.apply(i,arguments)}catch(G){console.error("THREE.WebGLState:",G)}}function ht(){try{i.texStorage3D.apply(i,arguments)}catch(G){console.error("THREE.WebGLState:",G)}}function Tt(){try{i.texImage2D.apply(i,arguments)}catch(G){console.error("THREE.WebGLState:",G)}}function yt(){try{i.texImage3D.apply(i,arguments)}catch(G){console.error("THREE.WebGLState:",G)}}function Lt(G){_t.equals(G)===!1&&(i.scissor(G.x,G.y,G.z,G.w),_t.copy(G))}function wt(G){X.equals(G)===!1&&(i.viewport(G.x,G.y,G.z,G.w),X.copy(G))}function Nt(G,xt){let st=h.get(xt);st===void 0&&(st=new WeakMap,h.set(xt,st));let ot=st.get(G);ot===void 0&&(ot=i.getUniformBlockIndex(xt,G.name),st.set(G,ot))}function Ot(G,xt){const ot=h.get(xt).get(G);l.get(xt)!==ot&&(i.uniformBlockBinding(xt,ot,G.__bindingPointIndex),l.set(xt,ot))}function $t(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),d={},Q=null,lt={},p={},m=new WeakMap,u=[],v=null,g=!1,f=null,c=null,M=null,E=null,y=null,D=null,L=null,P=new qt(0,0,0),N=0,b=!1,T=null,F=null,R=null,U=null,S=null,_t.set(0,0,i.canvas.width,i.canvas.height),X.set(0,0,i.canvas.width,i.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:ut,disable:pt,bindFramebuffer:Mt,drawBuffers:Pt,useProgram:It,setBlending:_,setMaterial:at,setFlipSided:Z,setCullFace:I,setLineWidth:C,setPolygonOffset:z,setScissorTest:tt,activeTexture:w,bindTexture:x,unbindTexture:O,compressedTexImage2D:j,compressedTexImage3D:V,texImage2D:Tt,texImage3D:yt,updateUBOMapping:Nt,uniformBlockBinding:Ot,texStorage2D:Vt,texStorage3D:ht,texSubImage2D:K,texSubImage3D:dt,compressedTexSubImage2D:ct,compressedTexSubImage3D:gt,scissor:Lt,viewport:wt,reset:$t}}function lo(i,t,e,n){const r=Zd(n);switch(e){case Eo:return i*t;case To:return i*t;case wo:return i*t*2;case Ao:return i*t/r.components*r.byteLength;case qs:return i*t/r.components*r.byteLength;case Ro:return i*t*2/r.components*r.byteLength;case js:return i*t*2/r.components*r.byteLength;case bo:return i*t*3/r.components*r.byteLength;case Fe:return i*t*4/r.components*r.byteLength;case Zs:return i*t*4/r.components*r.byteLength;case sr:case ar:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case or:case lr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ps:case _s:return Math.max(i,16)*Math.max(t,8)/4;case ds:case ms:return Math.max(i,8)*Math.max(t,8)/2;case gs:case vs:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case xs:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ss:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ms:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case ys:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Es:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case bs:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Ts:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case ws:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case As:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Rs:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Cs:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Ps:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Ds:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Ls:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Is:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case cr:case Us:case Ns:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Co:case Fs:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Os:case Bs:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Zd(i){switch(i){case sn:case So:return{byteLength:1,components:1};case Ti:case Mo:case Ai:return{byteLength:2,components:1};case Xs:case Ys:return{byteLength:2,components:4};case Un:case Ws:case en:return{byteLength:4,components:1};case yo:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function Kd(i,t,e,n,r,s,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new Ht,d=new WeakMap;let p;const m=new WeakMap;let u=!1;try{u=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(w,x){return u?new OffscreenCanvas(w,x):dr("canvas")}function g(w,x,O){let j=1;const V=tt(w);if((V.width>O||V.height>O)&&(j=O/Math.max(V.width,V.height)),j<1)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){const K=Math.floor(j*V.width),dt=Math.floor(j*V.height);p===void 0&&(p=v(K,dt));const ct=x?v(K,dt):p;return ct.width=K,ct.height=dt,ct.getContext("2d").drawImage(w,0,0,K,dt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+V.width+"x"+V.height+") to ("+K+"x"+dt+")."),ct}else return"data"in w&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+V.width+"x"+V.height+")."),w;return w}function f(w){return w.generateMipmaps}function c(w){i.generateMipmap(w)}function M(w){return w.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:w.isWebGL3DRenderTarget?i.TEXTURE_3D:w.isWebGLArrayRenderTarget||w.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function E(w,x,O,j,V=!1){if(w!==null){if(i[w]!==void 0)return i[w];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let K=x;if(x===i.RED&&(O===i.FLOAT&&(K=i.R32F),O===i.HALF_FLOAT&&(K=i.R16F),O===i.UNSIGNED_BYTE&&(K=i.R8)),x===i.RED_INTEGER&&(O===i.UNSIGNED_BYTE&&(K=i.R8UI),O===i.UNSIGNED_SHORT&&(K=i.R16UI),O===i.UNSIGNED_INT&&(K=i.R32UI),O===i.BYTE&&(K=i.R8I),O===i.SHORT&&(K=i.R16I),O===i.INT&&(K=i.R32I)),x===i.RG&&(O===i.FLOAT&&(K=i.RG32F),O===i.HALF_FLOAT&&(K=i.RG16F),O===i.UNSIGNED_BYTE&&(K=i.RG8)),x===i.RG_INTEGER&&(O===i.UNSIGNED_BYTE&&(K=i.RG8UI),O===i.UNSIGNED_SHORT&&(K=i.RG16UI),O===i.UNSIGNED_INT&&(K=i.RG32UI),O===i.BYTE&&(K=i.RG8I),O===i.SHORT&&(K=i.RG16I),O===i.INT&&(K=i.RG32I)),x===i.RGB_INTEGER&&(O===i.UNSIGNED_BYTE&&(K=i.RGB8UI),O===i.UNSIGNED_SHORT&&(K=i.RGB16UI),O===i.UNSIGNED_INT&&(K=i.RGB32UI),O===i.BYTE&&(K=i.RGB8I),O===i.SHORT&&(K=i.RGB16I),O===i.INT&&(K=i.RGB32I)),x===i.RGBA_INTEGER&&(O===i.UNSIGNED_BYTE&&(K=i.RGBA8UI),O===i.UNSIGNED_SHORT&&(K=i.RGBA16UI),O===i.UNSIGNED_INT&&(K=i.RGBA32UI),O===i.BYTE&&(K=i.RGBA8I),O===i.SHORT&&(K=i.RGBA16I),O===i.INT&&(K=i.RGBA32I)),x===i.RGB&&O===i.UNSIGNED_INT_5_9_9_9_REV&&(K=i.RGB9_E5),x===i.RGBA){const dt=V?_r:Xt.getTransfer(j);O===i.FLOAT&&(K=i.RGBA32F),O===i.HALF_FLOAT&&(K=i.RGBA16F),O===i.UNSIGNED_BYTE&&(K=dt===Jt?i.SRGB8_ALPHA8:i.RGBA8),O===i.UNSIGNED_SHORT_4_4_4_4&&(K=i.RGBA4),O===i.UNSIGNED_SHORT_5_5_5_1&&(K=i.RGB5_A1)}return(K===i.R16F||K===i.R32F||K===i.RG16F||K===i.RG32F||K===i.RGBA16F||K===i.RGBA32F)&&t.get("EXT_color_buffer_float"),K}function y(w,x){let O;return w?x===null||x===Un||x===hi?O=i.DEPTH24_STENCIL8:x===en?O=i.DEPTH32F_STENCIL8:x===Ti&&(O=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===Un||x===hi?O=i.DEPTH_COMPONENT24:x===en?O=i.DEPTH_COMPONENT32F:x===Ti&&(O=i.DEPTH_COMPONENT16),O}function D(w,x){return f(w)===!0||w.isFramebufferTexture&&w.minFilter!==Oe&&w.minFilter!==He?Math.log2(Math.max(x.width,x.height))+1:w.mipmaps!==void 0&&w.mipmaps.length>0?w.mipmaps.length:w.isCompressedTexture&&Array.isArray(w.image)?x.mipmaps.length:1}function L(w){const x=w.target;x.removeEventListener("dispose",L),N(x),x.isVideoTexture&&d.delete(x)}function P(w){const x=w.target;x.removeEventListener("dispose",P),T(x)}function N(w){const x=n.get(w);if(x.__webglInit===void 0)return;const O=w.source,j=m.get(O);if(j){const V=j[x.__cacheKey];V.usedTimes--,V.usedTimes===0&&b(w),Object.keys(j).length===0&&m.delete(O)}n.remove(w)}function b(w){const x=n.get(w);i.deleteTexture(x.__webglTexture);const O=w.source,j=m.get(O);delete j[x.__cacheKey],o.memory.textures--}function T(w){const x=n.get(w);if(w.depthTexture&&(w.depthTexture.dispose(),n.remove(w.depthTexture)),w.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(x.__webglFramebuffer[j]))for(let V=0;V<x.__webglFramebuffer[j].length;V++)i.deleteFramebuffer(x.__webglFramebuffer[j][V]);else i.deleteFramebuffer(x.__webglFramebuffer[j]);x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer[j])}else{if(Array.isArray(x.__webglFramebuffer))for(let j=0;j<x.__webglFramebuffer.length;j++)i.deleteFramebuffer(x.__webglFramebuffer[j]);else i.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&i.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let j=0;j<x.__webglColorRenderbuffer.length;j++)x.__webglColorRenderbuffer[j]&&i.deleteRenderbuffer(x.__webglColorRenderbuffer[j]);x.__webglDepthRenderbuffer&&i.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const O=w.textures;for(let j=0,V=O.length;j<V;j++){const K=n.get(O[j]);K.__webglTexture&&(i.deleteTexture(K.__webglTexture),o.memory.textures--),n.remove(O[j])}n.remove(w)}let F=0;function R(){F=0}function U(){const w=F;return w>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+w+" texture units while this GPU supports only "+r.maxTextures),F+=1,w}function S(w){const x=[];return x.push(w.wrapS),x.push(w.wrapT),x.push(w.wrapR||0),x.push(w.magFilter),x.push(w.minFilter),x.push(w.anisotropy),x.push(w.internalFormat),x.push(w.format),x.push(w.type),x.push(w.generateMipmaps),x.push(w.premultiplyAlpha),x.push(w.flipY),x.push(w.unpackAlignment),x.push(w.colorSpace),x.join()}function B(w,x){const O=n.get(w);if(w.isVideoTexture&&C(w),w.isRenderTargetTexture===!1&&w.version>0&&O.__version!==w.version){const j=w.image;if(j===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{X(O,w,x);return}}e.bindTexture(i.TEXTURE_2D,O.__webglTexture,i.TEXTURE0+x)}function et(w,x){const O=n.get(w);if(w.version>0&&O.__version!==w.version){X(O,w,x);return}e.bindTexture(i.TEXTURE_2D_ARRAY,O.__webglTexture,i.TEXTURE0+x)}function k(w,x){const O=n.get(w);if(w.version>0&&O.__version!==w.version){X(O,w,x);return}e.bindTexture(i.TEXTURE_3D,O.__webglTexture,i.TEXTURE0+x)}function $(w,x){const O=n.get(w);if(w.version>0&&O.__version!==w.version){J(O,w,x);return}e.bindTexture(i.TEXTURE_CUBE_MAP,O.__webglTexture,i.TEXTURE0+x)}const Q={[us]:i.REPEAT,[Ln]:i.CLAMP_TO_EDGE,[fs]:i.MIRRORED_REPEAT},lt={[Oe]:i.NEAREST,[Nl]:i.NEAREST_MIPMAP_NEAREST,[Ui]:i.NEAREST_MIPMAP_LINEAR,[He]:i.LINEAR,[Sr]:i.LINEAR_MIPMAP_NEAREST,[In]:i.LINEAR_MIPMAP_LINEAR},H={[zl]:i.NEVER,[Xl]:i.ALWAYS,[kl]:i.LESS,[Do]:i.LEQUAL,[Hl]:i.EQUAL,[Wl]:i.GEQUAL,[Gl]:i.GREATER,[Vl]:i.NOTEQUAL};function W(w,x){if(x.type===en&&t.has("OES_texture_float_linear")===!1&&(x.magFilter===He||x.magFilter===Sr||x.magFilter===Ui||x.magFilter===In||x.minFilter===He||x.minFilter===Sr||x.minFilter===Ui||x.minFilter===In)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(w,i.TEXTURE_WRAP_S,Q[x.wrapS]),i.texParameteri(w,i.TEXTURE_WRAP_T,Q[x.wrapT]),(w===i.TEXTURE_3D||w===i.TEXTURE_2D_ARRAY)&&i.texParameteri(w,i.TEXTURE_WRAP_R,Q[x.wrapR]),i.texParameteri(w,i.TEXTURE_MAG_FILTER,lt[x.magFilter]),i.texParameteri(w,i.TEXTURE_MIN_FILTER,lt[x.minFilter]),x.compareFunction&&(i.texParameteri(w,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(w,i.TEXTURE_COMPARE_FUNC,H[x.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Oe||x.minFilter!==Ui&&x.minFilter!==In||x.type===en&&t.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){const O=t.get("EXT_texture_filter_anisotropic");i.texParameterf(w,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,r.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}function _t(w,x){let O=!1;w.__webglInit===void 0&&(w.__webglInit=!0,x.addEventListener("dispose",L));const j=x.source;let V=m.get(j);V===void 0&&(V={},m.set(j,V));const K=S(x);if(K!==w.__cacheKey){V[K]===void 0&&(V[K]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,O=!0),V[K].usedTimes++;const dt=V[w.__cacheKey];dt!==void 0&&(V[w.__cacheKey].usedTimes--,dt.usedTimes===0&&b(x)),w.__cacheKey=K,w.__webglTexture=V[K].texture}return O}function X(w,x,O){let j=i.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(j=i.TEXTURE_2D_ARRAY),x.isData3DTexture&&(j=i.TEXTURE_3D);const V=_t(w,x),K=x.source;e.bindTexture(j,w.__webglTexture,i.TEXTURE0+O);const dt=n.get(K);if(K.version!==dt.__version||V===!0){e.activeTexture(i.TEXTURE0+O);const ct=Xt.getPrimaries(Xt.workingColorSpace),gt=x.colorSpace===_n?null:Xt.getPrimaries(x.colorSpace),Vt=x.colorSpace===_n||ct===gt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Vt);let ht=g(x.image,!1,r.maxTextureSize);ht=z(x,ht);const Tt=s.convert(x.format,x.colorSpace),yt=s.convert(x.type);let Lt=E(x.internalFormat,Tt,yt,x.colorSpace,x.isVideoTexture);W(j,x);let wt;const Nt=x.mipmaps,Ot=x.isVideoTexture!==!0,$t=dt.__version===void 0||V===!0,G=K.dataReady,xt=D(x,ht);if(x.isDepthTexture)Lt=y(x.format===ui,x.type),$t&&(Ot?e.texStorage2D(i.TEXTURE_2D,1,Lt,ht.width,ht.height):e.texImage2D(i.TEXTURE_2D,0,Lt,ht.width,ht.height,0,Tt,yt,null));else if(x.isDataTexture)if(Nt.length>0){Ot&&$t&&e.texStorage2D(i.TEXTURE_2D,xt,Lt,Nt[0].width,Nt[0].height);for(let st=0,ot=Nt.length;st<ot;st++)wt=Nt[st],Ot?G&&e.texSubImage2D(i.TEXTURE_2D,st,0,0,wt.width,wt.height,Tt,yt,wt.data):e.texImage2D(i.TEXTURE_2D,st,Lt,wt.width,wt.height,0,Tt,yt,wt.data);x.generateMipmaps=!1}else Ot?($t&&e.texStorage2D(i.TEXTURE_2D,xt,Lt,ht.width,ht.height),G&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ht.width,ht.height,Tt,yt,ht.data)):e.texImage2D(i.TEXTURE_2D,0,Lt,ht.width,ht.height,0,Tt,yt,ht.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Ot&&$t&&e.texStorage3D(i.TEXTURE_2D_ARRAY,xt,Lt,Nt[0].width,Nt[0].height,ht.depth);for(let st=0,ot=Nt.length;st<ot;st++)if(wt=Nt[st],x.format!==Fe)if(Tt!==null)if(Ot){if(G)if(x.layerUpdates.size>0){const St=lo(wt.width,wt.height,x.format,x.type);for(const Et of x.layerUpdates){const Bt=wt.data.subarray(Et*St/wt.data.BYTES_PER_ELEMENT,(Et+1)*St/wt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,st,0,0,Et,wt.width,wt.height,1,Tt,Bt)}x.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,st,0,0,0,wt.width,wt.height,ht.depth,Tt,wt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,st,Lt,wt.width,wt.height,ht.depth,0,wt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ot?G&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,st,0,0,0,wt.width,wt.height,ht.depth,Tt,yt,wt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,st,Lt,wt.width,wt.height,ht.depth,0,Tt,yt,wt.data)}else{Ot&&$t&&e.texStorage2D(i.TEXTURE_2D,xt,Lt,Nt[0].width,Nt[0].height);for(let st=0,ot=Nt.length;st<ot;st++)wt=Nt[st],x.format!==Fe?Tt!==null?Ot?G&&e.compressedTexSubImage2D(i.TEXTURE_2D,st,0,0,wt.width,wt.height,Tt,wt.data):e.compressedTexImage2D(i.TEXTURE_2D,st,Lt,wt.width,wt.height,0,wt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ot?G&&e.texSubImage2D(i.TEXTURE_2D,st,0,0,wt.width,wt.height,Tt,yt,wt.data):e.texImage2D(i.TEXTURE_2D,st,Lt,wt.width,wt.height,0,Tt,yt,wt.data)}else if(x.isDataArrayTexture)if(Ot){if($t&&e.texStorage3D(i.TEXTURE_2D_ARRAY,xt,Lt,ht.width,ht.height,ht.depth),G)if(x.layerUpdates.size>0){const st=lo(ht.width,ht.height,x.format,x.type);for(const ot of x.layerUpdates){const St=ht.data.subarray(ot*st/ht.data.BYTES_PER_ELEMENT,(ot+1)*st/ht.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,ot,ht.width,ht.height,1,Tt,yt,St)}x.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ht.width,ht.height,ht.depth,Tt,yt,ht.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Lt,ht.width,ht.height,ht.depth,0,Tt,yt,ht.data);else if(x.isData3DTexture)Ot?($t&&e.texStorage3D(i.TEXTURE_3D,xt,Lt,ht.width,ht.height,ht.depth),G&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ht.width,ht.height,ht.depth,Tt,yt,ht.data)):e.texImage3D(i.TEXTURE_3D,0,Lt,ht.width,ht.height,ht.depth,0,Tt,yt,ht.data);else if(x.isFramebufferTexture){if($t)if(Ot)e.texStorage2D(i.TEXTURE_2D,xt,Lt,ht.width,ht.height);else{let st=ht.width,ot=ht.height;for(let St=0;St<xt;St++)e.texImage2D(i.TEXTURE_2D,St,Lt,st,ot,0,Tt,yt,null),st>>=1,ot>>=1}}else if(Nt.length>0){if(Ot&&$t){const st=tt(Nt[0]);e.texStorage2D(i.TEXTURE_2D,xt,Lt,st.width,st.height)}for(let st=0,ot=Nt.length;st<ot;st++)wt=Nt[st],Ot?G&&e.texSubImage2D(i.TEXTURE_2D,st,0,0,Tt,yt,wt):e.texImage2D(i.TEXTURE_2D,st,Lt,Tt,yt,wt);x.generateMipmaps=!1}else if(Ot){if($t){const st=tt(ht);e.texStorage2D(i.TEXTURE_2D,xt,Lt,st.width,st.height)}G&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,Tt,yt,ht)}else e.texImage2D(i.TEXTURE_2D,0,Lt,Tt,yt,ht);f(x)&&c(j),dt.__version=K.version,x.onUpdate&&x.onUpdate(x)}w.__version=x.version}function J(w,x,O){if(x.image.length!==6)return;const j=_t(w,x),V=x.source;e.bindTexture(i.TEXTURE_CUBE_MAP,w.__webglTexture,i.TEXTURE0+O);const K=n.get(V);if(V.version!==K.__version||j===!0){e.activeTexture(i.TEXTURE0+O);const dt=Xt.getPrimaries(Xt.workingColorSpace),ct=x.colorSpace===_n?null:Xt.getPrimaries(x.colorSpace),gt=x.colorSpace===_n||dt===ct?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,gt);const Vt=x.isCompressedTexture||x.image[0].isCompressedTexture,ht=x.image[0]&&x.image[0].isDataTexture,Tt=[];for(let ot=0;ot<6;ot++)!Vt&&!ht?Tt[ot]=g(x.image[ot],!0,r.maxCubemapSize):Tt[ot]=ht?x.image[ot].image:x.image[ot],Tt[ot]=z(x,Tt[ot]);const yt=Tt[0],Lt=s.convert(x.format,x.colorSpace),wt=s.convert(x.type),Nt=E(x.internalFormat,Lt,wt,x.colorSpace),Ot=x.isVideoTexture!==!0,$t=K.__version===void 0||j===!0,G=V.dataReady;let xt=D(x,yt);W(i.TEXTURE_CUBE_MAP,x);let st;if(Vt){Ot&&$t&&e.texStorage2D(i.TEXTURE_CUBE_MAP,xt,Nt,yt.width,yt.height);for(let ot=0;ot<6;ot++){st=Tt[ot].mipmaps;for(let St=0;St<st.length;St++){const Et=st[St];x.format!==Fe?Lt!==null?Ot?G&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,St,0,0,Et.width,Et.height,Lt,Et.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,St,Nt,Et.width,Et.height,0,Et.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ot?G&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,St,0,0,Et.width,Et.height,Lt,wt,Et.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,St,Nt,Et.width,Et.height,0,Lt,wt,Et.data)}}}else{if(st=x.mipmaps,Ot&&$t){st.length>0&&xt++;const ot=tt(Tt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,xt,Nt,ot.width,ot.height)}for(let ot=0;ot<6;ot++)if(ht){Ot?G&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,0,0,0,Tt[ot].width,Tt[ot].height,Lt,wt,Tt[ot].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,0,Nt,Tt[ot].width,Tt[ot].height,0,Lt,wt,Tt[ot].data);for(let St=0;St<st.length;St++){const Bt=st[St].image[ot].image;Ot?G&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,St+1,0,0,Bt.width,Bt.height,Lt,wt,Bt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,St+1,Nt,Bt.width,Bt.height,0,Lt,wt,Bt.data)}}else{Ot?G&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,0,0,0,Lt,wt,Tt[ot]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,0,Nt,Lt,wt,Tt[ot]);for(let St=0;St<st.length;St++){const Et=st[St];Ot?G&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,St+1,0,0,Lt,wt,Et.image[ot]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,St+1,Nt,Lt,wt,Et.image[ot])}}}f(x)&&c(i.TEXTURE_CUBE_MAP),K.__version=V.version,x.onUpdate&&x.onUpdate(x)}w.__version=x.version}function mt(w,x,O,j,V,K){const dt=s.convert(O.format,O.colorSpace),ct=s.convert(O.type),gt=E(O.internalFormat,dt,ct,O.colorSpace),Vt=n.get(x),ht=n.get(O);if(ht.__renderTarget=x,!Vt.__hasExternalTextures){const Tt=Math.max(1,x.width>>K),yt=Math.max(1,x.height>>K);V===i.TEXTURE_3D||V===i.TEXTURE_2D_ARRAY?e.texImage3D(V,K,gt,Tt,yt,x.depth,0,dt,ct,null):e.texImage2D(V,K,gt,Tt,yt,0,dt,ct,null)}e.bindFramebuffer(i.FRAMEBUFFER,w),I(x)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,j,V,ht.__webglTexture,0,Z(x)):(V===i.TEXTURE_2D||V>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&V<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,j,V,ht.__webglTexture,K),e.bindFramebuffer(i.FRAMEBUFFER,null)}function ut(w,x,O){if(i.bindRenderbuffer(i.RENDERBUFFER,w),x.depthBuffer){const j=x.depthTexture,V=j&&j.isDepthTexture?j.type:null,K=y(x.stencilBuffer,V),dt=x.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ct=Z(x);I(x)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ct,K,x.width,x.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,ct,K,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,K,x.width,x.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,dt,i.RENDERBUFFER,w)}else{const j=x.textures;for(let V=0;V<j.length;V++){const K=j[V],dt=s.convert(K.format,K.colorSpace),ct=s.convert(K.type),gt=E(K.internalFormat,dt,ct,K.colorSpace),Vt=Z(x);O&&I(x)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Vt,gt,x.width,x.height):I(x)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Vt,gt,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,gt,x.width,x.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function pt(w,x){if(x&&x.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,w),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const j=n.get(x.depthTexture);j.__renderTarget=x,(!j.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),B(x.depthTexture,0);const V=j.__webglTexture,K=Z(x);if(x.depthTexture.format===ri)I(x)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,V,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,V,0);else if(x.depthTexture.format===ui)I(x)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,V,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,V,0);else throw new Error("Unknown depthTexture format")}function Mt(w){const x=n.get(w),O=w.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==w.depthTexture){const j=w.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),j){const V=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,j.removeEventListener("dispose",V)};j.addEventListener("dispose",V),x.__depthDisposeCallback=V}x.__boundDepthTexture=j}if(w.depthTexture&&!x.__autoAllocateDepthBuffer){if(O)throw new Error("target.depthTexture not supported in Cube render targets");pt(x.__webglFramebuffer,w)}else if(O){x.__webglDepthbuffer=[];for(let j=0;j<6;j++)if(e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[j]),x.__webglDepthbuffer[j]===void 0)x.__webglDepthbuffer[j]=i.createRenderbuffer(),ut(x.__webglDepthbuffer[j],w,!1);else{const V=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,K=x.__webglDepthbuffer[j];i.bindRenderbuffer(i.RENDERBUFFER,K),i.framebufferRenderbuffer(i.FRAMEBUFFER,V,i.RENDERBUFFER,K)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=i.createRenderbuffer(),ut(x.__webglDepthbuffer,w,!1);else{const j=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,V=x.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,V),i.framebufferRenderbuffer(i.FRAMEBUFFER,j,i.RENDERBUFFER,V)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Pt(w,x,O){const j=n.get(w);x!==void 0&&mt(j.__webglFramebuffer,w,w.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),O!==void 0&&Mt(w)}function It(w){const x=w.texture,O=n.get(w),j=n.get(x);w.addEventListener("dispose",P);const V=w.textures,K=w.isWebGLCubeRenderTarget===!0,dt=V.length>1;if(dt||(j.__webglTexture===void 0&&(j.__webglTexture=i.createTexture()),j.__version=x.version,o.memory.textures++),K){O.__webglFramebuffer=[];for(let ct=0;ct<6;ct++)if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer[ct]=[];for(let gt=0;gt<x.mipmaps.length;gt++)O.__webglFramebuffer[ct][gt]=i.createFramebuffer()}else O.__webglFramebuffer[ct]=i.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer=[];for(let ct=0;ct<x.mipmaps.length;ct++)O.__webglFramebuffer[ct]=i.createFramebuffer()}else O.__webglFramebuffer=i.createFramebuffer();if(dt)for(let ct=0,gt=V.length;ct<gt;ct++){const Vt=n.get(V[ct]);Vt.__webglTexture===void 0&&(Vt.__webglTexture=i.createTexture(),o.memory.textures++)}if(w.samples>0&&I(w)===!1){O.__webglMultisampledFramebuffer=i.createFramebuffer(),O.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let ct=0;ct<V.length;ct++){const gt=V[ct];O.__webglColorRenderbuffer[ct]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,O.__webglColorRenderbuffer[ct]);const Vt=s.convert(gt.format,gt.colorSpace),ht=s.convert(gt.type),Tt=E(gt.internalFormat,Vt,ht,gt.colorSpace,w.isXRRenderTarget===!0),yt=Z(w);i.renderbufferStorageMultisample(i.RENDERBUFFER,yt,Tt,w.width,w.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.RENDERBUFFER,O.__webglColorRenderbuffer[ct])}i.bindRenderbuffer(i.RENDERBUFFER,null),w.depthBuffer&&(O.__webglDepthRenderbuffer=i.createRenderbuffer(),ut(O.__webglDepthRenderbuffer,w,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(K){e.bindTexture(i.TEXTURE_CUBE_MAP,j.__webglTexture),W(i.TEXTURE_CUBE_MAP,x);for(let ct=0;ct<6;ct++)if(x.mipmaps&&x.mipmaps.length>0)for(let gt=0;gt<x.mipmaps.length;gt++)mt(O.__webglFramebuffer[ct][gt],w,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,gt);else mt(O.__webglFramebuffer[ct],w,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0);f(x)&&c(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(dt){for(let ct=0,gt=V.length;ct<gt;ct++){const Vt=V[ct],ht=n.get(Vt);e.bindTexture(i.TEXTURE_2D,ht.__webglTexture),W(i.TEXTURE_2D,Vt),mt(O.__webglFramebuffer,w,Vt,i.COLOR_ATTACHMENT0+ct,i.TEXTURE_2D,0),f(Vt)&&c(i.TEXTURE_2D)}e.unbindTexture()}else{let ct=i.TEXTURE_2D;if((w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(ct=w.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ct,j.__webglTexture),W(ct,x),x.mipmaps&&x.mipmaps.length>0)for(let gt=0;gt<x.mipmaps.length;gt++)mt(O.__webglFramebuffer[gt],w,x,i.COLOR_ATTACHMENT0,ct,gt);else mt(O.__webglFramebuffer,w,x,i.COLOR_ATTACHMENT0,ct,0);f(x)&&c(ct),e.unbindTexture()}w.depthBuffer&&Mt(w)}function Ut(w){const x=w.textures;for(let O=0,j=x.length;O<j;O++){const V=x[O];if(f(V)){const K=M(w),dt=n.get(V).__webglTexture;e.bindTexture(K,dt),c(K),e.unbindTexture()}}}const Wt=[],_=[];function at(w){if(w.samples>0){if(I(w)===!1){const x=w.textures,O=w.width,j=w.height;let V=i.COLOR_BUFFER_BIT;const K=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,dt=n.get(w),ct=x.length>1;if(ct)for(let gt=0;gt<x.length;gt++)e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+gt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+gt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,dt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,dt.__webglFramebuffer);for(let gt=0;gt<x.length;gt++){if(w.resolveDepthBuffer&&(w.depthBuffer&&(V|=i.DEPTH_BUFFER_BIT),w.stencilBuffer&&w.resolveStencilBuffer&&(V|=i.STENCIL_BUFFER_BIT)),ct){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,dt.__webglColorRenderbuffer[gt]);const Vt=n.get(x[gt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Vt,0)}i.blitFramebuffer(0,0,O,j,0,0,O,j,V,i.NEAREST),l===!0&&(Wt.length=0,_.length=0,Wt.push(i.COLOR_ATTACHMENT0+gt),w.depthBuffer&&w.resolveDepthBuffer===!1&&(Wt.push(K),_.push(K),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,_)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Wt))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ct)for(let gt=0;gt<x.length;gt++){e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+gt,i.RENDERBUFFER,dt.__webglColorRenderbuffer[gt]);const Vt=n.get(x[gt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+gt,i.TEXTURE_2D,Vt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,dt.__webglMultisampledFramebuffer)}else if(w.depthBuffer&&w.resolveDepthBuffer===!1&&l){const x=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[x])}}}function Z(w){return Math.min(r.maxSamples,w.samples)}function I(w){const x=n.get(w);return w.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function C(w){const x=o.render.frame;d.get(w)!==x&&(d.set(w,x),w.update())}function z(w,x){const O=w.colorSpace,j=w.format,V=w.type;return w.isCompressedTexture===!0||w.isVideoTexture===!0||O!==di&&O!==_n&&(Xt.getTransfer(O)===Jt?(j!==Fe||V!==sn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",O)),x}function tt(w){return typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement?(h.width=w.naturalWidth||w.width,h.height=w.naturalHeight||w.height):typeof VideoFrame<"u"&&w instanceof VideoFrame?(h.width=w.displayWidth,h.height=w.displayHeight):(h.width=w.width,h.height=w.height),h}this.allocateTextureUnit=U,this.resetTextureUnits=R,this.setTexture2D=B,this.setTexture2DArray=et,this.setTexture3D=k,this.setTextureCube=$,this.rebindTextures=Pt,this.setupRenderTarget=It,this.updateRenderTargetMipmap=Ut,this.updateMultisampleRenderTarget=at,this.setupDepthRenderbuffer=Mt,this.setupFrameBufferTexture=mt,this.useMultisampledRTT=I}function $d(i,t){function e(n,r=_n){let s;const o=Xt.getTransfer(r);if(n===sn)return i.UNSIGNED_BYTE;if(n===Xs)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ys)return i.UNSIGNED_SHORT_5_5_5_1;if(n===yo)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===So)return i.BYTE;if(n===Mo)return i.SHORT;if(n===Ti)return i.UNSIGNED_SHORT;if(n===Ws)return i.INT;if(n===Un)return i.UNSIGNED_INT;if(n===en)return i.FLOAT;if(n===Ai)return i.HALF_FLOAT;if(n===Eo)return i.ALPHA;if(n===bo)return i.RGB;if(n===Fe)return i.RGBA;if(n===To)return i.LUMINANCE;if(n===wo)return i.LUMINANCE_ALPHA;if(n===ri)return i.DEPTH_COMPONENT;if(n===ui)return i.DEPTH_STENCIL;if(n===Ao)return i.RED;if(n===qs)return i.RED_INTEGER;if(n===Ro)return i.RG;if(n===js)return i.RG_INTEGER;if(n===Zs)return i.RGBA_INTEGER;if(n===sr||n===ar||n===or||n===lr)if(o===Jt)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===sr)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===ar)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===or)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===lr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===sr)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===ar)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===or)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===lr)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ds||n===ps||n===ms||n===_s)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===ds)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ps)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ms)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===_s)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===gs||n===vs||n===xs)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===gs||n===vs)return o===Jt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===xs)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Ss||n===Ms||n===ys||n===Es||n===bs||n===Ts||n===ws||n===As||n===Rs||n===Cs||n===Ps||n===Ds||n===Ls||n===Is)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===Ss)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ms)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ys)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Es)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===bs)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Ts)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===ws)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===As)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Rs)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Cs)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ps)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ds)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ls)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Is)return o===Jt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===cr||n===Us||n===Ns)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===cr)return o===Jt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Us)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ns)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Co||n===Fs||n===Os||n===Bs)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===cr)return s.COMPRESSED_RED_RGTC1_EXT;if(n===Fs)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Os)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Bs)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===hi?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class Jd extends Re{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class er extends pe{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Qd={type:"move"};class jr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new er,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new er,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new nt,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new nt),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new er,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new nt,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new nt),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let r=null,s=null,o=null;const a=this._targetRay,l=this._grip,h=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(h&&t.hand){o=!0;for(const g of t.hand.values()){const f=e.getJointPose(g,n),c=this._getHandJoint(h,g);f!==null&&(c.matrix.fromArray(f.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,c.jointRadius=f.radius),c.visible=f!==null}const d=h.joints["index-finger-tip"],p=h.joints["thumb-tip"],m=d.position.distanceTo(p.position),u=.02,v=.005;h.inputState.pinching&&m>u+v?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!h.inputState.pinching&&m<=u-v&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(r=e.getPose(t.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Qd)))}return a!==null&&(a.visible=r!==null),l!==null&&(l.visible=s!==null),h!==null&&(h.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new er;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const tp=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,ep=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class np{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const r=new Me,s=t.properties.get(r);s.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=r}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Sn({vertexShader:tp,fragmentShader:ep,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Ce(new Di(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class ip extends Bn{constructor(t,e){super();const n=this;let r=null,s=1,o=null,a="local-floor",l=1,h=null,d=null,p=null,m=null,u=null,v=null;const g=new np,f=e.getContextAttributes();let c=null,M=null;const E=[],y=[],D=new Ht;let L=null;const P=new Re;P.viewport=new re;const N=new Re;N.viewport=new re;const b=[P,N],T=new Jd;let F=null,R=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let J=E[X];return J===void 0&&(J=new jr,E[X]=J),J.getTargetRaySpace()},this.getControllerGrip=function(X){let J=E[X];return J===void 0&&(J=new jr,E[X]=J),J.getGripSpace()},this.getHand=function(X){let J=E[X];return J===void 0&&(J=new jr,E[X]=J),J.getHandSpace()};function U(X){const J=y.indexOf(X.inputSource);if(J===-1)return;const mt=E[J];mt!==void 0&&(mt.update(X.inputSource,X.frame,h||o),mt.dispatchEvent({type:X.type,data:X.inputSource}))}function S(){r.removeEventListener("select",U),r.removeEventListener("selectstart",U),r.removeEventListener("selectend",U),r.removeEventListener("squeeze",U),r.removeEventListener("squeezestart",U),r.removeEventListener("squeezeend",U),r.removeEventListener("end",S),r.removeEventListener("inputsourceschange",B);for(let X=0;X<E.length;X++){const J=y[X];J!==null&&(y[X]=null,E[X].disconnect(J))}F=null,R=null,g.reset(),t.setRenderTarget(c),u=null,m=null,p=null,r=null,M=null,_t.stop(),n.isPresenting=!1,t.setPixelRatio(L),t.setSize(D.width,D.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){s=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){a=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||o},this.setReferenceSpace=function(X){h=X},this.getBaseLayer=function(){return m!==null?m:u},this.getBinding=function(){return p},this.getFrame=function(){return v},this.getSession=function(){return r},this.setSession=async function(X){if(r=X,r!==null){if(c=t.getRenderTarget(),r.addEventListener("select",U),r.addEventListener("selectstart",U),r.addEventListener("selectend",U),r.addEventListener("squeeze",U),r.addEventListener("squeezestart",U),r.addEventListener("squeezeend",U),r.addEventListener("end",S),r.addEventListener("inputsourceschange",B),f.xrCompatible!==!0&&await e.makeXRCompatible(),L=t.getPixelRatio(),t.getSize(D),r.renderState.layers===void 0){const J={antialias:f.antialias,alpha:!0,depth:f.depth,stencil:f.stencil,framebufferScaleFactor:s};u=new XRWebGLLayer(r,e,J),r.updateRenderState({baseLayer:u}),t.setPixelRatio(1),t.setSize(u.framebufferWidth,u.framebufferHeight,!1),M=new Nn(u.framebufferWidth,u.framebufferHeight,{format:Fe,type:sn,colorSpace:t.outputColorSpace,stencilBuffer:f.stencil})}else{let J=null,mt=null,ut=null;f.depth&&(ut=f.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,J=f.stencil?ui:ri,mt=f.stencil?hi:Un);const pt={colorFormat:e.RGBA8,depthFormat:ut,scaleFactor:s};p=new XRWebGLBinding(r,e),m=p.createProjectionLayer(pt),r.updateRenderState({layers:[m]}),t.setPixelRatio(1),t.setSize(m.textureWidth,m.textureHeight,!1),M=new Nn(m.textureWidth,m.textureHeight,{format:Fe,type:sn,depthTexture:new Yo(m.textureWidth,m.textureHeight,mt,void 0,void 0,void 0,void 0,void 0,void 0,J),stencilBuffer:f.stencil,colorSpace:t.outputColorSpace,samples:f.antialias?4:0,resolveDepthBuffer:m.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),h=null,o=await r.requestReferenceSpace(a),_t.setContext(r),_t.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function B(X){for(let J=0;J<X.removed.length;J++){const mt=X.removed[J],ut=y.indexOf(mt);ut>=0&&(y[ut]=null,E[ut].disconnect(mt))}for(let J=0;J<X.added.length;J++){const mt=X.added[J];let ut=y.indexOf(mt);if(ut===-1){for(let Mt=0;Mt<E.length;Mt++)if(Mt>=y.length){y.push(mt),ut=Mt;break}else if(y[Mt]===null){y[Mt]=mt,ut=Mt;break}if(ut===-1)break}const pt=E[ut];pt&&pt.connect(mt)}}const et=new nt,k=new nt;function $(X,J,mt){et.setFromMatrixPosition(J.matrixWorld),k.setFromMatrixPosition(mt.matrixWorld);const ut=et.distanceTo(k),pt=J.projectionMatrix.elements,Mt=mt.projectionMatrix.elements,Pt=pt[14]/(pt[10]-1),It=pt[14]/(pt[10]+1),Ut=(pt[9]+1)/pt[5],Wt=(pt[9]-1)/pt[5],_=(pt[8]-1)/pt[0],at=(Mt[8]+1)/Mt[0],Z=Pt*_,I=Pt*at,C=ut/(-_+at),z=C*-_;if(J.matrixWorld.decompose(X.position,X.quaternion,X.scale),X.translateX(z),X.translateZ(C),X.matrixWorld.compose(X.position,X.quaternion,X.scale),X.matrixWorldInverse.copy(X.matrixWorld).invert(),pt[10]===-1)X.projectionMatrix.copy(J.projectionMatrix),X.projectionMatrixInverse.copy(J.projectionMatrixInverse);else{const tt=Pt+C,w=It+C,x=Z-z,O=I+(ut-z),j=Ut*It/w*tt,V=Wt*It/w*tt;X.projectionMatrix.makePerspective(x,O,j,V,tt,w),X.projectionMatrixInverse.copy(X.projectionMatrix).invert()}}function Q(X,J){J===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices(J.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(r===null)return;let J=X.near,mt=X.far;g.texture!==null&&(g.depthNear>0&&(J=g.depthNear),g.depthFar>0&&(mt=g.depthFar)),T.near=N.near=P.near=J,T.far=N.far=P.far=mt,(F!==T.near||R!==T.far)&&(r.updateRenderState({depthNear:T.near,depthFar:T.far}),F=T.near,R=T.far),P.layers.mask=X.layers.mask|2,N.layers.mask=X.layers.mask|4,T.layers.mask=P.layers.mask|N.layers.mask;const ut=X.parent,pt=T.cameras;Q(T,ut);for(let Mt=0;Mt<pt.length;Mt++)Q(pt[Mt],ut);pt.length===2?$(T,P,N):T.projectionMatrix.copy(P.projectionMatrix),lt(X,T,ut)};function lt(X,J,mt){mt===null?X.matrix.copy(J.matrixWorld):(X.matrix.copy(mt.matrixWorld),X.matrix.invert(),X.matrix.multiply(J.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy(J.projectionMatrix),X.projectionMatrixInverse.copy(J.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=zs*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return T},this.getFoveation=function(){if(!(m===null&&u===null))return l},this.setFoveation=function(X){l=X,m!==null&&(m.fixedFoveation=X),u!==null&&u.fixedFoveation!==void 0&&(u.fixedFoveation=X)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(T)};let H=null;function W(X,J){if(d=J.getViewerPose(h||o),v=J,d!==null){const mt=d.views;u!==null&&(t.setRenderTargetFramebuffer(M,u.framebuffer),t.setRenderTarget(M));let ut=!1;mt.length!==T.cameras.length&&(T.cameras.length=0,ut=!0);for(let Mt=0;Mt<mt.length;Mt++){const Pt=mt[Mt];let It=null;if(u!==null)It=u.getViewport(Pt);else{const Wt=p.getViewSubImage(m,Pt);It=Wt.viewport,Mt===0&&(t.setRenderTargetTextures(M,Wt.colorTexture,m.ignoreDepthValues?void 0:Wt.depthStencilTexture),t.setRenderTarget(M))}let Ut=b[Mt];Ut===void 0&&(Ut=new Re,Ut.layers.enable(Mt),Ut.viewport=new re,b[Mt]=Ut),Ut.matrix.fromArray(Pt.transform.matrix),Ut.matrix.decompose(Ut.position,Ut.quaternion,Ut.scale),Ut.projectionMatrix.fromArray(Pt.projectionMatrix),Ut.projectionMatrixInverse.copy(Ut.projectionMatrix).invert(),Ut.viewport.set(It.x,It.y,It.width,It.height),Mt===0&&(T.matrix.copy(Ut.matrix),T.matrix.decompose(T.position,T.quaternion,T.scale)),ut===!0&&T.cameras.push(Ut)}const pt=r.enabledFeatures;if(pt&&pt.includes("depth-sensing")){const Mt=p.getDepthInformation(mt[0]);Mt&&Mt.isValid&&Mt.texture&&g.init(t,Mt,r.renderState)}}for(let mt=0;mt<E.length;mt++){const ut=y[mt],pt=E[mt];ut!==null&&pt!==void 0&&pt.update(ut,J,h||o)}H&&H(X,J),J.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:J}),v=null}const _t=new Wo;_t.setAnimationLoop(W),this.setAnimationLoop=function(X){H=X},this.dispose=function(){}}}const Rn=new We,rp=new se;function sp(i,t){function e(f,c){f.matrixAutoUpdate===!0&&f.updateMatrix(),c.value.copy(f.matrix)}function n(f,c){c.color.getRGB(f.fogColor.value,Ho(i)),c.isFog?(f.fogNear.value=c.near,f.fogFar.value=c.far):c.isFogExp2&&(f.fogDensity.value=c.density)}function r(f,c,M,E,y){c.isMeshBasicMaterial||c.isMeshLambertMaterial?s(f,c):c.isMeshToonMaterial?(s(f,c),p(f,c)):c.isMeshPhongMaterial?(s(f,c),d(f,c)):c.isMeshStandardMaterial?(s(f,c),m(f,c),c.isMeshPhysicalMaterial&&u(f,c,y)):c.isMeshMatcapMaterial?(s(f,c),v(f,c)):c.isMeshDepthMaterial?s(f,c):c.isMeshDistanceMaterial?(s(f,c),g(f,c)):c.isMeshNormalMaterial?s(f,c):c.isLineBasicMaterial?(o(f,c),c.isLineDashedMaterial&&a(f,c)):c.isPointsMaterial?l(f,c,M,E):c.isSpriteMaterial?h(f,c):c.isShadowMaterial?(f.color.value.copy(c.color),f.opacity.value=c.opacity):c.isShaderMaterial&&(c.uniformsNeedUpdate=!1)}function s(f,c){f.opacity.value=c.opacity,c.color&&f.diffuse.value.copy(c.color),c.emissive&&f.emissive.value.copy(c.emissive).multiplyScalar(c.emissiveIntensity),c.map&&(f.map.value=c.map,e(c.map,f.mapTransform)),c.alphaMap&&(f.alphaMap.value=c.alphaMap,e(c.alphaMap,f.alphaMapTransform)),c.bumpMap&&(f.bumpMap.value=c.bumpMap,e(c.bumpMap,f.bumpMapTransform),f.bumpScale.value=c.bumpScale,c.side===Se&&(f.bumpScale.value*=-1)),c.normalMap&&(f.normalMap.value=c.normalMap,e(c.normalMap,f.normalMapTransform),f.normalScale.value.copy(c.normalScale),c.side===Se&&f.normalScale.value.negate()),c.displacementMap&&(f.displacementMap.value=c.displacementMap,e(c.displacementMap,f.displacementMapTransform),f.displacementScale.value=c.displacementScale,f.displacementBias.value=c.displacementBias),c.emissiveMap&&(f.emissiveMap.value=c.emissiveMap,e(c.emissiveMap,f.emissiveMapTransform)),c.specularMap&&(f.specularMap.value=c.specularMap,e(c.specularMap,f.specularMapTransform)),c.alphaTest>0&&(f.alphaTest.value=c.alphaTest);const M=t.get(c),E=M.envMap,y=M.envMapRotation;E&&(f.envMap.value=E,Rn.copy(y),Rn.x*=-1,Rn.y*=-1,Rn.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(Rn.y*=-1,Rn.z*=-1),f.envMapRotation.value.setFromMatrix4(rp.makeRotationFromEuler(Rn)),f.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,f.reflectivity.value=c.reflectivity,f.ior.value=c.ior,f.refractionRatio.value=c.refractionRatio),c.lightMap&&(f.lightMap.value=c.lightMap,f.lightMapIntensity.value=c.lightMapIntensity,e(c.lightMap,f.lightMapTransform)),c.aoMap&&(f.aoMap.value=c.aoMap,f.aoMapIntensity.value=c.aoMapIntensity,e(c.aoMap,f.aoMapTransform))}function o(f,c){f.diffuse.value.copy(c.color),f.opacity.value=c.opacity,c.map&&(f.map.value=c.map,e(c.map,f.mapTransform))}function a(f,c){f.dashSize.value=c.dashSize,f.totalSize.value=c.dashSize+c.gapSize,f.scale.value=c.scale}function l(f,c,M,E){f.diffuse.value.copy(c.color),f.opacity.value=c.opacity,f.size.value=c.size*M,f.scale.value=E*.5,c.map&&(f.map.value=c.map,e(c.map,f.uvTransform)),c.alphaMap&&(f.alphaMap.value=c.alphaMap,e(c.alphaMap,f.alphaMapTransform)),c.alphaTest>0&&(f.alphaTest.value=c.alphaTest)}function h(f,c){f.diffuse.value.copy(c.color),f.opacity.value=c.opacity,f.rotation.value=c.rotation,c.map&&(f.map.value=c.map,e(c.map,f.mapTransform)),c.alphaMap&&(f.alphaMap.value=c.alphaMap,e(c.alphaMap,f.alphaMapTransform)),c.alphaTest>0&&(f.alphaTest.value=c.alphaTest)}function d(f,c){f.specular.value.copy(c.specular),f.shininess.value=Math.max(c.shininess,1e-4)}function p(f,c){c.gradientMap&&(f.gradientMap.value=c.gradientMap)}function m(f,c){f.metalness.value=c.metalness,c.metalnessMap&&(f.metalnessMap.value=c.metalnessMap,e(c.metalnessMap,f.metalnessMapTransform)),f.roughness.value=c.roughness,c.roughnessMap&&(f.roughnessMap.value=c.roughnessMap,e(c.roughnessMap,f.roughnessMapTransform)),c.envMap&&(f.envMapIntensity.value=c.envMapIntensity)}function u(f,c,M){f.ior.value=c.ior,c.sheen>0&&(f.sheenColor.value.copy(c.sheenColor).multiplyScalar(c.sheen),f.sheenRoughness.value=c.sheenRoughness,c.sheenColorMap&&(f.sheenColorMap.value=c.sheenColorMap,e(c.sheenColorMap,f.sheenColorMapTransform)),c.sheenRoughnessMap&&(f.sheenRoughnessMap.value=c.sheenRoughnessMap,e(c.sheenRoughnessMap,f.sheenRoughnessMapTransform))),c.clearcoat>0&&(f.clearcoat.value=c.clearcoat,f.clearcoatRoughness.value=c.clearcoatRoughness,c.clearcoatMap&&(f.clearcoatMap.value=c.clearcoatMap,e(c.clearcoatMap,f.clearcoatMapTransform)),c.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=c.clearcoatRoughnessMap,e(c.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),c.clearcoatNormalMap&&(f.clearcoatNormalMap.value=c.clearcoatNormalMap,e(c.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(c.clearcoatNormalScale),c.side===Se&&f.clearcoatNormalScale.value.negate())),c.dispersion>0&&(f.dispersion.value=c.dispersion),c.iridescence>0&&(f.iridescence.value=c.iridescence,f.iridescenceIOR.value=c.iridescenceIOR,f.iridescenceThicknessMinimum.value=c.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=c.iridescenceThicknessRange[1],c.iridescenceMap&&(f.iridescenceMap.value=c.iridescenceMap,e(c.iridescenceMap,f.iridescenceMapTransform)),c.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=c.iridescenceThicknessMap,e(c.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),c.transmission>0&&(f.transmission.value=c.transmission,f.transmissionSamplerMap.value=M.texture,f.transmissionSamplerSize.value.set(M.width,M.height),c.transmissionMap&&(f.transmissionMap.value=c.transmissionMap,e(c.transmissionMap,f.transmissionMapTransform)),f.thickness.value=c.thickness,c.thicknessMap&&(f.thicknessMap.value=c.thicknessMap,e(c.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=c.attenuationDistance,f.attenuationColor.value.copy(c.attenuationColor)),c.anisotropy>0&&(f.anisotropyVector.value.set(c.anisotropy*Math.cos(c.anisotropyRotation),c.anisotropy*Math.sin(c.anisotropyRotation)),c.anisotropyMap&&(f.anisotropyMap.value=c.anisotropyMap,e(c.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=c.specularIntensity,f.specularColor.value.copy(c.specularColor),c.specularColorMap&&(f.specularColorMap.value=c.specularColorMap,e(c.specularColorMap,f.specularColorMapTransform)),c.specularIntensityMap&&(f.specularIntensityMap.value=c.specularIntensityMap,e(c.specularIntensityMap,f.specularIntensityMapTransform))}function v(f,c){c.matcap&&(f.matcap.value=c.matcap)}function g(f,c){const M=t.get(c).light;f.referencePosition.value.setFromMatrixPosition(M.matrixWorld),f.nearDistance.value=M.shadow.camera.near,f.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function ap(i,t,e,n){let r={},s={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,E){const y=E.program;n.uniformBlockBinding(M,y)}function h(M,E){let y=r[M.id];y===void 0&&(v(M),y=d(M),r[M.id]=y,M.addEventListener("dispose",f));const D=E.program;n.updateUBOMapping(M,D);const L=t.render.frame;s[M.id]!==L&&(m(M),s[M.id]=L)}function d(M){const E=p();M.__bindingPointIndex=E;const y=i.createBuffer(),D=M.__size,L=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,y),i.bufferData(i.UNIFORM_BUFFER,D,L),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,E,y),y}function p(){for(let M=0;M<a;M++)if(o.indexOf(M)===-1)return o.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function m(M){const E=r[M.id],y=M.uniforms,D=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,E);for(let L=0,P=y.length;L<P;L++){const N=Array.isArray(y[L])?y[L]:[y[L]];for(let b=0,T=N.length;b<T;b++){const F=N[b];if(u(F,L,b,D)===!0){const R=F.__offset,U=Array.isArray(F.value)?F.value:[F.value];let S=0;for(let B=0;B<U.length;B++){const et=U[B],k=g(et);typeof et=="number"||typeof et=="boolean"?(F.__data[0]=et,i.bufferSubData(i.UNIFORM_BUFFER,R+S,F.__data)):et.isMatrix3?(F.__data[0]=et.elements[0],F.__data[1]=et.elements[1],F.__data[2]=et.elements[2],F.__data[3]=0,F.__data[4]=et.elements[3],F.__data[5]=et.elements[4],F.__data[6]=et.elements[5],F.__data[7]=0,F.__data[8]=et.elements[6],F.__data[9]=et.elements[7],F.__data[10]=et.elements[8],F.__data[11]=0):(et.toArray(F.__data,S),S+=k.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,R,F.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function u(M,E,y,D){const L=M.value,P=E+"_"+y;if(D[P]===void 0)return typeof L=="number"||typeof L=="boolean"?D[P]=L:D[P]=L.clone(),!0;{const N=D[P];if(typeof L=="number"||typeof L=="boolean"){if(N!==L)return D[P]=L,!0}else if(N.equals(L)===!1)return N.copy(L),!0}return!1}function v(M){const E=M.uniforms;let y=0;const D=16;for(let P=0,N=E.length;P<N;P++){const b=Array.isArray(E[P])?E[P]:[E[P]];for(let T=0,F=b.length;T<F;T++){const R=b[T],U=Array.isArray(R.value)?R.value:[R.value];for(let S=0,B=U.length;S<B;S++){const et=U[S],k=g(et),$=y%D,Q=$%k.boundary,lt=$+Q;y+=Q,lt!==0&&D-lt<k.storage&&(y+=D-lt),R.__data=new Float32Array(k.storage/Float32Array.BYTES_PER_ELEMENT),R.__offset=y,y+=k.storage}}}const L=y%D;return L>0&&(y+=D-L),M.__size=y,M.__cache={},this}function g(M){const E={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(E.boundary=4,E.storage=4):M.isVector2?(E.boundary=8,E.storage=8):M.isVector3||M.isColor?(E.boundary=16,E.storage=12):M.isVector4?(E.boundary=16,E.storage=16):M.isMatrix3?(E.boundary=48,E.storage=48):M.isMatrix4?(E.boundary=64,E.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),E}function f(M){const E=M.target;E.removeEventListener("dispose",f);const y=o.indexOf(E.__bindingPointIndex);o.splice(y,1),i.deleteBuffer(r[E.id]),delete r[E.id],delete s[E.id]}function c(){for(const M in r)i.deleteBuffer(r[M]);o=[],r={},s={}}return{bind:l,update:h,dispose:c}}class op{constructor(t={}){const{canvas:e=jl(),context:n=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:h=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:p=!1,reverseDepthBuffer:m=!1}=t;this.isWebGLRenderer=!0;let u;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");u=n.getContextAttributes().alpha}else u=o;const v=new Uint32Array(4),g=new Int32Array(4);let f=null,c=null;const M=[],E=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ae,this.toneMapping=vn,this.toneMappingExposure=1;const y=this;let D=!1,L=0,P=0,N=null,b=-1,T=null;const F=new re,R=new re;let U=null;const S=new qt(0);let B=0,et=e.width,k=e.height,$=1,Q=null,lt=null;const H=new re(0,0,et,k),W=new re(0,0,et,k);let _t=!1;const X=new $s;let J=!1,mt=!1;const ut=new se,pt=new se,Mt=new nt,Pt=new re,It={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Ut=!1;function Wt(){return N===null?$:1}let _=n;function at(A,Y){return e.getContext(A,Y)}try{const A={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:h,powerPreference:d,failIfMajorPerformanceCaveat:p};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Gs}`),e.addEventListener("webglcontextlost",ot,!1),e.addEventListener("webglcontextrestored",St,!1),e.addEventListener("webglcontextcreationerror",Et,!1),_===null){const Y="webgl2";if(_=at(Y,A),_===null)throw at(Y)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(A){throw console.error("THREE.WebGLRenderer: "+A.message),A}let Z,I,C,z,tt,w,x,O,j,V,K,dt,ct,gt,Vt,ht,Tt,yt,Lt,wt,Nt,Ot,$t,G;function xt(){Z=new ff(_),Z.init(),Ot=new $d(_,Z),I=new af(_,Z,t,Ot),C=new jd(_,Z),I.reverseDepthBuffer&&m&&C.buffers.depth.setReversed(!0),z=new mf(_),tt=new Id,w=new Kd(_,Z,C,tt,I,Ot,z),x=new lf(y),O=new uf(y),j=new Mc(_),$t=new rf(_,j),V=new df(_,j,z,$t),K=new gf(_,V,j,z),Lt=new _f(_,I,w),ht=new of(tt),dt=new Ld(y,x,O,Z,I,$t,ht),ct=new sp(y,tt),gt=new Nd,Vt=new Hd(Z),yt=new nf(y,x,O,C,K,u,l),Tt=new Yd(y,K,I),G=new ap(_,z,I,C),wt=new sf(_,Z,z),Nt=new pf(_,Z,z),z.programs=dt.programs,y.capabilities=I,y.extensions=Z,y.properties=tt,y.renderLists=gt,y.shadowMap=Tt,y.state=C,y.info=z}xt();const st=new ip(y,_);this.xr=st,this.getContext=function(){return _},this.getContextAttributes=function(){return _.getContextAttributes()},this.forceContextLoss=function(){const A=Z.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){const A=Z.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return $},this.setPixelRatio=function(A){A!==void 0&&($=A,this.setSize(et,k,!1))},this.getSize=function(A){return A.set(et,k)},this.setSize=function(A,Y,it=!0){if(st.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}et=A,k=Y,e.width=Math.floor(A*$),e.height=Math.floor(Y*$),it===!0&&(e.style.width=A+"px",e.style.height=Y+"px"),this.setViewport(0,0,A,Y)},this.getDrawingBufferSize=function(A){return A.set(et*$,k*$).floor()},this.setDrawingBufferSize=function(A,Y,it){et=A,k=Y,$=it,e.width=Math.floor(A*it),e.height=Math.floor(Y*it),this.setViewport(0,0,A,Y)},this.getCurrentViewport=function(A){return A.copy(F)},this.getViewport=function(A){return A.copy(H)},this.setViewport=function(A,Y,it,rt){A.isVector4?H.set(A.x,A.y,A.z,A.w):H.set(A,Y,it,rt),C.viewport(F.copy(H).multiplyScalar($).round())},this.getScissor=function(A){return A.copy(W)},this.setScissor=function(A,Y,it,rt){A.isVector4?W.set(A.x,A.y,A.z,A.w):W.set(A,Y,it,rt),C.scissor(R.copy(W).multiplyScalar($).round())},this.getScissorTest=function(){return _t},this.setScissorTest=function(A){C.setScissorTest(_t=A)},this.setOpaqueSort=function(A){Q=A},this.setTransparentSort=function(A){lt=A},this.getClearColor=function(A){return A.copy(yt.getClearColor())},this.setClearColor=function(){yt.setClearColor.apply(yt,arguments)},this.getClearAlpha=function(){return yt.getClearAlpha()},this.setClearAlpha=function(){yt.setClearAlpha.apply(yt,arguments)},this.clear=function(A=!0,Y=!0,it=!0){let rt=0;if(A){let q=!1;if(N!==null){const ft=N.texture.format;q=ft===Zs||ft===js||ft===qs}if(q){const ft=N.texture.type,bt=ft===sn||ft===Un||ft===Ti||ft===hi||ft===Xs||ft===Ys,At=yt.getClearColor(),Rt=yt.getClearAlpha(),Ft=At.r,zt=At.g,Ct=At.b;bt?(v[0]=Ft,v[1]=zt,v[2]=Ct,v[3]=Rt,_.clearBufferuiv(_.COLOR,0,v)):(g[0]=Ft,g[1]=zt,g[2]=Ct,g[3]=Rt,_.clearBufferiv(_.COLOR,0,g))}else rt|=_.COLOR_BUFFER_BIT}Y&&(rt|=_.DEPTH_BUFFER_BIT),it&&(rt|=_.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),_.clear(rt)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",ot,!1),e.removeEventListener("webglcontextrestored",St,!1),e.removeEventListener("webglcontextcreationerror",Et,!1),gt.dispose(),Vt.dispose(),tt.dispose(),x.dispose(),O.dispose(),K.dispose(),$t.dispose(),G.dispose(),dt.dispose(),st.dispose(),st.removeEventListener("sessionstart",ia),st.removeEventListener("sessionend",ra),yn.stop()};function ot(A){A.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),D=!0}function St(){console.log("THREE.WebGLRenderer: Context Restored."),D=!1;const A=z.autoReset,Y=Tt.enabled,it=Tt.autoUpdate,rt=Tt.needsUpdate,q=Tt.type;xt(),z.autoReset=A,Tt.enabled=Y,Tt.autoUpdate=it,Tt.needsUpdate=rt,Tt.type=q}function Et(A){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function Bt(A){const Y=A.target;Y.removeEventListener("dispose",Bt),ie(Y)}function ie(A){ue(A),tt.remove(A)}function ue(A){const Y=tt.get(A).programs;Y!==void 0&&(Y.forEach(function(it){dt.releaseProgram(it)}),A.isShaderMaterial&&dt.releaseShaderCache(A))}this.renderBufferDirect=function(A,Y,it,rt,q,ft){Y===null&&(Y=It);const bt=q.isMesh&&q.matrixWorld.determinant()<0,At=nl(A,Y,it,rt,q);C.setMaterial(rt,bt);let Rt=it.index,Ft=1;if(rt.wireframe===!0){if(Rt=V.getWireframeAttribute(it),Rt===void 0)return;Ft=2}const zt=it.drawRange,Ct=it.attributes.position;let Yt=zt.start*Ft,te=(zt.start+zt.count)*Ft;ft!==null&&(Yt=Math.max(Yt,ft.start*Ft),te=Math.min(te,(ft.start+ft.count)*Ft)),Rt!==null?(Yt=Math.max(Yt,0),te=Math.min(te,Rt.count)):Ct!=null&&(Yt=Math.max(Yt,0),te=Math.min(te,Ct.count));const ee=te-Yt;if(ee<0||ee===1/0)return;$t.setup(q,rt,At,it,Rt);let ge,jt=wt;if(Rt!==null&&(ge=j.get(Rt),jt=Nt,jt.setIndex(ge)),q.isMesh)rt.wireframe===!0?(C.setLineWidth(rt.wireframeLinewidth*Wt()),jt.setMode(_.LINES)):jt.setMode(_.TRIANGLES);else if(q.isLine){let Dt=rt.linewidth;Dt===void 0&&(Dt=1),C.setLineWidth(Dt*Wt()),q.isLineSegments?jt.setMode(_.LINES):q.isLineLoop?jt.setMode(_.LINE_LOOP):jt.setMode(_.LINE_STRIP)}else q.isPoints?jt.setMode(_.POINTS):q.isSprite&&jt.setMode(_.TRIANGLES);if(q.isBatchedMesh)if(q._multiDrawInstances!==null)jt.renderMultiDrawInstances(q._multiDrawStarts,q._multiDrawCounts,q._multiDrawCount,q._multiDrawInstances);else if(Z.get("WEBGL_multi_draw"))jt.renderMultiDraw(q._multiDrawStarts,q._multiDrawCounts,q._multiDrawCount);else{const Dt=q._multiDrawStarts,Ye=q._multiDrawCounts,Zt=q._multiDrawCount,De=Rt?j.get(Rt).bytesPerElement:1,zn=tt.get(rt).currentProgram.getUniforms();for(let ye=0;ye<Zt;ye++)zn.setValue(_,"_gl_DrawID",ye),jt.render(Dt[ye]/De,Ye[ye])}else if(q.isInstancedMesh)jt.renderInstances(Yt,ee,q.count);else if(it.isInstancedBufferGeometry){const Dt=it._maxInstanceCount!==void 0?it._maxInstanceCount:1/0,Ye=Math.min(it.instanceCount,Dt);jt.renderInstances(Yt,ee,Ye)}else jt.render(Yt,ee)};function Kt(A,Y,it){A.transparent===!0&&A.side===tn&&A.forceSinglePass===!1?(A.side=Se,A.needsUpdate=!0,Ii(A,Y,it),A.side=xn,A.needsUpdate=!0,Ii(A,Y,it),A.side=tn):Ii(A,Y,it)}this.compile=function(A,Y,it=null){it===null&&(it=A),c=Vt.get(it),c.init(Y),E.push(c),it.traverseVisible(function(q){q.isLight&&q.layers.test(Y.layers)&&(c.pushLight(q),q.castShadow&&c.pushShadow(q))}),A!==it&&A.traverseVisible(function(q){q.isLight&&q.layers.test(Y.layers)&&(c.pushLight(q),q.castShadow&&c.pushShadow(q))}),c.setupLights();const rt=new Set;return A.traverse(function(q){if(!(q.isMesh||q.isPoints||q.isLine||q.isSprite))return;const ft=q.material;if(ft)if(Array.isArray(ft))for(let bt=0;bt<ft.length;bt++){const At=ft[bt];Kt(At,it,q),rt.add(At)}else Kt(ft,it,q),rt.add(ft)}),E.pop(),c=null,rt},this.compileAsync=function(A,Y,it=null){const rt=this.compile(A,Y,it);return new Promise(q=>{function ft(){if(rt.forEach(function(bt){tt.get(bt).currentProgram.isReady()&&rt.delete(bt)}),rt.size===0){q(A);return}setTimeout(ft,10)}Z.get("KHR_parallel_shader_compile")!==null?ft():setTimeout(ft,10)})};let Pe=null;function Xe(A){Pe&&Pe(A)}function ia(){yn.stop()}function ra(){yn.start()}const yn=new Wo;yn.setAnimationLoop(Xe),typeof self<"u"&&yn.setContext(self),this.setAnimationLoop=function(A){Pe=A,st.setAnimationLoop(A),A===null?yn.stop():yn.start()},st.addEventListener("sessionstart",ia),st.addEventListener("sessionend",ra),this.render=function(A,Y){if(Y!==void 0&&Y.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),Y.parent===null&&Y.matrixWorldAutoUpdate===!0&&Y.updateMatrixWorld(),st.enabled===!0&&st.isPresenting===!0&&(st.cameraAutoUpdate===!0&&st.updateCamera(Y),Y=st.getCamera()),A.isScene===!0&&A.onBeforeRender(y,A,Y,N),c=Vt.get(A,E.length),c.init(Y),E.push(c),pt.multiplyMatrices(Y.projectionMatrix,Y.matrixWorldInverse),X.setFromProjectionMatrix(pt),mt=this.localClippingEnabled,J=ht.init(this.clippingPlanes,mt),f=gt.get(A,M.length),f.init(),M.push(f),st.enabled===!0&&st.isPresenting===!0){const ft=y.xr.getDepthSensingMesh();ft!==null&&xr(ft,Y,-1/0,y.sortObjects)}xr(A,Y,0,y.sortObjects),f.finish(),y.sortObjects===!0&&f.sort(Q,lt),Ut=st.enabled===!1||st.isPresenting===!1||st.hasDepthSensing()===!1,Ut&&yt.addToRenderList(f,A),this.info.render.frame++,J===!0&&ht.beginShadows();const it=c.state.shadowsArray;Tt.render(it,A,Y),J===!0&&ht.endShadows(),this.info.autoReset===!0&&this.info.reset();const rt=f.opaque,q=f.transmissive;if(c.setupLights(),Y.isArrayCamera){const ft=Y.cameras;if(q.length>0)for(let bt=0,At=ft.length;bt<At;bt++){const Rt=ft[bt];aa(rt,q,A,Rt)}Ut&&yt.render(A);for(let bt=0,At=ft.length;bt<At;bt++){const Rt=ft[bt];sa(f,A,Rt,Rt.viewport)}}else q.length>0&&aa(rt,q,A,Y),Ut&&yt.render(A),sa(f,A,Y);N!==null&&(w.updateMultisampleRenderTarget(N),w.updateRenderTargetMipmap(N)),A.isScene===!0&&A.onAfterRender(y,A,Y),$t.resetDefaultState(),b=-1,T=null,E.pop(),E.length>0?(c=E[E.length-1],J===!0&&ht.setGlobalState(y.clippingPlanes,c.state.camera)):c=null,M.pop(),M.length>0?f=M[M.length-1]:f=null};function xr(A,Y,it,rt){if(A.visible===!1)return;if(A.layers.test(Y.layers)){if(A.isGroup)it=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(Y);else if(A.isLight)c.pushLight(A),A.castShadow&&c.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||X.intersectsSprite(A)){rt&&Pt.setFromMatrixPosition(A.matrixWorld).applyMatrix4(pt);const bt=K.update(A),At=A.material;At.visible&&f.push(A,bt,At,it,Pt.z,null)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||X.intersectsObject(A))){const bt=K.update(A),At=A.material;if(rt&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),Pt.copy(A.boundingSphere.center)):(bt.boundingSphere===null&&bt.computeBoundingSphere(),Pt.copy(bt.boundingSphere.center)),Pt.applyMatrix4(A.matrixWorld).applyMatrix4(pt)),Array.isArray(At)){const Rt=bt.groups;for(let Ft=0,zt=Rt.length;Ft<zt;Ft++){const Ct=Rt[Ft],Yt=At[Ct.materialIndex];Yt&&Yt.visible&&f.push(A,bt,Yt,it,Pt.z,Ct)}}else At.visible&&f.push(A,bt,At,it,Pt.z,null)}}const ft=A.children;for(let bt=0,At=ft.length;bt<At;bt++)xr(ft[bt],Y,it,rt)}function sa(A,Y,it,rt){const q=A.opaque,ft=A.transmissive,bt=A.transparent;c.setupLightsView(it),J===!0&&ht.setGlobalState(y.clippingPlanes,it),rt&&C.viewport(F.copy(rt)),q.length>0&&Li(q,Y,it),ft.length>0&&Li(ft,Y,it),bt.length>0&&Li(bt,Y,it),C.buffers.depth.setTest(!0),C.buffers.depth.setMask(!0),C.buffers.color.setMask(!0),C.setPolygonOffset(!1)}function aa(A,Y,it,rt){if((it.isScene===!0?it.overrideMaterial:null)!==null)return;c.state.transmissionRenderTarget[rt.id]===void 0&&(c.state.transmissionRenderTarget[rt.id]=new Nn(1,1,{generateMipmaps:!0,type:Z.has("EXT_color_buffer_half_float")||Z.has("EXT_color_buffer_float")?Ai:sn,minFilter:In,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Xt.workingColorSpace}));const ft=c.state.transmissionRenderTarget[rt.id],bt=rt.viewport||F;ft.setSize(bt.z,bt.w);const At=y.getRenderTarget();y.setRenderTarget(ft),y.getClearColor(S),B=y.getClearAlpha(),B<1&&y.setClearColor(16777215,.5),y.clear(),Ut&&yt.render(it);const Rt=y.toneMapping;y.toneMapping=vn;const Ft=rt.viewport;if(rt.viewport!==void 0&&(rt.viewport=void 0),c.setupLightsView(rt),J===!0&&ht.setGlobalState(y.clippingPlanes,rt),Li(A,it,rt),w.updateMultisampleRenderTarget(ft),w.updateRenderTargetMipmap(ft),Z.has("WEBGL_multisampled_render_to_texture")===!1){let zt=!1;for(let Ct=0,Yt=Y.length;Ct<Yt;Ct++){const te=Y[Ct],ee=te.object,ge=te.geometry,jt=te.material,Dt=te.group;if(jt.side===tn&&ee.layers.test(rt.layers)){const Ye=jt.side;jt.side=Se,jt.needsUpdate=!0,oa(ee,it,rt,ge,jt,Dt),jt.side=Ye,jt.needsUpdate=!0,zt=!0}}zt===!0&&(w.updateMultisampleRenderTarget(ft),w.updateRenderTargetMipmap(ft))}y.setRenderTarget(At),y.setClearColor(S,B),Ft!==void 0&&(rt.viewport=Ft),y.toneMapping=Rt}function Li(A,Y,it){const rt=Y.isScene===!0?Y.overrideMaterial:null;for(let q=0,ft=A.length;q<ft;q++){const bt=A[q],At=bt.object,Rt=bt.geometry,Ft=rt===null?bt.material:rt,zt=bt.group;At.layers.test(it.layers)&&oa(At,Y,it,Rt,Ft,zt)}}function oa(A,Y,it,rt,q,ft){A.onBeforeRender(y,Y,it,rt,q,ft),A.modelViewMatrix.multiplyMatrices(it.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),q.onBeforeRender(y,Y,it,rt,A,ft),q.transparent===!0&&q.side===tn&&q.forceSinglePass===!1?(q.side=Se,q.needsUpdate=!0,y.renderBufferDirect(it,Y,rt,q,A,ft),q.side=xn,q.needsUpdate=!0,y.renderBufferDirect(it,Y,rt,q,A,ft),q.side=tn):y.renderBufferDirect(it,Y,rt,q,A,ft),A.onAfterRender(y,Y,it,rt,q,ft)}function Ii(A,Y,it){Y.isScene!==!0&&(Y=It);const rt=tt.get(A),q=c.state.lights,ft=c.state.shadowsArray,bt=q.state.version,At=dt.getParameters(A,q.state,ft,Y,it),Rt=dt.getProgramCacheKey(At);let Ft=rt.programs;rt.environment=A.isMeshStandardMaterial?Y.environment:null,rt.fog=Y.fog,rt.envMap=(A.isMeshStandardMaterial?O:x).get(A.envMap||rt.environment),rt.envMapRotation=rt.environment!==null&&A.envMap===null?Y.environmentRotation:A.envMapRotation,Ft===void 0&&(A.addEventListener("dispose",Bt),Ft=new Map,rt.programs=Ft);let zt=Ft.get(Rt);if(zt!==void 0){if(rt.currentProgram===zt&&rt.lightsStateVersion===bt)return ca(A,At),zt}else At.uniforms=dt.getUniforms(A),A.onBeforeCompile(At,y),zt=dt.acquireProgram(At,Rt),Ft.set(Rt,zt),rt.uniforms=At.uniforms;const Ct=rt.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Ct.clippingPlanes=ht.uniform),ca(A,At),rt.needsLights=rl(A),rt.lightsStateVersion=bt,rt.needsLights&&(Ct.ambientLightColor.value=q.state.ambient,Ct.lightProbe.value=q.state.probe,Ct.directionalLights.value=q.state.directional,Ct.directionalLightShadows.value=q.state.directionalShadow,Ct.spotLights.value=q.state.spot,Ct.spotLightShadows.value=q.state.spotShadow,Ct.rectAreaLights.value=q.state.rectArea,Ct.ltc_1.value=q.state.rectAreaLTC1,Ct.ltc_2.value=q.state.rectAreaLTC2,Ct.pointLights.value=q.state.point,Ct.pointLightShadows.value=q.state.pointShadow,Ct.hemisphereLights.value=q.state.hemi,Ct.directionalShadowMap.value=q.state.directionalShadowMap,Ct.directionalShadowMatrix.value=q.state.directionalShadowMatrix,Ct.spotShadowMap.value=q.state.spotShadowMap,Ct.spotLightMatrix.value=q.state.spotLightMatrix,Ct.spotLightMap.value=q.state.spotLightMap,Ct.pointShadowMap.value=q.state.pointShadowMap,Ct.pointShadowMatrix.value=q.state.pointShadowMatrix),rt.currentProgram=zt,rt.uniformsList=null,zt}function la(A){if(A.uniformsList===null){const Y=A.currentProgram.getUniforms();A.uniformsList=ur.seqWithValue(Y.seq,A.uniforms)}return A.uniformsList}function ca(A,Y){const it=tt.get(A);it.outputColorSpace=Y.outputColorSpace,it.batching=Y.batching,it.batchingColor=Y.batchingColor,it.instancing=Y.instancing,it.instancingColor=Y.instancingColor,it.instancingMorph=Y.instancingMorph,it.skinning=Y.skinning,it.morphTargets=Y.morphTargets,it.morphNormals=Y.morphNormals,it.morphColors=Y.morphColors,it.morphTargetsCount=Y.morphTargetsCount,it.numClippingPlanes=Y.numClippingPlanes,it.numIntersection=Y.numClipIntersection,it.vertexAlphas=Y.vertexAlphas,it.vertexTangents=Y.vertexTangents,it.toneMapping=Y.toneMapping}function nl(A,Y,it,rt,q){Y.isScene!==!0&&(Y=It),w.resetTextureUnits();const ft=Y.fog,bt=rt.isMeshStandardMaterial?Y.environment:null,At=N===null?y.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:di,Rt=(rt.isMeshStandardMaterial?O:x).get(rt.envMap||bt),Ft=rt.vertexColors===!0&&!!it.attributes.color&&it.attributes.color.itemSize===4,zt=!!it.attributes.tangent&&(!!rt.normalMap||rt.anisotropy>0),Ct=!!it.morphAttributes.position,Yt=!!it.morphAttributes.normal,te=!!it.morphAttributes.color;let ee=vn;rt.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(ee=y.toneMapping);const ge=it.morphAttributes.position||it.morphAttributes.normal||it.morphAttributes.color,jt=ge!==void 0?ge.length:0,Dt=tt.get(rt),Ye=c.state.lights;if(J===!0&&(mt===!0||A!==T)){const Te=A===T&&rt.id===b;ht.setState(rt,A,Te)}let Zt=!1;rt.version===Dt.__version?(Dt.needsLights&&Dt.lightsStateVersion!==Ye.state.version||Dt.outputColorSpace!==At||q.isBatchedMesh&&Dt.batching===!1||!q.isBatchedMesh&&Dt.batching===!0||q.isBatchedMesh&&Dt.batchingColor===!0&&q.colorTexture===null||q.isBatchedMesh&&Dt.batchingColor===!1&&q.colorTexture!==null||q.isInstancedMesh&&Dt.instancing===!1||!q.isInstancedMesh&&Dt.instancing===!0||q.isSkinnedMesh&&Dt.skinning===!1||!q.isSkinnedMesh&&Dt.skinning===!0||q.isInstancedMesh&&Dt.instancingColor===!0&&q.instanceColor===null||q.isInstancedMesh&&Dt.instancingColor===!1&&q.instanceColor!==null||q.isInstancedMesh&&Dt.instancingMorph===!0&&q.morphTexture===null||q.isInstancedMesh&&Dt.instancingMorph===!1&&q.morphTexture!==null||Dt.envMap!==Rt||rt.fog===!0&&Dt.fog!==ft||Dt.numClippingPlanes!==void 0&&(Dt.numClippingPlanes!==ht.numPlanes||Dt.numIntersection!==ht.numIntersection)||Dt.vertexAlphas!==Ft||Dt.vertexTangents!==zt||Dt.morphTargets!==Ct||Dt.morphNormals!==Yt||Dt.morphColors!==te||Dt.toneMapping!==ee||Dt.morphTargetsCount!==jt)&&(Zt=!0):(Zt=!0,Dt.__version=rt.version);let De=Dt.currentProgram;Zt===!0&&(De=Ii(rt,Y,q));let zn=!1,ye=!1,_i=!1;const ne=De.getUniforms(),ze=Dt.uniforms;if(C.useProgram(De.program)&&(zn=!0,ye=!0,_i=!0),rt.id!==b&&(b=rt.id,ye=!0),zn||T!==A){C.buffers.depth.getReversed()?(ut.copy(A.projectionMatrix),Kl(ut),$l(ut),ne.setValue(_,"projectionMatrix",ut)):ne.setValue(_,"projectionMatrix",A.projectionMatrix),ne.setValue(_,"viewMatrix",A.matrixWorldInverse);const on=ne.map.cameraPosition;on!==void 0&&on.setValue(_,Mt.setFromMatrixPosition(A.matrixWorld)),I.logarithmicDepthBuffer&&ne.setValue(_,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(rt.isMeshPhongMaterial||rt.isMeshToonMaterial||rt.isMeshLambertMaterial||rt.isMeshBasicMaterial||rt.isMeshStandardMaterial||rt.isShaderMaterial)&&ne.setValue(_,"isOrthographic",A.isOrthographicCamera===!0),T!==A&&(T=A,ye=!0,_i=!0)}if(q.isSkinnedMesh){ne.setOptional(_,q,"bindMatrix"),ne.setOptional(_,q,"bindMatrixInverse");const Te=q.skeleton;Te&&(Te.boneTexture===null&&Te.computeBoneTexture(),ne.setValue(_,"boneTexture",Te.boneTexture,w))}q.isBatchedMesh&&(ne.setOptional(_,q,"batchingTexture"),ne.setValue(_,"batchingTexture",q._matricesTexture,w),ne.setOptional(_,q,"batchingIdTexture"),ne.setValue(_,"batchingIdTexture",q._indirectTexture,w),ne.setOptional(_,q,"batchingColorTexture"),q._colorsTexture!==null&&ne.setValue(_,"batchingColorTexture",q._colorsTexture,w));const gi=it.morphAttributes;if((gi.position!==void 0||gi.normal!==void 0||gi.color!==void 0)&&Lt.update(q,it,De),(ye||Dt.receiveShadow!==q.receiveShadow)&&(Dt.receiveShadow=q.receiveShadow,ne.setValue(_,"receiveShadow",q.receiveShadow)),rt.isMeshGouraudMaterial&&rt.envMap!==null&&(ze.envMap.value=Rt,ze.flipEnvMap.value=Rt.isCubeTexture&&Rt.isRenderTargetTexture===!1?-1:1),rt.isMeshStandardMaterial&&rt.envMap===null&&Y.environment!==null&&(ze.envMapIntensity.value=Y.environmentIntensity),ye&&(ne.setValue(_,"toneMappingExposure",y.toneMappingExposure),Dt.needsLights&&il(ze,_i),ft&&rt.fog===!0&&ct.refreshFogUniforms(ze,ft),ct.refreshMaterialUniforms(ze,rt,$,k,c.state.transmissionRenderTarget[A.id]),ur.upload(_,la(Dt),ze,w)),rt.isShaderMaterial&&rt.uniformsNeedUpdate===!0&&(ur.upload(_,la(Dt),ze,w),rt.uniformsNeedUpdate=!1),rt.isSpriteMaterial&&ne.setValue(_,"center",q.center),ne.setValue(_,"modelViewMatrix",q.modelViewMatrix),ne.setValue(_,"normalMatrix",q.normalMatrix),ne.setValue(_,"modelMatrix",q.matrixWorld),rt.isShaderMaterial||rt.isRawShaderMaterial){const Te=rt.uniformsGroups;for(let on=0,ln=Te.length;on<ln;on++){const ha=Te[on];G.update(ha,De),G.bind(ha,De)}}return De}function il(A,Y){A.ambientLightColor.needsUpdate=Y,A.lightProbe.needsUpdate=Y,A.directionalLights.needsUpdate=Y,A.directionalLightShadows.needsUpdate=Y,A.pointLights.needsUpdate=Y,A.pointLightShadows.needsUpdate=Y,A.spotLights.needsUpdate=Y,A.spotLightShadows.needsUpdate=Y,A.rectAreaLights.needsUpdate=Y,A.hemisphereLights.needsUpdate=Y}function rl(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return L},this.getActiveMipmapLevel=function(){return P},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(A,Y,it){tt.get(A.texture).__webglTexture=Y,tt.get(A.depthTexture).__webglTexture=it;const rt=tt.get(A);rt.__hasExternalTextures=!0,rt.__autoAllocateDepthBuffer=it===void 0,rt.__autoAllocateDepthBuffer||Z.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),rt.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(A,Y){const it=tt.get(A);it.__webglFramebuffer=Y,it.__useDefaultFramebuffer=Y===void 0},this.setRenderTarget=function(A,Y=0,it=0){N=A,L=Y,P=it;let rt=!0,q=null,ft=!1,bt=!1;if(A){const Rt=tt.get(A);if(Rt.__useDefaultFramebuffer!==void 0)C.bindFramebuffer(_.FRAMEBUFFER,null),rt=!1;else if(Rt.__webglFramebuffer===void 0)w.setupRenderTarget(A);else if(Rt.__hasExternalTextures)w.rebindTextures(A,tt.get(A.texture).__webglTexture,tt.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){const Ct=A.depthTexture;if(Rt.__boundDepthTexture!==Ct){if(Ct!==null&&tt.has(Ct)&&(A.width!==Ct.image.width||A.height!==Ct.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");w.setupDepthRenderbuffer(A)}}const Ft=A.texture;(Ft.isData3DTexture||Ft.isDataArrayTexture||Ft.isCompressedArrayTexture)&&(bt=!0);const zt=tt.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(zt[Y])?q=zt[Y][it]:q=zt[Y],ft=!0):A.samples>0&&w.useMultisampledRTT(A)===!1?q=tt.get(A).__webglMultisampledFramebuffer:Array.isArray(zt)?q=zt[it]:q=zt,F.copy(A.viewport),R.copy(A.scissor),U=A.scissorTest}else F.copy(H).multiplyScalar($).floor(),R.copy(W).multiplyScalar($).floor(),U=_t;if(C.bindFramebuffer(_.FRAMEBUFFER,q)&&rt&&C.drawBuffers(A,q),C.viewport(F),C.scissor(R),C.setScissorTest(U),ft){const Rt=tt.get(A.texture);_.framebufferTexture2D(_.FRAMEBUFFER,_.COLOR_ATTACHMENT0,_.TEXTURE_CUBE_MAP_POSITIVE_X+Y,Rt.__webglTexture,it)}else if(bt){const Rt=tt.get(A.texture),Ft=Y||0;_.framebufferTextureLayer(_.FRAMEBUFFER,_.COLOR_ATTACHMENT0,Rt.__webglTexture,it||0,Ft)}b=-1},this.readRenderTargetPixels=function(A,Y,it,rt,q,ft,bt){if(!(A&&A.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let At=tt.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&bt!==void 0&&(At=At[bt]),At){C.bindFramebuffer(_.FRAMEBUFFER,At);try{const Rt=A.texture,Ft=Rt.format,zt=Rt.type;if(!I.textureFormatReadable(Ft)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!I.textureTypeReadable(zt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}Y>=0&&Y<=A.width-rt&&it>=0&&it<=A.height-q&&_.readPixels(Y,it,rt,q,Ot.convert(Ft),Ot.convert(zt),ft)}finally{const Rt=N!==null?tt.get(N).__webglFramebuffer:null;C.bindFramebuffer(_.FRAMEBUFFER,Rt)}}},this.readRenderTargetPixelsAsync=async function(A,Y,it,rt,q,ft,bt){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let At=tt.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&bt!==void 0&&(At=At[bt]),At){const Rt=A.texture,Ft=Rt.format,zt=Rt.type;if(!I.textureFormatReadable(Ft))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!I.textureTypeReadable(zt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(Y>=0&&Y<=A.width-rt&&it>=0&&it<=A.height-q){C.bindFramebuffer(_.FRAMEBUFFER,At);const Ct=_.createBuffer();_.bindBuffer(_.PIXEL_PACK_BUFFER,Ct),_.bufferData(_.PIXEL_PACK_BUFFER,ft.byteLength,_.STREAM_READ),_.readPixels(Y,it,rt,q,Ot.convert(Ft),Ot.convert(zt),0);const Yt=N!==null?tt.get(N).__webglFramebuffer:null;C.bindFramebuffer(_.FRAMEBUFFER,Yt);const te=_.fenceSync(_.SYNC_GPU_COMMANDS_COMPLETE,0);return _.flush(),await Zl(_,te,4),_.bindBuffer(_.PIXEL_PACK_BUFFER,Ct),_.getBufferSubData(_.PIXEL_PACK_BUFFER,0,ft),_.deleteBuffer(Ct),_.deleteSync(te),ft}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(A,Y=null,it=0){A.isTexture!==!0&&(Ei("WebGLRenderer: copyFramebufferToTexture function signature has changed."),Y=arguments[0]||null,A=arguments[1]);const rt=Math.pow(2,-it),q=Math.floor(A.image.width*rt),ft=Math.floor(A.image.height*rt),bt=Y!==null?Y.x:0,At=Y!==null?Y.y:0;w.setTexture2D(A,0),_.copyTexSubImage2D(_.TEXTURE_2D,it,0,0,bt,At,q,ft),C.unbindTexture()},this.copyTextureToTexture=function(A,Y,it=null,rt=null,q=0){A.isTexture!==!0&&(Ei("WebGLRenderer: copyTextureToTexture function signature has changed."),rt=arguments[0]||null,A=arguments[1],Y=arguments[2],q=arguments[3]||0,it=null);let ft,bt,At,Rt,Ft,zt,Ct,Yt,te;const ee=A.isCompressedTexture?A.mipmaps[q]:A.image;it!==null?(ft=it.max.x-it.min.x,bt=it.max.y-it.min.y,At=it.isBox3?it.max.z-it.min.z:1,Rt=it.min.x,Ft=it.min.y,zt=it.isBox3?it.min.z:0):(ft=ee.width,bt=ee.height,At=ee.depth||1,Rt=0,Ft=0,zt=0),rt!==null?(Ct=rt.x,Yt=rt.y,te=rt.z):(Ct=0,Yt=0,te=0);const ge=Ot.convert(Y.format),jt=Ot.convert(Y.type);let Dt;Y.isData3DTexture?(w.setTexture3D(Y,0),Dt=_.TEXTURE_3D):Y.isDataArrayTexture||Y.isCompressedArrayTexture?(w.setTexture2DArray(Y,0),Dt=_.TEXTURE_2D_ARRAY):(w.setTexture2D(Y,0),Dt=_.TEXTURE_2D),_.pixelStorei(_.UNPACK_FLIP_Y_WEBGL,Y.flipY),_.pixelStorei(_.UNPACK_PREMULTIPLY_ALPHA_WEBGL,Y.premultiplyAlpha),_.pixelStorei(_.UNPACK_ALIGNMENT,Y.unpackAlignment);const Ye=_.getParameter(_.UNPACK_ROW_LENGTH),Zt=_.getParameter(_.UNPACK_IMAGE_HEIGHT),De=_.getParameter(_.UNPACK_SKIP_PIXELS),zn=_.getParameter(_.UNPACK_SKIP_ROWS),ye=_.getParameter(_.UNPACK_SKIP_IMAGES);_.pixelStorei(_.UNPACK_ROW_LENGTH,ee.width),_.pixelStorei(_.UNPACK_IMAGE_HEIGHT,ee.height),_.pixelStorei(_.UNPACK_SKIP_PIXELS,Rt),_.pixelStorei(_.UNPACK_SKIP_ROWS,Ft),_.pixelStorei(_.UNPACK_SKIP_IMAGES,zt);const _i=A.isDataArrayTexture||A.isData3DTexture,ne=Y.isDataArrayTexture||Y.isData3DTexture;if(A.isRenderTargetTexture||A.isDepthTexture){const ze=tt.get(A),gi=tt.get(Y),Te=tt.get(ze.__renderTarget),on=tt.get(gi.__renderTarget);C.bindFramebuffer(_.READ_FRAMEBUFFER,Te.__webglFramebuffer),C.bindFramebuffer(_.DRAW_FRAMEBUFFER,on.__webglFramebuffer);for(let ln=0;ln<At;ln++)_i&&_.framebufferTextureLayer(_.READ_FRAMEBUFFER,_.COLOR_ATTACHMENT0,tt.get(A).__webglTexture,q,zt+ln),A.isDepthTexture?(ne&&_.framebufferTextureLayer(_.DRAW_FRAMEBUFFER,_.COLOR_ATTACHMENT0,tt.get(Y).__webglTexture,q,te+ln),_.blitFramebuffer(Rt,Ft,ft,bt,Ct,Yt,ft,bt,_.DEPTH_BUFFER_BIT,_.NEAREST)):ne?_.copyTexSubImage3D(Dt,q,Ct,Yt,te+ln,Rt,Ft,ft,bt):_.copyTexSubImage2D(Dt,q,Ct,Yt,te+ln,Rt,Ft,ft,bt);C.bindFramebuffer(_.READ_FRAMEBUFFER,null),C.bindFramebuffer(_.DRAW_FRAMEBUFFER,null)}else ne?A.isDataTexture||A.isData3DTexture?_.texSubImage3D(Dt,q,Ct,Yt,te,ft,bt,At,ge,jt,ee.data):Y.isCompressedArrayTexture?_.compressedTexSubImage3D(Dt,q,Ct,Yt,te,ft,bt,At,ge,ee.data):_.texSubImage3D(Dt,q,Ct,Yt,te,ft,bt,At,ge,jt,ee):A.isDataTexture?_.texSubImage2D(_.TEXTURE_2D,q,Ct,Yt,ft,bt,ge,jt,ee.data):A.isCompressedTexture?_.compressedTexSubImage2D(_.TEXTURE_2D,q,Ct,Yt,ee.width,ee.height,ge,ee.data):_.texSubImage2D(_.TEXTURE_2D,q,Ct,Yt,ft,bt,ge,jt,ee);_.pixelStorei(_.UNPACK_ROW_LENGTH,Ye),_.pixelStorei(_.UNPACK_IMAGE_HEIGHT,Zt),_.pixelStorei(_.UNPACK_SKIP_PIXELS,De),_.pixelStorei(_.UNPACK_SKIP_ROWS,zn),_.pixelStorei(_.UNPACK_SKIP_IMAGES,ye),q===0&&Y.generateMipmaps&&_.generateMipmap(Dt),C.unbindTexture()},this.copyTextureToTexture3D=function(A,Y,it=null,rt=null,q=0){return A.isTexture!==!0&&(Ei("WebGLRenderer: copyTextureToTexture3D function signature has changed."),it=arguments[0]||null,rt=arguments[1]||null,A=arguments[2],Y=arguments[3],q=arguments[4]||0),Ei('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(A,Y,it,rt,q)},this.initRenderTarget=function(A){tt.get(A).__webglFramebuffer===void 0&&w.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?w.setTextureCube(A,0):A.isData3DTexture?w.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?w.setTexture2DArray(A,0):w.setTexture2D(A,0),C.unbindTexture()},this.resetState=function(){L=0,P=0,N=null,C.reset(),$t.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return nn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=Xt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Xt._getUnpackColorSpace()}}class lp extends pe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new We,this.environmentIntensity=1,this.environmentRotation=new We,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class Qs extends Mn{constructor(t=1,e=32,n=16,r=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:r,phiLength:s,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let h=0;const d=[],p=new nt,m=new nt,u=[],v=[],g=[],f=[];for(let c=0;c<=n;c++){const M=[],E=c/n;let y=0;c===0&&o===0?y=.5/e:c===n&&l===Math.PI&&(y=-.5/e);for(let D=0;D<=e;D++){const L=D/e;p.x=-t*Math.cos(r+L*s)*Math.sin(o+E*a),p.y=t*Math.cos(o+E*a),p.z=t*Math.sin(r+L*s)*Math.sin(o+E*a),v.push(p.x,p.y,p.z),m.copy(p).normalize(),g.push(m.x,m.y,m.z),f.push(L+y,1-E),M.push(h++)}d.push(M)}for(let c=0;c<n;c++)for(let M=0;M<e;M++){const E=d[c][M+1],y=d[c][M],D=d[c+1][M],L=d[c+1][M+1];(c!==0||o>0)&&u.push(E,y,L),(c!==n-1||l<Math.PI)&&u.push(y,D,L)}this.setIndex(u),this.setAttribute("position",new Ve(v,3)),this.setAttribute("normal",new Ve(g,3)),this.setAttribute("uv",new Ve(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Qs(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class ta extends Pi{static get type(){return"MeshLambertMaterial"}constructor(t){super(),this.isMeshLambertMaterial=!0,this.color=new qt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new qt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Po,this.normalScale=new Ht(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new We,this.combine=Vs,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class $o extends pe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new qt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}const Zr=new se,co=new nt,ho=new nt;class cp{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ht(512,512),this.map=null,this.mapPass=null,this.matrix=new se,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new $s,this._frameExtents=new Ht(1,1),this._viewportCount=1,this._viewports=[new re(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;co.setFromMatrixPosition(t.matrixWorld),e.position.copy(co),ho.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(ho),e.updateMatrixWorld(),Zr.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Zr),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Zr)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class hp extends cp{constructor(){super(new Xo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class up extends $o{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.target=new pe,this.shadow=new hp}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class fp extends $o{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}class uo{constructor(t=1,e=0,n=0){return this.radius=t,this.phi=e,this.theta=n,this}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(_e(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class dp extends Bn{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Gs}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Gs);const fo={type:"change"},ea={type:"start"},Jo={type:"end"},nr=new No,po=new mn,pp=Math.cos(70*ql.DEG2RAD),oe=new nt,xe=2*Math.PI,Qt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Kr=1e-6;class mp extends dp{constructor(t,e=null){super(t,e),this.state=Qt.NONE,this.enabled=!0,this.target=new nt,this.cursor=new nt,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ni.ROTATE,MIDDLE:ni.DOLLY,RIGHT:ni.PAN},this.touches={ONE:ti.ROTATE,TWO:ti.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new nt,this._lastQuaternion=new Fn,this._lastTargetPosition=new nt,this._quat=new Fn().setFromUnitVectors(t.up,new nt(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new uo,this._sphericalDelta=new uo,this._scale=1,this._panOffset=new nt,this._rotateStart=new Ht,this._rotateEnd=new Ht,this._rotateDelta=new Ht,this._panStart=new Ht,this._panEnd=new Ht,this._panDelta=new Ht,this._dollyStart=new Ht,this._dollyEnd=new Ht,this._dollyDelta=new Ht,this._dollyDirection=new nt,this._mouse=new Ht,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=gp.bind(this),this._onPointerDown=_p.bind(this),this._onPointerUp=vp.bind(this),this._onContextMenu=Tp.bind(this),this._onMouseWheel=Mp.bind(this),this._onKeyDown=yp.bind(this),this._onTouchStart=Ep.bind(this),this._onTouchMove=bp.bind(this),this._onMouseDown=xp.bind(this),this._onMouseMove=Sp.bind(this),this._interceptControlDown=wp.bind(this),this._interceptControlUp=Ap.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(fo),this.update(),this.state=Qt.NONE}update(t=null){const e=this.object.position;oe.copy(e).sub(this.target),oe.applyQuaternion(this._quat),this._spherical.setFromVector3(oe),this.autoRotate&&this.state===Qt.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=xe:n>Math.PI&&(n-=xe),r<-Math.PI?r+=xe:r>Math.PI&&(r-=xe),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=o!=this._spherical.radius}if(oe.setFromSpherical(this._spherical),oe.applyQuaternion(this._quatInverse),e.copy(this.target).add(oe),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){const a=oe.length();o=this._clampDistance(a*this._scale);const l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),s=!!l}else if(this.object.isOrthographicCamera){const a=new nt(this._mouse.x,this._mouse.y,0);a.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=l!==this.object.zoom;const h=new nt(this._mouse.x,this._mouse.y,0);h.unproject(this.object),this.object.position.sub(h).add(a),this.object.updateMatrixWorld(),o=oe.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(nr.origin.copy(this.object.position),nr.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(nr.direction))<pp?this.object.lookAt(this.target):(po.setFromNormalAndCoplanarPoint(this.object.up,this.target),nr.intersectPlane(po,this.target))))}else if(this.object.isOrthographicCamera){const o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>Kr||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Kr||this._lastTargetPosition.distanceToSquared(this.target)>Kr?(this.dispatchEvent(fo),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?xe/60*this.autoRotateSpeed*t:xe/60/60*this.autoRotateSpeed}_getZoomScale(t){const e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){oe.setFromMatrixColumn(e,0),oe.multiplyScalar(-t),this._panOffset.add(oe)}_panUp(t,e){this.screenSpacePanning===!0?oe.setFromMatrixColumn(e,1):(oe.setFromMatrixColumn(e,0),oe.crossVectors(this.object.up,oe)),oe.multiplyScalar(t),this._panOffset.add(oe)}_pan(t,e){const n=this.domElement;if(this.object.isPerspectiveCamera){const r=this.object.position;oe.copy(r).sub(this.target);let s=oe.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*s/n.clientHeight,this.object.matrix),this._panUp(2*e*s/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const n=this.domElement.getBoundingClientRect(),r=t-n.left,s=e-n.top,o=n.width,a=n.height;this._mouse.x=r/o*2-1,this._mouse.y=-(s/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(xe*this._rotateDelta.x/e.clientHeight),this._rotateUp(xe*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(xe*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(-xe*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(xe*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(-xe*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),r=.5*(t.pageY+e.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),r=.5*(t.pageY+e.y);this._panStart.set(n,r)}}_handleTouchStartDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,r=t.pageY-e.y,s=Math.sqrt(n*n+r*r);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{const n=this._getSecondPointerPosition(t),r=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);this._rotateEnd.set(r,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(xe*this._rotateDelta.x/e.clientHeight),this._rotateUp(xe*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),r=.5*(t.pageY+e.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,r=t.pageY-e.y,s=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const o=(t.pageX+e.x)*.5,a=(t.pageY+e.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new Ht,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){const e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){const e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}}function _p(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i)))}function gp(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function vp(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Jo),this.state=Qt.NONE;break;case 1:const t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function xp(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case ni.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=Qt.DOLLY;break;case ni.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Qt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Qt.ROTATE}break;case ni.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Qt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Qt.PAN}break;default:this.state=Qt.NONE}this.state!==Qt.NONE&&this.dispatchEvent(ea)}function Sp(i){switch(this.state){case Qt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case Qt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case Qt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function Mp(i){this.enabled===!1||this.enableZoom===!1||this.state!==Qt.NONE||(i.preventDefault(),this.dispatchEvent(ea),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(Jo))}function yp(i){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(i)}function Ep(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case ti.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=Qt.TOUCH_ROTATE;break;case ti.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=Qt.TOUCH_PAN;break;default:this.state=Qt.NONE}break;case 2:switch(this.touches.TWO){case ti.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=Qt.TOUCH_DOLLY_PAN;break;case ti.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=Qt.TOUCH_DOLLY_ROTATE;break;default:this.state=Qt.NONE}break;default:this.state=Qt.NONE}this.state!==Qt.NONE&&this.dispatchEvent(ea)}function bp(i){switch(this._trackPointer(i),this.state){case Qt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case Qt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case Qt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case Qt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=Qt.NONE}}function Tp(i){this.enabled!==!1&&i.preventDefault()}function wp(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Ap(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var ir=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function Rp(i){return i&&i.__esModule&&Object.prototype.hasOwnProperty.call(i,"default")?i.default:i}function rr(i){throw new Error('Could not dynamically require "'+i+'". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.')}var $r={exports:{}};/*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/var mo;function Cp(){return mo||(mo=1,(function(i,t){(function(e){i.exports=e()})(function(){return(function e(n,r,s){function o(h,d){if(!r[h]){if(!n[h]){var p=typeof rr=="function"&&rr;if(!d&&p)return p(h,!0);if(a)return a(h,!0);var m=new Error("Cannot find module '"+h+"'");throw m.code="MODULE_NOT_FOUND",m}var u=r[h]={exports:{}};n[h][0].call(u.exports,function(v){var g=n[h][1][v];return o(g||v)},u,u.exports,e,n,r,s)}return r[h].exports}for(var a=typeof rr=="function"&&rr,l=0;l<s.length;l++)o(s[l]);return o})({1:[function(e,n,r){var s=e("./utils"),o=e("./support"),a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";r.encode=function(l){for(var h,d,p,m,u,v,g,f=[],c=0,M=l.length,E=M,y=s.getTypeOf(l)!=="string";c<l.length;)E=M-c,p=y?(h=l[c++],d=c<M?l[c++]:0,c<M?l[c++]:0):(h=l.charCodeAt(c++),d=c<M?l.charCodeAt(c++):0,c<M?l.charCodeAt(c++):0),m=h>>2,u=(3&h)<<4|d>>4,v=1<E?(15&d)<<2|p>>6:64,g=2<E?63&p:64,f.push(a.charAt(m)+a.charAt(u)+a.charAt(v)+a.charAt(g));return f.join("")},r.decode=function(l){var h,d,p,m,u,v,g=0,f=0,c="data:";if(l.substr(0,c.length)===c)throw new Error("Invalid base64 input, it looks like a data url.");var M,E=3*(l=l.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(l.charAt(l.length-1)===a.charAt(64)&&E--,l.charAt(l.length-2)===a.charAt(64)&&E--,E%1!=0)throw new Error("Invalid base64 input, bad content length.");for(M=o.uint8array?new Uint8Array(0|E):new Array(0|E);g<l.length;)h=a.indexOf(l.charAt(g++))<<2|(m=a.indexOf(l.charAt(g++)))>>4,d=(15&m)<<4|(u=a.indexOf(l.charAt(g++)))>>2,p=(3&u)<<6|(v=a.indexOf(l.charAt(g++))),M[f++]=h,u!==64&&(M[f++]=d),v!==64&&(M[f++]=p);return M}},{"./support":30,"./utils":32}],2:[function(e,n,r){var s=e("./external"),o=e("./stream/DataWorker"),a=e("./stream/Crc32Probe"),l=e("./stream/DataLengthProbe");function h(d,p,m,u,v){this.compressedSize=d,this.uncompressedSize=p,this.crc32=m,this.compression=u,this.compressedContent=v}h.prototype={getContentWorker:function(){var d=new o(s.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new l("data_length")),p=this;return d.on("end",function(){if(this.streamInfo.data_length!==p.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),d},getCompressedWorker:function(){return new o(s.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},h.createWorkerFrom=function(d,p,m){return d.pipe(new a).pipe(new l("uncompressedSize")).pipe(p.compressWorker(m)).pipe(new l("compressedSize")).withStreamInfo("compression",p)},n.exports=h},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(e,n,r){var s=e("./stream/GenericWorker");r.STORE={magic:"\0\0",compressWorker:function(){return new s("STORE compression")},uncompressWorker:function(){return new s("STORE decompression")}},r.DEFLATE=e("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(e,n,r){var s=e("./utils"),o=(function(){for(var a,l=[],h=0;h<256;h++){a=h;for(var d=0;d<8;d++)a=1&a?3988292384^a>>>1:a>>>1;l[h]=a}return l})();n.exports=function(a,l){return a!==void 0&&a.length?s.getTypeOf(a)!=="string"?(function(h,d,p,m){var u=o,v=m+p;h^=-1;for(var g=m;g<v;g++)h=h>>>8^u[255&(h^d[g])];return-1^h})(0|l,a,a.length,0):(function(h,d,p,m){var u=o,v=m+p;h^=-1;for(var g=m;g<v;g++)h=h>>>8^u[255&(h^d.charCodeAt(g))];return-1^h})(0|l,a,a.length,0):0}},{"./utils":32}],5:[function(e,n,r){r.base64=!1,r.binary=!1,r.dir=!1,r.createFolders=!0,r.date=null,r.compression=null,r.compressionOptions=null,r.comment=null,r.unixPermissions=null,r.dosPermissions=null},{}],6:[function(e,n,r){var s=null;s=typeof Promise<"u"?Promise:e("lie"),n.exports={Promise:s}},{lie:37}],7:[function(e,n,r){var s=typeof Uint8Array<"u"&&typeof Uint16Array<"u"&&typeof Uint32Array<"u",o=e("pako"),a=e("./utils"),l=e("./stream/GenericWorker"),h=s?"uint8array":"array";function d(p,m){l.call(this,"FlateWorker/"+p),this._pako=null,this._pakoAction=p,this._pakoOptions=m,this.meta={}}r.magic="\b\0",a.inherits(d,l),d.prototype.processChunk=function(p){this.meta=p.meta,this._pako===null&&this._createPako(),this._pako.push(a.transformTo(h,p.data),!1)},d.prototype.flush=function(){l.prototype.flush.call(this),this._pako===null&&this._createPako(),this._pako.push([],!0)},d.prototype.cleanUp=function(){l.prototype.cleanUp.call(this),this._pako=null},d.prototype._createPako=function(){this._pako=new o[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var p=this;this._pako.onData=function(m){p.push({data:m,meta:p.meta})}},r.compressWorker=function(p){return new d("Deflate",p)},r.uncompressWorker=function(){return new d("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(e,n,r){function s(u,v){var g,f="";for(g=0;g<v;g++)f+=String.fromCharCode(255&u),u>>>=8;return f}function o(u,v,g,f,c,M){var E,y,D=u.file,L=u.compression,P=M!==h.utf8encode,N=a.transformTo("string",M(D.name)),b=a.transformTo("string",h.utf8encode(D.name)),T=D.comment,F=a.transformTo("string",M(T)),R=a.transformTo("string",h.utf8encode(T)),U=b.length!==D.name.length,S=R.length!==T.length,B="",et="",k="",$=D.dir,Q=D.date,lt={crc32:0,compressedSize:0,uncompressedSize:0};v&&!g||(lt.crc32=u.crc32,lt.compressedSize=u.compressedSize,lt.uncompressedSize=u.uncompressedSize);var H=0;v&&(H|=8),P||!U&&!S||(H|=2048);var W=0,_t=0;$&&(W|=16),c==="UNIX"?(_t=798,W|=(function(J,mt){var ut=J;return J||(ut=mt?16893:33204),(65535&ut)<<16})(D.unixPermissions,$)):(_t=20,W|=(function(J){return 63&(J||0)})(D.dosPermissions)),E=Q.getUTCHours(),E<<=6,E|=Q.getUTCMinutes(),E<<=5,E|=Q.getUTCSeconds()/2,y=Q.getUTCFullYear()-1980,y<<=4,y|=Q.getUTCMonth()+1,y<<=5,y|=Q.getUTCDate(),U&&(et=s(1,1)+s(d(N),4)+b,B+="up"+s(et.length,2)+et),S&&(k=s(1,1)+s(d(F),4)+R,B+="uc"+s(k.length,2)+k);var X="";return X+=`
\0`,X+=s(H,2),X+=L.magic,X+=s(E,2),X+=s(y,2),X+=s(lt.crc32,4),X+=s(lt.compressedSize,4),X+=s(lt.uncompressedSize,4),X+=s(N.length,2),X+=s(B.length,2),{fileRecord:p.LOCAL_FILE_HEADER+X+N+B,dirRecord:p.CENTRAL_FILE_HEADER+s(_t,2)+X+s(F.length,2)+"\0\0\0\0"+s(W,4)+s(f,4)+N+B+F}}var a=e("../utils"),l=e("../stream/GenericWorker"),h=e("../utf8"),d=e("../crc32"),p=e("../signature");function m(u,v,g,f){l.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=v,this.zipPlatform=g,this.encodeFileName=f,this.streamFiles=u,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}a.inherits(m,l),m.prototype.push=function(u){var v=u.meta.percent||0,g=this.entriesCount,f=this._sources.length;this.accumulate?this.contentBuffer.push(u):(this.bytesWritten+=u.data.length,l.prototype.push.call(this,{data:u.data,meta:{currentFile:this.currentFile,percent:g?(v+100*(g-f-1))/g:100}}))},m.prototype.openedSource=function(u){this.currentSourceOffset=this.bytesWritten,this.currentFile=u.file.name;var v=this.streamFiles&&!u.file.dir;if(v){var g=o(u,v,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:g.fileRecord,meta:{percent:0}})}else this.accumulate=!0},m.prototype.closedSource=function(u){this.accumulate=!1;var v=this.streamFiles&&!u.file.dir,g=o(u,v,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(g.dirRecord),v)this.push({data:(function(f){return p.DATA_DESCRIPTOR+s(f.crc32,4)+s(f.compressedSize,4)+s(f.uncompressedSize,4)})(u),meta:{percent:100}});else for(this.push({data:g.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},m.prototype.flush=function(){for(var u=this.bytesWritten,v=0;v<this.dirRecords.length;v++)this.push({data:this.dirRecords[v],meta:{percent:100}});var g=this.bytesWritten-u,f=(function(c,M,E,y,D){var L=a.transformTo("string",D(y));return p.CENTRAL_DIRECTORY_END+"\0\0\0\0"+s(c,2)+s(c,2)+s(M,4)+s(E,4)+s(L.length,2)+L})(this.dirRecords.length,g,u,this.zipComment,this.encodeFileName);this.push({data:f,meta:{percent:100}})},m.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},m.prototype.registerPrevious=function(u){this._sources.push(u);var v=this;return u.on("data",function(g){v.processChunk(g)}),u.on("end",function(){v.closedSource(v.previous.streamInfo),v._sources.length?v.prepareNextSource():v.end()}),u.on("error",function(g){v.error(g)}),this},m.prototype.resume=function(){return!!l.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},m.prototype.error=function(u){var v=this._sources;if(!l.prototype.error.call(this,u))return!1;for(var g=0;g<v.length;g++)try{v[g].error(u)}catch{}return!0},m.prototype.lock=function(){l.prototype.lock.call(this);for(var u=this._sources,v=0;v<u.length;v++)u[v].lock()},n.exports=m},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(e,n,r){var s=e("../compressions"),o=e("./ZipFileWorker");r.generateWorker=function(a,l,h){var d=new o(l.streamFiles,h,l.platform,l.encodeFileName),p=0;try{a.forEach(function(m,u){p++;var v=(function(M,E){var y=M||E,D=s[y];if(!D)throw new Error(y+" is not a valid compression method !");return D})(u.options.compression,l.compression),g=u.options.compressionOptions||l.compressionOptions||{},f=u.dir,c=u.date;u._compressWorker(v,g).withStreamInfo("file",{name:m,dir:f,date:c,comment:u.comment||"",unixPermissions:u.unixPermissions,dosPermissions:u.dosPermissions}).pipe(d)}),d.entriesCount=p}catch(m){d.error(m)}return d}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(e,n,r){function s(){if(!(this instanceof s))return new s;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var o=new s;for(var a in this)typeof this[a]!="function"&&(o[a]=this[a]);return o}}(s.prototype=e("./object")).loadAsync=e("./load"),s.support=e("./support"),s.defaults=e("./defaults"),s.version="3.10.1",s.loadAsync=function(o,a){return new s().loadAsync(o,a)},s.external=e("./external"),n.exports=s},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(e,n,r){var s=e("./utils"),o=e("./external"),a=e("./utf8"),l=e("./zipEntries"),h=e("./stream/Crc32Probe"),d=e("./nodejsUtils");function p(m){return new o.Promise(function(u,v){var g=m.decompressed.getContentWorker().pipe(new h);g.on("error",function(f){v(f)}).on("end",function(){g.streamInfo.crc32!==m.decompressed.crc32?v(new Error("Corrupted zip : CRC32 mismatch")):u()}).resume()})}n.exports=function(m,u){var v=this;return u=s.extend(u||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:a.utf8decode}),d.isNode&&d.isStream(m)?o.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):s.prepareContent("the loaded zip file",m,!0,u.optimizedBinaryString,u.base64).then(function(g){var f=new l(u);return f.load(g),f}).then(function(g){var f=[o.Promise.resolve(g)],c=g.files;if(u.checkCRC32)for(var M=0;M<c.length;M++)f.push(p(c[M]));return o.Promise.all(f)}).then(function(g){for(var f=g.shift(),c=f.files,M=0;M<c.length;M++){var E=c[M],y=E.fileNameStr,D=s.resolve(E.fileNameStr);v.file(D,E.decompressed,{binary:!0,optimizedBinaryString:!0,date:E.date,dir:E.dir,comment:E.fileCommentStr.length?E.fileCommentStr:null,unixPermissions:E.unixPermissions,dosPermissions:E.dosPermissions,createFolders:u.createFolders}),E.dir||(v.file(D).unsafeOriginalName=y)}return f.zipComment.length&&(v.comment=f.zipComment),v})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(e,n,r){var s=e("../utils"),o=e("../stream/GenericWorker");function a(l,h){o.call(this,"Nodejs stream input adapter for "+l),this._upstreamEnded=!1,this._bindStream(h)}s.inherits(a,o),a.prototype._bindStream=function(l){var h=this;(this._stream=l).pause(),l.on("data",function(d){h.push({data:d,meta:{percent:0}})}).on("error",function(d){h.isPaused?this.generatedError=d:h.error(d)}).on("end",function(){h.isPaused?h._upstreamEnded=!0:h.end()})},a.prototype.pause=function(){return!!o.prototype.pause.call(this)&&(this._stream.pause(),!0)},a.prototype.resume=function(){return!!o.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},n.exports=a},{"../stream/GenericWorker":28,"../utils":32}],13:[function(e,n,r){var s=e("readable-stream").Readable;function o(a,l,h){s.call(this,l),this._helper=a;var d=this;a.on("data",function(p,m){d.push(p)||d._helper.pause(),h&&h(m)}).on("error",function(p){d.emit("error",p)}).on("end",function(){d.push(null)})}e("../utils").inherits(o,s),o.prototype._read=function(){this._helper.resume()},n.exports=o},{"../utils":32,"readable-stream":16}],14:[function(e,n,r){n.exports={isNode:typeof Buffer<"u",newBufferFrom:function(s,o){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(s,o);if(typeof s=="number")throw new Error('The "data" argument must not be a number');return new Buffer(s,o)},allocBuffer:function(s){if(Buffer.alloc)return Buffer.alloc(s);var o=new Buffer(s);return o.fill(0),o},isBuffer:function(s){return Buffer.isBuffer(s)},isStream:function(s){return s&&typeof s.on=="function"&&typeof s.pause=="function"&&typeof s.resume=="function"}}},{}],15:[function(e,n,r){function s(D,L,P){var N,b=a.getTypeOf(L),T=a.extend(P||{},d);T.date=T.date||new Date,T.compression!==null&&(T.compression=T.compression.toUpperCase()),typeof T.unixPermissions=="string"&&(T.unixPermissions=parseInt(T.unixPermissions,8)),T.unixPermissions&&16384&T.unixPermissions&&(T.dir=!0),T.dosPermissions&&16&T.dosPermissions&&(T.dir=!0),T.dir&&(D=c(D)),T.createFolders&&(N=f(D))&&M.call(this,N,!0);var F=b==="string"&&T.binary===!1&&T.base64===!1;P&&P.binary!==void 0||(T.binary=!F),(L instanceof p&&L.uncompressedSize===0||T.dir||!L||L.length===0)&&(T.base64=!1,T.binary=!0,L="",T.compression="STORE",b="string");var R=null;R=L instanceof p||L instanceof l?L:v.isNode&&v.isStream(L)?new g(D,L):a.prepareContent(D,L,T.binary,T.optimizedBinaryString,T.base64);var U=new m(D,R,T);this.files[D]=U}var o=e("./utf8"),a=e("./utils"),l=e("./stream/GenericWorker"),h=e("./stream/StreamHelper"),d=e("./defaults"),p=e("./compressedObject"),m=e("./zipObject"),u=e("./generate"),v=e("./nodejsUtils"),g=e("./nodejs/NodejsStreamInputAdapter"),f=function(D){D.slice(-1)==="/"&&(D=D.substring(0,D.length-1));var L=D.lastIndexOf("/");return 0<L?D.substring(0,L):""},c=function(D){return D.slice(-1)!=="/"&&(D+="/"),D},M=function(D,L){return L=L!==void 0?L:d.createFolders,D=c(D),this.files[D]||s.call(this,D,null,{dir:!0,createFolders:L}),this.files[D]};function E(D){return Object.prototype.toString.call(D)==="[object RegExp]"}var y={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(D){var L,P,N;for(L in this.files)N=this.files[L],(P=L.slice(this.root.length,L.length))&&L.slice(0,this.root.length)===this.root&&D(P,N)},filter:function(D){var L=[];return this.forEach(function(P,N){D(P,N)&&L.push(N)}),L},file:function(D,L,P){if(arguments.length!==1)return D=this.root+D,s.call(this,D,L,P),this;if(E(D)){var N=D;return this.filter(function(T,F){return!F.dir&&N.test(T)})}var b=this.files[this.root+D];return b&&!b.dir?b:null},folder:function(D){if(!D)return this;if(E(D))return this.filter(function(b,T){return T.dir&&D.test(b)});var L=this.root+D,P=M.call(this,L),N=this.clone();return N.root=P.name,N},remove:function(D){D=this.root+D;var L=this.files[D];if(L||(D.slice(-1)!=="/"&&(D+="/"),L=this.files[D]),L&&!L.dir)delete this.files[D];else for(var P=this.filter(function(b,T){return T.name.slice(0,D.length)===D}),N=0;N<P.length;N++)delete this.files[P[N].name];return this},generate:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(D){var L,P={};try{if((P=a.extend(D||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:o.utf8encode})).type=P.type.toLowerCase(),P.compression=P.compression.toUpperCase(),P.type==="binarystring"&&(P.type="string"),!P.type)throw new Error("No output type specified.");a.checkSupport(P.type),P.platform!=="darwin"&&P.platform!=="freebsd"&&P.platform!=="linux"&&P.platform!=="sunos"||(P.platform="UNIX"),P.platform==="win32"&&(P.platform="DOS");var N=P.comment||this.comment||"";L=u.generateWorker(this,P,N)}catch(b){(L=new l("error")).error(b)}return new h(L,P.type||"string",P.mimeType)},generateAsync:function(D,L){return this.generateInternalStream(D).accumulate(L)},generateNodeStream:function(D,L){return(D=D||{}).type||(D.type="nodebuffer"),this.generateInternalStream(D).toNodejsStream(L)}};n.exports=y},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(e,n,r){n.exports=e("stream")},{stream:void 0}],17:[function(e,n,r){var s=e("./DataReader");function o(a){s.call(this,a);for(var l=0;l<this.data.length;l++)a[l]=255&a[l]}e("../utils").inherits(o,s),o.prototype.byteAt=function(a){return this.data[this.zero+a]},o.prototype.lastIndexOfSignature=function(a){for(var l=a.charCodeAt(0),h=a.charCodeAt(1),d=a.charCodeAt(2),p=a.charCodeAt(3),m=this.length-4;0<=m;--m)if(this.data[m]===l&&this.data[m+1]===h&&this.data[m+2]===d&&this.data[m+3]===p)return m-this.zero;return-1},o.prototype.readAndCheckSignature=function(a){var l=a.charCodeAt(0),h=a.charCodeAt(1),d=a.charCodeAt(2),p=a.charCodeAt(3),m=this.readData(4);return l===m[0]&&h===m[1]&&d===m[2]&&p===m[3]},o.prototype.readData=function(a){if(this.checkOffset(a),a===0)return[];var l=this.data.slice(this.zero+this.index,this.zero+this.index+a);return this.index+=a,l},n.exports=o},{"../utils":32,"./DataReader":18}],18:[function(e,n,r){var s=e("../utils");function o(a){this.data=a,this.length=a.length,this.index=0,this.zero=0}o.prototype={checkOffset:function(a){this.checkIndex(this.index+a)},checkIndex:function(a){if(this.length<this.zero+a||a<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+a+"). Corrupted zip ?")},setIndex:function(a){this.checkIndex(a),this.index=a},skip:function(a){this.setIndex(this.index+a)},byteAt:function(){},readInt:function(a){var l,h=0;for(this.checkOffset(a),l=this.index+a-1;l>=this.index;l--)h=(h<<8)+this.byteAt(l);return this.index+=a,h},readString:function(a){return s.transformTo("string",this.readData(a))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var a=this.readInt(4);return new Date(Date.UTC(1980+(a>>25&127),(a>>21&15)-1,a>>16&31,a>>11&31,a>>5&63,(31&a)<<1))}},n.exports=o},{"../utils":32}],19:[function(e,n,r){var s=e("./Uint8ArrayReader");function o(a){s.call(this,a)}e("../utils").inherits(o,s),o.prototype.readData=function(a){this.checkOffset(a);var l=this.data.slice(this.zero+this.index,this.zero+this.index+a);return this.index+=a,l},n.exports=o},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(e,n,r){var s=e("./DataReader");function o(a){s.call(this,a)}e("../utils").inherits(o,s),o.prototype.byteAt=function(a){return this.data.charCodeAt(this.zero+a)},o.prototype.lastIndexOfSignature=function(a){return this.data.lastIndexOf(a)-this.zero},o.prototype.readAndCheckSignature=function(a){return a===this.readData(4)},o.prototype.readData=function(a){this.checkOffset(a);var l=this.data.slice(this.zero+this.index,this.zero+this.index+a);return this.index+=a,l},n.exports=o},{"../utils":32,"./DataReader":18}],21:[function(e,n,r){var s=e("./ArrayReader");function o(a){s.call(this,a)}e("../utils").inherits(o,s),o.prototype.readData=function(a){if(this.checkOffset(a),a===0)return new Uint8Array(0);var l=this.data.subarray(this.zero+this.index,this.zero+this.index+a);return this.index+=a,l},n.exports=o},{"../utils":32,"./ArrayReader":17}],22:[function(e,n,r){var s=e("../utils"),o=e("../support"),a=e("./ArrayReader"),l=e("./StringReader"),h=e("./NodeBufferReader"),d=e("./Uint8ArrayReader");n.exports=function(p){var m=s.getTypeOf(p);return s.checkSupport(m),m!=="string"||o.uint8array?m==="nodebuffer"?new h(p):o.uint8array?new d(s.transformTo("uint8array",p)):new a(s.transformTo("array",p)):new l(p)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(e,n,r){r.LOCAL_FILE_HEADER="PK",r.CENTRAL_FILE_HEADER="PK",r.CENTRAL_DIRECTORY_END="PK",r.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK\x07",r.ZIP64_CENTRAL_DIRECTORY_END="PK",r.DATA_DESCRIPTOR="PK\x07\b"},{}],24:[function(e,n,r){var s=e("./GenericWorker"),o=e("../utils");function a(l){s.call(this,"ConvertWorker to "+l),this.destType=l}o.inherits(a,s),a.prototype.processChunk=function(l){this.push({data:o.transformTo(this.destType,l.data),meta:l.meta})},n.exports=a},{"../utils":32,"./GenericWorker":28}],25:[function(e,n,r){var s=e("./GenericWorker"),o=e("../crc32");function a(){s.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}e("../utils").inherits(a,s),a.prototype.processChunk=function(l){this.streamInfo.crc32=o(l.data,this.streamInfo.crc32||0),this.push(l)},n.exports=a},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(e,n,r){var s=e("../utils"),o=e("./GenericWorker");function a(l){o.call(this,"DataLengthProbe for "+l),this.propName=l,this.withStreamInfo(l,0)}s.inherits(a,o),a.prototype.processChunk=function(l){if(l){var h=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=h+l.data.length}o.prototype.processChunk.call(this,l)},n.exports=a},{"../utils":32,"./GenericWorker":28}],27:[function(e,n,r){var s=e("../utils"),o=e("./GenericWorker");function a(l){o.call(this,"DataWorker");var h=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,l.then(function(d){h.dataIsReady=!0,h.data=d,h.max=d&&d.length||0,h.type=s.getTypeOf(d),h.isPaused||h._tickAndRepeat()},function(d){h.error(d)})}s.inherits(a,o),a.prototype.cleanUp=function(){o.prototype.cleanUp.call(this),this.data=null},a.prototype.resume=function(){return!!o.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,s.delay(this._tickAndRepeat,[],this)),!0)},a.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(s.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},a.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var l=null,h=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":l=this.data.substring(this.index,h);break;case"uint8array":l=this.data.subarray(this.index,h);break;case"array":case"nodebuffer":l=this.data.slice(this.index,h)}return this.index=h,this.push({data:l,meta:{percent:this.max?this.index/this.max*100:0}})},n.exports=a},{"../utils":32,"./GenericWorker":28}],28:[function(e,n,r){function s(o){this.name=o||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}s.prototype={push:function(o){this.emit("data",o)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(o){this.emit("error",o)}return!0},error:function(o){return!this.isFinished&&(this.isPaused?this.generatedError=o:(this.isFinished=!0,this.emit("error",o),this.previous&&this.previous.error(o),this.cleanUp()),!0)},on:function(o,a){return this._listeners[o].push(a),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(o,a){if(this._listeners[o])for(var l=0;l<this._listeners[o].length;l++)this._listeners[o][l].call(this,a)},pipe:function(o){return o.registerPrevious(this)},registerPrevious:function(o){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=o.streamInfo,this.mergeStreamInfo(),this.previous=o;var a=this;return o.on("data",function(l){a.processChunk(l)}),o.on("end",function(){a.end()}),o.on("error",function(l){a.error(l)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var o=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),o=!0),this.previous&&this.previous.resume(),!o},flush:function(){},processChunk:function(o){this.push(o)},withStreamInfo:function(o,a){return this.extraStreamInfo[o]=a,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var o in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,o)&&(this.streamInfo[o]=this.extraStreamInfo[o])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var o="Worker "+this.name;return this.previous?this.previous+" -> "+o:o}},n.exports=s},{}],29:[function(e,n,r){var s=e("../utils"),o=e("./ConvertWorker"),a=e("./GenericWorker"),l=e("../base64"),h=e("../support"),d=e("../external"),p=null;if(h.nodestream)try{p=e("../nodejs/NodejsStreamOutputAdapter")}catch{}function m(v,g){return new d.Promise(function(f,c){var M=[],E=v._internalType,y=v._outputType,D=v._mimeType;v.on("data",function(L,P){M.push(L),g&&g(P)}).on("error",function(L){M=[],c(L)}).on("end",function(){try{var L=(function(P,N,b){switch(P){case"blob":return s.newBlob(s.transformTo("arraybuffer",N),b);case"base64":return l.encode(N);default:return s.transformTo(P,N)}})(y,(function(P,N){var b,T=0,F=null,R=0;for(b=0;b<N.length;b++)R+=N[b].length;switch(P){case"string":return N.join("");case"array":return Array.prototype.concat.apply([],N);case"uint8array":for(F=new Uint8Array(R),b=0;b<N.length;b++)F.set(N[b],T),T+=N[b].length;return F;case"nodebuffer":return Buffer.concat(N);default:throw new Error("concat : unsupported type '"+P+"'")}})(E,M),D);f(L)}catch(P){c(P)}M=[]}).resume()})}function u(v,g,f){var c=g;switch(g){case"blob":case"arraybuffer":c="uint8array";break;case"base64":c="string"}try{this._internalType=c,this._outputType=g,this._mimeType=f,s.checkSupport(c),this._worker=v.pipe(new o(c)),v.lock()}catch(M){this._worker=new a("error"),this._worker.error(M)}}u.prototype={accumulate:function(v){return m(this,v)},on:function(v,g){var f=this;return v==="data"?this._worker.on(v,function(c){g.call(f,c.data,c.meta)}):this._worker.on(v,function(){s.delay(g,arguments,f)}),this},resume:function(){return s.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(v){if(s.checkSupport("nodestream"),this._outputType!=="nodebuffer")throw new Error(this._outputType+" is not supported by this method");return new p(this,{objectMode:this._outputType!=="nodebuffer"},v)}},n.exports=u},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(e,n,r){if(r.base64=!0,r.array=!0,r.string=!0,r.arraybuffer=typeof ArrayBuffer<"u"&&typeof Uint8Array<"u",r.nodebuffer=typeof Buffer<"u",r.uint8array=typeof Uint8Array<"u",typeof ArrayBuffer>"u")r.blob=!1;else{var s=new ArrayBuffer(0);try{r.blob=new Blob([s],{type:"application/zip"}).size===0}catch{try{var o=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);o.append(s),r.blob=o.getBlob("application/zip").size===0}catch{r.blob=!1}}}try{r.nodestream=!!e("readable-stream").Readable}catch{r.nodestream=!1}},{"readable-stream":16}],31:[function(e,n,r){for(var s=e("./utils"),o=e("./support"),a=e("./nodejsUtils"),l=e("./stream/GenericWorker"),h=new Array(256),d=0;d<256;d++)h[d]=252<=d?6:248<=d?5:240<=d?4:224<=d?3:192<=d?2:1;h[254]=h[254]=1;function p(){l.call(this,"utf-8 decode"),this.leftOver=null}function m(){l.call(this,"utf-8 encode")}r.utf8encode=function(u){return o.nodebuffer?a.newBufferFrom(u,"utf-8"):(function(v){var g,f,c,M,E,y=v.length,D=0;for(M=0;M<y;M++)(64512&(f=v.charCodeAt(M)))==55296&&M+1<y&&(64512&(c=v.charCodeAt(M+1)))==56320&&(f=65536+(f-55296<<10)+(c-56320),M++),D+=f<128?1:f<2048?2:f<65536?3:4;for(g=o.uint8array?new Uint8Array(D):new Array(D),M=E=0;E<D;M++)(64512&(f=v.charCodeAt(M)))==55296&&M+1<y&&(64512&(c=v.charCodeAt(M+1)))==56320&&(f=65536+(f-55296<<10)+(c-56320),M++),f<128?g[E++]=f:(f<2048?g[E++]=192|f>>>6:(f<65536?g[E++]=224|f>>>12:(g[E++]=240|f>>>18,g[E++]=128|f>>>12&63),g[E++]=128|f>>>6&63),g[E++]=128|63&f);return g})(u)},r.utf8decode=function(u){return o.nodebuffer?s.transformTo("nodebuffer",u).toString("utf-8"):(function(v){var g,f,c,M,E=v.length,y=new Array(2*E);for(g=f=0;g<E;)if((c=v[g++])<128)y[f++]=c;else if(4<(M=h[c]))y[f++]=65533,g+=M-1;else{for(c&=M===2?31:M===3?15:7;1<M&&g<E;)c=c<<6|63&v[g++],M--;1<M?y[f++]=65533:c<65536?y[f++]=c:(c-=65536,y[f++]=55296|c>>10&1023,y[f++]=56320|1023&c)}return y.length!==f&&(y.subarray?y=y.subarray(0,f):y.length=f),s.applyFromCharCode(y)})(u=s.transformTo(o.uint8array?"uint8array":"array",u))},s.inherits(p,l),p.prototype.processChunk=function(u){var v=s.transformTo(o.uint8array?"uint8array":"array",u.data);if(this.leftOver&&this.leftOver.length){if(o.uint8array){var g=v;(v=new Uint8Array(g.length+this.leftOver.length)).set(this.leftOver,0),v.set(g,this.leftOver.length)}else v=this.leftOver.concat(v);this.leftOver=null}var f=(function(M,E){var y;for((E=E||M.length)>M.length&&(E=M.length),y=E-1;0<=y&&(192&M[y])==128;)y--;return y<0||y===0?E:y+h[M[y]]>E?y:E})(v),c=v;f!==v.length&&(o.uint8array?(c=v.subarray(0,f),this.leftOver=v.subarray(f,v.length)):(c=v.slice(0,f),this.leftOver=v.slice(f,v.length))),this.push({data:r.utf8decode(c),meta:u.meta})},p.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:r.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},r.Utf8DecodeWorker=p,s.inherits(m,l),m.prototype.processChunk=function(u){this.push({data:r.utf8encode(u.data),meta:u.meta})},r.Utf8EncodeWorker=m},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(e,n,r){var s=e("./support"),o=e("./base64"),a=e("./nodejsUtils"),l=e("./external");function h(g){return g}function d(g,f){for(var c=0;c<g.length;++c)f[c]=255&g.charCodeAt(c);return f}e("setimmediate"),r.newBlob=function(g,f){r.checkSupport("blob");try{return new Blob([g],{type:f})}catch{try{var c=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return c.append(g),c.getBlob(f)}catch{throw new Error("Bug : can't construct the Blob.")}}};var p={stringifyByChunk:function(g,f,c){var M=[],E=0,y=g.length;if(y<=c)return String.fromCharCode.apply(null,g);for(;E<y;)f==="array"||f==="nodebuffer"?M.push(String.fromCharCode.apply(null,g.slice(E,Math.min(E+c,y)))):M.push(String.fromCharCode.apply(null,g.subarray(E,Math.min(E+c,y)))),E+=c;return M.join("")},stringifyByChar:function(g){for(var f="",c=0;c<g.length;c++)f+=String.fromCharCode(g[c]);return f},applyCanBeUsed:{uint8array:(function(){try{return s.uint8array&&String.fromCharCode.apply(null,new Uint8Array(1)).length===1}catch{return!1}})(),nodebuffer:(function(){try{return s.nodebuffer&&String.fromCharCode.apply(null,a.allocBuffer(1)).length===1}catch{return!1}})()}};function m(g){var f=65536,c=r.getTypeOf(g),M=!0;if(c==="uint8array"?M=p.applyCanBeUsed.uint8array:c==="nodebuffer"&&(M=p.applyCanBeUsed.nodebuffer),M)for(;1<f;)try{return p.stringifyByChunk(g,c,f)}catch{f=Math.floor(f/2)}return p.stringifyByChar(g)}function u(g,f){for(var c=0;c<g.length;c++)f[c]=g[c];return f}r.applyFromCharCode=m;var v={};v.string={string:h,array:function(g){return d(g,new Array(g.length))},arraybuffer:function(g){return v.string.uint8array(g).buffer},uint8array:function(g){return d(g,new Uint8Array(g.length))},nodebuffer:function(g){return d(g,a.allocBuffer(g.length))}},v.array={string:m,array:h,arraybuffer:function(g){return new Uint8Array(g).buffer},uint8array:function(g){return new Uint8Array(g)},nodebuffer:function(g){return a.newBufferFrom(g)}},v.arraybuffer={string:function(g){return m(new Uint8Array(g))},array:function(g){return u(new Uint8Array(g),new Array(g.byteLength))},arraybuffer:h,uint8array:function(g){return new Uint8Array(g)},nodebuffer:function(g){return a.newBufferFrom(new Uint8Array(g))}},v.uint8array={string:m,array:function(g){return u(g,new Array(g.length))},arraybuffer:function(g){return g.buffer},uint8array:h,nodebuffer:function(g){return a.newBufferFrom(g)}},v.nodebuffer={string:m,array:function(g){return u(g,new Array(g.length))},arraybuffer:function(g){return v.nodebuffer.uint8array(g).buffer},uint8array:function(g){return u(g,new Uint8Array(g.length))},nodebuffer:h},r.transformTo=function(g,f){if(f=f||"",!g)return f;r.checkSupport(g);var c=r.getTypeOf(f);return v[c][g](f)},r.resolve=function(g){for(var f=g.split("/"),c=[],M=0;M<f.length;M++){var E=f[M];E==="."||E===""&&M!==0&&M!==f.length-1||(E===".."?c.pop():c.push(E))}return c.join("/")},r.getTypeOf=function(g){return typeof g=="string"?"string":Object.prototype.toString.call(g)==="[object Array]"?"array":s.nodebuffer&&a.isBuffer(g)?"nodebuffer":s.uint8array&&g instanceof Uint8Array?"uint8array":s.arraybuffer&&g instanceof ArrayBuffer?"arraybuffer":void 0},r.checkSupport=function(g){if(!s[g.toLowerCase()])throw new Error(g+" is not supported by this platform")},r.MAX_VALUE_16BITS=65535,r.MAX_VALUE_32BITS=-1,r.pretty=function(g){var f,c,M="";for(c=0;c<(g||"").length;c++)M+="\\x"+((f=g.charCodeAt(c))<16?"0":"")+f.toString(16).toUpperCase();return M},r.delay=function(g,f,c){setImmediate(function(){g.apply(c||null,f||[])})},r.inherits=function(g,f){function c(){}c.prototype=f.prototype,g.prototype=new c},r.extend=function(){var g,f,c={};for(g=0;g<arguments.length;g++)for(f in arguments[g])Object.prototype.hasOwnProperty.call(arguments[g],f)&&c[f]===void 0&&(c[f]=arguments[g][f]);return c},r.prepareContent=function(g,f,c,M,E){return l.Promise.resolve(f).then(function(y){return s.blob&&(y instanceof Blob||["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(y))!==-1)&&typeof FileReader<"u"?new l.Promise(function(D,L){var P=new FileReader;P.onload=function(N){D(N.target.result)},P.onerror=function(N){L(N.target.error)},P.readAsArrayBuffer(y)}):y}).then(function(y){var D=r.getTypeOf(y);return D?(D==="arraybuffer"?y=r.transformTo("uint8array",y):D==="string"&&(E?y=o.decode(y):c&&M!==!0&&(y=(function(L){return d(L,s.uint8array?new Uint8Array(L.length):new Array(L.length))})(y))),y):l.Promise.reject(new Error("Can't read the data of '"+g+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(e,n,r){var s=e("./reader/readerFor"),o=e("./utils"),a=e("./signature"),l=e("./zipEntry"),h=e("./support");function d(p){this.files=[],this.loadOptions=p}d.prototype={checkSignature:function(p){if(!this.reader.readAndCheckSignature(p)){this.reader.index-=4;var m=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+o.pretty(m)+", expected "+o.pretty(p)+")")}},isSignature:function(p,m){var u=this.reader.index;this.reader.setIndex(p);var v=this.reader.readString(4)===m;return this.reader.setIndex(u),v},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var p=this.reader.readData(this.zipCommentLength),m=h.uint8array?"uint8array":"array",u=o.transformTo(m,p);this.zipComment=this.loadOptions.decodeFileName(u)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var p,m,u,v=this.zip64EndOfCentralSize-44;0<v;)p=this.reader.readInt(2),m=this.reader.readInt(4),u=this.reader.readData(m),this.zip64ExtensibleData[p]={id:p,length:m,value:u}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var p,m;for(p=0;p<this.files.length;p++)m=this.files[p],this.reader.setIndex(m.localHeaderOffset),this.checkSignature(a.LOCAL_FILE_HEADER),m.readLocalPart(this.reader),m.handleUTF8(),m.processAttributes()},readCentralDir:function(){var p;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(a.CENTRAL_FILE_HEADER);)(p=new l({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(p);if(this.centralDirRecords!==this.files.length&&this.centralDirRecords!==0&&this.files.length===0)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var p=this.reader.lastIndexOfSignature(a.CENTRAL_DIRECTORY_END);if(p<0)throw this.isSignature(0,a.LOCAL_FILE_HEADER)?new Error("Corrupted zip: can't find end of central directory"):new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");this.reader.setIndex(p);var m=p;if(this.checkSignature(a.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===o.MAX_VALUE_16BITS||this.diskWithCentralDirStart===o.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===o.MAX_VALUE_16BITS||this.centralDirRecords===o.MAX_VALUE_16BITS||this.centralDirSize===o.MAX_VALUE_32BITS||this.centralDirOffset===o.MAX_VALUE_32BITS){if(this.zip64=!0,(p=this.reader.lastIndexOfSignature(a.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(p),this.checkSignature(a.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,a.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(a.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(a.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var u=this.centralDirOffset+this.centralDirSize;this.zip64&&(u+=20,u+=12+this.zip64EndOfCentralSize);var v=m-u;if(0<v)this.isSignature(m,a.CENTRAL_FILE_HEADER)||(this.reader.zero=v);else if(v<0)throw new Error("Corrupted zip: missing "+Math.abs(v)+" bytes.")},prepareReader:function(p){this.reader=s(p)},load:function(p){this.prepareReader(p),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},n.exports=d},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(e,n,r){var s=e("./reader/readerFor"),o=e("./utils"),a=e("./compressedObject"),l=e("./crc32"),h=e("./utf8"),d=e("./compressions"),p=e("./support");function m(u,v){this.options=u,this.loadOptions=v}m.prototype={isEncrypted:function(){return(1&this.bitFlag)==1},useUTF8:function(){return(2048&this.bitFlag)==2048},readLocalPart:function(u){var v,g;if(u.skip(22),this.fileNameLength=u.readInt(2),g=u.readInt(2),this.fileName=u.readData(this.fileNameLength),u.skip(g),this.compressedSize===-1||this.uncompressedSize===-1)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if((v=(function(f){for(var c in d)if(Object.prototype.hasOwnProperty.call(d,c)&&d[c].magic===f)return d[c];return null})(this.compressionMethod))===null)throw new Error("Corrupted zip : compression "+o.pretty(this.compressionMethod)+" unknown (inner file : "+o.transformTo("string",this.fileName)+")");this.decompressed=new a(this.compressedSize,this.uncompressedSize,this.crc32,v,u.readData(this.compressedSize))},readCentralPart:function(u){this.versionMadeBy=u.readInt(2),u.skip(2),this.bitFlag=u.readInt(2),this.compressionMethod=u.readString(2),this.date=u.readDate(),this.crc32=u.readInt(4),this.compressedSize=u.readInt(4),this.uncompressedSize=u.readInt(4);var v=u.readInt(2);if(this.extraFieldsLength=u.readInt(2),this.fileCommentLength=u.readInt(2),this.diskNumberStart=u.readInt(2),this.internalFileAttributes=u.readInt(2),this.externalFileAttributes=u.readInt(4),this.localHeaderOffset=u.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");u.skip(v),this.readExtraFields(u),this.parseZIP64ExtraField(u),this.fileComment=u.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var u=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),u==0&&(this.dosPermissions=63&this.externalFileAttributes),u==3&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||this.fileNameStr.slice(-1)!=="/"||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var u=s(this.extraFields[1].value);this.uncompressedSize===o.MAX_VALUE_32BITS&&(this.uncompressedSize=u.readInt(8)),this.compressedSize===o.MAX_VALUE_32BITS&&(this.compressedSize=u.readInt(8)),this.localHeaderOffset===o.MAX_VALUE_32BITS&&(this.localHeaderOffset=u.readInt(8)),this.diskNumberStart===o.MAX_VALUE_32BITS&&(this.diskNumberStart=u.readInt(4))}},readExtraFields:function(u){var v,g,f,c=u.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});u.index+4<c;)v=u.readInt(2),g=u.readInt(2),f=u.readData(g),this.extraFields[v]={id:v,length:g,value:f};u.setIndex(c)},handleUTF8:function(){var u=p.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=h.utf8decode(this.fileName),this.fileCommentStr=h.utf8decode(this.fileComment);else{var v=this.findExtraFieldUnicodePath();if(v!==null)this.fileNameStr=v;else{var g=o.transformTo(u,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(g)}var f=this.findExtraFieldUnicodeComment();if(f!==null)this.fileCommentStr=f;else{var c=o.transformTo(u,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(c)}}},findExtraFieldUnicodePath:function(){var u=this.extraFields[28789];if(u){var v=s(u.value);return v.readInt(1)!==1||l(this.fileName)!==v.readInt(4)?null:h.utf8decode(v.readData(u.length-5))}return null},findExtraFieldUnicodeComment:function(){var u=this.extraFields[25461];if(u){var v=s(u.value);return v.readInt(1)!==1||l(this.fileComment)!==v.readInt(4)?null:h.utf8decode(v.readData(u.length-5))}return null}},n.exports=m},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(e,n,r){function s(v,g,f){this.name=v,this.dir=f.dir,this.date=f.date,this.comment=f.comment,this.unixPermissions=f.unixPermissions,this.dosPermissions=f.dosPermissions,this._data=g,this._dataBinary=f.binary,this.options={compression:f.compression,compressionOptions:f.compressionOptions}}var o=e("./stream/StreamHelper"),a=e("./stream/DataWorker"),l=e("./utf8"),h=e("./compressedObject"),d=e("./stream/GenericWorker");s.prototype={internalStream:function(v){var g=null,f="string";try{if(!v)throw new Error("No output type specified.");var c=(f=v.toLowerCase())==="string"||f==="text";f!=="binarystring"&&f!=="text"||(f="string"),g=this._decompressWorker();var M=!this._dataBinary;M&&!c&&(g=g.pipe(new l.Utf8EncodeWorker)),!M&&c&&(g=g.pipe(new l.Utf8DecodeWorker))}catch(E){(g=new d("error")).error(E)}return new o(g,f,"")},async:function(v,g){return this.internalStream(v).accumulate(g)},nodeStream:function(v,g){return this.internalStream(v||"nodebuffer").toNodejsStream(g)},_compressWorker:function(v,g){if(this._data instanceof h&&this._data.compression.magic===v.magic)return this._data.getCompressedWorker();var f=this._decompressWorker();return this._dataBinary||(f=f.pipe(new l.Utf8EncodeWorker)),h.createWorkerFrom(f,v,g)},_decompressWorker:function(){return this._data instanceof h?this._data.getContentWorker():this._data instanceof d?this._data:new a(this._data)}};for(var p=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],m=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},u=0;u<p.length;u++)s.prototype[p[u]]=m;n.exports=s},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(e,n,r){(function(s){var o,a,l=s.MutationObserver||s.WebKitMutationObserver;if(l){var h=0,d=new l(v),p=s.document.createTextNode("");d.observe(p,{characterData:!0}),o=function(){p.data=h=++h%2}}else if(s.setImmediate||s.MessageChannel===void 0)o="document"in s&&"onreadystatechange"in s.document.createElement("script")?function(){var g=s.document.createElement("script");g.onreadystatechange=function(){v(),g.onreadystatechange=null,g.parentNode.removeChild(g),g=null},s.document.documentElement.appendChild(g)}:function(){setTimeout(v,0)};else{var m=new s.MessageChannel;m.port1.onmessage=v,o=function(){m.port2.postMessage(0)}}var u=[];function v(){var g,f;a=!0;for(var c=u.length;c;){for(f=u,u=[],g=-1;++g<c;)f[g]();c=u.length}a=!1}n.exports=function(g){u.push(g)!==1||a||o()}}).call(this,typeof ir<"u"?ir:typeof self<"u"?self:typeof window<"u"?window:{})},{}],37:[function(e,n,r){var s=e("immediate");function o(){}var a={},l=["REJECTED"],h=["FULFILLED"],d=["PENDING"];function p(c){if(typeof c!="function")throw new TypeError("resolver must be a function");this.state=d,this.queue=[],this.outcome=void 0,c!==o&&g(this,c)}function m(c,M,E){this.promise=c,typeof M=="function"&&(this.onFulfilled=M,this.callFulfilled=this.otherCallFulfilled),typeof E=="function"&&(this.onRejected=E,this.callRejected=this.otherCallRejected)}function u(c,M,E){s(function(){var y;try{y=M(E)}catch(D){return a.reject(c,D)}y===c?a.reject(c,new TypeError("Cannot resolve promise with itself")):a.resolve(c,y)})}function v(c){var M=c&&c.then;if(c&&(typeof c=="object"||typeof c=="function")&&typeof M=="function")return function(){M.apply(c,arguments)}}function g(c,M){var E=!1;function y(P){E||(E=!0,a.reject(c,P))}function D(P){E||(E=!0,a.resolve(c,P))}var L=f(function(){M(D,y)});L.status==="error"&&y(L.value)}function f(c,M){var E={};try{E.value=c(M),E.status="success"}catch(y){E.status="error",E.value=y}return E}(n.exports=p).prototype.finally=function(c){if(typeof c!="function")return this;var M=this.constructor;return this.then(function(E){return M.resolve(c()).then(function(){return E})},function(E){return M.resolve(c()).then(function(){throw E})})},p.prototype.catch=function(c){return this.then(null,c)},p.prototype.then=function(c,M){if(typeof c!="function"&&this.state===h||typeof M!="function"&&this.state===l)return this;var E=new this.constructor(o);return this.state!==d?u(E,this.state===h?c:M,this.outcome):this.queue.push(new m(E,c,M)),E},m.prototype.callFulfilled=function(c){a.resolve(this.promise,c)},m.prototype.otherCallFulfilled=function(c){u(this.promise,this.onFulfilled,c)},m.prototype.callRejected=function(c){a.reject(this.promise,c)},m.prototype.otherCallRejected=function(c){u(this.promise,this.onRejected,c)},a.resolve=function(c,M){var E=f(v,M);if(E.status==="error")return a.reject(c,E.value);var y=E.value;if(y)g(c,y);else{c.state=h,c.outcome=M;for(var D=-1,L=c.queue.length;++D<L;)c.queue[D].callFulfilled(M)}return c},a.reject=function(c,M){c.state=l,c.outcome=M;for(var E=-1,y=c.queue.length;++E<y;)c.queue[E].callRejected(M);return c},p.resolve=function(c){return c instanceof this?c:a.resolve(new this(o),c)},p.reject=function(c){var M=new this(o);return a.reject(M,c)},p.all=function(c){var M=this;if(Object.prototype.toString.call(c)!=="[object Array]")return this.reject(new TypeError("must be an array"));var E=c.length,y=!1;if(!E)return this.resolve([]);for(var D=new Array(E),L=0,P=-1,N=new this(o);++P<E;)b(c[P],P);return N;function b(T,F){M.resolve(T).then(function(R){D[F]=R,++L!==E||y||(y=!0,a.resolve(N,D))},function(R){y||(y=!0,a.reject(N,R))})}},p.race=function(c){var M=this;if(Object.prototype.toString.call(c)!=="[object Array]")return this.reject(new TypeError("must be an array"));var E=c.length,y=!1;if(!E)return this.resolve([]);for(var D=-1,L=new this(o);++D<E;)P=c[D],M.resolve(P).then(function(N){y||(y=!0,a.resolve(L,N))},function(N){y||(y=!0,a.reject(L,N))});var P;return L}},{immediate:36}],38:[function(e,n,r){var s={};(0,e("./lib/utils/common").assign)(s,e("./lib/deflate"),e("./lib/inflate"),e("./lib/zlib/constants")),n.exports=s},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(e,n,r){var s=e("./zlib/deflate"),o=e("./utils/common"),a=e("./utils/strings"),l=e("./zlib/messages"),h=e("./zlib/zstream"),d=Object.prototype.toString,p=0,m=-1,u=0,v=8;function g(c){if(!(this instanceof g))return new g(c);this.options=o.assign({level:m,method:v,chunkSize:16384,windowBits:15,memLevel:8,strategy:u,to:""},c||{});var M=this.options;M.raw&&0<M.windowBits?M.windowBits=-M.windowBits:M.gzip&&0<M.windowBits&&M.windowBits<16&&(M.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new h,this.strm.avail_out=0;var E=s.deflateInit2(this.strm,M.level,M.method,M.windowBits,M.memLevel,M.strategy);if(E!==p)throw new Error(l[E]);if(M.header&&s.deflateSetHeader(this.strm,M.header),M.dictionary){var y;if(y=typeof M.dictionary=="string"?a.string2buf(M.dictionary):d.call(M.dictionary)==="[object ArrayBuffer]"?new Uint8Array(M.dictionary):M.dictionary,(E=s.deflateSetDictionary(this.strm,y))!==p)throw new Error(l[E]);this._dict_set=!0}}function f(c,M){var E=new g(M);if(E.push(c,!0),E.err)throw E.msg||l[E.err];return E.result}g.prototype.push=function(c,M){var E,y,D=this.strm,L=this.options.chunkSize;if(this.ended)return!1;y=M===~~M?M:M===!0?4:0,typeof c=="string"?D.input=a.string2buf(c):d.call(c)==="[object ArrayBuffer]"?D.input=new Uint8Array(c):D.input=c,D.next_in=0,D.avail_in=D.input.length;do{if(D.avail_out===0&&(D.output=new o.Buf8(L),D.next_out=0,D.avail_out=L),(E=s.deflate(D,y))!==1&&E!==p)return this.onEnd(E),!(this.ended=!0);D.avail_out!==0&&(D.avail_in!==0||y!==4&&y!==2)||(this.options.to==="string"?this.onData(a.buf2binstring(o.shrinkBuf(D.output,D.next_out))):this.onData(o.shrinkBuf(D.output,D.next_out)))}while((0<D.avail_in||D.avail_out===0)&&E!==1);return y===4?(E=s.deflateEnd(this.strm),this.onEnd(E),this.ended=!0,E===p):y!==2||(this.onEnd(p),!(D.avail_out=0))},g.prototype.onData=function(c){this.chunks.push(c)},g.prototype.onEnd=function(c){c===p&&(this.options.to==="string"?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=c,this.msg=this.strm.msg},r.Deflate=g,r.deflate=f,r.deflateRaw=function(c,M){return(M=M||{}).raw=!0,f(c,M)},r.gzip=function(c,M){return(M=M||{}).gzip=!0,f(c,M)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(e,n,r){var s=e("./zlib/inflate"),o=e("./utils/common"),a=e("./utils/strings"),l=e("./zlib/constants"),h=e("./zlib/messages"),d=e("./zlib/zstream"),p=e("./zlib/gzheader"),m=Object.prototype.toString;function u(g){if(!(this instanceof u))return new u(g);this.options=o.assign({chunkSize:16384,windowBits:0,to:""},g||{});var f=this.options;f.raw&&0<=f.windowBits&&f.windowBits<16&&(f.windowBits=-f.windowBits,f.windowBits===0&&(f.windowBits=-15)),!(0<=f.windowBits&&f.windowBits<16)||g&&g.windowBits||(f.windowBits+=32),15<f.windowBits&&f.windowBits<48&&(15&f.windowBits)==0&&(f.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new d,this.strm.avail_out=0;var c=s.inflateInit2(this.strm,f.windowBits);if(c!==l.Z_OK)throw new Error(h[c]);this.header=new p,s.inflateGetHeader(this.strm,this.header)}function v(g,f){var c=new u(f);if(c.push(g,!0),c.err)throw c.msg||h[c.err];return c.result}u.prototype.push=function(g,f){var c,M,E,y,D,L,P=this.strm,N=this.options.chunkSize,b=this.options.dictionary,T=!1;if(this.ended)return!1;M=f===~~f?f:f===!0?l.Z_FINISH:l.Z_NO_FLUSH,typeof g=="string"?P.input=a.binstring2buf(g):m.call(g)==="[object ArrayBuffer]"?P.input=new Uint8Array(g):P.input=g,P.next_in=0,P.avail_in=P.input.length;do{if(P.avail_out===0&&(P.output=new o.Buf8(N),P.next_out=0,P.avail_out=N),(c=s.inflate(P,l.Z_NO_FLUSH))===l.Z_NEED_DICT&&b&&(L=typeof b=="string"?a.string2buf(b):m.call(b)==="[object ArrayBuffer]"?new Uint8Array(b):b,c=s.inflateSetDictionary(this.strm,L)),c===l.Z_BUF_ERROR&&T===!0&&(c=l.Z_OK,T=!1),c!==l.Z_STREAM_END&&c!==l.Z_OK)return this.onEnd(c),!(this.ended=!0);P.next_out&&(P.avail_out!==0&&c!==l.Z_STREAM_END&&(P.avail_in!==0||M!==l.Z_FINISH&&M!==l.Z_SYNC_FLUSH)||(this.options.to==="string"?(E=a.utf8border(P.output,P.next_out),y=P.next_out-E,D=a.buf2string(P.output,E),P.next_out=y,P.avail_out=N-y,y&&o.arraySet(P.output,P.output,E,y,0),this.onData(D)):this.onData(o.shrinkBuf(P.output,P.next_out)))),P.avail_in===0&&P.avail_out===0&&(T=!0)}while((0<P.avail_in||P.avail_out===0)&&c!==l.Z_STREAM_END);return c===l.Z_STREAM_END&&(M=l.Z_FINISH),M===l.Z_FINISH?(c=s.inflateEnd(this.strm),this.onEnd(c),this.ended=!0,c===l.Z_OK):M!==l.Z_SYNC_FLUSH||(this.onEnd(l.Z_OK),!(P.avail_out=0))},u.prototype.onData=function(g){this.chunks.push(g)},u.prototype.onEnd=function(g){g===l.Z_OK&&(this.options.to==="string"?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=g,this.msg=this.strm.msg},r.Inflate=u,r.inflate=v,r.inflateRaw=function(g,f){return(f=f||{}).raw=!0,v(g,f)},r.ungzip=v},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(e,n,r){var s=typeof Uint8Array<"u"&&typeof Uint16Array<"u"&&typeof Int32Array<"u";r.assign=function(l){for(var h=Array.prototype.slice.call(arguments,1);h.length;){var d=h.shift();if(d){if(typeof d!="object")throw new TypeError(d+"must be non-object");for(var p in d)d.hasOwnProperty(p)&&(l[p]=d[p])}}return l},r.shrinkBuf=function(l,h){return l.length===h?l:l.subarray?l.subarray(0,h):(l.length=h,l)};var o={arraySet:function(l,h,d,p,m){if(h.subarray&&l.subarray)l.set(h.subarray(d,d+p),m);else for(var u=0;u<p;u++)l[m+u]=h[d+u]},flattenChunks:function(l){var h,d,p,m,u,v;for(h=p=0,d=l.length;h<d;h++)p+=l[h].length;for(v=new Uint8Array(p),h=m=0,d=l.length;h<d;h++)u=l[h],v.set(u,m),m+=u.length;return v}},a={arraySet:function(l,h,d,p,m){for(var u=0;u<p;u++)l[m+u]=h[d+u]},flattenChunks:function(l){return[].concat.apply([],l)}};r.setTyped=function(l){l?(r.Buf8=Uint8Array,r.Buf16=Uint16Array,r.Buf32=Int32Array,r.assign(r,o)):(r.Buf8=Array,r.Buf16=Array,r.Buf32=Array,r.assign(r,a))},r.setTyped(s)},{}],42:[function(e,n,r){var s=e("./common"),o=!0,a=!0;try{String.fromCharCode.apply(null,[0])}catch{o=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch{a=!1}for(var l=new s.Buf8(256),h=0;h<256;h++)l[h]=252<=h?6:248<=h?5:240<=h?4:224<=h?3:192<=h?2:1;function d(p,m){if(m<65537&&(p.subarray&&a||!p.subarray&&o))return String.fromCharCode.apply(null,s.shrinkBuf(p,m));for(var u="",v=0;v<m;v++)u+=String.fromCharCode(p[v]);return u}l[254]=l[254]=1,r.string2buf=function(p){var m,u,v,g,f,c=p.length,M=0;for(g=0;g<c;g++)(64512&(u=p.charCodeAt(g)))==55296&&g+1<c&&(64512&(v=p.charCodeAt(g+1)))==56320&&(u=65536+(u-55296<<10)+(v-56320),g++),M+=u<128?1:u<2048?2:u<65536?3:4;for(m=new s.Buf8(M),g=f=0;f<M;g++)(64512&(u=p.charCodeAt(g)))==55296&&g+1<c&&(64512&(v=p.charCodeAt(g+1)))==56320&&(u=65536+(u-55296<<10)+(v-56320),g++),u<128?m[f++]=u:(u<2048?m[f++]=192|u>>>6:(u<65536?m[f++]=224|u>>>12:(m[f++]=240|u>>>18,m[f++]=128|u>>>12&63),m[f++]=128|u>>>6&63),m[f++]=128|63&u);return m},r.buf2binstring=function(p){return d(p,p.length)},r.binstring2buf=function(p){for(var m=new s.Buf8(p.length),u=0,v=m.length;u<v;u++)m[u]=p.charCodeAt(u);return m},r.buf2string=function(p,m){var u,v,g,f,c=m||p.length,M=new Array(2*c);for(u=v=0;u<c;)if((g=p[u++])<128)M[v++]=g;else if(4<(f=l[g]))M[v++]=65533,u+=f-1;else{for(g&=f===2?31:f===3?15:7;1<f&&u<c;)g=g<<6|63&p[u++],f--;1<f?M[v++]=65533:g<65536?M[v++]=g:(g-=65536,M[v++]=55296|g>>10&1023,M[v++]=56320|1023&g)}return d(M,v)},r.utf8border=function(p,m){var u;for((m=m||p.length)>p.length&&(m=p.length),u=m-1;0<=u&&(192&p[u])==128;)u--;return u<0||u===0?m:u+l[p[u]]>m?u:m}},{"./common":41}],43:[function(e,n,r){n.exports=function(s,o,a,l){for(var h=65535&s|0,d=s>>>16&65535|0,p=0;a!==0;){for(a-=p=2e3<a?2e3:a;d=d+(h=h+o[l++]|0)|0,--p;);h%=65521,d%=65521}return h|d<<16|0}},{}],44:[function(e,n,r){n.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(e,n,r){var s=(function(){for(var o,a=[],l=0;l<256;l++){o=l;for(var h=0;h<8;h++)o=1&o?3988292384^o>>>1:o>>>1;a[l]=o}return a})();n.exports=function(o,a,l,h){var d=s,p=h+l;o^=-1;for(var m=h;m<p;m++)o=o>>>8^d[255&(o^a[m])];return-1^o}},{}],46:[function(e,n,r){var s,o=e("../utils/common"),a=e("./trees"),l=e("./adler32"),h=e("./crc32"),d=e("./messages"),p=0,m=4,u=0,v=-2,g=-1,f=4,c=2,M=8,E=9,y=286,D=30,L=19,P=2*y+1,N=15,b=3,T=258,F=T+b+1,R=42,U=113,S=1,B=2,et=3,k=4;function $(_,at){return _.msg=d[at],at}function Q(_){return(_<<1)-(4<_?9:0)}function lt(_){for(var at=_.length;0<=--at;)_[at]=0}function H(_){var at=_.state,Z=at.pending;Z>_.avail_out&&(Z=_.avail_out),Z!==0&&(o.arraySet(_.output,at.pending_buf,at.pending_out,Z,_.next_out),_.next_out+=Z,at.pending_out+=Z,_.total_out+=Z,_.avail_out-=Z,at.pending-=Z,at.pending===0&&(at.pending_out=0))}function W(_,at){a._tr_flush_block(_,0<=_.block_start?_.block_start:-1,_.strstart-_.block_start,at),_.block_start=_.strstart,H(_.strm)}function _t(_,at){_.pending_buf[_.pending++]=at}function X(_,at){_.pending_buf[_.pending++]=at>>>8&255,_.pending_buf[_.pending++]=255&at}function J(_,at){var Z,I,C=_.max_chain_length,z=_.strstart,tt=_.prev_length,w=_.nice_match,x=_.strstart>_.w_size-F?_.strstart-(_.w_size-F):0,O=_.window,j=_.w_mask,V=_.prev,K=_.strstart+T,dt=O[z+tt-1],ct=O[z+tt];_.prev_length>=_.good_match&&(C>>=2),w>_.lookahead&&(w=_.lookahead);do if(O[(Z=at)+tt]===ct&&O[Z+tt-1]===dt&&O[Z]===O[z]&&O[++Z]===O[z+1]){z+=2,Z++;do;while(O[++z]===O[++Z]&&O[++z]===O[++Z]&&O[++z]===O[++Z]&&O[++z]===O[++Z]&&O[++z]===O[++Z]&&O[++z]===O[++Z]&&O[++z]===O[++Z]&&O[++z]===O[++Z]&&z<K);if(I=T-(K-z),z=K-T,tt<I){if(_.match_start=at,w<=(tt=I))break;dt=O[z+tt-1],ct=O[z+tt]}}while((at=V[at&j])>x&&--C!=0);return tt<=_.lookahead?tt:_.lookahead}function mt(_){var at,Z,I,C,z,tt,w,x,O,j,V=_.w_size;do{if(C=_.window_size-_.lookahead-_.strstart,_.strstart>=V+(V-F)){for(o.arraySet(_.window,_.window,V,V,0),_.match_start-=V,_.strstart-=V,_.block_start-=V,at=Z=_.hash_size;I=_.head[--at],_.head[at]=V<=I?I-V:0,--Z;);for(at=Z=V;I=_.prev[--at],_.prev[at]=V<=I?I-V:0,--Z;);C+=V}if(_.strm.avail_in===0)break;if(tt=_.strm,w=_.window,x=_.strstart+_.lookahead,O=C,j=void 0,j=tt.avail_in,O<j&&(j=O),Z=j===0?0:(tt.avail_in-=j,o.arraySet(w,tt.input,tt.next_in,j,x),tt.state.wrap===1?tt.adler=l(tt.adler,w,j,x):tt.state.wrap===2&&(tt.adler=h(tt.adler,w,j,x)),tt.next_in+=j,tt.total_in+=j,j),_.lookahead+=Z,_.lookahead+_.insert>=b)for(z=_.strstart-_.insert,_.ins_h=_.window[z],_.ins_h=(_.ins_h<<_.hash_shift^_.window[z+1])&_.hash_mask;_.insert&&(_.ins_h=(_.ins_h<<_.hash_shift^_.window[z+b-1])&_.hash_mask,_.prev[z&_.w_mask]=_.head[_.ins_h],_.head[_.ins_h]=z,z++,_.insert--,!(_.lookahead+_.insert<b)););}while(_.lookahead<F&&_.strm.avail_in!==0)}function ut(_,at){for(var Z,I;;){if(_.lookahead<F){if(mt(_),_.lookahead<F&&at===p)return S;if(_.lookahead===0)break}if(Z=0,_.lookahead>=b&&(_.ins_h=(_.ins_h<<_.hash_shift^_.window[_.strstart+b-1])&_.hash_mask,Z=_.prev[_.strstart&_.w_mask]=_.head[_.ins_h],_.head[_.ins_h]=_.strstart),Z!==0&&_.strstart-Z<=_.w_size-F&&(_.match_length=J(_,Z)),_.match_length>=b)if(I=a._tr_tally(_,_.strstart-_.match_start,_.match_length-b),_.lookahead-=_.match_length,_.match_length<=_.max_lazy_match&&_.lookahead>=b){for(_.match_length--;_.strstart++,_.ins_h=(_.ins_h<<_.hash_shift^_.window[_.strstart+b-1])&_.hash_mask,Z=_.prev[_.strstart&_.w_mask]=_.head[_.ins_h],_.head[_.ins_h]=_.strstart,--_.match_length!=0;);_.strstart++}else _.strstart+=_.match_length,_.match_length=0,_.ins_h=_.window[_.strstart],_.ins_h=(_.ins_h<<_.hash_shift^_.window[_.strstart+1])&_.hash_mask;else I=a._tr_tally(_,0,_.window[_.strstart]),_.lookahead--,_.strstart++;if(I&&(W(_,!1),_.strm.avail_out===0))return S}return _.insert=_.strstart<b-1?_.strstart:b-1,at===m?(W(_,!0),_.strm.avail_out===0?et:k):_.last_lit&&(W(_,!1),_.strm.avail_out===0)?S:B}function pt(_,at){for(var Z,I,C;;){if(_.lookahead<F){if(mt(_),_.lookahead<F&&at===p)return S;if(_.lookahead===0)break}if(Z=0,_.lookahead>=b&&(_.ins_h=(_.ins_h<<_.hash_shift^_.window[_.strstart+b-1])&_.hash_mask,Z=_.prev[_.strstart&_.w_mask]=_.head[_.ins_h],_.head[_.ins_h]=_.strstart),_.prev_length=_.match_length,_.prev_match=_.match_start,_.match_length=b-1,Z!==0&&_.prev_length<_.max_lazy_match&&_.strstart-Z<=_.w_size-F&&(_.match_length=J(_,Z),_.match_length<=5&&(_.strategy===1||_.match_length===b&&4096<_.strstart-_.match_start)&&(_.match_length=b-1)),_.prev_length>=b&&_.match_length<=_.prev_length){for(C=_.strstart+_.lookahead-b,I=a._tr_tally(_,_.strstart-1-_.prev_match,_.prev_length-b),_.lookahead-=_.prev_length-1,_.prev_length-=2;++_.strstart<=C&&(_.ins_h=(_.ins_h<<_.hash_shift^_.window[_.strstart+b-1])&_.hash_mask,Z=_.prev[_.strstart&_.w_mask]=_.head[_.ins_h],_.head[_.ins_h]=_.strstart),--_.prev_length!=0;);if(_.match_available=0,_.match_length=b-1,_.strstart++,I&&(W(_,!1),_.strm.avail_out===0))return S}else if(_.match_available){if((I=a._tr_tally(_,0,_.window[_.strstart-1]))&&W(_,!1),_.strstart++,_.lookahead--,_.strm.avail_out===0)return S}else _.match_available=1,_.strstart++,_.lookahead--}return _.match_available&&(I=a._tr_tally(_,0,_.window[_.strstart-1]),_.match_available=0),_.insert=_.strstart<b-1?_.strstart:b-1,at===m?(W(_,!0),_.strm.avail_out===0?et:k):_.last_lit&&(W(_,!1),_.strm.avail_out===0)?S:B}function Mt(_,at,Z,I,C){this.good_length=_,this.max_lazy=at,this.nice_length=Z,this.max_chain=I,this.func=C}function Pt(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=M,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new o.Buf16(2*P),this.dyn_dtree=new o.Buf16(2*(2*D+1)),this.bl_tree=new o.Buf16(2*(2*L+1)),lt(this.dyn_ltree),lt(this.dyn_dtree),lt(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new o.Buf16(N+1),this.heap=new o.Buf16(2*y+1),lt(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new o.Buf16(2*y+1),lt(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function It(_){var at;return _&&_.state?(_.total_in=_.total_out=0,_.data_type=c,(at=_.state).pending=0,at.pending_out=0,at.wrap<0&&(at.wrap=-at.wrap),at.status=at.wrap?R:U,_.adler=at.wrap===2?0:1,at.last_flush=p,a._tr_init(at),u):$(_,v)}function Ut(_){var at=It(_);return at===u&&(function(Z){Z.window_size=2*Z.w_size,lt(Z.head),Z.max_lazy_match=s[Z.level].max_lazy,Z.good_match=s[Z.level].good_length,Z.nice_match=s[Z.level].nice_length,Z.max_chain_length=s[Z.level].max_chain,Z.strstart=0,Z.block_start=0,Z.lookahead=0,Z.insert=0,Z.match_length=Z.prev_length=b-1,Z.match_available=0,Z.ins_h=0})(_.state),at}function Wt(_,at,Z,I,C,z){if(!_)return v;var tt=1;if(at===g&&(at=6),I<0?(tt=0,I=-I):15<I&&(tt=2,I-=16),C<1||E<C||Z!==M||I<8||15<I||at<0||9<at||z<0||f<z)return $(_,v);I===8&&(I=9);var w=new Pt;return(_.state=w).strm=_,w.wrap=tt,w.gzhead=null,w.w_bits=I,w.w_size=1<<w.w_bits,w.w_mask=w.w_size-1,w.hash_bits=C+7,w.hash_size=1<<w.hash_bits,w.hash_mask=w.hash_size-1,w.hash_shift=~~((w.hash_bits+b-1)/b),w.window=new o.Buf8(2*w.w_size),w.head=new o.Buf16(w.hash_size),w.prev=new o.Buf16(w.w_size),w.lit_bufsize=1<<C+6,w.pending_buf_size=4*w.lit_bufsize,w.pending_buf=new o.Buf8(w.pending_buf_size),w.d_buf=1*w.lit_bufsize,w.l_buf=3*w.lit_bufsize,w.level=at,w.strategy=z,w.method=Z,Ut(_)}s=[new Mt(0,0,0,0,function(_,at){var Z=65535;for(Z>_.pending_buf_size-5&&(Z=_.pending_buf_size-5);;){if(_.lookahead<=1){if(mt(_),_.lookahead===0&&at===p)return S;if(_.lookahead===0)break}_.strstart+=_.lookahead,_.lookahead=0;var I=_.block_start+Z;if((_.strstart===0||_.strstart>=I)&&(_.lookahead=_.strstart-I,_.strstart=I,W(_,!1),_.strm.avail_out===0)||_.strstart-_.block_start>=_.w_size-F&&(W(_,!1),_.strm.avail_out===0))return S}return _.insert=0,at===m?(W(_,!0),_.strm.avail_out===0?et:k):(_.strstart>_.block_start&&(W(_,!1),_.strm.avail_out),S)}),new Mt(4,4,8,4,ut),new Mt(4,5,16,8,ut),new Mt(4,6,32,32,ut),new Mt(4,4,16,16,pt),new Mt(8,16,32,32,pt),new Mt(8,16,128,128,pt),new Mt(8,32,128,256,pt),new Mt(32,128,258,1024,pt),new Mt(32,258,258,4096,pt)],r.deflateInit=function(_,at){return Wt(_,at,M,15,8,0)},r.deflateInit2=Wt,r.deflateReset=Ut,r.deflateResetKeep=It,r.deflateSetHeader=function(_,at){return _&&_.state?_.state.wrap!==2?v:(_.state.gzhead=at,u):v},r.deflate=function(_,at){var Z,I,C,z;if(!_||!_.state||5<at||at<0)return _?$(_,v):v;if(I=_.state,!_.output||!_.input&&_.avail_in!==0||I.status===666&&at!==m)return $(_,_.avail_out===0?-5:v);if(I.strm=_,Z=I.last_flush,I.last_flush=at,I.status===R)if(I.wrap===2)_.adler=0,_t(I,31),_t(I,139),_t(I,8),I.gzhead?(_t(I,(I.gzhead.text?1:0)+(I.gzhead.hcrc?2:0)+(I.gzhead.extra?4:0)+(I.gzhead.name?8:0)+(I.gzhead.comment?16:0)),_t(I,255&I.gzhead.time),_t(I,I.gzhead.time>>8&255),_t(I,I.gzhead.time>>16&255),_t(I,I.gzhead.time>>24&255),_t(I,I.level===9?2:2<=I.strategy||I.level<2?4:0),_t(I,255&I.gzhead.os),I.gzhead.extra&&I.gzhead.extra.length&&(_t(I,255&I.gzhead.extra.length),_t(I,I.gzhead.extra.length>>8&255)),I.gzhead.hcrc&&(_.adler=h(_.adler,I.pending_buf,I.pending,0)),I.gzindex=0,I.status=69):(_t(I,0),_t(I,0),_t(I,0),_t(I,0),_t(I,0),_t(I,I.level===9?2:2<=I.strategy||I.level<2?4:0),_t(I,3),I.status=U);else{var tt=M+(I.w_bits-8<<4)<<8;tt|=(2<=I.strategy||I.level<2?0:I.level<6?1:I.level===6?2:3)<<6,I.strstart!==0&&(tt|=32),tt+=31-tt%31,I.status=U,X(I,tt),I.strstart!==0&&(X(I,_.adler>>>16),X(I,65535&_.adler)),_.adler=1}if(I.status===69)if(I.gzhead.extra){for(C=I.pending;I.gzindex<(65535&I.gzhead.extra.length)&&(I.pending!==I.pending_buf_size||(I.gzhead.hcrc&&I.pending>C&&(_.adler=h(_.adler,I.pending_buf,I.pending-C,C)),H(_),C=I.pending,I.pending!==I.pending_buf_size));)_t(I,255&I.gzhead.extra[I.gzindex]),I.gzindex++;I.gzhead.hcrc&&I.pending>C&&(_.adler=h(_.adler,I.pending_buf,I.pending-C,C)),I.gzindex===I.gzhead.extra.length&&(I.gzindex=0,I.status=73)}else I.status=73;if(I.status===73)if(I.gzhead.name){C=I.pending;do{if(I.pending===I.pending_buf_size&&(I.gzhead.hcrc&&I.pending>C&&(_.adler=h(_.adler,I.pending_buf,I.pending-C,C)),H(_),C=I.pending,I.pending===I.pending_buf_size)){z=1;break}z=I.gzindex<I.gzhead.name.length?255&I.gzhead.name.charCodeAt(I.gzindex++):0,_t(I,z)}while(z!==0);I.gzhead.hcrc&&I.pending>C&&(_.adler=h(_.adler,I.pending_buf,I.pending-C,C)),z===0&&(I.gzindex=0,I.status=91)}else I.status=91;if(I.status===91)if(I.gzhead.comment){C=I.pending;do{if(I.pending===I.pending_buf_size&&(I.gzhead.hcrc&&I.pending>C&&(_.adler=h(_.adler,I.pending_buf,I.pending-C,C)),H(_),C=I.pending,I.pending===I.pending_buf_size)){z=1;break}z=I.gzindex<I.gzhead.comment.length?255&I.gzhead.comment.charCodeAt(I.gzindex++):0,_t(I,z)}while(z!==0);I.gzhead.hcrc&&I.pending>C&&(_.adler=h(_.adler,I.pending_buf,I.pending-C,C)),z===0&&(I.status=103)}else I.status=103;if(I.status===103&&(I.gzhead.hcrc?(I.pending+2>I.pending_buf_size&&H(_),I.pending+2<=I.pending_buf_size&&(_t(I,255&_.adler),_t(I,_.adler>>8&255),_.adler=0,I.status=U)):I.status=U),I.pending!==0){if(H(_),_.avail_out===0)return I.last_flush=-1,u}else if(_.avail_in===0&&Q(at)<=Q(Z)&&at!==m)return $(_,-5);if(I.status===666&&_.avail_in!==0)return $(_,-5);if(_.avail_in!==0||I.lookahead!==0||at!==p&&I.status!==666){var w=I.strategy===2?(function(x,O){for(var j;;){if(x.lookahead===0&&(mt(x),x.lookahead===0)){if(O===p)return S;break}if(x.match_length=0,j=a._tr_tally(x,0,x.window[x.strstart]),x.lookahead--,x.strstart++,j&&(W(x,!1),x.strm.avail_out===0))return S}return x.insert=0,O===m?(W(x,!0),x.strm.avail_out===0?et:k):x.last_lit&&(W(x,!1),x.strm.avail_out===0)?S:B})(I,at):I.strategy===3?(function(x,O){for(var j,V,K,dt,ct=x.window;;){if(x.lookahead<=T){if(mt(x),x.lookahead<=T&&O===p)return S;if(x.lookahead===0)break}if(x.match_length=0,x.lookahead>=b&&0<x.strstart&&(V=ct[K=x.strstart-1])===ct[++K]&&V===ct[++K]&&V===ct[++K]){dt=x.strstart+T;do;while(V===ct[++K]&&V===ct[++K]&&V===ct[++K]&&V===ct[++K]&&V===ct[++K]&&V===ct[++K]&&V===ct[++K]&&V===ct[++K]&&K<dt);x.match_length=T-(dt-K),x.match_length>x.lookahead&&(x.match_length=x.lookahead)}if(x.match_length>=b?(j=a._tr_tally(x,1,x.match_length-b),x.lookahead-=x.match_length,x.strstart+=x.match_length,x.match_length=0):(j=a._tr_tally(x,0,x.window[x.strstart]),x.lookahead--,x.strstart++),j&&(W(x,!1),x.strm.avail_out===0))return S}return x.insert=0,O===m?(W(x,!0),x.strm.avail_out===0?et:k):x.last_lit&&(W(x,!1),x.strm.avail_out===0)?S:B})(I,at):s[I.level].func(I,at);if(w!==et&&w!==k||(I.status=666),w===S||w===et)return _.avail_out===0&&(I.last_flush=-1),u;if(w===B&&(at===1?a._tr_align(I):at!==5&&(a._tr_stored_block(I,0,0,!1),at===3&&(lt(I.head),I.lookahead===0&&(I.strstart=0,I.block_start=0,I.insert=0))),H(_),_.avail_out===0))return I.last_flush=-1,u}return at!==m?u:I.wrap<=0?1:(I.wrap===2?(_t(I,255&_.adler),_t(I,_.adler>>8&255),_t(I,_.adler>>16&255),_t(I,_.adler>>24&255),_t(I,255&_.total_in),_t(I,_.total_in>>8&255),_t(I,_.total_in>>16&255),_t(I,_.total_in>>24&255)):(X(I,_.adler>>>16),X(I,65535&_.adler)),H(_),0<I.wrap&&(I.wrap=-I.wrap),I.pending!==0?u:1)},r.deflateEnd=function(_){var at;return _&&_.state?(at=_.state.status)!==R&&at!==69&&at!==73&&at!==91&&at!==103&&at!==U&&at!==666?$(_,v):(_.state=null,at===U?$(_,-3):u):v},r.deflateSetDictionary=function(_,at){var Z,I,C,z,tt,w,x,O,j=at.length;if(!_||!_.state||(z=(Z=_.state).wrap)===2||z===1&&Z.status!==R||Z.lookahead)return v;for(z===1&&(_.adler=l(_.adler,at,j,0)),Z.wrap=0,j>=Z.w_size&&(z===0&&(lt(Z.head),Z.strstart=0,Z.block_start=0,Z.insert=0),O=new o.Buf8(Z.w_size),o.arraySet(O,at,j-Z.w_size,Z.w_size,0),at=O,j=Z.w_size),tt=_.avail_in,w=_.next_in,x=_.input,_.avail_in=j,_.next_in=0,_.input=at,mt(Z);Z.lookahead>=b;){for(I=Z.strstart,C=Z.lookahead-(b-1);Z.ins_h=(Z.ins_h<<Z.hash_shift^Z.window[I+b-1])&Z.hash_mask,Z.prev[I&Z.w_mask]=Z.head[Z.ins_h],Z.head[Z.ins_h]=I,I++,--C;);Z.strstart=I,Z.lookahead=b-1,mt(Z)}return Z.strstart+=Z.lookahead,Z.block_start=Z.strstart,Z.insert=Z.lookahead,Z.lookahead=0,Z.match_length=Z.prev_length=b-1,Z.match_available=0,_.next_in=w,_.input=x,_.avail_in=tt,Z.wrap=z,u},r.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(e,n,r){n.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(e,n,r){n.exports=function(s,o){var a,l,h,d,p,m,u,v,g,f,c,M,E,y,D,L,P,N,b,T,F,R,U,S,B;a=s.state,l=s.next_in,S=s.input,h=l+(s.avail_in-5),d=s.next_out,B=s.output,p=d-(o-s.avail_out),m=d+(s.avail_out-257),u=a.dmax,v=a.wsize,g=a.whave,f=a.wnext,c=a.window,M=a.hold,E=a.bits,y=a.lencode,D=a.distcode,L=(1<<a.lenbits)-1,P=(1<<a.distbits)-1;t:do{E<15&&(M+=S[l++]<<E,E+=8,M+=S[l++]<<E,E+=8),N=y[M&L];e:for(;;){if(M>>>=b=N>>>24,E-=b,(b=N>>>16&255)===0)B[d++]=65535&N;else{if(!(16&b)){if((64&b)==0){N=y[(65535&N)+(M&(1<<b)-1)];continue e}if(32&b){a.mode=12;break t}s.msg="invalid literal/length code",a.mode=30;break t}T=65535&N,(b&=15)&&(E<b&&(M+=S[l++]<<E,E+=8),T+=M&(1<<b)-1,M>>>=b,E-=b),E<15&&(M+=S[l++]<<E,E+=8,M+=S[l++]<<E,E+=8),N=D[M&P];n:for(;;){if(M>>>=b=N>>>24,E-=b,!(16&(b=N>>>16&255))){if((64&b)==0){N=D[(65535&N)+(M&(1<<b)-1)];continue n}s.msg="invalid distance code",a.mode=30;break t}if(F=65535&N,E<(b&=15)&&(M+=S[l++]<<E,(E+=8)<b&&(M+=S[l++]<<E,E+=8)),u<(F+=M&(1<<b)-1)){s.msg="invalid distance too far back",a.mode=30;break t}if(M>>>=b,E-=b,(b=d-p)<F){if(g<(b=F-b)&&a.sane){s.msg="invalid distance too far back",a.mode=30;break t}if(U=c,(R=0)===f){if(R+=v-b,b<T){for(T-=b;B[d++]=c[R++],--b;);R=d-F,U=B}}else if(f<b){if(R+=v+f-b,(b-=f)<T){for(T-=b;B[d++]=c[R++],--b;);if(R=0,f<T){for(T-=b=f;B[d++]=c[R++],--b;);R=d-F,U=B}}}else if(R+=f-b,b<T){for(T-=b;B[d++]=c[R++],--b;);R=d-F,U=B}for(;2<T;)B[d++]=U[R++],B[d++]=U[R++],B[d++]=U[R++],T-=3;T&&(B[d++]=U[R++],1<T&&(B[d++]=U[R++]))}else{for(R=d-F;B[d++]=B[R++],B[d++]=B[R++],B[d++]=B[R++],2<(T-=3););T&&(B[d++]=B[R++],1<T&&(B[d++]=B[R++]))}break}}break}}while(l<h&&d<m);l-=T=E>>3,M&=(1<<(E-=T<<3))-1,s.next_in=l,s.next_out=d,s.avail_in=l<h?h-l+5:5-(l-h),s.avail_out=d<m?m-d+257:257-(d-m),a.hold=M,a.bits=E}},{}],49:[function(e,n,r){var s=e("../utils/common"),o=e("./adler32"),a=e("./crc32"),l=e("./inffast"),h=e("./inftrees"),d=1,p=2,m=0,u=-2,v=1,g=852,f=592;function c(R){return(R>>>24&255)+(R>>>8&65280)+((65280&R)<<8)+((255&R)<<24)}function M(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new s.Buf16(320),this.work=new s.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function E(R){var U;return R&&R.state?(U=R.state,R.total_in=R.total_out=U.total=0,R.msg="",U.wrap&&(R.adler=1&U.wrap),U.mode=v,U.last=0,U.havedict=0,U.dmax=32768,U.head=null,U.hold=0,U.bits=0,U.lencode=U.lendyn=new s.Buf32(g),U.distcode=U.distdyn=new s.Buf32(f),U.sane=1,U.back=-1,m):u}function y(R){var U;return R&&R.state?((U=R.state).wsize=0,U.whave=0,U.wnext=0,E(R)):u}function D(R,U){var S,B;return R&&R.state?(B=R.state,U<0?(S=0,U=-U):(S=1+(U>>4),U<48&&(U&=15)),U&&(U<8||15<U)?u:(B.window!==null&&B.wbits!==U&&(B.window=null),B.wrap=S,B.wbits=U,y(R))):u}function L(R,U){var S,B;return R?(B=new M,(R.state=B).window=null,(S=D(R,U))!==m&&(R.state=null),S):u}var P,N,b=!0;function T(R){if(b){var U;for(P=new s.Buf32(512),N=new s.Buf32(32),U=0;U<144;)R.lens[U++]=8;for(;U<256;)R.lens[U++]=9;for(;U<280;)R.lens[U++]=7;for(;U<288;)R.lens[U++]=8;for(h(d,R.lens,0,288,P,0,R.work,{bits:9}),U=0;U<32;)R.lens[U++]=5;h(p,R.lens,0,32,N,0,R.work,{bits:5}),b=!1}R.lencode=P,R.lenbits=9,R.distcode=N,R.distbits=5}function F(R,U,S,B){var et,k=R.state;return k.window===null&&(k.wsize=1<<k.wbits,k.wnext=0,k.whave=0,k.window=new s.Buf8(k.wsize)),B>=k.wsize?(s.arraySet(k.window,U,S-k.wsize,k.wsize,0),k.wnext=0,k.whave=k.wsize):(B<(et=k.wsize-k.wnext)&&(et=B),s.arraySet(k.window,U,S-B,et,k.wnext),(B-=et)?(s.arraySet(k.window,U,S-B,B,0),k.wnext=B,k.whave=k.wsize):(k.wnext+=et,k.wnext===k.wsize&&(k.wnext=0),k.whave<k.wsize&&(k.whave+=et))),0}r.inflateReset=y,r.inflateReset2=D,r.inflateResetKeep=E,r.inflateInit=function(R){return L(R,15)},r.inflateInit2=L,r.inflate=function(R,U){var S,B,et,k,$,Q,lt,H,W,_t,X,J,mt,ut,pt,Mt,Pt,It,Ut,Wt,_,at,Z,I,C=0,z=new s.Buf8(4),tt=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!R||!R.state||!R.output||!R.input&&R.avail_in!==0)return u;(S=R.state).mode===12&&(S.mode=13),$=R.next_out,et=R.output,lt=R.avail_out,k=R.next_in,B=R.input,Q=R.avail_in,H=S.hold,W=S.bits,_t=Q,X=lt,at=m;t:for(;;)switch(S.mode){case v:if(S.wrap===0){S.mode=13;break}for(;W<16;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}if(2&S.wrap&&H===35615){z[S.check=0]=255&H,z[1]=H>>>8&255,S.check=a(S.check,z,2,0),W=H=0,S.mode=2;break}if(S.flags=0,S.head&&(S.head.done=!1),!(1&S.wrap)||(((255&H)<<8)+(H>>8))%31){R.msg="incorrect header check",S.mode=30;break}if((15&H)!=8){R.msg="unknown compression method",S.mode=30;break}if(W-=4,_=8+(15&(H>>>=4)),S.wbits===0)S.wbits=_;else if(_>S.wbits){R.msg="invalid window size",S.mode=30;break}S.dmax=1<<_,R.adler=S.check=1,S.mode=512&H?10:12,W=H=0;break;case 2:for(;W<16;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}if(S.flags=H,(255&S.flags)!=8){R.msg="unknown compression method",S.mode=30;break}if(57344&S.flags){R.msg="unknown header flags set",S.mode=30;break}S.head&&(S.head.text=H>>8&1),512&S.flags&&(z[0]=255&H,z[1]=H>>>8&255,S.check=a(S.check,z,2,0)),W=H=0,S.mode=3;case 3:for(;W<32;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}S.head&&(S.head.time=H),512&S.flags&&(z[0]=255&H,z[1]=H>>>8&255,z[2]=H>>>16&255,z[3]=H>>>24&255,S.check=a(S.check,z,4,0)),W=H=0,S.mode=4;case 4:for(;W<16;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}S.head&&(S.head.xflags=255&H,S.head.os=H>>8),512&S.flags&&(z[0]=255&H,z[1]=H>>>8&255,S.check=a(S.check,z,2,0)),W=H=0,S.mode=5;case 5:if(1024&S.flags){for(;W<16;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}S.length=H,S.head&&(S.head.extra_len=H),512&S.flags&&(z[0]=255&H,z[1]=H>>>8&255,S.check=a(S.check,z,2,0)),W=H=0}else S.head&&(S.head.extra=null);S.mode=6;case 6:if(1024&S.flags&&(Q<(J=S.length)&&(J=Q),J&&(S.head&&(_=S.head.extra_len-S.length,S.head.extra||(S.head.extra=new Array(S.head.extra_len)),s.arraySet(S.head.extra,B,k,J,_)),512&S.flags&&(S.check=a(S.check,B,J,k)),Q-=J,k+=J,S.length-=J),S.length))break t;S.length=0,S.mode=7;case 7:if(2048&S.flags){if(Q===0)break t;for(J=0;_=B[k+J++],S.head&&_&&S.length<65536&&(S.head.name+=String.fromCharCode(_)),_&&J<Q;);if(512&S.flags&&(S.check=a(S.check,B,J,k)),Q-=J,k+=J,_)break t}else S.head&&(S.head.name=null);S.length=0,S.mode=8;case 8:if(4096&S.flags){if(Q===0)break t;for(J=0;_=B[k+J++],S.head&&_&&S.length<65536&&(S.head.comment+=String.fromCharCode(_)),_&&J<Q;);if(512&S.flags&&(S.check=a(S.check,B,J,k)),Q-=J,k+=J,_)break t}else S.head&&(S.head.comment=null);S.mode=9;case 9:if(512&S.flags){for(;W<16;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}if(H!==(65535&S.check)){R.msg="header crc mismatch",S.mode=30;break}W=H=0}S.head&&(S.head.hcrc=S.flags>>9&1,S.head.done=!0),R.adler=S.check=0,S.mode=12;break;case 10:for(;W<32;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}R.adler=S.check=c(H),W=H=0,S.mode=11;case 11:if(S.havedict===0)return R.next_out=$,R.avail_out=lt,R.next_in=k,R.avail_in=Q,S.hold=H,S.bits=W,2;R.adler=S.check=1,S.mode=12;case 12:if(U===5||U===6)break t;case 13:if(S.last){H>>>=7&W,W-=7&W,S.mode=27;break}for(;W<3;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}switch(S.last=1&H,W-=1,3&(H>>>=1)){case 0:S.mode=14;break;case 1:if(T(S),S.mode=20,U!==6)break;H>>>=2,W-=2;break t;case 2:S.mode=17;break;case 3:R.msg="invalid block type",S.mode=30}H>>>=2,W-=2;break;case 14:for(H>>>=7&W,W-=7&W;W<32;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}if((65535&H)!=(H>>>16^65535)){R.msg="invalid stored block lengths",S.mode=30;break}if(S.length=65535&H,W=H=0,S.mode=15,U===6)break t;case 15:S.mode=16;case 16:if(J=S.length){if(Q<J&&(J=Q),lt<J&&(J=lt),J===0)break t;s.arraySet(et,B,k,J,$),Q-=J,k+=J,lt-=J,$+=J,S.length-=J;break}S.mode=12;break;case 17:for(;W<14;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}if(S.nlen=257+(31&H),H>>>=5,W-=5,S.ndist=1+(31&H),H>>>=5,W-=5,S.ncode=4+(15&H),H>>>=4,W-=4,286<S.nlen||30<S.ndist){R.msg="too many length or distance symbols",S.mode=30;break}S.have=0,S.mode=18;case 18:for(;S.have<S.ncode;){for(;W<3;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}S.lens[tt[S.have++]]=7&H,H>>>=3,W-=3}for(;S.have<19;)S.lens[tt[S.have++]]=0;if(S.lencode=S.lendyn,S.lenbits=7,Z={bits:S.lenbits},at=h(0,S.lens,0,19,S.lencode,0,S.work,Z),S.lenbits=Z.bits,at){R.msg="invalid code lengths set",S.mode=30;break}S.have=0,S.mode=19;case 19:for(;S.have<S.nlen+S.ndist;){for(;Mt=(C=S.lencode[H&(1<<S.lenbits)-1])>>>16&255,Pt=65535&C,!((pt=C>>>24)<=W);){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}if(Pt<16)H>>>=pt,W-=pt,S.lens[S.have++]=Pt;else{if(Pt===16){for(I=pt+2;W<I;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}if(H>>>=pt,W-=pt,S.have===0){R.msg="invalid bit length repeat",S.mode=30;break}_=S.lens[S.have-1],J=3+(3&H),H>>>=2,W-=2}else if(Pt===17){for(I=pt+3;W<I;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}W-=pt,_=0,J=3+(7&(H>>>=pt)),H>>>=3,W-=3}else{for(I=pt+7;W<I;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}W-=pt,_=0,J=11+(127&(H>>>=pt)),H>>>=7,W-=7}if(S.have+J>S.nlen+S.ndist){R.msg="invalid bit length repeat",S.mode=30;break}for(;J--;)S.lens[S.have++]=_}}if(S.mode===30)break;if(S.lens[256]===0){R.msg="invalid code -- missing end-of-block",S.mode=30;break}if(S.lenbits=9,Z={bits:S.lenbits},at=h(d,S.lens,0,S.nlen,S.lencode,0,S.work,Z),S.lenbits=Z.bits,at){R.msg="invalid literal/lengths set",S.mode=30;break}if(S.distbits=6,S.distcode=S.distdyn,Z={bits:S.distbits},at=h(p,S.lens,S.nlen,S.ndist,S.distcode,0,S.work,Z),S.distbits=Z.bits,at){R.msg="invalid distances set",S.mode=30;break}if(S.mode=20,U===6)break t;case 20:S.mode=21;case 21:if(6<=Q&&258<=lt){R.next_out=$,R.avail_out=lt,R.next_in=k,R.avail_in=Q,S.hold=H,S.bits=W,l(R,X),$=R.next_out,et=R.output,lt=R.avail_out,k=R.next_in,B=R.input,Q=R.avail_in,H=S.hold,W=S.bits,S.mode===12&&(S.back=-1);break}for(S.back=0;Mt=(C=S.lencode[H&(1<<S.lenbits)-1])>>>16&255,Pt=65535&C,!((pt=C>>>24)<=W);){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}if(Mt&&(240&Mt)==0){for(It=pt,Ut=Mt,Wt=Pt;Mt=(C=S.lencode[Wt+((H&(1<<It+Ut)-1)>>It)])>>>16&255,Pt=65535&C,!(It+(pt=C>>>24)<=W);){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}H>>>=It,W-=It,S.back+=It}if(H>>>=pt,W-=pt,S.back+=pt,S.length=Pt,Mt===0){S.mode=26;break}if(32&Mt){S.back=-1,S.mode=12;break}if(64&Mt){R.msg="invalid literal/length code",S.mode=30;break}S.extra=15&Mt,S.mode=22;case 22:if(S.extra){for(I=S.extra;W<I;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}S.length+=H&(1<<S.extra)-1,H>>>=S.extra,W-=S.extra,S.back+=S.extra}S.was=S.length,S.mode=23;case 23:for(;Mt=(C=S.distcode[H&(1<<S.distbits)-1])>>>16&255,Pt=65535&C,!((pt=C>>>24)<=W);){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}if((240&Mt)==0){for(It=pt,Ut=Mt,Wt=Pt;Mt=(C=S.distcode[Wt+((H&(1<<It+Ut)-1)>>It)])>>>16&255,Pt=65535&C,!(It+(pt=C>>>24)<=W);){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}H>>>=It,W-=It,S.back+=It}if(H>>>=pt,W-=pt,S.back+=pt,64&Mt){R.msg="invalid distance code",S.mode=30;break}S.offset=Pt,S.extra=15&Mt,S.mode=24;case 24:if(S.extra){for(I=S.extra;W<I;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}S.offset+=H&(1<<S.extra)-1,H>>>=S.extra,W-=S.extra,S.back+=S.extra}if(S.offset>S.dmax){R.msg="invalid distance too far back",S.mode=30;break}S.mode=25;case 25:if(lt===0)break t;if(J=X-lt,S.offset>J){if((J=S.offset-J)>S.whave&&S.sane){R.msg="invalid distance too far back",S.mode=30;break}mt=J>S.wnext?(J-=S.wnext,S.wsize-J):S.wnext-J,J>S.length&&(J=S.length),ut=S.window}else ut=et,mt=$-S.offset,J=S.length;for(lt<J&&(J=lt),lt-=J,S.length-=J;et[$++]=ut[mt++],--J;);S.length===0&&(S.mode=21);break;case 26:if(lt===0)break t;et[$++]=S.length,lt--,S.mode=21;break;case 27:if(S.wrap){for(;W<32;){if(Q===0)break t;Q--,H|=B[k++]<<W,W+=8}if(X-=lt,R.total_out+=X,S.total+=X,X&&(R.adler=S.check=S.flags?a(S.check,et,X,$-X):o(S.check,et,X,$-X)),X=lt,(S.flags?H:c(H))!==S.check){R.msg="incorrect data check",S.mode=30;break}W=H=0}S.mode=28;case 28:if(S.wrap&&S.flags){for(;W<32;){if(Q===0)break t;Q--,H+=B[k++]<<W,W+=8}if(H!==(4294967295&S.total)){R.msg="incorrect length check",S.mode=30;break}W=H=0}S.mode=29;case 29:at=1;break t;case 30:at=-3;break t;case 31:return-4;case 32:default:return u}return R.next_out=$,R.avail_out=lt,R.next_in=k,R.avail_in=Q,S.hold=H,S.bits=W,(S.wsize||X!==R.avail_out&&S.mode<30&&(S.mode<27||U!==4))&&F(R,R.output,R.next_out,X-R.avail_out)?(S.mode=31,-4):(_t-=R.avail_in,X-=R.avail_out,R.total_in+=_t,R.total_out+=X,S.total+=X,S.wrap&&X&&(R.adler=S.check=S.flags?a(S.check,et,X,R.next_out-X):o(S.check,et,X,R.next_out-X)),R.data_type=S.bits+(S.last?64:0)+(S.mode===12?128:0)+(S.mode===20||S.mode===15?256:0),(_t==0&&X===0||U===4)&&at===m&&(at=-5),at)},r.inflateEnd=function(R){if(!R||!R.state)return u;var U=R.state;return U.window&&(U.window=null),R.state=null,m},r.inflateGetHeader=function(R,U){var S;return R&&R.state?(2&(S=R.state).wrap)==0?u:((S.head=U).done=!1,m):u},r.inflateSetDictionary=function(R,U){var S,B=U.length;return R&&R.state?(S=R.state).wrap!==0&&S.mode!==11?u:S.mode===11&&o(1,U,B,0)!==S.check?-3:F(R,U,B,B)?(S.mode=31,-4):(S.havedict=1,m):u},r.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(e,n,r){var s=e("../utils/common"),o=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],a=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],l=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],h=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];n.exports=function(d,p,m,u,v,g,f,c){var M,E,y,D,L,P,N,b,T,F=c.bits,R=0,U=0,S=0,B=0,et=0,k=0,$=0,Q=0,lt=0,H=0,W=null,_t=0,X=new s.Buf16(16),J=new s.Buf16(16),mt=null,ut=0;for(R=0;R<=15;R++)X[R]=0;for(U=0;U<u;U++)X[p[m+U]]++;for(et=F,B=15;1<=B&&X[B]===0;B--);if(B<et&&(et=B),B===0)return v[g++]=20971520,v[g++]=20971520,c.bits=1,0;for(S=1;S<B&&X[S]===0;S++);for(et<S&&(et=S),R=Q=1;R<=15;R++)if(Q<<=1,(Q-=X[R])<0)return-1;if(0<Q&&(d===0||B!==1))return-1;for(J[1]=0,R=1;R<15;R++)J[R+1]=J[R]+X[R];for(U=0;U<u;U++)p[m+U]!==0&&(f[J[p[m+U]]++]=U);if(P=d===0?(W=mt=f,19):d===1?(W=o,_t-=257,mt=a,ut-=257,256):(W=l,mt=h,-1),R=S,L=g,$=U=H=0,y=-1,D=(lt=1<<(k=et))-1,d===1&&852<lt||d===2&&592<lt)return 1;for(;;){for(N=R-$,T=f[U]<P?(b=0,f[U]):f[U]>P?(b=mt[ut+f[U]],W[_t+f[U]]):(b=96,0),M=1<<R-$,S=E=1<<k;v[L+(H>>$)+(E-=M)]=N<<24|b<<16|T|0,E!==0;);for(M=1<<R-1;H&M;)M>>=1;if(M!==0?(H&=M-1,H+=M):H=0,U++,--X[R]==0){if(R===B)break;R=p[m+f[U]]}if(et<R&&(H&D)!==y){for($===0&&($=et),L+=S,Q=1<<(k=R-$);k+$<B&&!((Q-=X[k+$])<=0);)k++,Q<<=1;if(lt+=1<<k,d===1&&852<lt||d===2&&592<lt)return 1;v[y=H&D]=et<<24|k<<16|L-g|0}}return H!==0&&(v[L+H]=R-$<<24|64<<16|0),c.bits=et,0}},{"../utils/common":41}],51:[function(e,n,r){n.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(e,n,r){var s=e("../utils/common"),o=0,a=1;function l(C){for(var z=C.length;0<=--z;)C[z]=0}var h=0,d=29,p=256,m=p+1+d,u=30,v=19,g=2*m+1,f=15,c=16,M=7,E=256,y=16,D=17,L=18,P=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],N=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],b=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],T=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],F=new Array(2*(m+2));l(F);var R=new Array(2*u);l(R);var U=new Array(512);l(U);var S=new Array(256);l(S);var B=new Array(d);l(B);var et,k,$,Q=new Array(u);function lt(C,z,tt,w,x){this.static_tree=C,this.extra_bits=z,this.extra_base=tt,this.elems=w,this.max_length=x,this.has_stree=C&&C.length}function H(C,z){this.dyn_tree=C,this.max_code=0,this.stat_desc=z}function W(C){return C<256?U[C]:U[256+(C>>>7)]}function _t(C,z){C.pending_buf[C.pending++]=255&z,C.pending_buf[C.pending++]=z>>>8&255}function X(C,z,tt){C.bi_valid>c-tt?(C.bi_buf|=z<<C.bi_valid&65535,_t(C,C.bi_buf),C.bi_buf=z>>c-C.bi_valid,C.bi_valid+=tt-c):(C.bi_buf|=z<<C.bi_valid&65535,C.bi_valid+=tt)}function J(C,z,tt){X(C,tt[2*z],tt[2*z+1])}function mt(C,z){for(var tt=0;tt|=1&C,C>>>=1,tt<<=1,0<--z;);return tt>>>1}function ut(C,z,tt){var w,x,O=new Array(f+1),j=0;for(w=1;w<=f;w++)O[w]=j=j+tt[w-1]<<1;for(x=0;x<=z;x++){var V=C[2*x+1];V!==0&&(C[2*x]=mt(O[V]++,V))}}function pt(C){var z;for(z=0;z<m;z++)C.dyn_ltree[2*z]=0;for(z=0;z<u;z++)C.dyn_dtree[2*z]=0;for(z=0;z<v;z++)C.bl_tree[2*z]=0;C.dyn_ltree[2*E]=1,C.opt_len=C.static_len=0,C.last_lit=C.matches=0}function Mt(C){8<C.bi_valid?_t(C,C.bi_buf):0<C.bi_valid&&(C.pending_buf[C.pending++]=C.bi_buf),C.bi_buf=0,C.bi_valid=0}function Pt(C,z,tt,w){var x=2*z,O=2*tt;return C[x]<C[O]||C[x]===C[O]&&w[z]<=w[tt]}function It(C,z,tt){for(var w=C.heap[tt],x=tt<<1;x<=C.heap_len&&(x<C.heap_len&&Pt(z,C.heap[x+1],C.heap[x],C.depth)&&x++,!Pt(z,w,C.heap[x],C.depth));)C.heap[tt]=C.heap[x],tt=x,x<<=1;C.heap[tt]=w}function Ut(C,z,tt){var w,x,O,j,V=0;if(C.last_lit!==0)for(;w=C.pending_buf[C.d_buf+2*V]<<8|C.pending_buf[C.d_buf+2*V+1],x=C.pending_buf[C.l_buf+V],V++,w===0?J(C,x,z):(J(C,(O=S[x])+p+1,z),(j=P[O])!==0&&X(C,x-=B[O],j),J(C,O=W(--w),tt),(j=N[O])!==0&&X(C,w-=Q[O],j)),V<C.last_lit;);J(C,E,z)}function Wt(C,z){var tt,w,x,O=z.dyn_tree,j=z.stat_desc.static_tree,V=z.stat_desc.has_stree,K=z.stat_desc.elems,dt=-1;for(C.heap_len=0,C.heap_max=g,tt=0;tt<K;tt++)O[2*tt]!==0?(C.heap[++C.heap_len]=dt=tt,C.depth[tt]=0):O[2*tt+1]=0;for(;C.heap_len<2;)O[2*(x=C.heap[++C.heap_len]=dt<2?++dt:0)]=1,C.depth[x]=0,C.opt_len--,V&&(C.static_len-=j[2*x+1]);for(z.max_code=dt,tt=C.heap_len>>1;1<=tt;tt--)It(C,O,tt);for(x=K;tt=C.heap[1],C.heap[1]=C.heap[C.heap_len--],It(C,O,1),w=C.heap[1],C.heap[--C.heap_max]=tt,C.heap[--C.heap_max]=w,O[2*x]=O[2*tt]+O[2*w],C.depth[x]=(C.depth[tt]>=C.depth[w]?C.depth[tt]:C.depth[w])+1,O[2*tt+1]=O[2*w+1]=x,C.heap[1]=x++,It(C,O,1),2<=C.heap_len;);C.heap[--C.heap_max]=C.heap[1],(function(ct,gt){var Vt,ht,Tt,yt,Lt,wt,Nt=gt.dyn_tree,Ot=gt.max_code,$t=gt.stat_desc.static_tree,G=gt.stat_desc.has_stree,xt=gt.stat_desc.extra_bits,st=gt.stat_desc.extra_base,ot=gt.stat_desc.max_length,St=0;for(yt=0;yt<=f;yt++)ct.bl_count[yt]=0;for(Nt[2*ct.heap[ct.heap_max]+1]=0,Vt=ct.heap_max+1;Vt<g;Vt++)ot<(yt=Nt[2*Nt[2*(ht=ct.heap[Vt])+1]+1]+1)&&(yt=ot,St++),Nt[2*ht+1]=yt,Ot<ht||(ct.bl_count[yt]++,Lt=0,st<=ht&&(Lt=xt[ht-st]),wt=Nt[2*ht],ct.opt_len+=wt*(yt+Lt),G&&(ct.static_len+=wt*($t[2*ht+1]+Lt)));if(St!==0){do{for(yt=ot-1;ct.bl_count[yt]===0;)yt--;ct.bl_count[yt]--,ct.bl_count[yt+1]+=2,ct.bl_count[ot]--,St-=2}while(0<St);for(yt=ot;yt!==0;yt--)for(ht=ct.bl_count[yt];ht!==0;)Ot<(Tt=ct.heap[--Vt])||(Nt[2*Tt+1]!==yt&&(ct.opt_len+=(yt-Nt[2*Tt+1])*Nt[2*Tt],Nt[2*Tt+1]=yt),ht--)}})(C,z),ut(O,dt,C.bl_count)}function _(C,z,tt){var w,x,O=-1,j=z[1],V=0,K=7,dt=4;for(j===0&&(K=138,dt=3),z[2*(tt+1)+1]=65535,w=0;w<=tt;w++)x=j,j=z[2*(w+1)+1],++V<K&&x===j||(V<dt?C.bl_tree[2*x]+=V:x!==0?(x!==O&&C.bl_tree[2*x]++,C.bl_tree[2*y]++):V<=10?C.bl_tree[2*D]++:C.bl_tree[2*L]++,O=x,dt=(V=0)===j?(K=138,3):x===j?(K=6,3):(K=7,4))}function at(C,z,tt){var w,x,O=-1,j=z[1],V=0,K=7,dt=4;for(j===0&&(K=138,dt=3),w=0;w<=tt;w++)if(x=j,j=z[2*(w+1)+1],!(++V<K&&x===j)){if(V<dt)for(;J(C,x,C.bl_tree),--V!=0;);else x!==0?(x!==O&&(J(C,x,C.bl_tree),V--),J(C,y,C.bl_tree),X(C,V-3,2)):V<=10?(J(C,D,C.bl_tree),X(C,V-3,3)):(J(C,L,C.bl_tree),X(C,V-11,7));O=x,dt=(V=0)===j?(K=138,3):x===j?(K=6,3):(K=7,4)}}l(Q);var Z=!1;function I(C,z,tt,w){X(C,(h<<1)+(w?1:0),3),(function(x,O,j,V){Mt(x),_t(x,j),_t(x,~j),s.arraySet(x.pending_buf,x.window,O,j,x.pending),x.pending+=j})(C,z,tt)}r._tr_init=function(C){Z||((function(){var z,tt,w,x,O,j=new Array(f+1);for(x=w=0;x<d-1;x++)for(B[x]=w,z=0;z<1<<P[x];z++)S[w++]=x;for(S[w-1]=x,x=O=0;x<16;x++)for(Q[x]=O,z=0;z<1<<N[x];z++)U[O++]=x;for(O>>=7;x<u;x++)for(Q[x]=O<<7,z=0;z<1<<N[x]-7;z++)U[256+O++]=x;for(tt=0;tt<=f;tt++)j[tt]=0;for(z=0;z<=143;)F[2*z+1]=8,z++,j[8]++;for(;z<=255;)F[2*z+1]=9,z++,j[9]++;for(;z<=279;)F[2*z+1]=7,z++,j[7]++;for(;z<=287;)F[2*z+1]=8,z++,j[8]++;for(ut(F,m+1,j),z=0;z<u;z++)R[2*z+1]=5,R[2*z]=mt(z,5);et=new lt(F,P,p+1,m,f),k=new lt(R,N,0,u,f),$=new lt(new Array(0),b,0,v,M)})(),Z=!0),C.l_desc=new H(C.dyn_ltree,et),C.d_desc=new H(C.dyn_dtree,k),C.bl_desc=new H(C.bl_tree,$),C.bi_buf=0,C.bi_valid=0,pt(C)},r._tr_stored_block=I,r._tr_flush_block=function(C,z,tt,w){var x,O,j=0;0<C.level?(C.strm.data_type===2&&(C.strm.data_type=(function(V){var K,dt=4093624447;for(K=0;K<=31;K++,dt>>>=1)if(1&dt&&V.dyn_ltree[2*K]!==0)return o;if(V.dyn_ltree[18]!==0||V.dyn_ltree[20]!==0||V.dyn_ltree[26]!==0)return a;for(K=32;K<p;K++)if(V.dyn_ltree[2*K]!==0)return a;return o})(C)),Wt(C,C.l_desc),Wt(C,C.d_desc),j=(function(V){var K;for(_(V,V.dyn_ltree,V.l_desc.max_code),_(V,V.dyn_dtree,V.d_desc.max_code),Wt(V,V.bl_desc),K=v-1;3<=K&&V.bl_tree[2*T[K]+1]===0;K--);return V.opt_len+=3*(K+1)+5+5+4,K})(C),x=C.opt_len+3+7>>>3,(O=C.static_len+3+7>>>3)<=x&&(x=O)):x=O=tt+5,tt+4<=x&&z!==-1?I(C,z,tt,w):C.strategy===4||O===x?(X(C,2+(w?1:0),3),Ut(C,F,R)):(X(C,4+(w?1:0),3),(function(V,K,dt,ct){var gt;for(X(V,K-257,5),X(V,dt-1,5),X(V,ct-4,4),gt=0;gt<ct;gt++)X(V,V.bl_tree[2*T[gt]+1],3);at(V,V.dyn_ltree,K-1),at(V,V.dyn_dtree,dt-1)})(C,C.l_desc.max_code+1,C.d_desc.max_code+1,j+1),Ut(C,C.dyn_ltree,C.dyn_dtree)),pt(C),w&&Mt(C)},r._tr_tally=function(C,z,tt){return C.pending_buf[C.d_buf+2*C.last_lit]=z>>>8&255,C.pending_buf[C.d_buf+2*C.last_lit+1]=255&z,C.pending_buf[C.l_buf+C.last_lit]=255&tt,C.last_lit++,z===0?C.dyn_ltree[2*tt]++:(C.matches++,z--,C.dyn_ltree[2*(S[tt]+p+1)]++,C.dyn_dtree[2*W(z)]++),C.last_lit===C.lit_bufsize-1},r._tr_align=function(C){X(C,2,3),J(C,E,F),(function(z){z.bi_valid===16?(_t(z,z.bi_buf),z.bi_buf=0,z.bi_valid=0):8<=z.bi_valid&&(z.pending_buf[z.pending++]=255&z.bi_buf,z.bi_buf>>=8,z.bi_valid-=8)})(C)}},{"../utils/common":41}],53:[function(e,n,r){n.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(e,n,r){(function(s){(function(o,a){if(!o.setImmediate){var l,h,d,p,m=1,u={},v=!1,g=o.document,f=Object.getPrototypeOf&&Object.getPrototypeOf(o);f=f&&f.setTimeout?f:o,l={}.toString.call(o.process)==="[object process]"?function(y){process.nextTick(function(){M(y)})}:(function(){if(o.postMessage&&!o.importScripts){var y=!0,D=o.onmessage;return o.onmessage=function(){y=!1},o.postMessage("","*"),o.onmessage=D,y}})()?(p="setImmediate$"+Math.random()+"$",o.addEventListener?o.addEventListener("message",E,!1):o.attachEvent("onmessage",E),function(y){o.postMessage(p+y,"*")}):o.MessageChannel?((d=new MessageChannel).port1.onmessage=function(y){M(y.data)},function(y){d.port2.postMessage(y)}):g&&"onreadystatechange"in g.createElement("script")?(h=g.documentElement,function(y){var D=g.createElement("script");D.onreadystatechange=function(){M(y),D.onreadystatechange=null,h.removeChild(D),D=null},h.appendChild(D)}):function(y){setTimeout(M,0,y)},f.setImmediate=function(y){typeof y!="function"&&(y=new Function(""+y));for(var D=new Array(arguments.length-1),L=0;L<D.length;L++)D[L]=arguments[L+1];var P={callback:y,args:D};return u[m]=P,l(m),m++},f.clearImmediate=c}function c(y){delete u[y]}function M(y){if(v)setTimeout(M,0,y);else{var D=u[y];if(D){v=!0;try{(function(L){var P=L.callback,N=L.args;switch(N.length){case 0:P();break;case 1:P(N[0]);break;case 2:P(N[0],N[1]);break;case 3:P(N[0],N[1],N[2]);break;default:P.apply(a,N)}})(D)}finally{c(y),v=!1}}}}function E(y){y.source===o&&typeof y.data=="string"&&y.data.indexOf(p)===0&&M(+y.data.slice(p.length))}})(typeof self>"u"?s===void 0?this:s:self)}).call(this,typeof ir<"u"?ir:typeof self<"u"?self:typeof window<"u"?window:{})},{}]},{},[10])(10)})})($r)),$r.exports}var Pp=Cp();const Dp=Rp(Pp);async function Lp(i){const t=await Dp.loadAsync(i),e=await Ip(t,"version.txt"),n=await Up(t),r=Np(n),s=Op(r),o=Bp(r);return{version:e.trim(),projectName:s,sceneObjects:o}}async function Ip(i,t){const e=i.file(t);return e?e.async("string"):""}async function Up(i){const t=i.file("programType.xml");if(!t)throw new Error("No programType.xml found in .a3p archive");const e=await t.async("uint8array");if(e.length>=2){if(e[0]===254&&e[1]===255)return Jr(e,!0);if(e[0]===255&&e[1]===254)return Jr(e,!1);if(e[0]===0||e[1]===0){const n=e[0]===0;return Jr(e,n)}}return new TextDecoder("utf-8").decode(e)}function Jr(i,t){const e=t?"utf-16be":"utf-16le";return new TextDecoder(e).decode(i)}function Np(i){if(typeof DOMParser<"u")return new DOMParser().parseFromString(i,"application/xml");throw new Error("DOMParser not available – run in a browser or polyfill it")}function Fp(i){const t=new Map,e=i.getElementsByTagName("node");for(let n=0;n<e.length;n++){const r=e[n],s=r.getAttribute("key");s&&(r.getAttribute("type")||r.childNodes.length>0)&&(t.has(s)||t.set(s,r))}return t}function On(i,t){const e=i.getAttribute("key");return!e||i.getAttribute("type")||i.childNodes.length>0?i:t.get(e)??i}function Op(i){const t=i.documentElement;return t.tagName!=="node"?"Unknown":wi(t,"name")??"Unknown"}function Bp(i){const t=[],e=i.documentElement,n=Fp(e),r=zp(e,n);if(!r)return t;const s=kp(r,"fields",n);for(const o of s){const a=Hp(o,n);a&&t.push(a)}return Gp(r,t,n),t}function zp(i,t){const e=i.getElementsByTagName("node");for(let n=0;n<e.length;n++){const r=e[n];if(r.getAttribute("type")!=="org.lgna.project.ast.NamedUserType")continue;const s=Qo(r,t);if(s&&s.includes("SScene"))return r}return null}function Qo(i,t){const e=an(i,"superType");if(!e)return null;let n=Be(e,"node");if(!n)return null;n=On(n,t);const r=Be(n,"type");return(r==null?void 0:r.getAttribute("name"))??null}function wi(i,t){var r;const e=an(i,t);if(!e)return null;const n=Be(e,"value");return((r=n==null?void 0:n.textContent)==null?void 0:r.trim())??null}function an(i,t){for(let e=0;e<i.childNodes.length;e++){const n=i.childNodes[e];if(n.nodeType===1&&n.tagName==="property"&&n.getAttribute("name")===t)return n}return null}function Be(i,t){for(let e=0;e<i.childNodes.length;e++){const n=i.childNodes[e];if(n.nodeType===1&&n.tagName===t)return n}return null}function kp(i,t,e){const n=an(i,t);if(!n)return[];const r=Be(n,"collection");if(!r)return[];const s=[];for(let o=0;o<r.childNodes.length;o++){const a=r.childNodes[o];a.nodeType===1&&a.tagName==="node"&&s.push(On(a,e))}return s}function Hp(i,t){const e=wi(i,"name");if(!e)return null;let n="unknown";const r=an(i,"valueType");if(r){let a=Be(r,"node");if(a){a=On(a,t);const l=Be(a,"type");if(l)n=l.getAttribute("name")??"unknown";else{const h=wi(a,"name");n=Qo(a,t)??`User:${h??"unknown"}`}}}let s=null;const o=an(i,"initializer");if(o){let a=Be(o,"node");if(a){a=On(a,t);const l=a.getElementsByTagName("resourceReference");l.length>0&&(s=l[0].getAttribute("name")??null)}}return{name:e,typeName:n,resourceType:s,position:null,orientation:null,size:null}}function Gp(i,t,e){const n=new Map;for(const s of t)n.set(s.name,s);const r=i.getElementsByTagName("node");for(let s=0;s<r.length;s++){const o=r[s];if(o.getAttribute("type")!=="org.lgna.project.ast.MethodInvocation")continue;const a=an(o,"method");if(!a)continue;let l=Be(a,"node");if(!l)continue;l=On(l,e);const h=Be(l,"method");if(!h)continue;const d=h.getAttribute("name")??"",p=an(o,"expression"),m=Vp(p,e);if(!m)continue;const u=n.get(m);if(!u)continue;const v=Wp(o);d==="setPositionRelativeToVehicle"&&v.length>=3?u.position={x:v[0],y:v[1],z:v[2]}:d==="setOrientationRelativeToVehicle"&&v.length>=4?u.orientation={x:v[0],y:v[1],z:v[2],w:v[3]}:d==="setSize"&&v.length>=3&&(u.size={width:v[0],height:v[1],depth:v[2]})}}function Vp(i,t){if(!i)return null;let e=Be(i,"node");if(!e||(e=On(e,t),e.getAttribute("type")!=="org.lgna.project.ast.FieldAccess"))return null;const n=an(e,"field");if(!n)return null;let r=Be(n,"node");return r?(r=On(r,t),wi(r,"name")):null}function Wp(i){const t=[],e=an(i,"requiredArguments");if(!e)return t;const n=e.getElementsByTagName("node");for(let r=0;r<n.length;r++){const s=n[r];if(s.getAttribute("type")==="org.lgna.project.ast.DoubleLiteral"){const o=wi(s,"value");o!==null&&t.push(parseFloat(o))}}return t}const Xp={"org.lgna.story.SGround":4881471},Yp=11887901,qp=13399842,jp=8947916;function Zp(i){const t=new lp;t.background=new qt(8900331);const e=new fp(16777215,.5);t.add(e);const n=new up(16777215,.8);n.position.set(5,10,7),n.castShadow=!0,t.add(n);const r=new Re(60,window.innerWidth/window.innerHeight,.1,1e3);r.position.set(0,5,20),r.lookAt(0,0,0);for(const s of i.sceneObjects){const o=Kp(s);o&&t.add(o)}return{scene:t,camera:r}}function Kp(i){const t=i.typeName;return t.includes("SGround")?$p(i):t.includes("SCamera")?null:t.includes("SProp")||t.includes("SModel")||t.includes("SJointedModel")?Jp(i):Qp(i)}function $p(i){const t=new Di(200,200),e=new ta({color:Xp["org.lgna.story.SGround"]}),n=new Ce(t,e);return n.rotation.x=-Math.PI/2,n.receiveShadow=!0,n.name=i.name,n}function Jp(i){var l,h,d;const t=((l=i.size)==null?void 0:l.width)??1,e=((h=i.size)==null?void 0:h.height)??1,n=((d=i.size)==null?void 0:d.depth)??1,r=new pi(t,e,n),s=i.typeName.includes("SProp")?Yp:qp,o=new ta({color:s}),a=new Ce(r,o);return a.castShadow=!0,tl(a,i),a.name=i.name,a}function Qp(i){const t=new Qs(.5,16,16),e=new ta({color:jp}),n=new Ce(t,e);return n.castShadow=!0,tl(n,i),n.name=i.name,n}function tl(i,t){t.position&&i.position.set(t.position.x,t.position.y,t.position.z),t.orientation&&i.quaternion.set(t.orientation.x,t.orientation.y,t.orientation.z,t.orientation.w)}const _o=document.getElementById("file-input"),go=document.getElementById("object-list"),Qr=document.getElementById("status"),pr=document.getElementById("viewport"),vr=new op({canvas:pr,antialias:!0});vr.setPixelRatio(window.devicePixelRatio);vr.shadowMap.enabled=!0;na();let Hs=null,ai=null,Qe=null;function na(){const i=pr.clientWidth,t=pr.clientHeight;vr.setSize(i,t,!1),ai&&(ai.aspect=i/t,ai.updateProjectionMatrix())}window.addEventListener("resize",na);function el(){requestAnimationFrame(el),Qe==null||Qe.update(),Hs&&ai&&vr.render(Hs,ai)}el();_o.addEventListener("change",async()=>{var t;const i=(t=_o.files)==null?void 0:t[0];if(i){Qr.textContent=`Loading ${i.name}…`,go.innerHTML="";try{const e=await i.arrayBuffer(),n=await Lp(e);Qr.textContent=`Loaded "${n.projectName}" (v${n.version}) – ${n.sceneObjects.length} objects`;for(const o of n.sceneObjects){const a=document.createElement("li"),l=o.typeName.split(".").pop()??o.typeName;if(a.textContent=`${o.name} (${l})`,o.resourceType){const h=document.createElement("small");h.textContent=` [${o.resourceType.split(".").pop()}]`,a.appendChild(h)}go.appendChild(a)}const{scene:r,camera:s}=Zp(n);Hs=r,ai=s,na(),Qe==null||Qe.dispose(),Qe=new mp(s,pr),Qe.enableDamping=!0,Qe.target.set(0,1,0)}catch(e){Qr.textContent=`Error: ${e instanceof Error?e.message:String(e)}`,console.error(e)}}});
