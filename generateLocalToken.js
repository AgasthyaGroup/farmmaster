const jwt = require('jsonwebtoken');

// Generate local JWT token for user "admin"
const token = jwt.sign(
  { userId: '6a1aebeda5f3b7b32d4a29dc', role: 'SUPER_ADMIN', email: 'admin@admin.com' },
  'dev_secret_key_12345',
  { expiresIn: '1d' }
);

console.log("GENERATED_LOCAL_TOKEN:", token);
