import HomePage from "./pages/home.js";
import RegisterPage from "./pages/register.js";
import PlayPage from "./pages/play.js";
import LocalPongPage from "./pages/localMultiplayer.js";
import NotFound from "./pages/notfound.js";
import ChatPage from "./pages/chat.js";
import LeaderBoardPage from "./pages/leaderBoard.js"
import AboutPage from "./pages/about.js";
import { Page } from "./types/types.js";
import PlayVsAI from "./pages/PlayVsAI.js"
import { Lang, setLanguage } from "./languages/LanguageController.js";
import TournamentPage from "./pages/tournaments.js";
import OnlineGame from './pages/online-game.js';
import CreateTournamentPage from './pages/create-tournament.js';

const routes: { [key: string]: Page } = {
  "/": HomePage,
  "/register": RegisterPage,
  "/register/twofactor": RegisterPage,
  "/reset_password/:uuid": RegisterPage,
  "/play": PlayPage,
  "/play/local-ai": PlayVsAI,
  "/play/local-multi": LocalPongPage,
  "/play/online-game": OnlineGame,
  "/play/tournaments": TournamentPage,
  "/tournaments/create": CreateTournamentPage,
  "/chat": ChatPage,
  "/chat/:uName": ChatPage,
  "/leader-board": LeaderBoardPage,
  "/about-us": AboutPage
};

// export function refreshRouter() {
//   const path = window.location.pathname;
//   const page = routes[path] || NotFound;
//   const appContainer = document.getElementById("app")!;
//   appContainer.className = "";
//   appContainer.innerHTML = "";

//   const savedLanguage = localStorage.getItem("selectedLanguage");
//   if (savedLanguage) {
//     setLanguage(savedLanguage as Lang);
//   }

//   page.render(appContainer);
// }

export function refreshRouter() {
	const path = window.location.pathname;
	let page: Page | null = null;
	let params: { [key: string]: string } = {};

	for (const route in routes) {
		// Convert route to a regex: "/reset_password/:uuid" → "^/reset_password/([^/]+)$"
		const regex = new RegExp("^" + route.replace(/:\w+/g, "([^/]+)") + "$");
		const match = path.match(regex);

		if (match) {
			page = routes[route]; // Corrected: Now correctly fetches the page
			const keys = (route.match(/:(\w+)/g) || []).map((key) => key.substring(1));

			keys.forEach((key, index) => {
				params[key] = match[index + 1]; // Extract params from URL
			});

			break;
		}
	}

	if (!page) {
		page = NotFound;
	}

	const appContainer = document.getElementById("app")!;
	appContainer.className = "";
	appContainer.innerHTML = "";

	const savedLanguage = localStorage.getItem("selectedLanguage");
	if (savedLanguage) {
		setLanguage(savedLanguage as Lang);
	}

	// Pass params to the page if needed
	page.render(appContainer, params);
}

export function navigate(path: string) {
	window.history.pushState({}, "", path);
	refreshRouter();
}

window.addEventListener("popstate", refreshRouter);
document.addEventListener("DOMContentLoaded", refreshRouter);
