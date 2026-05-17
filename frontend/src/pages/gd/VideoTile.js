import React, { useEffect, useRef, useState } from 'react';
import RealisticAvatar from '../../components/RealisticAvatar';

const GRAD = 'linear-gradient(135deg,#531697,#13a1a5)';

/**
 * VideoTile — v3 (Fixed)
 *
 * Fixes:
 *  1. stream prop changes properly re-attach to <video> (srcObject assignment)
 *  2. Handles stream arriving late (after component mounts)
 *  3. Shows live indicator for active speaker
 *  4. ✅ AI participants now show RealisticAvatar face instead of plain 🤖 emoji
 */
export default function VideoTile({ stream, participant, isActiveSpeaker, isLocal, size = 'small', style = {} }) {
  const videoRef   = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);

  // ✅ Re-run whenever `stream` changes — covers both initial load and late-arriving streams
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.play().catch(() => {});
      }
      const videoTracks = stream.getVideoTracks();
      setHasVideo(videoTracks.length > 0 && videoTracks.some(t => t.enabled && t.readyState === 'live'));
    } else {
      video.srcObject = null;
      setHasVideo(false);
    }
  }, [stream]);

  // Also listen for track changes inside the stream (e.g. camera toggled mid-call)
  useEffect(() => {
    if (!stream) return;
    const handleTrackChange = () => {
      const videoTracks = stream.getVideoTracks();
      setHasVideo(videoTracks.length > 0 && videoTracks.some(t => t.enabled && t.readyState === 'live'));
    };
    stream.addEventListener('addtrack',    handleTrackChange);
    stream.addEventListener('removetrack', handleTrackChange);
    return () => {
      stream.removeEventListener('addtrack',    handleTrackChange);
      stream.removeEventListener('removetrack', handleTrackChange);
    };
  }, [stream]);

  const showVideo  = hasVideo && !participant?.isCameraOff && !participant?.isAI;
  const name       = participant?.name || 'Unknown';
  const initial    = name[0]?.toUpperCase() || '?';
  const borderColor= isActiveSpeaker ? '#47d372' : participant?.isAI ? '#13a1a5' : 'transparent';
  const borderWidth= isActiveSpeaker ? 3 : participant?.isAI ? 2 : 0;

  // ✅ AI avatar size based on tile size prop
  const avatarSize = size === 'large' ? 100 : 64;

  return (
    <div style={{
      position:   'relative',
      borderRadius: 14,
      overflow:   'hidden',
      background: participant?.isAI ? '#0a2233' : '#1a2640',
      border:     `${borderWidth}px solid ${borderColor}`,
      display:    'flex', alignItems: 'center', justifyContent: 'center',
      aspectRatio:'16/9',
      transition: 'border-color 0.2s ease',
      boxShadow:  isActiveSpeaker ? `0 0 16px ${borderColor}55` : '0 2px 8px rgba(0,0,0,0.3)',
      ...style,
    }}>

      {/* Video element — always rendered but hidden when no stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          width:      '100%',
          height:     '100%',
          objectFit:  'cover',
          transform:  isLocal ? 'scaleX(-1)' : 'none',
          display:    showVideo ? 'block' : 'none',
        }}
      />

      {/* ✅ AI participant: show RealisticAvatar animated face */}
      {!showVideo && participant?.isAI && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width:        avatarSize,
            height:       avatarSize,
            borderRadius: '50%',
            overflow:     'hidden',
            background:   'rgba(19,161,165,0.15)',
            border:       '2px solid rgba(19,161,165,0.4)',
            display:      'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RealisticAvatar
              size={avatarSize}
              isTalking={isActiveSpeaker}
              isThinking={false}
              isListening={false}
              emotion="neutral"
              skinTone="indian"
              shirtColor="#13a1a5"
              avatarName=""
              showNameBadge={false}
              glowColor="#13a1a5"
            />
          </div>
          {size === 'large' && (
            <div style={{ color: '#9ab0c8', fontSize: '.75rem', fontWeight: 700 }}>
              AI Participant
            </div>
          )}
        </div>
      )}

      {/* Human fallback avatar when no video */}
      {!showVideo && !participant?.isAI && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{
            width:       size === 'large' ? 80 : 52,
            height:      size === 'large' ? 80 : 52,
            borderRadius:'50%',
            background:  GRAD,
            display:    'flex', alignItems:'center', justifyContent:'center',
            fontSize:    size === 'large' ? '2rem' : '1.3rem',
            fontFamily:  "'Syne',sans-serif", fontWeight: 800, color: '#fff',
          }}>
            {initial}
          </div>
          {size === 'large' && (
            <div style={{ color: '#9ab0c8', fontSize: '.8rem', fontWeight: 700 }}>
              {participant?.isCameraOff ? 'Camera off' : 'No video'}
            </div>
          )}
        </div>
      )}

      {/* Name bar */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        padding:'24px 10px 8px',
        background:'linear-gradient(transparent, rgba(0,0,0,0.72))',
        display:'flex', alignItems:'center', gap:6,
      }}>
        {participant?.isMuted && (
          <span style={{ fontSize:'.75rem', color:'#ef4444', background:'rgba(0,0,0,0.6)', borderRadius:4, padding:'1px 5px' }}>🔇</span>
        )}
        <span style={{ fontSize:'.78rem', fontWeight:700, color:'#fff', fontFamily:"'Nunito',sans-serif", textShadow:'0 1px 3px rgba(0,0,0,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
          {participant?.isAI ? `🤖 ${name}` : name}
          {isLocal && <span style={{ color:'#13a1a5', marginLeft:4 }}>(you)</span>}
        </span>
        {isActiveSpeaker && !participant?.isMuted && (
          <span style={{ fontSize:'.7rem', color:'#47d372', fontWeight:800, animation:'pulse 1s ease-in-out infinite' }}>● LIVE</span>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}