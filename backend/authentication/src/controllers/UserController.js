const User = require('../models/User');
const bcrypt = require('bcrypt');
const Session = require('../models/Session');
const saltRounds = 10;
const SECRET_KEY = process.env.JWT_SECRET_KEY;
const { validateEmail, validatePassword, validateNickname, validateFullName, validateAge, capitalizeFullName } = require('../utils/validationUtils');
const UserToken = require('../models/UserToken');
const axios = require('axios');

class UserController {

	static async createUser(request, reply) {
		const { email, password, nickname, full_name, age, country, google_id } = request.body;
		const activationEmailHtml = (activationToken, full_name) => {
			const host = request.headers.host.split(':')[0];
			const protocol = request.headers['x-forwarded-proto'] || 'https';
			return `
				<div>
					<h1>Welcome ${full_name} to our website!</h1>
					<p>Please click on the link below to activate your account</p>
					${protocol}://${host}:4443/authentication/auth/activate/${activationToken}
					<p>Have a nice day!</p>
				</div>
			`;
		}
		console.log(JSON.stringify(request.body, null, 2));
		try {
			if (!validateEmail(email))
				return reply.code(400).send({ message: "Invalid email address!" });
			if (!validatePassword(password))
				return reply.code(400).send({ message: "Invalid password!" });
			if (!validateNickname(nickname))
				return reply.code(400).send({ message: "Invalid nickname!" });
			if (!validateFullName(full_name))
				return reply.code(400).send({ message: "Invalid full name!" });
			if (!validateAge(Number(age)))
				return reply.code(400).send({ message: "Invalid age!" });
			const passwordHash = await bcrypt.hash(password, saltRounds);
			const fullName = capitalizeFullName(full_name);
			const userId = await User.create({ email, password: passwordHash, nickname, full_name: fullName, age, country, google_id });
			const activationToken = crypto.randomUUID();
			await UserToken.create({ userId, activationToken, tokenType: "account_activation" });
			try {
				await axios.post(`http://notifications:3003/api/notifications/email`, {
					recipientId: userId,
					content: {
						subject: "New account is here!",
						email,
						body: activationEmailHtml(activationToken, full_name)
					}
				});

				return reply.code(201).send({ userId });
			} catch (err) {
				return reply.code(500).send({ message: "Error sending email request!", error: err.message });
			}
		} catch (err) {
			if (err.message.includes('Users.nickname'))
				return reply.code(409).send({ key: "nickname", message: "Nickname is already in use!", error: err.message });
			if (err.message.includes('Users.email'))
				return reply.code(409).send({ key: "email", message: "Email is already in use!", error: err.message });
			return reply.code(500).send({ key: "database", message: 'Error creating user', error: err.message });
		}
	}

	static async getAllUsers(request, reply) {
		try {
			const users = await User.getAll();
			reply.code(200).send(users);
		} catch (err) {
			reply.code(500).send({ message: 'Error getting users', error: err.message });
		}
	}

	static async getUserByEmail(request, reply) {
		const { email } = request.params;
		try {
			const user = await User.findByEmail(email);
			if (!user) reply.code(404).send({ message: 'User not found!' });
			else reply.code(200).send(user);
		} catch (err) {
			reply.code(500).send({ message: 'Error getting user by email', error: err.message });
		}
	}

	static async getUserById(request, reply) {
		const { id } = request.params;
		try {
			const user = await User.findById(id);
			if (!user) reply.code(404).send({ message: 'User not found!' });
			else reply.code(200).send(user);
		} catch (err) {
			reply.code(500).send({ message: 'Error getting user by id', error: err.message });
		}
	}

