
import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function hashPassword(plainTextPassword) {
  return await bcrypt.hash(plainTextPassword, saltRounds);
}

export async function comparePasswords(plainTextPassword, hashedPassword) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
}
