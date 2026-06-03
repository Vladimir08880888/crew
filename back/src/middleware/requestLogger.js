export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? 31 : status >= 400 ? 33 : status >= 300 ? 36 : 32;
    console.log(`[\x1b[${color}m${status}\x1b[0m] ${req.method.padEnd(6)} ${req.originalUrl} — ${ms}ms`);
  });
  next();
}