	static async getUserByNickname(request, reply) {
		const { nickname } = request.params;
		const authHeader = request.headers.authorization;
		try {
			if (!authHeader || !authHeader.startsWith('Bearer '))
				return reply.status(401).send({ error: 'Unauthorized: No token provided' });
			const accessToken = authHeader.split(' ')[1];
			let decoded;
			try {
				decoded = request.server.jwt.verify(accessToken, SECRET_KEY);
			} catch (err) {
				if (err.name === 'TokenExpiredError')
					return reply.code(401).send({ message: "Access token expired!" });
				return reply.code(401).send({ message: "Invalid access token" });
			}
			const user = await User.findByNickname(nickname);
			if (!user)
				return reply.code(404).send({ message: "User not found!" });
			return reply.code(200).send(user);
		} catch (err) {
			return reply.code(500).send({ message: "Error getting user by nickname!", error: err.message });
		}
	}

	static async updateUser(request, reply) {
		const { id } = request.params;
		const { nickname, full_name, age, country, avatar_url } = request.body;
		const authHeader = request.headers.authorization;
		try {
			if (!authHeader || !authHeader.startsWith('Bearer '))
				return reply.status(401).send({ error: 'Unauthorized: No token provided' });
			const accessToken = authHeader.split(' ')[1];
			let decoded;
			try {
				decoded = request.server.jwt.verify(accessToken, SECRET_KEY);
			} catch (err) {
				if (err.name === 'TokenExpiredError')
					return reply.code(401).send({ message: "Access token expired!" });
				return reply.code(401).send({ message: "Invalid access token" });
			}
			if (decoded.userId != id)
				return reply.code(403).send({ message: "Token does not belong to this user!" });
			if (!validateNickname(nickname))
				return reply.code(400).send({ message: "Invalid email address!" });
			if (!validateFullName(full_name))
				return reply.code(400).send({ message: "Invalid full name!" });
			if (!validateAge(Number(age)))
				return reply.code(400).send({ message: "Invalid age!" });
			const updatedFullName = capitalizeFullName(full_name);
			const changes = await User.update(id, { nickname, full_name: updatedFullName, age, country, avatar_url });
			if (changes == 0) reply.code(404).send({ message: 'User not found!' });
			else reply.code(200).send({ message: 'User updated successfully!' });
		} catch (err) {
			if (err.message.includes('Users.nickname'))
				return reply.code(409).send({ key: "nickname", message: "Nickname is already in use!", error: err.message });
			reply.code(500).send({ key: "database", message: 'Error updating the user', error: err.message });
		}
	}

	static async deleteUser(request, reply) {
		const { id } = request.params;
		const authHeader = request.headers.authorization;
		try {
			if (!authHeader || !authHeader.startsWith('Bearer '))
				return reply.status(401).send({ error: 'Unauthorized: No token provided' });
			const accessToken = authHeader.split(' ')[1];
			let decoded;
			try {
				decoded = request.server.jwt.verify(accessToken, SECRET_KEY);
			} catch (err) {
				if (err.name === 'TokenExpiredError')
					return reply.code(401).send({ message: "Access token expired!" });
				return reply.code(401).send({ message: "Invalid access token" });
			}
			if (decoded.userId != id)
				return reply.code(403).send({ message: "Token does not belong to this user!" });
			const changes = await User.delete(id);
			if (changes == 0) reply.code(404).send({ message: 'User not found!' });
			else {
				await Session.deleteUserSessions(id);
				// Remove the uploads directory for this user if it exists
				const userDir = path.join(__dirname, '../../uploads', `user${id}`);
				if (fs.existsSync(userDir)) {
					await fs.promises.rm(userDir, { recursive: true, force: true });
				}
				reply.code(200).send({ message: 'User deleted successfully!' });
			}
		} catch (err) {
			reply.code(500).send({ message: 'Error deleting the user', error: err.message });
		}
	}

