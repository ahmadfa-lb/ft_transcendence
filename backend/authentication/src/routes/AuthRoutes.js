const AuthController = require('../controllers/AuthController');

module.exports = async (fastify) => {
	fastify.get('/auth/me', AuthController.getCurrentUser);
	fastify.post('/auth/login', AuthController.login);
	fastify.post('/auth/logout/:sessionUUID', AuthController.logout);
	fastify.post('/auth/resetPassword/email', AuthController.verifyResetEmail);
	fastify.post('/auth/resetPassword/reset/:uuid', AuthController.validateResetPassword);
	fastify.get('/auth/activate/:token', AuthController.activateUser);
	fastify.post('/auth/google/signIn', AuthController.googlesignIn);
};