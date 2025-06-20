const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true }, // рабочий почтовый адрес организации
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employees: [{ type: String }], // список email сотрудников
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Organization', OrganizationSchema);
