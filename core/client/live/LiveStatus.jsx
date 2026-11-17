import { LIVE_SERVER } from './liveApi.js';
import './LiveStatus.css';

/**
 * The connection badge under a live poll: live, connecting, voting closed,
 * or local mode (no server, so no votes are collected).
 */
export default function LiveStatus({ connected, votingOpen, className = 'poll-status' }) {
  if (!LIVE_SERVER) {
    return <span className={className}>○ Local mode: no live voting</span>;
  }
  if (!connected) {
    return <span className={className}>○ Connecting…</span>;
  }
  return (
    <span className={`${className} ${className}--live`}>
      ● Live{votingOpen ? '' : ' · voting closed'}
    </span>
  );
}
