const Fastify = require('fastify');
const fastify = Fastify();
const { setupDb } = require('./db'); 

// MySQL database
setupDb(fastify);

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

