const jwt = require('jsonwebtoken');
require('dotenv').config();
const token = jwt.sign({ id: 'USU-00014' }, process.env.JWT_SECRET || 'secret', {
  expiresIn: '1h',
});
console.log(token);
