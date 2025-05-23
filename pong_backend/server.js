const Fastify = require('fastify');
const fastify = Fastify();
const { setupDb, createUser } = require('./db');


fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/json-body-parser'));


setupDb(fastify);

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

fastify.post('/register', async (req, reply) => {
  const { username, password } = req.body;

const result = await createUser(fastify.db, username, password);

  if (result.success) {
    return { message: 'User created!' };
  } else {
    reply.status(500);
    return { error: result.error };
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on port 3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

