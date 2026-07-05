// ═══════════════════════════════════════════════════════════════
//  SAFETY GUARD — Evita que sync({ force: true }) borre la BD real
// ═══════════════════════════════════════════════════════════════
if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    [
      '═══════════════════════════════════════════════════════',
      '  ERROR DE SEGURIDAD: NODE_ENV no es "test"',
      '═══════════════════════════════════════════════════════',
      '  Los tests harían sync({ force: true }) en la BD real.',
      '',
      '  En PowerShell ejecute:',
      '    $env:NODE_ENV="test"; npm test',
      '',
      '  O use directamente:',
      '    npx cross-env NODE_ENV=test jest',
      '═══════════════════════════════════════════════════════',
    ].join('\n')
  );
}