	static async patchUser(request, reply) {
		const activationEmailHtml = (activationToken, email, full_name) => {
			// Get the host from the request headers
			const host = request.headers.host.split(':')[0]; // Remove port if present
			const protocol = request.headers['x-forwarded-proto'] || 'https';
			return `
				<div>
					<h1>Welcome ${full_name} to our website!</h1>
					<p>After updating your email to ${email}, please click on the link below to activate your account</p>
					${protocol}://${host}:4443/authentication/auth/activate/${activationToken}
					<p>Have a nice day!</p>
				</div>
			`;
		}
		try {
			const { id } = request.params;
			const updates = Object.keys(request.body);
			const allowedUpdates = ['nickname', 'full_name', 'age', 'country', 'email', 'language'];
			const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
			const authHeader = request.headers.authorization;
			if (!authHeader || !authHeader.startsWith('Bearer '))
				return reply.status(401).send({ error: 'Unauthorized: No token provided' });
			const accessToken = authHeader.split(' ')[1];
			let decoded;
			try {
				decoded = request.server.jwt.verify(accessToken, SECRET_KEY);
			} catch (err) {
				if (err.name === 'TokenExpiredError')
					return reply.code(401).send({ message: "Access token expired!" });
				return reply.code(401).send({ message: "Invalid access token" });
			}
			if (!isValidOperation) {
				return reply.code(400).send({ message: 'Invalid updates!' });
			}
			if (decoded.userId != id)
				return reply.code(403).send({ message: "Token does not belong to this user!" });
			const user = await User.findById(id);
			if (!user)
				return reply.code(404).send({ message: "User not found!" });
			const { email, nickname, full_name, age, country, language } = request.body;
			if (typeof language !== 'undefined' && !['en', 'fr', 'ar'].includes(language))
				return reply.code(400).send({ message: "Invalid language! Must be 'en', 'fr', or 'ar'" });		
			if (typeof email !== 'undefined' && !validateEmail(email))
				return reply.code(400).send({ message: "Invalid email address!" });
			if (typeof nickname !== 'undefined' && !validateNickname(nickname))
				return reply.code(400).send({ message: "Invalid nickname!" });
			if (typeof full_name !== 'undefined' && !validateFullName(full_name))
				return reply.code(400).send({ message: "Invalid full name!" });
			if (typeof age !== 'undefined' && !validateAge(Number(age)))
				return reply.code(400).send({ message: "Invalid age!" });
			if (typeof country !== 'undefined' && !country)
				return reply.code(400).send({ message: "Invalid country!" });

			const updateData = {};
			if (email !== undefined) updateData.email = email;
			if (nickname !== undefined) updateData.nickname = nickname;
			if (full_name !== undefined) updateData.full_name = capitalizeFullName(full_name);
			if (age !== undefined) updateData.age = age;
			if (country !== undefined) updateData.country = country;
			if (language !== undefined) updateData.language = language;
			if (updateData.email !== undefined) {
				const activationToken = crypto.randomUUID();
				await UserToken.create({ userId: id, activationToken, tokenType: "account_activation" });
				try {
					const fullName = typeof full_name !== 'undefined' ? full_name : user.full_name;
					await axios.post(`http://notifications:3003/api/notifications/email`, {
						recipientId: id,
						content: {
							subject: "Activating your account due to email changing",
							email,
							body: activationEmailHtml(activationToken, updateData.email, fullName)
						}
					});
				} catch (err) {
					return reply.code(500).send({ message: "Error sending email request!", error: err.message });
				}
			}
			const changes = await User.updateProfile(id, updateData);
			if (changes == 0)
				reply.code(404).send({ message: 'User not found!' });
			else
				reply.code(200).send({ message: 'User updated successfully!' });
		} catch (err) {
			if (err.message.includes('Users.nickname'))
				return reply.code(409).send({ key: "nickname", message: "Nickname is already in use!", error: err.message });
			if (err.message.includes('Users.email'))
				return reply.code(409).send({ key: "email", message: "Email is already in use!", error: err.message });
			reply.code(500).send({ message: 'Error Editing User info', error: err.message });
		}
	}
}

module.exports = UserController;