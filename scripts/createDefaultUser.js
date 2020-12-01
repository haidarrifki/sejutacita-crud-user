const model = require('../models');
const { hash } = require('../helpers/encryption');

const createDefaultUser = async () => {
  const totalUser = await model.User.countDocuments();
  if (totalUser === 0) {
    const passwordHash = await hash('johndoe');
    await model.User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      role: 'admin',
      username: 'johndoe',
      password: passwordHash,
      address: 'Surakarta'
    });
  }
}

module.exports = createDefaultUser;