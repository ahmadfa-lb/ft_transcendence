const UserController = require('../controllers/UserController');

module.exports = async (fastify) => {
	fastify.post('/auth/users', UserController.createUser);
	fastify.get('/auth/users', UserController.getAllUsers);
	fastify.get('/auth/users/id/:id', UserController.getUserById);
	fastify.get('/auth/users/email/:email', UserController.getUserByEmail)
	fastify.get('/auth/users/nickname/:nickname', UserController.getUserByNickname);
	fastify.put('/auth/users/:id', UserController.updateUser);
	fastify.delete('/auth/users/:id', UserController.deleteUser);
	fastify.patch('/auth/users/:id', UserController.patchUser);
};