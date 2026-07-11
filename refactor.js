const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'src', 'modules');

function generatePrefix(modelName) {
  // Convert ModelName to 3-letter prefix, e.g. Usuario -> USU
  // Role -> ROL, AlumnoRepresentante -> ALR
  let prefix = modelName.substring(0, 3).toUpperCase();
  if (modelName.match(/[A-Z]/g) && modelName.match(/[A-Z]/g).length > 1) {
    // If it's PascalCase with multiple words (e.g. AlumnoRepresentante)
    const caps = modelName.match(/[A-Z]/g);
    if (caps.length >= 3) {
      prefix = caps.slice(0, 3).join('');
    } else {
      prefix = caps[0] + caps[1] + modelName.charAt(modelName.indexOf(caps[1]) + 1).toUpperCase();
      if (prefix.length > 3) prefix = prefix.substring(0, 3);
    }
  }
  return prefix;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.model.js')) {
      if (file === 'Persona.model.js') continue; // Skip Persona as it already has the hook

      let content = fs.readFileSync(fullPath, 'utf8');

      // Match the model name from: const ModelName = sequelize.define('ModelName', ...
      const modelMatch = content.match(/sequelize\.define\(\s*['"`]([^'"`]+)['"`]/);
      if (!modelMatch) continue;

      const modelName = modelMatch[1];
      const prefix = generatePrefix(modelName);

      // 1. Replace DataTypes.INTEGER with DataTypes.STRING(15) for ID fields
      content = content.replace(/type:\s*DataTypes\.INTEGER/g, 'type: DataTypes.STRING(15)');

      // 2. Remove autoIncrement: true
      content = content.replace(/,\s*autoIncrement:\s*true/g, '');
      content = content.replace(/autoIncrement:\s*true\s*,?/g, '');

      // 3. Inject hook
      // We will find the closing bracket of the options object: `}, { tableName: ... });`
      // We will look for the `tableName:` or similar options block and add hooks.
      // Easiest is to replace `tableName: '...',` with `tableName: '...', hooks: { ... },`

      const hookCode = `
    hooks: {
      beforeCreate: async (instance, options) => {
        // Obtenemos el nombre de la clave primaria
        const pkField = instance.constructor.primaryKeyAttribute;
        if (!pkField || pkField === 'id') return; // En caso de tablas pivot sin PK explícito
        
        const lastRecord = await instance.constructor.findOne({
          order: [[pkField, 'DESC']],
          transaction: options.transaction,
          raw: true,
          paranoid: false // Para incluir registros eliminados si hay soft deletes
        });

        let newNumber = 1;
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('${prefix}-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('${prefix}-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = \`${prefix}-\${String(newNumber).padStart(5, '0')}\`;
      }
    },`;

      if (content.includes('tableName:')) {
        if (!content.includes('hooks: {')) {
          content = content.replace(/(tableName:\s*['"`][^'"`]+['"`],?)/, `$1${hookCode}`);
        }
      } else {
        // Just before the last });
        if (!content.includes('hooks: {')) {
          content = content.replace(/\}\);\s*module\.exports/, `,${hookCode}\n});\nmodule.exports`);
        }
      }

      fs.writeFileSync(fullPath, content);
      console.log(`Updated ${file} with prefix ${prefix}`);
    }
  }
}

processDirectory(modulesDir);
console.log('Refactor completed.');
