const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.model.js')) results.push(file);
    }
  });
  return results;
}

const files = walk(
  'c:/Users/USUARIO/OneDrive/Documents/Universidad/Trabajos/servicio/Panel_administrativo/Mavet_Global/FRONTED/Mavet/Backend-Panel-Admin-MAVET/src/modules'
);

let changed = 0;
files.forEach((f) => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes("if (!pkField || pkField === 'id') return;")) {
    content = content.replace(
      "if (!pkField || pkField === 'id') return;",
      "if (!pkField || (pkField === 'id' && instance.rawAttributes.id.type.key !== 'STRING')) return;"
    );
    fs.writeFileSync(f, content);
    changed++;
  }
});
console.log('Fixed hooks in ' + changed + ' models');
