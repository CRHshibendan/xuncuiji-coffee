/* ===== 寻萃集 · SVG 器具插画库 ===== */
// 高保真 SVG 咖啡器具插画，支持皮肤换色
// 所有插画尺寸统一为 viewBox 0 0 200 200，通过 CSS 缩放

// Exact lower-glass contour, so liquid stays inside even while SVG clips are refreshed.
function lowerGlassContour(curves,center,top){
  const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  function split(c,t){const a=lerp(c[0],c[1],t),b=lerp(c[1],c[2],t),d=lerp(c[2],c[3],t),e=lerp(a,b,t),f=lerp(b,d,t);return[lerp(e,f,t),f,d,c[3]];}
  const index=Math.max(0,curves.findIndex(c=>top<=c[3][1])),c=curves[index];let low=0,high=1;
  for(let i=0;i<32;i++){const mid=(low+high)/2;if(split(c,mid)[0][1]<top)low=mid;else high=mid;}
  const lower=[split(c,(low+high)/2),...curves.slice(index+1)],point=lower[0][0];
  const pair=p=>p.map(v=>Number(v.toFixed(5))).join(' '),mirror=p=>[center*2-p[0],p[1]];
  let d='M'+pair(point);for(const curve of lower)d+='C'+curve.slice(1).map(pair).join(' ');
  for(const curve of [...lower].reverse())d+='C'+[curve[2],curve[1],curve[0]].map(p=>pair(mirror(p))).join(' ');
  return {d:d+'Z',radius:center-point[0]};
}
function serverLiquidContour(top){return lowerGlassContour([[[189,326],[164,358],[145,390],[151,428]],[[151,428],[159,477],[204,500],[310,500]]],310,top);}
function chemexLiquidContour(top){return lowerGlassContour([[[265,342],[230,391],[170,436],[166,493]],[[166,493],[162,541],[198,565],[320,565]]],320,top);}

