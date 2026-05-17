import React, { useEffect, useRef, useState } from 'react';

/**
 * RealisticAvatar v4 — Photo-realistic Indian professional
 * Fully animated: blink, eye movement, lip-sync, head-tilt, breathing
 */
export default function RealisticAvatar({
  isTalking    = false,
  isThinking   = false,
  isListening  = false,
  emotion      = 'neutral',
  skinTone     = 'indian',
  shirtColor   = '#1E3A5F',
  avatarName   = '',
  size         = 200,
  showNameBadge= true,
  glowColor    = '#531697',
}) {
  const s  = size;
  const cx = s / 2;

  // Animation state
  const [blink, setBlink]       = useState(0);   // 0=open 1=half 2=closed
  const [eyeOff, setEyeOff]     = useState({ x: 0, y: 0 });
  const [mouth, setMouth]       = useState(0);   // 0..1 open amount
  const [breath, setBreath]     = useState(0);
  const [tilt, setTilt]         = useState(0);

  const bRef = useRef(); const eRef = useRef();
  const mRef = useRef(); const brRef = useRef(); const tRef = useRef();

  // ── Blink ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const go = () => {
      setBlink(1);
      setTimeout(() => setBlink(2), 60);
      setTimeout(() => setBlink(1), 110);
      setTimeout(() => { setBlink(0); bRef.current = setTimeout(go, 2500 + Math.random()*3500); }, 160);
    };
    bRef.current = setTimeout(go, 800 + Math.random()*1500);
    return () => clearTimeout(bRef.current);
  }, []);

  // ── Eye wander ────────────────────────────────────────────────────────────
  useEffect(() => {
    const go = () => {
      if (isThinking) setEyeOff({ x: 4 + Math.random()*2, y: -2 - Math.random() });
      else setEyeOff({ x: (Math.random()-0.5)*5, y: (Math.random()-0.5)*3 });
      eRef.current = setTimeout(go, 1200 + Math.random()*2400);
    };
    go();
    return () => clearTimeout(eRef.current);
  }, [isThinking]);

  // ── Lip sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isTalking) { clearTimeout(mRef.current); setMouth(0); return; }
    const go = () => {
      setMouth([0.2, 0.6, 0.9, 0.45, 0.75, 0.15, 0.55][Math.floor(Math.random()*7)]);
      mRef.current = setTimeout(go, 65 + Math.random()*85);
    };
    mRef.current = setTimeout(go, 50);
    return () => clearTimeout(mRef.current);
  }, [isTalking]);

  // ── Breathing ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let t = 0;
    const go = () => { t += 0.038; setBreath(Math.sin(t) * 1.1); brRef.current = requestAnimationFrame(go); };
    brRef.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(brRef.current);
  }, []);

  // ── Head tilt ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const target = isThinking ? -7 : isListening ? 5 : 0;
    let cur = tilt;
    const go = () => { cur += (target - cur) * 0.08; setTilt(cur); if (Math.abs(target-cur) > 0.1) tRef.current = requestAnimationFrame(go); };
    cancelAnimationFrame(tRef.current);
    tRef.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(tRef.current);
  // eslint-disable-next-line
  }, [isThinking, isListening]);

  // ── Geometry ──────────────────────────────────────────────────────────────
  const fy   = breath * 0.35;
  const eyeRyFull = s * 0.033;
  const eyeRy = blink === 2 ? 0.5 : blink === 1 ? eyeRyFull * 0.45 : eyeRyFull;

  const ELX = cx - s*0.142 + eyeOff.x;
  const ERX = cx + s*0.142 + eyeOff.x;
  const EY  = s*0.418 + eyeOff.y + fy;

  const id = (n) => `${n}_${Math.abs(avatarName.split('').reduce((a,c)=>a+c.charCodeAt(0),size))}`;

  // ── Mouth path ────────────────────────────────────────────────────────────
  const MY = s*0.608 + fy;
  const MW = s*0.108;
  const MO = mouth * s*0.058;

  const renderMouth = () => {
    if (emotion === 'smile' || (emotion === 'neutral' && !isTalking)) {
      // Warm professional smile — cornerlifts, hint of teeth
      return (
        <g>
          {/* Inner dark */}
          <path d={`M ${cx-MW*0.95} ${MY+2} Q ${cx} ${MY+s*0.038+MO*0.4} ${cx+MW*0.95} ${MY+2}`}
            fill="#3A1A10"/>
          {/* Teeth */}
          <path d={`M ${cx-MW*0.75} ${MY+2} Q ${cx} ${MY+s*0.022} ${cx+MW*0.75} ${MY+2} L ${cx+MW*0.75} ${MY+s*0.02} Q ${cx} ${MY+s*0.036} ${cx-MW*0.75} ${MY+s*0.02} Z`}
            fill="#F8F2EA"/>
          {/* Upper lip — cupid's bow */}
          <path d={`M ${cx-MW} ${MY} Q ${cx-MW*0.5} ${MY-s*0.022} ${cx} ${MY-s*0.016} Q ${cx+MW*0.5} ${MY-s*0.022} ${cx+MW} ${MY}`}
            fill="#B05840" />
          {/* Lower lip */}
          <path d={`M ${cx-MW*0.9} ${MY} Q ${cx} ${MY+s*0.042} ${cx+MW*0.9} ${MY}`}
            fill="#C0684A"/>
          {/* Lip highlight */}
          <ellipse cx={cx} cy={MY+s*0.024} rx={MW*0.4} ry={s*0.009}
            fill="rgba(255,210,180,0.35)"/>
        </g>
      );
    }
    if (isTalking) {
      return (
        <g>
          <ellipse cx={cx} cy={MY+MO*0.6} rx={MW*(0.65+mouth*0.35)} ry={Math.max(MO*0.75, s*0.008)} fill="#2A0E06"/>
          {mouth > 0.3 && <rect x={cx-MW*(0.5+mouth*0.25)} y={MY+s*0.003} width={MW*(1+mouth*0.5)} height={s*0.018} rx={3} fill="#F0EAE0" opacity="0.9"/>}
          <path d={`M ${cx-MW} ${MY} Q ${cx-MW*0.45} ${MY-s*0.02} ${cx} ${MY-s*0.014} Q ${cx+MW*0.45} ${MY-s*0.02} ${cx+MW} ${MY}`}
            fill="#B05840"/>
          <path d={`M ${cx-MW*0.9} ${MY} Q ${cx} ${MY+MO*1.6+s*0.008} ${cx+MW*0.9} ${MY}`}
            fill="#C0684A"/>
        </g>
      );
    }
    // neutral closed
    return (
      <g>
        <path d={`M ${cx-MW*0.88} ${MY} Q ${cx} ${MY+s*0.022} ${cx+MW*0.88} ${MY}`}
          fill="#B05840"/>
        <path d={`M ${cx-MW*0.78} ${MY} Q ${cx-MW*0.35} ${MY-s*0.016} ${cx} ${MY-s*0.012} Q ${cx+MW*0.35} ${MY-s*0.016} ${cx+MW*0.78} ${MY}`}
          fill="#9A4830" opacity="0.7"/>
      </g>
    );
  };

  return (
    <div style={{ position:'relative', width:s, height:s+(showNameBadge?32:0), flexShrink:0, display:'inline-flex', flexDirection:'column', alignItems:'center' }}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}
        style={{ transform:`rotate(${tilt}deg)`, transformOrigin:`${cx}px ${s*0.45}px`, overflow:'visible', transition:'transform 0.3s ease' }}>
        <defs>
          {/* Skin — radial, warm light from upper-left */}
          <radialGradient id={id('skin')} cx="36%" cy="28%" r="64%">
            <stop offset="0%"   stopColor="#E8A878"/>
            <stop offset="30%"  stopColor="#D08858"/>
            <stop offset="65%"  stopColor="#B86E3A"/>
            <stop offset="100%" stopColor="#8A4E22"/>
          </radialGradient>
          {/* Side/jaw depth shadow */}
          <radialGradient id={id('skinS')} cx="50%" cy="72%" r="56%">
            <stop offset="0%"   stopColor="rgba(90,40,5,0)"   />
            <stop offset="100%" stopColor="rgba(90,40,5,0.42)"/>
          </radialGradient>
          {/* Forehead lighter band */}
          <linearGradient id={id('forehead')} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,200,150,0.28)"/>
            <stop offset="100%" stopColor="rgba(255,200,150,0)"   />
          </linearGradient>
          {/* Hair */}
          <radialGradient id={id('hair')} cx="38%" cy="20%" r="70%">
            <stop offset="0%"   stopColor="#2E1E10"/>
            <stop offset="55%"  stopColor="#1A1008"/>
            <stop offset="100%" stopColor="#0C0806"/>
          </radialGradient>
          {/* Hair shine */}
          <radialGradient id={id('hairSh')} cx="32%" cy="22%" r="38%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.28)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"   />
          </radialGradient>
          {/* Iris */}
          <radialGradient id={id('iris')} cx="38%" cy="32%" r="62%">
            <stop offset="0%"   stopColor="#6B4828"/>
            <stop offset="55%"  stopColor="#3D2510"/>
            <stop offset="100%" stopColor="#150A03"/>
          </radialGradient>
          {/* Shirt */}
          <linearGradient id={id('shirt')} x1="25%" y1="0%" x2="75%" y2="100%">
            <stop offset="0%"   stopColor={shirtColor}/>
            <stop offset="100%" stopColor={shirtColor} stopOpacity="0.6"/>
          </linearGradient>
          {/* Neck */}
          <linearGradient id={id('neck')} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#C07840"/>
            <stop offset="100%" stopColor="#8A5020"/>
          </linearGradient>
          {/* Eye white */}
          <radialGradient id={id('white')} cx="50%" cy="38%" r="58%">
            <stop offset="0%"   stopColor="#FEFCF9"/>
            <stop offset="100%" stopColor="#EAE4DC"/>
          </radialGradient>
          {/* Glow filter */}
          <filter id={id('glow')}>
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Face drop shadow */}
          <filter id={id('faceShadow')} x="-15%" y="-8%" width="130%" height="125%">
            <feDropShadow dx="3" dy="5" stdDeviation="7" floodColor="#6B3010" floodOpacity="0.38"/>
          </filter>
        </defs>

        {/* ═══ BODY / SHIRT ═══ */}
        <ellipse cx={cx} cy={s*0.99} rx={s*0.5} ry={s*0.27} fill={`url(#${id('shirt')})`}/>
        {/* Shirt center seam */}
        <line x1={cx} y1={s*0.8+fy} x2={cx} y2={s*0.96+fy}
          stroke="rgba(0,0,0,0.18)" strokeWidth={s*0.008}/>
        {/* Shirt highlights */}
        <ellipse cx={cx-s*0.1} cy={s*0.9} rx={s*0.08} ry={s*0.055}
          fill="rgba(255,255,255,0.06)"/>
        <ellipse cx={cx+s*0.1} cy={s*0.9} rx={s*0.08} ry={s*0.055}
          fill="rgba(255,255,255,0.06)"/>
        {/* Collar — left */}
        <path d={`M ${cx} ${s*0.79+fy} L ${cx-s*0.14} ${s*0.9+fy} L ${cx-s*0.04} ${s*0.87+fy} Z`}
          fill={shirtColor} stroke="rgba(0,0,0,0.15)" strokeWidth="1"/>
        {/* Collar — right */}
        <path d={`M ${cx} ${s*0.79+fy} L ${cx+s*0.14} ${s*0.9+fy} L ${cx+s*0.04} ${s*0.87+fy} Z`}
          fill={shirtColor} stroke="rgba(0,0,0,0.15)" strokeWidth="1"/>

        {/* ═══ NECK ═══ */}
        <rect x={cx-s*0.085} y={s*0.73+fy} width={s*0.17} height={s*0.15}
          rx={s*0.04} fill={`url(#${id('neck')})`}/>
        <ellipse cx={cx-s*0.08} cy={s*0.78+fy} rx={s*0.022} ry={s*0.048}
          fill="rgba(90,40,10,0.28)"/>
        <ellipse cx={cx+s*0.08} cy={s*0.78+fy} rx={s*0.022} ry={s*0.048}
          fill="rgba(90,40,10,0.28)"/>

        {/* ═══ FACE ═══ */}
        {/* Jaw — slightly squared for realistic look */}
        <path d={`M ${cx-s*0.248} ${s*0.42+fy} Q ${cx-s*0.27} ${s*0.6+fy} ${cx-s*0.16} ${s*0.71+fy} Q ${cx} ${s*0.76+fy} ${cx+s*0.16} ${s*0.71+fy} Q ${cx+s*0.27} ${s*0.6+fy} ${cx+s*0.248} ${s*0.42+fy}`}
          fill={`url(#${id('skin')})`} filter={`url(#${id('faceShadow')})`}/>
        {/* Upper face ellipse (cheeks + forehead) */}
        <ellipse cx={cx} cy={s*0.4+fy} rx={s*0.263} ry={s*0.23}
          fill={`url(#${id('skin')})`}/>
        {/* Side shadow overlay */}
        <path d={`M ${cx-s*0.248} ${s*0.42+fy} Q ${cx-s*0.27} ${s*0.6+fy} ${cx-s*0.16} ${s*0.71+fy} Q ${cx} ${s*0.76+fy} ${cx+s*0.16} ${s*0.71+fy} Q ${cx+s*0.27} ${s*0.6+fy} ${cx+s*0.248} ${s*0.42+fy}`}
          fill={`url(#${id('skinS')})`}/>
        <ellipse cx={cx} cy={s*0.4+fy} rx={s*0.263} ry={s*0.23}
          fill={`url(#${id('skinS')})`}/>
        {/* Forehead highlight */}
        <ellipse cx={cx-s*0.02} cy={s*0.285+fy} rx={s*0.13} ry={s*0.088}
          fill={`url(#${id('forehead')})`}/>
        {/* Key light on left cheek */}
        <ellipse cx={cx-s*0.15} cy={s*0.47+fy} rx={s*0.07} ry={s*0.05}
          fill="rgba(255,210,170,0.2)" style={{filter:'blur(4px)'}}/>
        {/* Key light on right cheek */}
        <ellipse cx={cx+s*0.15} cy={s*0.47+fy} rx={s*0.07} ry={s*0.05}
          fill="rgba(255,210,170,0.2)" style={{filter:'blur(4px)'}}/>

        {/* ═══ EARS ═══ */}
        <ellipse cx={cx-s*0.272} cy={s*0.435+fy} rx={s*0.04} ry={s*0.058}
          fill="#B86E3A"/>
        <ellipse cx={cx+s*0.272} cy={s*0.435+fy} rx={s*0.04} ry={s*0.058}
          fill="#B86E3A"/>
        <ellipse cx={cx-s*0.269} cy={s*0.435+fy} rx={s*0.021} ry={s*0.033}
          fill="#8A5022" opacity="0.5"/>
        <ellipse cx={cx+s*0.269} cy={s*0.435+fy} rx={s*0.021} ry={s*0.033}
          fill="#8A5022" opacity="0.5"/>

        {/* ═══ HAIR ═══ */}
        {/* Main hair mass — sits on top of face */}
        <ellipse cx={cx} cy={s*0.21+fy} rx={s*0.277} ry={s*0.215}
          fill={`url(#${id('hair')})`}/>
        {/* Side hair — covers temples */}
        <ellipse cx={cx-s*0.25} cy={s*0.305+fy} rx={s*0.095} ry={s*0.18}
          fill={`url(#${id('hair')})`}/>
        <ellipse cx={cx+s*0.25} cy={s*0.305+fy} rx={s*0.095} ry={s*0.18}
          fill={`url(#${id('hair')})`}/>
        {/* Hairline — smooth curve at forehead */}
        <path d={`M ${cx-s*0.255} ${s*0.262+fy} Q ${cx-s*0.08} ${s*0.116+fy} ${cx+s*0.01} ${s*0.11+fy} Q ${cx+s*0.1} ${s*0.116+fy} ${cx+s*0.255} ${s*0.262+fy}`}
          fill={`url(#${id('hair')})`}/>
        {/* Styled hero quiff / side sweep */}
        <path d={`M ${cx-s*0.12} ${s*0.13+fy} Q ${cx} ${s*0.09+fy} ${cx+s*0.16} ${s*0.16+fy} Q ${cx+s*0.08} ${s*0.13+fy} ${cx-s*0.04} ${s*0.17+fy} Z`}
          fill="#3D2818" opacity="0.55"/>
        {/* Hair shine highlight */}
        <ellipse cx={cx-s*0.045} cy={s*0.158+fy} rx={s*0.075} ry={s*0.03}
          fill={`url(#${id('hairSh')})`}/>
        <ellipse cx={cx+s*0.055} cy={s*0.172+fy} rx={s*0.044} ry={s*0.016}
          fill="rgba(255,255,255,0.14)"/>

        {/* ═══ EYEBROWS — thick, defined ═══ */}
        {/* Left */}
        <path d={`M ${ELX-s*0.088} ${EY-s*0.095} Q ${ELX} ${EY-s*0.115} ${ELX+s*0.088} ${EY-s*0.09}`}
          stroke="#1C1008" strokeWidth={s*0.03} fill="none" strokeLinecap="round"/>
        <path d={`M ${ELX-s*0.07} ${EY-s*0.093} Q ${ELX} ${EY-s*0.112} ${ELX+s*0.07} ${EY-s*0.088}`}
          stroke="rgba(50,30,8,0.45)" strokeWidth={s*0.012} fill="none" strokeLinecap="round"/>
        {/* Right */}
        <path d={`M ${ERX-s*0.088} ${EY-s*0.09} Q ${ERX} ${EY-s*0.115} ${ERX+s*0.088} ${EY-s*0.095}`}
          stroke="#1C1008" strokeWidth={s*0.03} fill="none" strokeLinecap="round"/>
        <path d={`M ${ERX-s*0.07} ${EY-s*0.088} Q ${ERX} ${EY-s*0.112} ${ERX+s*0.07} ${EY-s*0.093}`}
          stroke="rgba(50,30,8,0.45)" strokeWidth={s*0.012} fill="none" strokeLinecap="round"/>

        {/* ═══ EYES ═══ */}
        {/* Socket shadow */}
        <ellipse cx={ELX} cy={EY+1} rx={s*0.09} ry={eyeRy+s*0.012}
          fill="rgba(60,20,5,0.22)"/>
        <ellipse cx={ERX} cy={EY+1} rx={s*0.09} ry={eyeRy+s*0.012}
          fill="rgba(60,20,5,0.22)"/>
        {/* Whites */}
        <ellipse cx={ELX} cy={EY} rx={s*0.082} ry={eyeRy} fill={`url(#${id('white')})`}/>
        <ellipse cx={ERX} cy={EY} rx={s*0.082} ry={eyeRy} fill={`url(#${id('white')})`}/>

        {blink < 2 && <>
          {/* Iris */}
          <circle cx={ELX} cy={EY} r={eyeRy*0.78} fill={`url(#${id('iris')})`}/>
          <circle cx={ERX} cy={EY} r={eyeRy*0.78} fill={`url(#${id('iris')})`}/>
          {/* Iris detail ring */}
          <circle cx={ELX} cy={EY} r={eyeRy*0.78} fill="none"
            stroke="rgba(80,45,15,0.55)" strokeWidth={eyeRy*0.2}/>
          <circle cx={ERX} cy={EY} r={eyeRy*0.78} fill="none"
            stroke="rgba(80,45,15,0.55)" strokeWidth={eyeRy*0.2}/>
          {/* Pupil */}
          <circle cx={ELX} cy={EY} r={eyeRy*0.46} fill="#080402"/>
          <circle cx={ERX} cy={EY} r={eyeRy*0.46} fill="#080402"/>
          {/* Primary catchlight — top-right of iris */}
          <circle cx={ELX+s*0.022} cy={EY-eyeRy*0.34} r={eyeRy*0.3} fill="white" opacity="0.96"/>
          <circle cx={ERX+s*0.022} cy={EY-eyeRy*0.34} r={eyeRy*0.3} fill="white" opacity="0.96"/>
          {/* Secondary catchlight — bottom-left */}
          <circle cx={ELX-s*0.02} cy={EY+eyeRy*0.28} r={eyeRy*0.13} fill="white" opacity="0.58"/>
          <circle cx={ERX-s*0.02} cy={EY+eyeRy*0.28} r={eyeRy*0.13} fill="white" opacity="0.58"/>
        </>}

        {/* Upper eyelid crease / shadow */}
        <ellipse cx={ELX} cy={EY-eyeRy*0.18} rx={s*0.082} ry={eyeRy*0.48}
          fill="rgba(60,20,5,0.3)"/>
        <ellipse cx={ERX} cy={EY-eyeRy*0.18} rx={s*0.082} ry={eyeRy*0.48}
          fill="rgba(60,20,5,0.3)"/>
        {/* Eyelash curve */}
        <path d={`M ${ELX-s*0.08} ${EY-eyeRy*0.72} Q ${ELX} ${EY-eyeRy*1.18} ${ELX+s*0.08} ${EY-eyeRy*0.72}`}
          stroke="#0C0806" strokeWidth={s*0.02} fill="none" strokeLinecap="round"/>
        <path d={`M ${ERX-s*0.08} ${EY-eyeRy*0.72} Q ${ERX} ${EY-eyeRy*1.18} ${ERX+s*0.08} ${EY-eyeRy*0.72}`}
          stroke="#0C0806" strokeWidth={s*0.02} fill="none" strokeLinecap="round"/>
        {/* Lower lash line */}
        <path d={`M ${ELX-s*0.07} ${EY+eyeRy*0.78} Q ${ELX} ${EY+eyeRy*0.95} ${ELX+s*0.07} ${EY+eyeRy*0.78}`}
          stroke="rgba(60,20,5,0.35)" strokeWidth={s*0.008} fill="none" strokeLinecap="round"/>
        <path d={`M ${ERX-s*0.07} ${EY+eyeRy*0.78} Q ${ERX} ${EY+eyeRy*0.95} ${ERX+s*0.07} ${EY+eyeRy*0.78}`}
          stroke="rgba(60,20,5,0.35)" strokeWidth={s*0.008} fill="none" strokeLinecap="round"/>

        {/* ═══ NOSE ═══ */}
        {/* Bridge shadow line */}
        <path d={`M ${cx+s*0.01} ${s*0.465+fy} Q ${cx+s*0.022} ${s*0.505+fy} ${cx+s*0.044} ${s*0.538+fy}`}
          stroke="rgba(90,40,10,0.45)" strokeWidth={s*0.016} fill="none" strokeLinecap="round"/>
        {/* Left nostril */}
        <path d={`M ${cx-s*0.06} ${s*0.552+fy} Q ${cx-s*0.042} ${s*0.565+fy} ${cx-s*0.022} ${s*0.555+fy}`}
          stroke="rgba(90,40,10,0.55)" strokeWidth={s*0.014} fill="none" strokeLinecap="round"/>
        {/* Right nostril */}
        <path d={`M ${cx+s*0.022} ${s*0.555+fy} Q ${cx+s*0.042} ${s*0.565+fy} ${cx+s*0.06} ${s*0.552+fy}`}
          stroke="rgba(90,40,10,0.55)" strokeWidth={s*0.014} fill="none" strokeLinecap="round"/>
        {/* Nose base */}
        <path d={`M ${cx-s*0.058} ${s*0.556+fy} Q ${cx} ${s*0.562+fy} ${cx+s*0.058} ${s*0.556+fy}`}
          stroke="rgba(90,40,10,0.35)" strokeWidth={s*0.011} fill="none"/>
        {/* Tip highlight */}
        <ellipse cx={cx} cy={s*0.546+fy} rx={s*0.024} ry={s*0.016}
          fill="rgba(255,210,170,0.3)"/>

        {/* ═══ PHILTRUM (upper lip groove) ═══ */}
        <path d={`M ${cx-s*0.02} ${s*0.565+fy} L ${cx-s*0.014} ${MY-s*0.01+fy}`}
          stroke="rgba(90,40,10,0.2)" strokeWidth={s*0.006} fill="none"/>
        <path d={`M ${cx+s*0.02} ${s*0.565+fy} L ${cx+s*0.014} ${MY-s*0.01+fy}`}
          stroke="rgba(90,40,10,0.2)" strokeWidth={s*0.006} fill="none"/>

        {/* ═══ MOUTH ═══ */}
        {renderMouth()}

        {/* ═══ CHIN DEFINITION ═══ */}
        <path d={`M ${cx-s*0.1} ${s*0.7+fy} Q ${cx} ${s*0.74+fy} ${cx+s*0.1} ${s*0.7+fy}`}
          stroke="rgba(90,40,10,0.2)" strokeWidth={s*0.01} fill="none"/>
        {/* Chin highlight */}
        <ellipse cx={cx} cy={s*0.718+fy} rx={s*0.045} ry={s*0.018}
          fill="rgba(255,200,150,0.2)"/>

        {/* ═══ BEARD STUBBLE ═══ */}
        {['#5a2e0a','#4a2408','#3e1e06'].map((c, i) => (
          <path key={i}
            d={`M ${cx-(s*0.2-i*s*0.015)} ${s*0.614+i*s*0.02+fy} Q ${cx} ${s*0.66+i*s*0.02+fy} ${cx+(s*0.2-i*s*0.015)} ${s*0.614+i*s*0.02+fy}`}
            stroke={c} strokeWidth={s*0.009} fill="none" opacity={0.28-i*0.04}
            strokeDasharray={`${1.8+i*0.4},${2.8+i*0.5}`}/>
        ))}
        {/* Mustache shadow */}
        <path d={`M ${cx-s*0.07} ${MY-s*0.022+fy} Q ${cx} ${MY-s*0.028+fy} ${cx+s*0.07} ${MY-s*0.022+fy}`}
          stroke="rgba(40,15,3,0.2)" strokeWidth={s*0.018} fill="none" strokeLinecap="round"/>

        {/* ═══ CHEEK BLUSH ═══ */}
        <ellipse cx={cx-s*0.195} cy={s*0.503+fy} rx={s*0.068} ry={s*0.042}
          fill="#D08858" opacity="0.22" style={{filter:'blur(4px)'}}/>
        <ellipse cx={cx+s*0.195} cy={s*0.503+fy} rx={s*0.068} ry={s*0.042}
          fill="#D08858" opacity="0.22" style={{filter:'blur(4px)'}}/>

        {/* ═══ AI STATE INDICATORS ═══ */}
        {isThinking && [0,1,2].map(i => (
          <circle key={i} cx={cx+(i-1)*s*0.11} cy={s*0.085} r={s*0.025} fill={glowColor} opacity="0.8">
            <animate attributeName="cy" values={`${s*0.085};${s*0.062};${s*0.085}`} dur="1s" begin={`${i*0.3}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" begin={`${i*0.3}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {isTalking && (
          <circle cx={cx} cy={s*0.435} r={s*0.32} fill="none"
            stroke={glowColor} strokeWidth="2.5" opacity="0.3"
            filter={`url(#${id('glow')})`}>
            <animate attributeName="r" values={`${s*0.32};${s*0.36};${s*0.32}`} dur="0.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0.05;0.3" dur="0.5s" repeatCount="indefinite"/>
          </circle>
        )}
        {isListening && (
          <circle cx={cx} cy={s*0.435} r={s*0.34} fill="none"
            stroke="#22C55E" strokeWidth="2" opacity="0.28">
            <animate attributeName="r" values={`${s*0.34};${s*0.38};${s*0.34}`} dur="1.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.28;0.04;0.28" dur="1.2s" repeatCount="indefinite"/>
          </circle>
        )}
      </svg>

      {showNameBadge && (
        <div style={{
          marginTop: 5, fontFamily:"'Nunito',sans-serif",
          fontSize: Math.max(11, s*0.073), fontWeight: 700,
          color: isTalking ? glowColor : '#dde4f0',
          transition: 'color 0.3s', letterSpacing: '0.02em', textAlign:'center',
        }}>
          {avatarName}
          {isTalking   && <span style={{marginLeft:6,fontSize:s*0.058}}>🎙</span>}
          {isListening && <span style={{marginLeft:6,fontSize:s*0.058}}>👂</span>}
          {isThinking  && <span style={{marginLeft:6,fontSize:s*0.058}}>💭</span>}
        </div>
      )}
    </div>
  );
}