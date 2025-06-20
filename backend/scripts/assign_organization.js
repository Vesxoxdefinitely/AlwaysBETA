// Скрипт для массового назначения организации пользователям
const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/always_a_helper';

async function assignOrgToUsers(orgName, userEmails) {
  await mongoose.connect(MONGO_URI);
  let org = await Organization.findOne({ name: orgName });
  if (!org) {
    org = new Organization({ name: orgName });
    await org.save();
    console.log('Создана организация:', orgName);
  }
  const res = await User.updateMany(
    { email: { $in: userEmails } },
    { $set: { organization: org._id } }
  );
  console.log(`Обновлено пользователей: ${res.nModified || res.modifiedCount}`);
  await mongoose.disconnect();
}

// Пример использования:
// node assign_organization.js "OrgName" "user1@mail.com,user2@mail.com"
if (require.main === module) {
  const [orgName, emails] = process.argv.slice(2);
  if (!orgName || !emails) {
    console.log('Использование: node assign_organization.js "OrgName" "user1@mail.com,user2@mail.com"');
    process.exit(1);
  }
  assignOrgToUsers(orgName, emails.split(','))
    .then(() => console.log('Готово'))
    .catch(err => { console.error(err); process.exit(1); });
}
