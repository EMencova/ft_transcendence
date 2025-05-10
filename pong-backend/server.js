const Fastify = require('fastify');

// Create a Fastify instance
const fastify = Fastify();

// Declare a simple route
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

// Correct way to start the server
fastify.listen(3000, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);  // Exit if an error occurs
  }
  console.log(`Server listening at ${address}`);
});

