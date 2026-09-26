/**
 * Parse string timestamp (e.g. "01:29" or "00:05" or "1:05:20") into total seconds.
 */
export function timestampToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  const parts = timestamp.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2) {
    const [min, sec] = parts;
    return (isNaN(min) ? 0 : min) * 60 + (isNaN(sec) ? 0 : sec);
  } else if (parts.length === 3) {
    const [hr, min, sec] = parts;
    return (
      (isNaN(hr) ? 0 : hr) * 3600 +
      (isNaN(min) ? 0 : min) * 60 +
      (isNaN(sec) ? 0 : sec)
    );
  }
  return 0;
}

/**
 * Format seconds (e.g. 89) into mm:ss format (e.g. "01:29").
 */
export function secondsToTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
