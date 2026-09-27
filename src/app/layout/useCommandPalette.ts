import * as React from 'react';

/** Open state for the search palette, with the Ctrl/⌘ K and "/" shortcuts. */
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);
  // Mount the (lazy) palette only once it has been opened, so its code is not part of first load.
  const [used, setUsed] = React.useState(false);
  if (open && !used) setUsed(true);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return { open, setOpen, used };
}
