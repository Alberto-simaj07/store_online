import bcrypt from 'bcrypt';

const plain = '123456';          // cambia aquí si quieres otra clave
const rounds = 10;

const run = async () => {
  const hash = await bcrypt.hash(plain, rounds);
  console.log('HASH ->', hash);
};
run();
