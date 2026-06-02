type Callback = (...args: any[]) => void;

const listeners: Record<string, Set<Callback>> = {};

export const on = (event: string, cb: Callback) => {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(cb);
  return () => listeners[event]?.delete(cb);
};

export const emit = (event: string, ...args: any[]) => {
  const set = listeners[event];
  if (!set) return;
  set.forEach(cb => {
    try { cb(...args); } catch (e) { /* swallow listener errors */ }
  });
};

export const onPremiumRequired = (cb: Callback) => on('premiumRequired', cb);
export const emitPremiumRequired = () => emit('premiumRequired');

export const onNavigate = (cb: (screen: string, payload?: any) => void) => on('navigate', cb);
export const emitNavigate = (screen: string, payload?: any) => emit('navigate', screen, payload);

export default { on, emit, onPremiumRequired, emitPremiumRequired, onNavigate, emitNavigate };