const SVGTools = {
  // 滤杯：type='melitta'（梯形陶瓷）或 'chemex'（玻璃漏斗+木领）
  dripper(color = '#FF7043', type = 'melitta', level = 0, opts = {}) {
    if (type === 'chemex') return this.chemexDripper(color, level, opts);
    return this.melittaDripper(color);
  },

  melittaDripper(color) {
    return `<svg viewBox="0 0 640 640" class="svg-tool" fill="none">
  <g stroke="#493F36" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <g id="handle">
      <path d="M464 237C503 219 550 235 553 275C556 316 517 355 463 362L451 331C492 326 520 302 518 279C517 257 495 255 475 269Z" fill="#EEEAE1"/>
    </g>
    <g id="base">
      <path d="M195 445V460C195 480 445 480 445 460V445Z" fill="#E3DED3"/>
      <ellipse cx="320" cy="445" rx="125" ry="22" fill="#F8F5EF"/>
      <path d="M276 411V441C289 452 351 452 364 441V411" fill="#F5F1E8"/>
    </g>
    <g id="body">
      <path d="M130 185L241 411C250 431 390 431 399 411L510 185Z" fill="#F8F5EF"/>
    </g>
    <g id="rim">
      <ellipse cx="320" cy="185" rx="190" ry="65" fill="#FFFCF7"/>
      <ellipse cx="320" cy="185" rx="172" ry="49" fill="#E9E4DA" stroke="#A99C8C" stroke-width="3"/>
      <path d="M179 204L268 220M226 223L291 230M290 233L309 236M350 233L331 236M414 223L349 230M461 204L372 220" stroke="#B9AD9D" stroke-width="2.5"/>
      <path d="M197 160C260 135 378 135 442 159" stroke="#FFFFFF" stroke-width="6"/>
    </g>
    <g id="details" stroke="#A99C8C" stroke-width="2.5">
      <path d="M282 454C305 457 335 457 358 454"/>
      <path d="M260 394C270 402 370 402 380 394"/>
    </g>
  </g>
</svg>`;
  },

  // Chemex 完整沙漏壶（玻璃漏斗+木领+皮绳+下壶），可含咖啡液、滤纸、粉层
  chemexDripper(color, level = 0, opts = {}) {
    const { showFilter = false, showGrounds = false } = opts;
    const glass = 'rgba(220, 240, 255, 0.36)';
    const glassEdge = 'rgba(140, 180, 210, 0.7)';
    const wood = '#C69A62';
    const woodDark = '#967044';
    const woodLight = '#E4C398';
    const fillH = 215 * Math.max(0, Math.min(Number(level) || 0, 100)) / 100;
    const coffeeTop = 565 - fillH;
    const liquidContour = chemexLiquidContour(coffeeTop);
    const surfaceLift = Math.min(5, fillH * .25), surfaceDepth = Math.min(8, fillH);
    const bodyPath = 'M166 145C183 191 228 240 268 286C282 303 280 321 265 342C230 391 170 436 166 493C162 541 198 565 320 565C442 565 478 541 474 493C470 436 410 391 375 342C360 321 358 303 372 286C412 240 457 191 474 145Z';
    return `<svg viewBox="0 0 640 640" class="svg-tool">
      <defs>
        <linearGradient id="cheCoffee" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#8D6E63"/>
          <stop offset="100%" stop-color="#3E2723"/>
        </linearGradient>
        <clipPath id="cheBodyClip"><path d="${bodyPath}"/></clipPath>
      </defs>
      <g stroke="#493F36" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <g id="glass-body">
          <path d="${bodyPath}" fill="${glass}" fill-opacity="0.36"/>
          <path d="M188 164C214 212 246 251 280 286M452 164C426 212 394 251 360 286" stroke="#B6C7C2" stroke-width="3"/>
          <!-- 咖啡液（裁剪在壶身内） -->
          ${fillH > 0 ? `<g clip-path="url(#cheBodyClip)">
            <path class="chemex-liquid-fill" d="${liquidContour.d}" fill="url(#cheCoffee) #8D6E63" stroke="none"/>
            <path class="chemex-liquid-surface" d="M${320-liquidContour.radius} ${coffeeTop}Q320 ${coffeeTop-surfaceLift} ${320+liquidContour.radius} ${coffeeTop}Q320 ${coffeeTop+surfaceDepth} ${320-liquidContour.radius} ${coffeeTop}Z" fill="#6D4C41" opacity="0.45" stroke="none"/>
          </g>` : ''}
          <path d="M267 365C229 411 198 450 194 487C190 512 201 526 225 535" stroke="#FFFFFF" stroke-width="10"/>
          <path d="M398 400C424 431 446 462 448 491" stroke="#BBCBC5" stroke-width="3"/>
          <path d="M201 542C254 557 387 557 439 542" stroke="#AEBFB8" stroke-width="3"/>
          <path d="M416 467H432M422 492H438" stroke="#9FAEA7" stroke-width="3"/>
        </g>
        <!-- 滤纸（上壶漏斗内） -->
        ${showFilter ? `<g id="filter" opacity="0.92">
          <path d="M190 160C215 205 245 240 278 272C296 289 296 305 278 322C242 360 210 395 205 430 L435 430C430 395 398 360 362 322C344 305 344 289 362 272C395 240 425 205 450 160 Z" fill="#FFFEF7" stroke="#D8CFBC" stroke-width="2"/>
          <path d="M320 165 L320 425" stroke="#C8BEA8" stroke-width="1.2" stroke-dasharray="3 4"/>
        </g>` : ''}
        <!-- 咖啡粉层 -->
        ${showGrounds ? `<g id="grounds" clip-path="url(#cheBodyClip)">
          <ellipse cx="320" cy="230" rx="100" ry="14" fill="#5D4037"/>
          <ellipse cx="320" cy="226" rx="92" ry="10" fill="#6D4C41"/>
        </g>` : ''}
        <g id="rim-and-spout">
          <path d="M474 145C474 119 404 99 320 99C235 99 166 119 166 145C166 171 235 191 320 191C389 191 446 178 468 158L494 132C483 132 478 137 474 145Z" fill="#F9FCFA" fill-opacity="0.85"/>
          <path d="M183 145C211 117 413 114 454 143C429 166 370 176 320 176C261 176 210 165 183 145Z" fill="#E6EEEA" fill-opacity="0.65" stroke="#A7BAB0" stroke-width="2.5"/>
          <path d="M432 175C447 167 458 158 466 148" stroke="#A7BAB0" stroke-width="2.5"/>
        </g>
        <g id="wood-collar">
          <path d="M258 280C291 290 349 290 382 280L374 303C368 321 373 339 383 356C348 367 292 367 257 356C267 339 272 321 266 303Z" fill="${wood}"/>
          <path d="M320 289V363" stroke="${woodDark}" stroke-width="3"/>
          <g stroke="#A87D4B" stroke-width="2">
            <path d="M278 299C291 303 302 304 309 304M332 304C343 304 352 303 363 300"/>
            <path d="M275 342C289 347 299 347 309 348M332 348C343 348 353 347 365 343"/>
          </g>
          <path d="M272 291C295 296 306 296 311 296" stroke="${woodLight}" stroke-width="3"/>
        </g>
        <g id="leather-tie" stroke="#684832" stroke-width="4">
          <path d="M263 317C299 325 342 325 377 317"/>
          <path d="M263 325C299 333 342 333 377 325"/>
          <path d="M326 328C346 345 357 365 357 391C358 409 366 421 376 427M321 332C324 360 316 379 321 396C326 414 321 430 311 439"/>
          <path d="M317 323C308 302 293 300 289 308C285 319 300 326 317 323ZM325 323C336 302 352 302 354 312C356 323 340 328 325 323Z" fill="#DAC2A5" stroke-width="3"/>
          <ellipse cx="322" cy="328" rx="11" ry="14" fill="#AC794B" stroke-width="3"/>
        </g>
      </g>
    </svg>`;
  },

  // 滤纸（适配梯形滤杯）
  filter() {
    return `<svg viewBox="0 0 200 200" class="svg-tool" style="opacity:0.93">
      <defs>
        <linearGradient id="filtPaper" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFEF7"/>
          <stop offset="100%" stop-color="#F5EFE0"/>
        </linearGradient>
      </defs>
      <path d="M56 38 L144 38 L132 145 L68 145 Z" fill="url(#filtPaper)" stroke="#D8CFBC" stroke-width="1.5"/>
      <!-- 滤纸接缝 -->
      <path d="M100 41 L100 143" stroke="#C8BEA8" stroke-width="1" stroke-dasharray="2 3"/>
      <!-- 纸纹 -->
      <g stroke="#E8E0D0" stroke-width="0.6" opacity="0.5">
        <path d="M68 55 Q100 57 132 55" fill="none"/>
        <path d="M70 75 Q100 77 130 75" fill="none"/>
        <path d="M72 95 Q100 97 128 95" fill="none"/>
        <path d="M74 115 Q100 117 126 115" fill="none"/>
      </g>
    </svg>`;
  },

  // 咖啡粉层
  grounds(height = 30) {
    return `<svg viewBox="0 0 200 200" class="svg-tool">
      <defs>
        <linearGradient id="grdTop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#6D4C41"/>
          <stop offset="100%" stop-color="#4E342E"/>
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="${148 - height}" rx="38" ry="6" fill="#3E2723"/>
      <path d="M62 ${148 - height} Q100 ${153 - height} 138 ${148 - height} L132 148 Q100 154 68 148 Z" fill="url(#grdTop)"/>
      <ellipse cx="100" cy="${148 - height}" rx="36" ry="3.5" fill="#8D6E63" opacity="0.5"/>
    </svg>`;
  },

  // 细嘴手冲壶（鹅颈壶）
  // 鹅颈手冲壶（含温度显示、沸腾蒸汽）
  kettle(temp = 20, boiling = false) {
    const tempColor = temp >= 90 ? '#FF5252' : temp >= 70 ? '#FFA726' : '#66BB6A';
    return `<svg viewBox="0 0 640 640" class="svg-tool">
      <defs>
        <linearGradient id="ketBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#90A4AE"/>
          <stop offset="50%" stop-color="#607D8B"/>
          <stop offset="100%" stop-color="#455A64"/>
        </linearGradient>
      </defs>
      <g stroke="#493F36" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- 把手 -->
        <g id="handle"><path d="M420 249C496 216 535 244 533 307C531 367 489 402 431 392L428 361C469 369 501 342 502 304C504 267 482 253 433 280Z" fill="#6F7C78"/></g>
        <!-- 鹅颈壶嘴 -->
        <g id="spout"><path d="M211 388C149 383 134 353 128 309C119 250 121 207 93 178L68 155L83 145C132 175 145 220 151 279C156 330 167 343 221 344Z" fill="#DCE4DB"/><path d="M79 151L101 174" stroke="#A8B7AA" stroke-width="3"/><path d="M138 295C144 351 159 361 202 368" stroke="#FFF" stroke-width="5"/></g>
        <!-- 壶身 -->
        <g id="body"><path d="M240 244C210 284 193 364 187 436C185 465 218 486 322 486C426 486 459 465 457 436C451 364 434 284 404 244Z" fill="#DCE4DB"/><ellipse cx="322" cy="244" rx="82" ry="23" fill="#ACBBAE"/><path d="M223 320C211 364 207 405 207 435" stroke="#FFF" stroke-width="10"/><path d="M214 464C266 479 380 479 430 464" stroke="#A6B3A5" stroke-width="3"/></g>
        <!-- 壶盖 -->
        <g id="lid"><path d="M239 238C245 207 399 207 405 238C374 251 270 251 239 238Z" fill="#EEF1E8"/><path d="M299 214V196C299 181 345 181 345 196V214Z" fill="#C69A62"/><path d="M306 192C315 188 332 188 338 192" stroke="#E5C69D" stroke-width="3"/></g>
        <!-- 温度显示屏 -->
        <rect x="258" y="300" width="128" height="44" rx="8" fill="#0D3110" stroke="#000" stroke-width="2.5"/>
        <rect x="262" y="304" width="120" height="36" rx="5" fill="#1B5E20"/>
        <text x="322" y="330" text-anchor="middle" font-family="'Courier New', monospace" font-size="22" font-weight="bold" fill="${tempColor}">${temp}°C</text>
        ${boiling ? `
        <g>
          <ellipse cx="160" cy="130" rx="6" ry="16" fill="#fff" opacity="0.5">
            <animate attributeName="cy" values="140;90;140" dur="1.1s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0;0.5" dur="1.1s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="200" cy="125" rx="5" ry="14" fill="#fff" opacity="0.4">
            <animate attributeName="cy" values="135;85;135" dur="0.9s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;0;0.4" dur="0.9s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="240" cy="132" rx="6" ry="15" fill="#fff" opacity="0.45">
            <animate attributeName="cy" values="142;92;142" dur="1.3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.45;0;0.45" dur="1.3s" repeatCount="indefinite"/>
          </ellipse>
        </g>` : ''}
      </g>
    </svg>`;
  },

  // 电子秤（显示屏实时重量）
  scale(weight = 0) {
    return `<svg viewBox="0 0 640 640" class="svg-tool">
      <g stroke="#493F36" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <g id="feet" fill="#6F7C78"><path d="M149 442V463H199V446M441 446V463H491V442"/></g>
        <g id="body"><path d="M114 382H526V425C526 443 512 452 494 452H146C128 452 114 443 114 425Z" fill="#AAB7AA"/><path d="M149 177H491L526 382C530 402 519 414 500 414H140C121 414 110 402 114 382Z" fill="#DDE5DA"/><path d="M134 423H506" stroke="#849582" stroke-width="3"/></g>
        <g id="weighing-platform"><path d="M166 193H474L491 301C492 313 484 320 471 320H169C156 320 148 313 149 301Z" fill="#7B8B7D"/><path d="M176 207H464L477 300H163Z" fill="#91A18F" stroke="#AEBCA8" stroke-width="2.5"/><path d="M184 217H454" stroke="#C3CFB9" stroke-width="3"/></g>
        <g id="display"><rect x="178" y="342" width="284" height="49" rx="8" fill="#56685B"/>
          <text x="320" y="376" text-anchor="middle" font-family="'Courier New', monospace" font-size="30" font-weight="bold" fill="#DDEACD">${weight.toFixed(1)}g</text>
          <path d="M320 351V380" stroke="#94A58A" stroke-width="2"/>
        </g>
        <g id="controls"><circle cx="145" cy="367" r="13" fill="#F7F6EC"/><path d="M145 357V365M139 361A9 9 0 1 0 151 361" stroke="#697A66" stroke-width="2"/><circle cx="495" cy="367" r="13" fill="#C69A62"/><path d="M489 362H501M495 362V373" stroke="#785A3E" stroke-width="2"/></g>
      </g>
    </svg>`;
  },

  // 咖啡豆
  beans() {
    return `<svg viewBox="0 0 200 200" class="svg-tool">
      <defs>
        <radialGradient id="beanA" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#A1887F"/>
          <stop offset="55%" stop-color="#5D4037"/>
          <stop offset="100%" stop-color="#2E1A12"/>
        </radialGradient>
        <radialGradient id="beanB" cx="40%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#8D6E63"/>
          <stop offset="55%" stop-color="#4E342E"/>
          <stop offset="100%" stop-color="#1A0E08"/>
        </radialGradient>
      </defs>
      <ellipse cx="72" cy="105" rx="30" ry="38" fill="url(#beanA)" transform="rotate(-22 72 105)"/>
      <path d="M58 73 Q72 105 58 137" fill="none" stroke="#1A0E08" stroke-width="2.5" stroke-linecap="round" transform="rotate(-22 72 105)"/>
      <ellipse cx="128" cy="112" rx="26" ry="34" fill="url(#beanB)" transform="rotate(18 128 112)"/>
      <path d="M116 82 Q128 112 116 142" fill="none" stroke="#1A0E08" stroke-width="2.5" stroke-linecap="round" transform="rotate(18 128 112)"/>
      <ellipse cx="100" cy="62" rx="22" ry="28" fill="url(#beanA)" transform="rotate(-8 100 62)" opacity="0.92"/>
      <path d="M89 38 Q100 62 89 86" fill="none" stroke="#1A0E08" stroke-width="2.2" stroke-linecap="round" transform="rotate(-8 100 62)"/>
      <!-- 高光 -->
      <ellipse cx="62" cy="88" rx="6" ry="10" fill="#D7CCC8" opacity="0.3" transform="rotate(-22 62 88)"/>
      <ellipse cx="118" cy="98" rx="5" ry="8" fill="#BCAAA4" opacity="0.25" transform="rotate(18 118 98)"/>
    </svg>`;
  },

  // 手摇磨豆机（摇柄可旋转，接粉杯内粉量随进度增长）
  grinder(progress = 0) {
    const fillH = Math.min(8 + progress * 12, 42);
    const fillTop = 493 - fillH;
    return `<svg viewBox="0 0 640 640" class="svg-tool">
      <g stroke="#493F36" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <g id="body"><path d="M239 254H401V434C401 454 239 454 239 434Z" fill="#D9E2D5"/><ellipse cx="320" cy="254" rx="81" ry="22" fill="#ADBDA8"/><path d="M258 287V412" stroke="#FFF" stroke-width="8"/><path d="M385 286V424" stroke="#A1B298" stroke-width="3"/></g>
        <g id="grip"><path d="M236 318C258 327 382 327 404 318V379C382 390 258 390 236 379Z" fill="#7D8C79"/><path d="M249 336V365M264 339V369M279 341V372M294 343V374M309 344V375M324 344V375M339 343V374M354 342V372M369 340V369M384 337V365" stroke="#A5B39A" stroke-width="2"/></g>
        <!-- 接粉杯（含咖啡粉） -->
        <g id="grounds-cup"><path d="M239 435C258 446 382 446 401 435V493C401 521 239 521 239 493Z" fill="#C69A62"/><path d="M251 450C282 457 358 457 389 450M255 496C281 503 358 503 385 496" stroke="#A57C4D" stroke-width="2.5"/><path d="M258 464V483" stroke="#E8CBA4" stroke-width="5"/>
          ${progress > 0 ? `<clipPath id="grCupClip"><path d="M251 450C282 457 358 457 389 450L396 490C370 500 270 500 244 490Z"/></clipPath>
          <g clip-path="url(#grCupClip)"><rect x="244" y="${fillTop}" width="152" height="${fillH + 8}" fill="#5D4037"/><ellipse cx="320" cy="${fillTop}" rx="70" ry="8" fill="#6D4C41"/></g>` : ''}
        </g>
        <g id="lid"><path d="M238 247C246 220 394 220 402 247V256C371 269 269 269 238 256Z" fill="#EEF1E6"/><path d="M311 224V194H329V224" fill="#93A58B"/></g>
        <!-- 摇柄（可旋转） -->
        <g id="crank" class="grinder-handle-svg"><path d="M311 196V171C311 160 319 155 329 155H462V171H331V196Z" fill="#BDCBB5"/><path d="M452 162V137" stroke="#6F7C78" stroke-width="9"/><path d="M430 136C420 129 421 108 430 101C439 94 473 94 482 101C491 108 492 129 482 136C473 143 439 143 430 136Z" fill="#C69A62"/><path d="M434 105C445 101 467 101 478 105" stroke="#E5C69D" stroke-width="3"/></g>
      </g>
    </svg>`;
  },

  // 云朵咖啡分享壶（玻璃，带导流嘴、弧形把手、刻度，咖啡水位动态）
  server(level = 0, opts = {}) {
    const showLid = opts.showLid !== false;
    const fillH = 95 * Math.max(0, Math.min(Number(level) || 0, 100)) / 100;
    const coffeeTop = 485 - fillH;
    const liquidContour = serverLiquidContour(coffeeTop);
    return `<svg viewBox="0 0 640 640" class="svg-tool">
      <defs>
        <clipPath id="csGlassClip"><path d="M229 211C232 255 215 292 189 326C164 358 145 390 151 428C159 477 204 500 310 500C416 500 461 477 469 428C475 390 456 358 431 326C405 292 388 255 391 211Z"/></clipPath>
      </defs>
      <g stroke="#493F36" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- 把手 -->
        <g id="handle">
          <path d="M403 242C465 215 517 231 522 280C528 333 492 382 427 392L418 363C464 354 494 323 490 286C487 256 456 252 414 274Z" fill="#E4ECE7" fill-opacity=".65"/>
          <path d="M438 252C479 242 506 257 506 286" stroke="#FFF" stroke-width="5"/>
        </g>
        <!-- 玻璃壶身 -->
        <g id="glass-body">
          <path d="M229 211C232 255 215 292 189 326C164 358 145 390 151 428C159 477 204 500 310 500C416 500 461 477 469 428C475 390 456 358 431 326C405 292 388 255 391 211Z" fill="#EAF1ED" fill-opacity=".4"/>
          <path d="M244 240C241 279 224 308 203 338" stroke="#BDCEC3" stroke-width="3"/>
          <path d="M201 355C180 383 175 405 180 427C183 442 193 454 207 461" stroke="#FFF" stroke-width="10"/>
          <path d="M411 343C430 368 443 392 444 412" stroke="#B6C8BC" stroke-width="3"/>
          <path d="M191 475C248 493 373 493 431 475" stroke="#ADBEAF" stroke-width="3"/>
        </g>
        <!-- 咖啡液（裁剪在壶身内） -->
        ${fillH > 0 ? `<g clip-path="url(#csGlassClip)">
          <path class="server-liquid-fill" d="${liquidContour.d}" fill="#A8815C" fill-opacity=".7" stroke="none"/>
          <path class="server-liquid-surface" d="M${310-liquidContour.radius} ${coffeeTop}Q310 ${coffeeTop-5} ${310+liquidContour.radius} ${coffeeTop}Q310 ${coffeeTop+8} ${310-liquidContour.radius} ${coffeeTop}Z" fill="#C6AD90" opacity="0.5" stroke="none"/>
        </g>` : ''}
        <!-- 杯口与导流嘴 -->
        <g id="rim-and-spout">
          <path d="M229 211C223 190 245 175 307 175C351 175 377 183 391 195L415 176L407 207C405 229 246 240 229 211Z" fill="#F8FBF8" fill-opacity=".8"/>
          <path d="M244 203C264 183 347 182 376 202C353 221 270 224 244 203Z" fill="#E2ECE5" fill-opacity=".65" stroke="#ADBEAF" stroke-width="2.5"/>
          <path d="M377 217L400 195" stroke="#ADBEAF" stroke-width="2.5"/>
        </g>
        <!-- 刻度线 -->
        <g id="measurement-marks" stroke="#93A993" stroke-width="3">
          <path d="M346 308H373"/>
          <path d="M349 337H366"/>
          <path d="M352 366H379"/>
        </g>
        ${showLid ? `<!-- 壶盖 -->
        <g id="lid">
          <path d="M239 170C252 155 366 155 379 170L374 184C354 197 264 197 244 184Z" fill="#7D8C79"/>
          <ellipse cx="309" cy="168" rx="70" ry="15" fill="#95A28D"/>
          <path d="M261 164C280 157 338 157 357 164" stroke="#BECAB3" stroke-width="3"/>
        </g>` : ''}
      </g>
    </svg>`;
  },

  // 法压壶（咖啡液水位、压杆位置动态）
  frenchPress(waterLevel = 0, pressPos = 0) {
    const h = 300 * Math.min(waterLevel, 100) / 100;
    const coffeeTop = 485 - h;
    const discY = 200 + pressPos * 4.5;
    return `<svg viewBox="0 0 640 640" class="svg-tool">
      <defs>
        <linearGradient id="fpCoffee" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#A1887F"/>
          <stop offset="100%" stop-color="#4E342E"/>
        </linearGradient>
        <clipPath id="fpGlassClip"><path d="M192 182H424V491C424 526 192 526 192 491Z"/></clipPath>
      </defs>
      <g stroke="#493F36" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <g id="handle"><path d="M421 210C491 203 512 239 512 296C512 357 483 394 422 391V361C463 360 481 334 481 296C481 258 469 239 422 240Z" fill="#6F7C78"/></g>
        <!-- 玻璃壶身 -->
        <g id="glass"><path d="M192 182H424V491C424 526 192 526 192 491Z" fill="#ECF1EE" fill-opacity=".45"/><ellipse cx="308" cy="182" rx="116" ry="24" fill="#E7EEEA"/><path d="M208 490C230 507 386 507 408 490" stroke="#A4B4AA" stroke-width="3"/><path d="M219 223V462" stroke="white" stroke-width="10"/></g>
        <!-- 咖啡液 -->
        ${h > 0 ? `<g clip-path="url(#fpGlassClip)"><rect x="192" y="${coffeeTop}" width="232" height="${h + 10}" fill="url(#fpCoffee)"/><ellipse cx="308" cy="${coffeeTop}" rx="112" ry="12" fill="#A1887F" opacity="0.5"/></g>` : ''}
        <!-- 压杆 -->
        <g id="plunger"><path d="M308 110V${discY}" stroke="#6F7C78" stroke-width="9"/><ellipse cx="308" cy="${discY}" rx="100" ry="16" fill="#AEB7AF"/><path d="M215 ${discY}H401M233 ${discY - 10}L245 ${discY + 10}M269 ${discY - 13}L281 ${discY + 14}M305 ${discY - 14}L317 ${discY + 16}M341 ${discY - 13}L353 ${discY + 13}M377 ${discY - 9}L389 ${discY + 8}" stroke="#7E8B82" stroke-width="2"/></g>
        <!-- 金属框架 -->
        <g id="frame" fill="#6F7C78"><path d="M188 189H201V497H188ZM415 189H428V497H415Z"/><path d="M183 491C236 502 379 502 434 491V513C382 527 235 527 183 513Z"/><path d="M190 171C195 149 421 149 426 171V187C373 202 242 202 190 187Z"/><ellipse cx="308" cy="169" rx="118" ry="24" fill="#89958E"/><path d="M284 139V121C284 96 332 96 332 121V139Z"/></g>
      </g>
    </svg>`;
  },

  // 摩卡壶（上壶咖啡液、加热火焰动态）
  mokaPot(coffeeLevel = 0, heating = false) {
    const h = 130 * Math.min(coffeeLevel, 100) / 100;
    const coffeeTop = 345 - h;
    return `<svg viewBox="0 0 640 640" class="svg-tool">
      <defs>
        <linearGradient id="mkCoffee" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#6D4C41"/>
          <stop offset="100%" stop-color="#2E1A12"/>
        </linearGradient>
        <clipPath id="mkUpperClip"><path d="M211 190L382 178L423 210L402 349L361 375H242L200 346Z"/></clipPath>
      </defs>
      ${heating ? `
      <ellipse cx="301" cy="560" rx="70" ry="16" fill="#FF6F00" opacity="0.55">
        <animate attributeName="opacity" values="0.35;0.7;0.35" dur="0.3s" repeatCount="indefinite"/>
      </ellipse>` : ''}
      <g stroke="#493F36" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <g id="handle"><path d="M426 198C493 177 521 194 521 233L504 326C499 351 479 364 448 360L443 332C461 336 473 327 475 311L490 235C493 217 481 213 444 225Z" fill="#6F7C78"/></g>
        <g id="upper-chamber"><path d="M211 190L382 178L423 210L402 349L361 375H242L200 346Z" fill="#E2E7E3"/><path d="M211 190L242 215H382L423 210M242 215L258 352L242 375M382 215L361 352V375M258 352H361" stroke="#95A59A" stroke-width="3"/><path d="M226 224L243 331" stroke="#FFF" stroke-width="9"/><path d="M201 227L153 207L182 286L204 300Z" fill="#CFD8D0"/></g>
        <!-- 上壶咖啡液 -->
        ${h > 0 ? `<g clip-path="url(#mkUpperClip)"><rect x="195" y="${coffeeTop}" width="235" height="${h + 12}" fill="url(#mkCoffee)"/><ellipse cx="305" cy="${coffeeTop}" rx="90" ry="10" fill="#8D6E63" opacity="0.6"/></g>` : ''}
        <g id="lid"><path d="M208 190L242 165H378L417 188L382 204H244Z" fill="#ACBAB0"/><path d="M289 164V145C289 130 326 130 326 145V164Z" fill="#6F7C78"/></g>
        <g id="waist"><path d="M242 375H361V395H242Z" fill="#7E8B82"/></g>
        <g id="boiler"><path d="M242 395H361L405 496L374 535H230L198 496Z" fill="#D5DDD6"/><path d="M242 395L258 407H346L361 395M258 407L245 516L230 535M346 407L359 516L374 535M245 516H359" stroke="#95A59A" stroke-width="3"/><path d="M229 435L214 489" stroke="#FFF" stroke-width="8"/><ellipse cx="379" cy="472" rx="10" ry="12" fill="#8F9B91"/><ellipse cx="379" cy="472" rx="3" ry="4" fill="#493F36" stroke="none"/></g>
      </g>
    </svg>`;
  },

  // 虹吸壶（按阶段控制水/咖啡在上下壶间转移 + 酒精灯火焰）
  siphon(waterLevel = 0, phase = 'idle') {
    const w = 60 * Math.min(waterLevel, 100) / 100;
    return `<svg viewBox="0 0 640 640" class="svg-tool">
      <defs>
        <linearGradient id="spWater" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#81D4FA"/>
          <stop offset="100%" stop-color="#29B6F6"/>
        </linearGradient>
        <linearGradient id="spCoffee" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#6D4C41"/>
          <stop offset="100%" stop-color="#3E2723"/>
        </linearGradient>
        <clipPath id="spLowerClip"><g transform="translate(60.6 62.6) scale(.8)"><circle cx="303" cy="388" r="100"/></g></clipPath>
        <clipPath id="spUpperClip"><path d="M215 115H391L375 244C372 269 334 282 319 285V369H287V285C272 282 234 269 231 244Z"/></clipPath>
      </defs>
      <g stroke="#493F36" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <g id="stand" fill="#7D8981"><path d="M422 287H442V522H422Z"/><path d="M286 505H437L483 536H202L246 514Z" fill="#89958C"/><path d="M349 302H432V321H349Z"/></g>
        <!-- 下壶 -->
        <g id="lower-globe" transform="translate(60.6 62.6) scale(.8)"><circle cx="303" cy="388" r="100" fill="#ECF2EF" fill-opacity=".42"/><path d="M269 306V286H337V306" fill="#E5EDE8"/><path d="M218 411C244 392 362 392 388 411C374 497 232 497 218 411Z" fill="#A17A58" fill-opacity=".26" stroke="#B19B81" stroke-width="2.5"/><path d="M233 359C218 385 222 416 232 431" stroke="#FFF" stroke-width="9"/><path d="M253 470C286 487 332 487 358 470" stroke="#ADBBB1" stroke-width="3"/></g>
        <!-- 下壶液体（水或咖啡） -->
        ${(phase === 'idle' || phase === 'heating') ? `<g clip-path="url(#spLowerClip)"><rect x="200" y="${470 - w * 0.6}" width="210" height="${w * 0.6 + 60}" fill="url(#spWater)" opacity="0.6"/></g>` : ''}
        ${phase === 'descending' ? `<g clip-path="url(#spLowerClip)"><rect x="200" y="${470 - w * 0.6}" width="210" height="${w * 0.6 + 60}" fill="url(#spCoffee)" opacity="0.75"/></g>` : ''}
        <!-- 上壶 -->
        <g id="upper-bowl"><path d="M215 115H391L375 244C372 269 334 282 319 285V369H287V285C272 282 234 269 231 244Z" fill="#EEF3F0" fill-opacity=".55"/><ellipse cx="303" cy="115" rx="88" ry="23" fill="#F9FCFA"/><ellipse cx="303" cy="115" rx="71" ry="12" fill="#DDE8E0" stroke="#AABBAE" stroke-width="2.5"/><path d="M239 146L249 229M297 297V357" stroke="#FFF" stroke-width="6"/><ellipse cx="303" cy="264" rx="43" ry="9" fill="#ABB7AB" stroke-width="3"/><path d="M303 272V332" stroke="#839181" stroke-width="3"/></g>
        <!-- 上壶液体（水或咖啡） -->
        ${(phase === 'heating' || phase === 'brewing') ? `<g clip-path="url(#spUpperClip)"><rect x="220" y="${150}" width="170" height="140" fill="${phase === 'brewing' ? 'url(#spCoffee)' : 'url(#spWater)'}" opacity="${phase === 'brewing' ? 0.75 : 0.6}"/></g>` : ''}
        ${phase === 'brewing' ? `<ellipse cx="303" cy="165" rx="50" ry="10" fill="#4E342E" opacity="0.6"/>` : ''}
        <g id="collar" fill="#C69A62"><path d="M269 286C285 279 321 279 337 286V302C321 309 285 309 269 302Z"/><path d="M337 285H391C405 285 411 311 391 311H337Z" fill="#6F7C78"/></g>
        <!-- 酒精灯 -->
        <g id="burner"><path d="M259 509C259 490 347 490 347 509V538C347 553 259 553 259 538Z" fill="#D9E2D8"/><ellipse cx="303" cy="509" rx="44" ry="12" fill="#EAF0E8"/><path d="M289 496V481H317V496" fill="#B7BFB2"/>
          ${(phase === 'heating' || phase === 'brewing') ? `<path d="M303 481C289 472 297 463 307 457C308 468 316 474 303 481Z" fill="#DDB67C" stroke="#AE8656" stroke-width="3"><animate attributeName="d" values="M303 481C289 472 297 463 307 457C308 468 316 474 303 481Z;M303 483C287 474 295 461 307 455C308 469 318 476 303 483Z;M303 481C289 472 297 463 307 457C308 468 316 474 303 481Z" dur="0.4s" repeatCount="indefinite"/></path>` : `<path d="M303 481C289 472 297 463 307 457C308 468 316 474 303 481Z" fill="#DDB67C" stroke="#AE8656" stroke-width="3"/>`}
        </g>
      </g>
    </svg>`;
  },

  // 意式咖啡机
  espressoMachine() {
    return `<svg viewBox="0 0 640 640" class="svg-tool">
      <g stroke="#493F36" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <g id="housing"><path d="M133 167L155 140H488L511 167V493H133Z" fill="#CDD7CF"/><path d="M133 167H511V280H133Z" fill="#E8ECE6"/><path d="M150 280H493V464H150Z" fill="#79877E"/><path d="M165 300H478V454H165Z" fill="#A8B8AC"/><path d="M153 148H489M152 181V258" stroke="#FFF" stroke-width="6"/></g>
        <g id="controls"><circle cx="233" cy="225" r="30" fill="#FAF8EF"/><path d="M213 238A24 24 0 0 1 253 238M233 225L246 213" stroke="#7B8A7D" stroke-width="3"/><circle cx="233" cy="225" r="4" fill="#493F36"/><rect x="299" y="204" width="89" height="40" rx="8" fill="#6F7C78"/><path d="M316 224H328M346 224H371" stroke="#D8E4D5" stroke-width="4"/><circle cx="444" cy="224" r="17" fill="#C69A62"/></g>
        <g id="brew-head"><path d="M241 281H341V309C333 324 249 324 241 309Z" fill="#D9E1D7"/><path d="M256 319H326V338H256Z" fill="#7D8B80"/><path d="M326 319H417C430 319 430 339 417 339H326Z" fill="#493F36"/><path d="M275 339V354M307 339V354" stroke="#737E72" stroke-width="7"/><path d="M275 358V384M307 358V384" stroke="#A47A4E" stroke-width="3"/></g>
        <g id="steam-wand"><circle cx="452" cy="286" r="13" fill="#DBE3D7"/><path d="M452 299V340L431 388" stroke="#E5EBE1" stroke-width="9"/><path d="M431 388L425 402" stroke="#493F36" stroke-width="8"/></g>
        <g id="cup"><path d="M244 388H339V422C339 460 244 460 244 422Z" fill="#FCF8EF"/><path d="M340 399C374 389 378 428 341 430" fill="#FCF8EF"/><ellipse cx="291" cy="388" rx="47" ry="10" fill="#B18A63"/><ellipse cx="291" cy="452" rx="64" ry="9" fill="#EEE8DA"/></g>
        <g id="drip-tray"><path d="M123 467H521V498H123Z" fill="#A4B0A4"/><path d="M143 478H501" stroke="#DDE5D9" stroke-width="7"/><path d="M173 473V486M209 473V486M245 473V486M281 473V486M317 473V486M353 473V486M389 473V486M425 473V486M461 473V486" stroke="#778477" stroke-width="3"/><path d="M155 499V516H197V499M445 499V516H487V499" fill="#6F7C78"/></g>
      </g>
    </svg>`;
  },

  // 卡片用器具图标
  toolIcon(id) {
    switch(id) {
      case 'chemex': return this.chemexDripper('#4FC3F7');
      case 'melitta': return this.melittaDripper('#FFCCBC');
      case 'frenchpress': return this.frenchPress(60, 0);
      case 'moka': return this.mokaPot(50, false);
      case 'siphon': return this.siphon(50, 'idle');
      case 'espresso': return this.espressoMachine();
      case 'aeropress': return this.frenchPress(40, 0); // 暂用法压代替
      case 'coldbrew': return this.server(50);
      default: return this.beans();
    }
  },

  // 辅助：颜色变亮
  lighten(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0xff) + percent);
    const b = Math.min(255, (num & 0xff) + percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  },

  // 辅助：颜色变暗
  darken(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - percent);
    const g = Math.max(0, ((num >> 8) & 0xff) - percent);
    const b = Math.max(0, (num & 0xff) - percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
};
