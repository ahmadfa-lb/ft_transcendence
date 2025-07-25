const { db } = require('../db/initDb');
const bcrypt = require('bcrypt');
const Session = require('../models/Session');
const User = require('../models/User');
const { generateTokens } = require('../utils/jwtUtils');
const UserToken = require('../models/UserToken');
const axios = require('axios');
const { validatePassword, validateNickname, capitalizeFullName } = require('../utils/validationUtils');

const SECRET_KEY = process.env.JWT_SECRET_KEY;

const authenticateUser = async (email, password) => {
	const query = `SELECT * FROM Users WHERE email = ?`;

	return new Promise((resolve, reject) => {
		db.get(query, [email], async (err, user) => {
			if (err) {
				reject(new Error("Database error"));
				return;
			}
			if (!user) {
				reject(new Error("Incorrect email"));
				return;
			}
			if (user && !user.is_active) {
				reject(new Error("User not active"));
				return;
			}
			if (user && !user.password) {
				reject(new Error("Invalid password"));
				return;
			}
			const isValid = await bcrypt.compare(password, user.password);
			if (!isValid) {
				reject(new Error("Invalid password"));
				return;
			}

			resolve(user);
		});
	});
};

const generateNickname = async (userId) => {
	const randomString = Math.random().toString(36).substring(2, 7);
	const nickname = `user${userId}${randomString}`;

	if (!validateNickname(nickname) || await User.findByNickname(nickname)) {
		return generateNickname(userId);
	}
	return nickname;
};

class AuthController {

	static async getCurrentUser(request, reply) {
		try {
			const refreshToken = request.cookies.refreshToken;
			if (!refreshToken) {
				return reply.code(401).send({ message: "No session found" });
			}
	
			let decoded;
			try {
				decoded = request.server.jwt.verify(refreshToken, SECRET_KEY);
			} catch (err) {
				reply.clearCookie('refreshToken');
				return reply.code(401).send({ message: "Invalid session" });
			}
	
			const user = await User.findById(decoded.userId);
			if (!user || !user.is_active) {
				reply.clearCookie('refreshToken');
				return reply.code(401).send({ message: "User not found or inactive" });
			}
	
			const { accessToken } = await generateTokens(user, reply.server);
			
			return reply.code(200).send({
				userId: user.id,
				nickname: user.nickname,
				email: user.email,
				fullName: user.full_name,
				age: user.age,
				country: user.country,
				language: user.language || 'en',
				avatarUrl: user.avatar_url,
				is2faEnabled: user.is_2fa_enabled,
				createdAt: user.created_at,
				accessToken: accessToken
			});
		} catch (err) {
			return reply.code(500).send({ message: "Error validating session", error: err.message });
		}
	}

	static async login(request, reply) {
		const { email, password } = request.body;
		try {
			const user = await authenticateUser(email, password);
			const userId = user.id;
			if (!user.is_2fa_enabled) {
				const { accessToken, refreshToken } = await generateTokens(user, reply.server);
				const sessId = await Session.create({ userId, accessToken, refreshToken });
				const session = await Session.getById(sessId);
				await User.updateUserStatus(userId, { status: "online" });

				console.log('Refresh token (first 20 chars):', refreshToken.substring(0, 20));
				
				reply.setCookie('refreshToken', refreshToken, {
					httpOnly: true,
					secure: false,
					sameSite: 'strict',
					maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
					path: '/',
					domain: undefined
				});
				
				
				return reply.code(200).send({
					require2FA: false, 
					sessUUID: session.uuid, 
					accessToken: accessToken
				});
			} else {
				const sessId = await Session.create({ userId, accessToken: null, refreshToken: null });
				const session = await Session.getById(sessId);
				return reply.code(200).send({ require2FA: true, sessUUID: session.uuid });
			}
		} catch (err) {
			if (err.message === "Incorrect email" || err.message === "Invalid password") {
				return reply.code(404).send({ message: err.message });
			}
			if (err.message === "User not active")
				return reply.code(403).send({ message: `${err.message}! check your inbox and activate your account` });
			return reply.code(500).send({ message: 'Error with login from the server!', error: err.message });
		}
	}

	static async logout(request, reply) {
		const { sessionUUID } = request.params;
		try {
			const session = await Session.getByUUID(sessionUUID);
			if (!session)
				return reply.code(404).send({ message: "Session not found!" });
			else {
				await Session.deleteByUUID(sessionUUID);
				await User.updateUserStatus(session.user_id, { status: "offline" });
				return reply.code(200).send({ message: "User logged out successfully!" });
			}
		} catch (err) {
			return reply.code(500).send({ message: "Error with logout from the server!", error: err.message });
		}
	}

