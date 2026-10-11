// Applied before first paint so the saved theme shows without a light/dark flash. Kept in its own file
// so the content security policy can refuse inline scripts (issue SEC-01).
// Apply the saved theme before first paint (no light/dark flash).
      (function () {
        try {
          var p = JSON.parse(localStorage.getItem('inform.prefs') || '{}');
          var t = (p.state && p.state.theme) || 'system';
          var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
          document.documentElement.classList.toggle('dark', dark);
          var lang = p.state && p.state.language;
          if (lang) document.documentElement.lang = lang;
          var size = p.state && p.state.textSize;
          if (size && size !== 'normal') document.documentElement.setAttribute('data-text-size', size);
        } catch (e) {}
      })();
