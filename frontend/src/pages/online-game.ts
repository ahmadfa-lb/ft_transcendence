import { Header } from "../components/header_footer/header.js";
import { PongLoading } from "../components/partials/PongLoading.js";
import { FetchFriendsList } from "../components/Online-Game/components/FriendsList.js";
import { FindOpponent } from "../components/Online-Game/components/FindOpponent.js";
import { t } from "../languages/LanguageController.js";
import { Footer } from "../components/header_footer/footer.js";

export default {
	render: (container: HTMLElement) => {
		container.className = "flex flex-col h-dvh";
		container.innerHTML = `
			<div class="header z-50 w-full bg-black"></div>
			
			<div class="content flex-1 relative overflow-hidden bg-black">
				<!-- Neon glow effects -->
				<div class="absolute inset-0 bg-gradient-to-br from-transparent via-pongcyan/5 to-transparent opacity-20 z-5 pointer-events-none"></div>
				
				<div id="content" class="flex max-sm:flex-col max-sm:items-center max-sm:justify-around max-sm:py-4 flex-1 container mx-auto px-4 w-full text-white z-10 relative">
					<div class="flex flex-col items-center justify-center gap-5 sm:gap-10 w-full sm:w-1/2 py-8">
						<h1 class="text-4xl md:text-5xl font-bold text-center text-pongcyan drop-shadow-[0_0_15px_#00f7ff] animate-fade-down animate-once animate-duration-700">
							${t('play.title')}
						</h1>
						<div class="flex flex-col gap-6 w-full max-w-md">
							<button id="play-with-friend" class="play-btn p-4 border-2 border-pongcyan rounded-xl group bg-black hover:bg-black/80 text-white flex items-center gap-4 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] shadow-[0_0_15px_rgba(0,247,255,0.4)] hover:shadow-[0_0_25px_rgba(0,247,255,0.6)] animate-fade-right animate-once animate-duration-700">
								<span class="group-hover:scale-110 text-2xl transition-transform duration-300 ease-in-out text-pongcyan drop-shadow-[0_0_10px_#00f7ff]">
									<i class="fa-solid fa-users"></i>
								</span>
								<div class="flex flex-col gap-1">
									<h2 class="text-xl font-bold text-pongcyan drop-shadow-[0_0_5px_#00f7ff] group-hover:text-white group-hover:drop-shadow-[0_0_10px_#00f7ff]">${t('play.onlineGame.friendBtn')}</h2>
									<p class="text-sm opacity-90">${t('play.onlineGame.vsFriend')}</p>
								</div>
							</button>
							
							<button id="online-showdown" class="play-btn p-4 border-2 border-pongpink rounded-xl group bg-black hover:bg-black/80 text-white flex items-center gap-4 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] shadow-[0_0_15px_rgba(255,0,228,0.4)] hover:shadow-[0_0_25px_rgba(255,0,228,0.6)] animate-fade-left animate-once animate-duration-700 animate-delay-100">
								<span class="group-hover:scale-110 text-2xl transition-transform duration-300 ease-in-out text-pongpink drop-shadow-[0_0_10px_#ff00e4]">
									<i class="fa-solid fa-globe"></i>
								</span>
								<div class="flex flex-col gap-1">
									<h2 class="text-xl font-bold text-pongpink drop-shadow-[0_0_5px_#ff00e4] group-hover:text-white group-hover:drop-shadow-[0_0_10px_#ff00e4]">${t('play.onlineGame.onlineShowdownBtn')}</h2>
									<p class="text-sm opacity-90">${t('play.onlineGame.vsRivals')}</p>
								</div>
							</button>
						</div>
					</div>
					
					<div id="game-mode-details" class="flex flex-col items-center justify-center gap-10 w-full sm:w-1/2 py-8">
						<div class="relative w-full flex items-center justify-center">
							<div class="animation-container relative w-full max-w-md aspect-square">
								<i id="icon-friends" class="fa-solid fa-users text-7xl md:text-8xl absolute top-1/4 left-1/2 -translate-x-1/2 transition-opacity duration-500 opacity-100 bg-gradient-to-r from-pongcyan via-[rgba(100,100,255,0.8)] to-pongcyan text-transparent bg-clip-text"></i>
								<span id="text-friends" class="text-3xl md:text-4xl text-center font-bold absolute top-1/4 left-1/2 -translate-x-1/2 transition-opacity duration-500 opacity-0">${t('play.onlineGame.vsFriend')}</span>
								
								<div id="loading-pong" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-125"></div>
								
								<i id="icon-online" class="fa-solid fa-globe text-7xl md:text-8xl absolute bottom-1/4 left-1/2 -translate-x-1/2 transition-opacity duration-500 opacity-100 bg-gradient-to-b from-pongpink via-[rgba(255,0,228,0.8)] to-pongpink text-transparent bg-clip-text"></i>
								<span id="text-online" class="text-3xl md:text-4xl text-center font-bold absolute bottom-1/4 left-1/2 -translate-x-1/2 transition-opacity duration-500 opacity-0">${t('play.onlineGame.vsRivals')}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="footer"></div>
		`;

		// Header
		const headerNav = container.querySelector(".header");
		const header = Header();
		headerNav?.appendChild(header);

		// Footer component
		const footerContainer = container.querySelector(".footer");
		const footerComp = Footer();
		footerContainer?.appendChild(footerComp);

		// Loading pong animation
		const loadingPong = container.querySelector('#loading-pong');
		loadingPong?.appendChild(PongLoading({text: t('play.onlineGame.or')}));

		let isIconVisible = true;
		let toggleInterval = setInterval(() => {
			isIconVisible = !isIconVisible;
	
			// Toggle Friends animation
			document.getElementById("icon-friends")?.classList.toggle("opacity-0", !isIconVisible);
			document.getElementById("icon-friends")?.classList.toggle("opacity-100");
			document.getElementById("text-friends")?.classList.toggle("opacity-0", isIconVisible);

			// Toggle Online animation
			document.getElementById("icon-online")?.classList.toggle("opacity-0", !isIconVisible);
			document.getElementById("icon-online")?.classList.toggle("opacity-100");
			document.getElementById("text-online")?.classList.toggle("opacity-0", isIconVisible);
		}, 3000);

		const heading = container.querySelector("h1")!;
		// Play with Friend functionality
		const playWithFriendBtn = document.getElementById("play-with-friend");
		playWithFriendBtn?.addEventListener("click", () => {
			clearInterval(toggleInterval);

			const gameModeDetails = document.getElementById("game-mode-details");
			if (gameModeDetails) {
				heading.textContent = t('play.onlineGame.findFriend');
				heading.className = "text-4xl md:text-5xl font-bold text-center text-pongcyan drop-shadow-[0_0_15px_#00f7ff]";

				gameModeDetails.innerHTML = '';
				gameModeDetails.appendChild(FetchFriendsList());
			}
		});

		// Online Showdown functionality
		const onlineShowdownBtn = document.getElementById("online-showdown");
		onlineShowdownBtn?.addEventListener("click", () => {
			clearInterval(toggleInterval);

			const gameModeDetails = document.getElementById("game-mode-details");
			if (gameModeDetails) {
				heading.textContent = t('play.onlineGame.findingOponent');
				heading.className = "text-4xl md:text-5xl font-bold text-center text-pongpink drop-shadow-[0_0_15px_#ff00e4]";

				gameModeDetails.innerHTML = '';
				gameModeDetails.appendChild(FindOpponent({heading, isIconVisible, toggleInterval}));
				isIconVisible = !isIconVisible;
			}
		});
	}
}