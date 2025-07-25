export default {
	statusOn: "online",
	statusOf: "offline",
	viewProfile: "View Profile",
	logout: "Logout",
	home: {
		header: {
			play: "Play",
			leaderBoard: "Leaderboard",
			chat: "Chat",
			search: "search here...",
			noUsersFound: "No users found",
			noNotif: 'No notifications yet!',
		},
		title: "Neon Pong",
		tagline: "Compete • Chat • Dominate<br>The Ultimate Pong Experience Awaits!",
		register: "Register now!",
		playAI: "Play vs AI",
		playLocaly: "Play Localy",
		startTournament: "Start a Tournament",
		playOnline: "Play Online",
		chatWithFriends: "Chat with Friends",
		footer: {
			developed: "Developed by",
			rights :"All intellectual property rights reserved."
		},
	},
	register: {
		signin: {
			title: "Welcome Back!",
			emailPlaceholder: "Your Email here!",
			password: "Password",
			passwordPlaceholder: "Your Password here!",
			forgotpass: "forgot password?",
			signin_btn: "Sign In",
			acc_question: "Don't have an Account?",
			signup_btn: "Let's SignUp"
		},
		signup: {
			title: "Create a new Account",
			emailPlaceholder: "Enter an email: user@example.com",
			nickname: "Nickname",
			nicknamePlaceholder: "Enter a Nickname",
			passwordPlaceholder: "Enter a strong Password",
			passwordConfirmTitle: "Confirm Password",
			passwordConfirm: "Retype your password",
			fullname: "Full Name",
			fullnamePlaceholder: "Enter your Full Name",
			age: "Age",
			agePlaceholder: "Enter your Age",
			country: "Country",
			countryPlaceholder: "Enter your Country",
			signup_btn: "Sign Up",
			acc_question: "Already have an Account?",
			signin_btn: "Let's Login"
		},
		sendEmail: {
			resetPass: "Reset Your Password",
			info: "Enter the email associated with your account and will send you password reset instructions.",
			sendEmailBtn: "Send Email",
			backToSignin: "Back to signin",
			resendEmail: "Resend Email"
		},
		twoFactor: {
			title: "Two-Factor Authentication",
			info: "Enter the 6-digits code from your authenticator app",
			verifyBtn: "Verify",
			back: "Back to sign In",
		},
		validation: {
			email: "Enter a valid email address (e.g., user@example.com)",
			password: "Password must be at least 8 characters and include 1 uppercase, 1 lowercase, and 1 special character.",
			passNotMatch: "Passwords do not match.",
			nickname: "Nickname must be 3-16 characters long and can only contain letters, numbers, _, or -",
			fullName: "Full name must be at least 3 characters.",
			fullName2: "Please enter exactly two names: first and last name.",
			fullName3: "Each name must be at least 3 characters long.",
			names: 'Names should only contain alphabetical characters.',
			age: 'Age should be a number between 1 and 100.'
		},
		or: "OR",
		continueGoogle: "Continue with google"
	},
	play: {
		title: "Choose your Mode",
		vsAI: "VS AI",
		vsAIInfo: "Test your skills against our smart AI",
		localPlayer: "Local Multiplayer",
		localPlayerInfo: "Play with a friend on the same device",
		tournament: "Online Tournament",
		tournamentInfo: "Compete in a knockout tournament",
		online: "Online Multiplayer",
		onlineInfo: "Challenge players worldwide",
		tapToSelect: "Tap to select",
		localAI: {
			difficultyPopup: {
				title: "CHOOSE DIFFICULTY",
				easy: "EASY",
				medium: "MEDIUM",
				hard: "HARD",
			},
		},
		onlineGame: {
			friendBtn: "Play with a Friend",
			onlineShowdownBtn: "Online Showdown",
			vsFriend: "Vs Friends",
			or: "OR",
			vsRivals: "Vs Rivals",
			findFriend: "Find a Friend",
			searchFriends: "Search for friends...",
			noUsersSearch: "No users found. Try a different search.",
			findingOponent: "Finding Opponent...",
			searching: "Searching...",
			searchingForRivals: "Searching for Rivals...",
			oponentFound: "Opponent Found!",
			cancel: "Cancel",
			invite: "Invite",
			positionInQueue: "Position in Queue",
			playAgain: "Play Again",
			youWon: "You Won!",
			youLost: "You Lost!",
			finalScore: "Final Score",
			eloChange: "ELO Change",
			opponent: "Opponent",
			opponentElo: "Opponent ELO",
			startingIn: "Starting in",
			matchFound: "Match Found!",
		},
		"tournaments": {
			"title": "Tournaments",
			"createTab": "Create Tournament",
			"joinTab": "Join Tournament", 
			"myTournamentsTab": "My Tournaments",
			"backToTournaments": "Back to Tournaments",
			"loading": "Loading tournament details...",
			alert: 'Tournament Alert',
			
			"createTournament": {
			  "title": "Create New Tournament",
			  "name": "Tournament Name",
			  "namePlaceholder": "Enter tournament name",
			  "nameError": "Tournament name must be at least 3 characters",
			  "playerCount": "Number of Players",
			  "players": "Players",
			  "createButton": "Create Tournament",
			  "creating": "Creating...",
			  "waitingRoom": "Waiting Room",
			  "currentParticipants": "Current Participants",
			  "tournamentStart": "Tournament will start when",
			  "tournamentStartContinue": "players join",
			  "startTournament": "Start Tournament",
			  "leaveTournament": "Leave Tournament",
			  "leaveConfirmation": "Are you sure you want to leave this tournament?",
			  "leaveError": "Failed to leave tournament. Please try again.",
			  "waitingForPlayers": "Waiting for players...",
			  "rank": "Rank",
			  "round": "Round",
			  "final": "Final",
			  "matchCompleted": "Match Completed",
			  "startSoon": "Match will start soon",
			  "TBD": "TBD",
			  "pts": "pts"
			},
			
			"joinTournament": {
			  "loading": "Loading tournaments...",
			  "searchPlaceholder": "Search tournaments...",
			  "noTournaments": "No tournaments available",
			  "registering": "Registering",
			  "inProgress": "In Progress", 
			  "join": "Join",
			  "full": "Full"
			},

			"inTournament": {
				"clickToViewMatch": "Click on a match to view details. Matches will become playable when it's your turn.",
				"tournamentInProgress": "Tournament in Progress",
				"status": "Status",
				"matchDetails": "Match Details",
				"vs": "VS",
				"winner": "Winner",
				"tbd": "TBD",
				"viewFinalBrackets": "View Final Brackets"
			},
			
			"myTournaments": {
			  "loading": "Loading your tournaments...",
			  "noTournaments": "No tournaments available",
			  createOrJoin: "Create or join a tournament to start playing!",
			},
			
			"matchNotification": {
			  "title": "Tournament Match Ready!",
			  "message": "Your next tournament match is ready to begin.",
			  "elo": "ELO",
			  "accept": "Accept Match"
			},
			
			"matchResult": {
			  "victory": "Victory!",
			  "defeat": "Defeat",
			  "you": "You", 
			  "eloChange": "ELO Change",
			  "continue": "Continue"
			},
			"TournamentResults": {
				"tournamentResults": "Tournament Results",
				"tournamentCompleted": "Tournament Completed",
				"tournamentFinished": "Tournament Finished",
				"inProgress": "In Progress",
				"completed": "Completed",
				"first": "1st",
				"second": "2nd",
				"third": "3rd"
			}
		  },
		paused: "Game Paused",
		resultsPopup: {
			title: "Wins!",
			finalScore: "Final Score",
			playAgain: "Play Again",
		},
		game: "Game",
		player: "Player",
		unranked: "Unranked",
		"unknownPlayer": "Unknown Player",
		"ai": "AI"
	},
	leaderBoard: {
		title: "Champions",
		rank: "Rank",
		player: "Player",
		wins: "Wins",
		score: "Score"
	},
	chat: {
		nochat: "Select a chat",
		friends: "Friends",
		messageRequests: "Message Requests",
		loadingFriends: "Loading friends...",
		loadingRequests: "Loading chats...",
		noFriends: "No friends yet",
		noFriendsFound: "No friends found",
		noRequests: "No message requests",
		searchFriends: "Search friends...",
		searchRequests: "Search requests...",
		on: "Online",
		off: "Offline",
		errorLoadingFriends: "Error loading friends",
		errorLoadingRequests: "Error loading requests",
		retry: "Retry",
		typeMessage: "Type your message...",
		noMessages: 'No messages yet',
	},
	profile: {
		rank: "Rank: ",
		message: "Message",
		add: "Add", 
		removeFriend: "Remove friend",
		block: "Block",
		unblock: "Unblock",
		requestSent: "request sent",
		infoTab: {
			nickname: "Nickname:",
			title: "Info",
			fullname: "Full Name:",
			age: "Age:",
			country: "Country:",
			memberSince: "Member Since:",
			enable2fa: "Enable 2FA",
			qrcodeScan: "Scan this QR code with your authenticator app",
			generating: "Generating...",
			generateNewQrcode: "validate code",
			saveBtn: "Save",
		},
		statisticsTab: {
			EloProgression: "ELO Rating Progression",
			monthly: "Monthly Wins vs Losses",
			overall: "Overall Win Rate ",
			title: "Statistics",
		},
		historyTab: {
			title: "History",
			oponent: "OPONENT",
			result: "RESULT",
			outcome: "OUTCOME",
			trophies: "TROPHIES",
			played: "PLAYED",
			duration: "DURATION",
			win: "Win",
			lose: "Lose",
			draw: "Draw",
			showing: "Showing",
			of: "of",
			matches: "matches",
			oneVsOne: "1v1",
			friendly: "Friendly",
			tournament: "Tournament"
		},
		socialTab :
		{
			title: "Social",
			friends: "Friends",
			friendRequests: "Friend Requests",
			blockedUsers: "Blocked Users",
			loadingFriendReq: "Loading friend requests...",
			noPendingReq: "No pending friend requests",
			noBlocks: "You haven't blocked any users.",
			failedToLoad: "Failed to load friends",
			noFriends: "No friends found",
			friendRemoved: "Friend removed successfully",
			search: "Search friends...",
			confirmRemoveFriend: "Remove from your friends list?",
			accept: "Accept",
			decline: "Decline",
			unblock: "Unblock",
			blockedOn: "Blocked on",
			oneVoneMatches: "1v1 Matches",
			friendlyMatches: "Friendly Matches",
			tournamentsMatches: "Tournament Matches",
		}
	},
	about: {
		title: "Development Team",
		developer: "Developer",
		moabbasInfo: "Crafting pixel-perfect interfaces with modern web technologies.",
		afarachiInfo: "Bridging frontend beauty with backend functionality seamlessly.",
		jfatfatInfo: "Architecting robust server-side solutions and database systems.",
		conclusion: "Our team combines expertise across the entire development stack to deliver high-performance, scalable web applications with exceptional user experiences.",
	},
	notfound: {
		title: "Page Not Found",
		message: "Oops! The page you're looking for has vanished like a ghost. Let's get you back to the game!",
		homeBtn: "Back to Home"
	},
	status: {
		online: "Online",
		offline: "Offline",
		inGame: "In Game",
	},
	time: {
		ago: "{number} {unit} ago",
		second: "second",
		seconds: "seconds",
		minute: "minute", 
		minutes: "minutes",
		hour: "hour",
		hours: "hours",
		day: "day",
		days: "days", 
		week: "week",
		weeks: "weeks",
		month: "month",
		months: "months",
		year: "year",
		years: "years"
	},
};