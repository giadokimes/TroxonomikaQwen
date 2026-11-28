/* Λεπτός προσαρμογέας: διαβάζει το violations.js (χωρίς αντίγραφο δεδομένων)
   και το services.js. Καμία παράβαση δεν ξαναγράφεται εδώ. */
window.TROXO = (() => {
  const fail = m => { window.TROXO_ERROR = m; return null; };
  let raw = null, ver = '', src = '';
  try { if (typeof data !== 'undefined' && Array.isArray(data)) raw = data; } catch (e) {}
  try { if (typeof DATA_VERSION !== 'undefined') ver = String(DATA_VERSION); } catch (e) {}
  try { if (typeof DATA_SOURCE !== 'undefined') src = String(DATA_SOURCE); } catch (e) {}
  if (!raw) return fail('Λείπει το violations.js ή δεν περιέχει πίνακα data.');
  const S = window.TROXO_SERVICES;
  if (!S || !Array.isArray(S.list) || !S.list.length) return fail('Λείπει ή είναι κενό το services.js.');

  const LAT = { A:'Α',B:'Β',E:'Ε',Z:'Ζ',H:'Η',I:'Ι',K:'Κ',M:'Μ',N:'Ν',O:'Ο',P:'Ρ',T:'Τ',Y:'Υ',X:'Χ' };
  const fold = s => String(s ?? '').toUpperCase().replace(/[A-Z]/g, c => LAT[c] || c).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const baseArticle = a => { const m = /^(\d{1,3})(?=[§\s(,]|$)/.exec(String(a || '').trim()); return m && +m[1] > 0 && +m[1] <= 150 ? m[1] : ''; };
  const stem = w => w.length >= 5 ? w.replace(/(ΟΥΣ|ΟΥ|ΩΝ|ΗΣ|ΕΣ|ΑΣ|ΟΣ|ΟΝ|ΩΣ|Σ|Η|Α|Ο|Ω|Ε|Υ|Ι)$/, '') : w;

  const seen = new Set(), catalog = [];
  raw.forEach(v => {
    if (!v || !v.name || !v.article) return;
    const k = fold(v.article) + '::' + fold(v.name);
    if (seen.has(k)) return; seen.add(k);
    const info = String(v.fullDescription || v.details || '');
    const e = {
      id: v.id, cat: v.category || '', name: v.name, article: v.article, base: baseArticle(v.article),
      fine: String(v.fine ?? ''), suspend: String(v.suspend || '-'), pts: Number(v.points) || 0,
      criminal: !!v.criminal, half: !!v.half, sev: Number(v.severity) || 0, info,
      details: String(v.details || ''), offloader: v.offloader_fine != null ? String(v.offloader_fine) : ''
    };
    e.hay = fold(e.name + ' ' + e.cat + ' ' + info + ' ' + e.details);
    e.artKey = fold(e.article).replace(/[§\s.,()\-]/g, '');
    e.nameKey = fold(e.name);
    e.stems = [...new Set(fold(e.name + ' ' + info + ' ' + e.cat).split(/[^Α-Ω]+/).filter(w => w.length >= 4).map(stem))];
    catalog.push(e);
  });
  if (catalog.length < 100) return fail('Το violations.js φαίνεται ελλιπές (' + catalog.length + ' εγγραφές).');
  catalog.sort((a, b) => a.id - b.id);

  const cats = [...new Set(catalog.map(v => v.cat))];
  const FREQ_DEF = [
    ['Υπερβολική ταχύτητα', v => v.cat === 'ταχύτητα'],
    ['Μέθη', v => v.cat === 'αλκοόλ'],
    ['ΚΤΕΟ', v => /ΚΤΕΟ/.test(fold(v.name))],
    ['Διόδια', v => /ΔΙΟΔΙ/.test(fold(v.name + ' ' + v.info))],
    ['Στάθμευση', v => v.cat === 'στάθμευση']
  ];
  const freq = {};
  FREQ_DEF.forEach(([label, test]) => {
    const set = catalog.filter(test), cnt = {};
    set.forEach(v => { if (v.base) cnt[v.base] = (cnt[v.base] || 0) + 1; });
    freq[label] = { article: Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || +a - +b)[0] || '', n: set.length };
  });

  const services = S.list.map(s => ({ ...s, hay: fold(s.name + ' ' + s.city + ' ' + s.nomos + ' ' + s.cat + ' ' + s.region) }));
  const svcIndex = S.index.map(x => ({ ...x, hay: fold(x.nomos) }));

  return {
    ok: true, version: 1, dataVersion: ver, source: src, catalog, cats, freq,
    viols: FREQ_DEF.map(f => f[0]), services, svcIndex, cityTitle: S.cityTitle, fold, baseArticle
  };
})();
