const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();

  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminId = uuidv4();

  // Insert admin user
  await knex('users').insert([
    {
      id: adminId,
      full_name: 'System Administrator',
      email: 'admin@lostfound.com',
      password_hash: adminPassword,
      user_type: 'admin',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      full_name: 'Test Student',
      email: 'student@school.edu',
      password_hash: await bcrypt.hash('student123', 12),
      user_type: 'student',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      full_name: 'Test Staff',
      email: 'staff@school.edu',
      password_hash: await bcrypt.hash('staff123', 12),
      user_type: 'staff',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  console.log('✅ Admin and test users created successfully');
  console.log('📧 Admin email: admin@lostfound.com');
  console.log('🔑 Admin password: admin123');
};