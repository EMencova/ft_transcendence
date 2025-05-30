const Fastify = require('fastify');
const fastify = Fastify();
const { setupDb } = require('./db'); 
const path = require('path');

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

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../frontend'),
  prefix: '/', // So http://localhost:3000 loads index.html
});