	static async verifyResetEmail(request, reply) {
		const { email } = request.body;
		const passwordResetEmailMessage = (fullName, uuid) => {
			const host = request.headers.host.split(':')[0];
			const protocol = request.headers['x-forwarded-proto'] || 'https';
			return `
				<div>
					<p>Dear ${fullName}, </p>
					<p>Please follow the below link to reset your password. </p>
					<p>${protocol}://${host}:4443/reset_password/${uuid} </p>
					<p>Have a nice day! </p>
				</div>
			`;
		}
		try {
			const user = await User.findByEmail(email);
			if (!user)
				return reply.code(404).send({ message: "User not found!" });
			if (user && !user.is_active)
				return reply.code(403).send({ message: "User not active!" });
			const userId = user.id;
			const uuid = crypto.randomUUID();
			try {
				await axios.post(`http://notifications:3003/api/notifications/email`, {
					recipientId: userId,
					content: {
						subject: "Reset password email",
						email: user.email,
						body: passwordResetEmailMessage(user.full_name, uuid)
					}
				});
				await UserToken.create({ userId, activationToken: uuid, tokenType: "reset_password" });
				return reply.code(200).send({ message: "Email sent successfully!" });
			} catch (err) {
				return reply.code(500).send({ message: "Error sending email request!", error: err.message });
			}
		} catch (err) {
			return reply.code(500).send({ message: "Error verifying the email for the password reset!", error: err.message });
		}
	}

	static async validateResetPassword(request, reply) {
		const { uuid } = request.params;
		const { password, verifyPassword } = request.body;
		try {
			const tokenRecord = await UserToken.getByToken(uuid);
			if (!tokenRecord)
				return reply.code(404).send({ message: "Token not found!" });
			if (tokenRecord.token_type !== "reset_password")
				return reply.code(403).send({ message: "Token is not for reset password!" });
			const expiresAt = tokenRecord.expires_at;
			const userId = tokenRecord.user_id;
			const tokenExpirationTime = new Date(expiresAt).getTime();
			const currentTime = new Date().getTime();

			if (currentTime > tokenExpirationTime) {
				await UserToken.deleteByToken(UserToken);
				return reply.code(400).send({ message: "Token has expired!" });
			}
			const user = await User.findById(userId);
			if (!user)
				return reply.code(404).send({ message: "User not found!" });
			if (user && !user.is_active)
				return reply.code(403).send({ message: "User not active!" });
			if (!validatePassword(password) || !validatePassword(verifyPassword))
				return reply.code(400).send({ message: "Incorrect password format!" });
			if (password !== verifyPassword)
				return reply.code(400).send({ message: "passwords didn't match!" });
			const hashedPassword = await bcrypt.hash(password, 10);
			await User.updateUserPassword(userId, { password: hashedPassword });
			await UserToken.deleteByToken(uuid);
			return reply.code(200).send({ message: "password changed successfully!" });
		} catch (err) {
			return reply.code(500).send({ message: "Error resetting password!", error: err.message });
		}
	}

	static async activateUser(request, reply) {
		const { token } = request.params;
		try {
			const tokenRecord = await UserToken.getByToken(token);
			if (!tokenRecord)
				return reply.code(404).send({ message: "Token not found!" });
			if (tokenRecord.token_type !== "account_activation")
				return reply.code(403).send({ message: "Token is not for account activation!" });
			const expiresAt = tokenRecord.expires_at;
			const userId = tokenRecord.user_id;
			const tokenExpirationTime = new Date(expiresAt).getTime();
			const currentTime = new Date().getTime();

			if (currentTime > tokenExpirationTime) {
				await UserToken.deleteByToken(token);
				await User.delete(userId);
				return reply.code(400).send({ message: "Token has expired!" });
			}
			const user = await User.findById(userId);
			if (!user)
				return reply.code(404).send({ message: "User not found!" });
			await User.activateUser(userId);
			await UserToken.deleteByToken(token);
			const host = request.headers.host.split(':')[0];
			const protocol = request.headers['x-forwarded-proto'] || 'https';
			return reply.redirect(`${protocol}://${host}/account-verified?u=${user.nickname}&e=${user.email}`);
		} catch (err) {
			return reply.code(500).send({ message: "Error activating the account!", error: err.message });
		}
	}

	static async googlesignIn(request, reply) {
		const { email, name, country, image_url } = request.body;
		try {
			let user = await User.findByEmail(email);
			if (!user) {
				const userData = {
					email: email,
					password: null,
					nickname: null,
					full_name: capitalizeFullName(name),
					age: null,
					image_url: image_url,
					country: country,
				};
				const newUserId = await User.create(userData);
				if (!newUserId) {
					throw new Error("Failed to create user");
				}
				const nickname = await generateNickname(newUserId);
				await User.updateUserNickname(newUserId, { nickname: nickname });
				user = await User.findById(newUserId);
			}
			const userId = user.id;
			if (!user.is_active)
				await User.activateUser(userId);
			if (!user.is_2fa_enabled) {
				const { accessToken, refreshToken } = await generateTokens(user, reply.server);
				const sessId = await Session.create({ userId, accessToken, refreshToken });
				const session = await Session.getById(sessId);
				await User.updateUserStatus(userId, { status: "online" });
				reply.setCookie('refreshToken', refreshToken, {
					httpOnly: true,
					secure: false,
					sameSite: 'strict',
					maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
					path: '/',
					domain: undefined
				});
				
				return reply.code(200).send({ 
					require2FA: false, 
					sessUUID: session.uuid, 
					accessToken 
				});
			}
			else {
				const sessId = await Session.create({ userId, accessToken: null, refreshToken: null });
				const session = await Session.getById(sessId);
				return reply.code(200).send({ require2FA: true, sessUUID: session.uuid });
			}
		} catch (err) {
			return reply.code(500).send({ message: "Error with remote authentication", error: err.message });
		}
	}
}

module.exports = AuthController;