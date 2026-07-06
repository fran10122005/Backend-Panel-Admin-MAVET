const models = require('./src/models');
const fs = require('fs');
const { execSync } = require('child_process');

for (const modelName of Object.keys(models)) {
  if (modelName === 'sequelize') continue;
  try {
    const result = execSync(`findstr /S /M /C:"${modelName}" src\\*.*`).toString();
    const lines = result
      .trim()
      .split('\n')
      .filter((line) => !line.includes('models\\') && !line.includes('src\\models\\index.js'));
    console.log(`${modelName}: ${lines.length} usages`);
    if (lines.length === 0) {
      console.log(`>>> ${modelName} MIGHT BE UNUSED`);
    }
  } catch (e) {
    console.log(`${modelName}: 0 usages (error)`);
    console.log(`>>> ${modelName} MIGHT BE UNUSED`);
  }
}
