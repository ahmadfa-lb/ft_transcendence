import { createComponent } from "../../utils/StateManager.js";
import { t } from "../../languages/LanguageController.js";
import { TournamentClient } from "./TournamentClient.js";

export interface Player {
  userId: string;
  username: string;
  avatar?: string;
  rank?: string;
  joinedAt: string;
}

export interface WaitingRoomProps {
  tournamentId: string;
  playerCount: number;
  client: TournamentClient;
  players: Player[];
  isCreator: boolean;
  onPlayerJoin?: (player: Player) => void;
  onTournamentStart?: () => void;
}

export const WaitingRoom = createComponent((props: WaitingRoomProps) => {
  const {
    tournamentId,
    playerCount,
    client,
    players = [],
    isCreator = false,
    onPlayerJoin,
    onTournamentStart
  } = props;

  const container = document.createElement('div');
  container.className = "flex flex-col gap-6 h-full";
  container.innerHTML = `
    <div class="text-2xl font-semibold text-white drop-shadow-[0_0_5px_#ffffff]">${t('play.tournaments.createTournament.waitingRoom')}</div>
    <div class="flex flex-col gap-4 bg-pongcyan/10 rounded-lg p-4 h-full">
      <div class="flex justify-between items-center flex-wrap gap-1">
        <div class="sm:text-lg text-white drop-shadow-[0_0_5px_#ffffff] font-medium">${t('play.tournaments.createTournament.currentParticipants')}</div>
        <div class="text-sm text-gray-300">${t('play.tournaments.createTournament.tournamentStart')} <span class="player-max-display">${playerCount}</span> ${t('play.tournaments.createTournament.tournamentStartContinue')}</div>
      </div>
      <div class="flex-1 h-full">
        <div id="waiting-players" class="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 max-h-64 overflow-auto">
          <!-- Player slots will be dynamically generated -->
        </div>
      </div>
      </div>
      <div class="max-sm:fixed bottom-8 right-12 flex justify-between justify-self-end">
        ${isCreator && players.length === playerCount ?
      `<button id="start-tournament" class="px-4 py-2 drop-shadow-[0_0_5px_#16a34a] text-white bg-green-600 hover:bg-green-700 rounded-lg">${t('play.tournaments.createTournament.startTournament')}</button>` : ''}
        <button id="leave-tournament" class="px-4 py-2 drop-shadow-[0_0_5px_#dc2626] text-white bg-red-600 hover:bg-red-700 rounded-lg">${t('play.tournaments.createTournament.leaveTournament')}</button>
      </div>
  `;

  renderWaitingRoomSlots(container, playerCount ?? 0, players);

  const startButton = container.querySelector('#start-tournament');
  if (startButton) {
    startButton.addEventListener('click', () => {
      client.startTournament(tournamentId);
      if (onTournamentStart) onTournamentStart();
    });
  }

  const leaveButton = container.querySelector('#leave-tournament');
  if (leaveButton) {
    leaveButton.addEventListener('click', () => {
      if (confirm(t('play.tournaments.createTournament.leaveConfirmation'))) {
        client.leaveTournament(tournamentId)
          .then(() => {
            window.history.back();
          })
          .catch((error) => {
            console.error("Error leaving tournament:", error);
            alert(t('play.tournaments.createTournament.leaveError'));
          });
      }
    });
  }

  if (client) {
    client.on('tournament_player_joined', (data) => {
      if (String(data.tournamentId) === String(tournamentId)) {
        renderWaitingRoomSlots(container, playerCount ?? 0, data.players);
        if (onPlayerJoin) onPlayerJoin(data.newPlayer);

        if (isCreator && data.players.length === playerCount) {
          const startButton = container.querySelector('#start-tournament');
          if (startButton) {
            startButton.classList.remove('opacity-50', 'cursor-not-allowed');
            startButton.removeAttribute('disabled');
          }
        }
      }
    });

    client.on('tournament_player_left', async (data) => {
      if (String(data.tournamentId) === String(tournamentId)) {
        try {
          const enrichedPlayers = await Promise.all(
            data.players.map(async (player: {player_id: string, placement: string, joined_at: string}) => {
              try {
                const response = await fetch(`/authentication/auth/users/id/${player.player_id}`);
                
                if (response.ok) {
                  const userData = await response.json();
                  return {
                    userId: player.player_id,
                    username: userData.nickname || `${t("play.player")} ${player.player_id}`,
                    avatar: userData.avatar_url,
                    rank: player.placement || t("play.unranked"),
                    joinedAt: player.joined_at || new Date().toISOString()
                  };
                } else {
                  throw new Error(`Failed to fetch user data: ${response.statusText}`);
                }
              } catch (error) {
                console.error(`Error fetching user data for player ${player.player_id}:`, error);
                return {
                  userId: player.player_id,
                  username: `${t("play.player")} ${player.player_id}`,
                  rank: player.placement || t("play.unranked"),
                  joinedAt: player.joined_at || new Date().toISOString()
                };
              }
            })
          );
          
          renderWaitingRoomSlots(container, playerCount ?? 0, enrichedPlayers);
        } catch (error) {
          console.error('Error processing tournament_player_left event:', error);
            renderWaitingRoomSlots(container, playerCount ?? 0, data.players.map((p: { player_id: string; joined_at: string }) => ({
            userId: p.player_id,
            username: `${t("play.player")} ${p.player_id}`,
            joinedAt: p.joined_at || new Date().toISOString()
            })));
        }
      }
    });

    client.on('tournament_started', (data) => {
      if (String(data.tournamentId) === String(tournamentId) && onTournamentStart) {
        onTournamentStart();
      } else {
        console.error("[Waiting Room]: Ids don't match");
      }
    });
  }

  return container;
});

export function renderWaitingRoomSlots(container: HTMLElement, playerCount: number, players: Player[] = []) {
  const waitingPlayersContainer = container.querySelector('#waiting-players');
  const playerMaxDisplay = container.querySelectorAll('.player-max-display');

  if (waitingPlayersContainer) {
    waitingPlayersContainer.innerHTML = '';

    playerMaxDisplay.forEach(el => {
      el.textContent = playerCount.toString();
    });

    for (let i = 0; i < playerCount; i++) {
      const playerData = i < players.length ? players[i] : null;

      if (playerData) {
        waitingPlayersContainer.innerHTML += `
          <div class="bg-pongcyan/20 p-4 py-2 rounded-lg flex items-center justify-between drop-shadow-pongcyan">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-full bg-pongcyan">
                ${playerData.avatar ?
            `<img src="${playerData.avatar}" alt="avatar" class="size-full rounded-full object-cover" />` :
            `<div class="size-full rounded-full flex items-center justify-center bg-pongcyan text-white text-xl font-bold">${playerData.username ? playerData.username.charAt(0).toUpperCase() : '?'}</div>`
          }
              </div>
              <div>
                <div class="font-medium">${playerData.username || t("play.unknowPlayer")}</div>
                <div class="text-sm text-gray-300">${t('play.tournaments.createTournament.rank')} ${playerData.rank || t("play.unranked")}</div>
              </div>
            </div>
          </div>
        `;
      } else {
        waitingPlayersContainer.innerHTML += `
          <div class="border-2 border-dashed border-pongcyan/30 p-4 rounded-lg flex items-center justify-center">
            <div class="text-[rgba(255,255,255,0.5)]">${t('play.tournaments.createTournament.waitingForPlayers')}</div>
          </div>
        `;
      }
    }
  }
}
