const MongoConnect = require('../lib/mongo');
const bcrypt = require('bcryptjs');

class UserService {
  constructor() {
    this.mongodb = new MongoConnect()
    this.collection = 'users'
  }

  async getUser({ email }) {
    try {
      const [user] = await this.mongodb.getAll(this.collection, { email })  
      return user
    } catch (error) {
      throw new Error(error);
    }
  }

  async createUser(user) {
    try {
      const { email, password } = user
      const hashedPassword = await bcrypt.hash(password, 10);

      const createdUser = await this.mongodb.create(this.collection, {
        email, password: hashedPassword
      }) 

      return createdUser
    } catch (error) {
      throw new Error(error);
    }
  }

  async getOrCreateUser({ user }) {
    const queriedUser = await this.getUser({ email: user.email });

    if (queriedUser) {
      return queriedUser;
    }

    await this.createUser({ user });
    return await this.getUser({ email: user.email });
  }
}

module.exports = UserService;