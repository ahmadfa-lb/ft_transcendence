import { OfflineGameAI } from "../components/Offline-Game/AIGame.js";
import { OfflineGame } from "../components/Offline-Game/OfflineGame.js";

// Global variable to hold the current game instance
// let currentGame: (HTMLElement & { destroy?: () => void }) | null = null;

export default {
  render: (container: HTMLElement) => {
    container.innerHTML = `
      <div class="content relative flex flex-col items-center sm:justify-around h-dvh max-sm:p-2 sm:border-8 bg-pongcyan border-pongdark border-solid">
        <div class="player-header w-4/5 "></div>
        <div id="game-container" class="flex items-center justify-center max-sm:flex-1 max-w-0"></div>
      </div>
    `;

    // If a game is already running, clean it up immediately before showing the popup
    const content = container.querySelector(".content")!
    const playerHeader = content.querySelector(".player-header")!
    const gameContainer = container.querySelector("#game-container")!;
    const game:OfflineGame = new OfflineGameAI()

    // Show difficulty popup and start game after selection
    if (game instanceof OfflineGameAI) {
      container.appendChild(game.difficultyPopupElement);
      container.appendChild(game.countdownOverlayElement)
      playerHeader.appendChild(game.gameHeaderElement);
      container.appendChild(game.resultPopupElement);
      gameContainer.appendChild(game.gameCanvasElement);
    }
  },
};
