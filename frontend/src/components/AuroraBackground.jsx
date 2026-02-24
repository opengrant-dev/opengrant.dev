export default function AuroraBackground() {
  return (
    <>
      <style>{`
        @keyframes float1 {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(80px,60px) scale(1.15); }
        }
        @keyframes float2 {
          0%   { transform: translate(0,0) scale(1.05); }
          100% { transform: translate(-60px,80px) scale(0.9); }
        }
        @keyframes float3 {
          0%   { transform: translate(0,0) scale(0.95); }
          100% { transform: translate(100px,-60px) scale(1.1); }
        }
        .aurora-1 { animation: float1 20s ease-in-out infinite alternate; }
        .aurora-2 { animation: float2 25s ease-in-out infinite alternate; }
        .aurora-3 { animation: float3 30s ease-in-out infinite alternate; }
      `}</style>
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        <div className="aurora-1" style={{
          position:'absolute', top:'8%', left:'8%',
          width:'520px', height:'520px', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(14,165,233,0.13) 0%, transparent 70%)',
          filter:'blur(40px)',
        }} />
        <div className="aurora-2" style={{
          position:'absolute', top:'35%', right:'5%',
          width:'480px', height:'480px', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(99,102,241,0.11) 0%, transparent 70%)',
          filter:'blur(40px)',
        }} />
        <div className="aurora-3" style={{
          position:'absolute', bottom:'5%', left:'25%',
          width:'560px', height:'560px', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)',
          filter:'blur(40px)',
        }} />
      </div>
    </>
  )
}
