const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany().then(u => {
  console.log(JSON.stringify(u.map(x => ({ email: x.email, role: x.role, name: x.name })), null, 2));
  return p.$disconnect();
});