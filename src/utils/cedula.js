const normalizeCedula = (cedula) => {
  if (!cedula) return null;
  let c = String(cedula).trim().toUpperCase();
  c = c.replace(/\./g, '');
  c = c.replace(/\s+/g, '');

  if (/^[VE]\d+/.test(c)) {
    c = c[0] + '-' + c.slice(1);
  } else if (/^\d+/.test(c)) {
    c = 'V-' + c;
  }
  return c;
};

module.exports = {
  normalizeCedula,
};
