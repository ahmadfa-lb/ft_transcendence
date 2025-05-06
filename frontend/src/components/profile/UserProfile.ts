import { createComponent } from "../../utils/StateManager.js";
import logoUrl from "../../assets/guests.png";
import goldRank from "/src/assets/gold-medal.png";
import { GamesHistory } from "./GmaesHistory.js";
import { UserInfo } from "./UserInfo.js";
import { UserStatistics } from "./UserStatistics.js";
import Chart from "chart.js/auto";
import store from "../../../store/store.js";
import axios from "axios";
import { t } from "../../languages/LanguageController.js";
import { chatService } from "../../utils/chatUtils/chatWebSocketService.js";
import { UserFriends } from "./UserFriends.js";
import { navigate } from "../../router.js";
import Toast from "../../../src/toast/Toast";


interface ProfileProps {
  uName: string;
}

export const Profile = createComponent((props: ProfileProps) => {
  let currentFriendshipStatus = 'unknown';
  let currentInitiator: any = null;
  let currentDirection: any = null;

  // Modify the existing API call section to request friendship status via WebSocket
  if (props && props.uName) {
    const token = store.accessToken;

    axios
      .get(`http://localhost:8001/auth/users/nickname/${props.uName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const userData = response.data;
        updateUIWithUserData(userData, container);

        // Request friendship status via WebSocket
        console.log(userData);
        console.log(userData.id);

        chatService.send('friendship:check', {
          currentUserId: store.userId,
          targetUserId: userData.id
        });

        addFriendButton?.addEventListener("click", async () => {
          const fromUserId = store.userId;
          const toUsername = props.uName;

          if (!fromUserId || !toUsername) {
            console.error("Missing user information for friend request");
            return;
          }

          // Different actions based on current friendship status
          switch (currentFriendshipStatus) {
            case 'none':
              // Send friend request
              console.log("Sending friend request");
              chatService.send("friend:request", {
                from: fromUserId,
                to: userData.id,
              });

              // const body = {
              //   senderId: parseInt(fromUserId),
              //   recipientId: userData.id,
              //   // content: ,
              // }
              // await axios.post('/notifications/api/notifications/friend-request', body).catch(err => {
              //   console.error("Error sending message:", err);
              // })

              // Update UI immediately - don't wait for server response
              addFriendButton.textContent = t("profile.requestSent");
              addFriendButton.disabled = true;
              addFriendButton.classList.remove("bg-green-500", "hover:bg-green-600");
              addFriendButton.classList.add("bg-gray-400");
              currentFriendshipStatus = 'pending';
              currentInitiator = 'current_user';
              currentDirection = 'outgoing';
              break;

            case 'pending':
              if (currentInitiator === 'other_user' && currentDirection === 'incoming') {
                // Accept friend request
                console.log("Accepting friend request");
                chatService.send("friend:accept", {
                  from: fromUserId,
                  to: userData.id,
                });

                // Update UI immediately
                addFriendButton.textContent = t("✖️Remove friend");
                addFriendButton.classList.remove("bg-yellow-500", "hover:bg-yellow-600");
                addFriendButton.classList.add("bg-red-500", "hover:bg-red-600");
                currentFriendshipStatus = 'friends';
              }
              break;

            case 'friends':
              // Remove friend
              console.log("Removing friend");
              console.log(userData);
              chatService.removeFriend(userData.id);

              // Update UI immediately
              addFriendButton.textContent = t("profile.add");
              addFriendButton.classList.remove("bg-red-500", "hover:bg-red-600");
              addFriendButton.classList.add("bg-green-500", "hover:bg-green-600");
              currentFriendshipStatus = 'none';
              break;
          }
        });

        chatService.send("user:check_blocked", {
          userId: store.userId,
          targetId: userData.id
        });

        // Add this event listener
        chatService.on("user:blocked_status", (data) => {
          console.log(data);
          if (data.targetId === userData.id) {
            const isBlocked = data.isBlocked;
            const blockButton = container.querySelector("#block-user");

            if (isBlocked && blockButton) {
              // User is blocked, show unblock button
              blockButton.textContent = t("profile.unblock");
              blockButton.classList.remove("bg-red-500", "hover:bg-red-600");
              blockButton.classList.add("bg-gray-500", "hover:bg-gray-600");
              blockButton.id = "unblock-user";

              // Update event listeners
              blockButton.removeEventListener("click", blockUserHandler);
              blockButton.addEventListener("click", unblockUserHandler);
            }
          }
        });

        // blockUserButton?.addEventListener("click", () => {
        //   const fromUserId = store.userId;
        //   const toUsername = props.uName;

        //   if (!fromUserId || !toUsername) {
        //     console.error("Missing user information for friend request");
        //     return;
        //   }

        //   chatService.blockUser(userData.id);

        //   // Update UI immediately
        //   blockUserButton.textContent = t("Unblock User");

        //   Toast.show(`You have blocked ${userData.nickname}`, "success");
        //   blockUserButton.removeAttribute('id');
        //   blockUserButton.id = 'unblock-user';
        // });
        function blockUserHandler() {
          const fromUserId = store.userId;

          if (!fromUserId || !userData) {
            console.error("Missing user information for blocking user");
            return;
          }

          // Send block request to server
          // chatService.send("user:block", {
          //   from: fromUserId,
          //   blocked: userData.id
          // });
          chatService.blockUser(userData.id);

          // Update UI immediately
          const blockButton = container.querySelector("#block-user");
          if (blockButton) {
            blockButton.textContent = t("profile.unblock");
            blockButton.classList.remove("bg-red-500", "hover:bg-red-600");
            blockButton.classList.add("bg-gray-500", "hover:bg-gray-600");

            // Change the button ID to indicate it's now an unblock button
            blockButton.id = "unblock-user";

            // Remove the old event listener and add a new one for unblocking
            blockButton.removeEventListener("click", blockUserHandler);
            blockButton.addEventListener("click", unblockUserHandler);
          }

          Toast.show(`You have blocked ${userData.nickname}`, "success");
        }

        function unblockUserHandler() {
          const fromUserId = store.userId;

          if (!fromUserId || !userData) {
            console.error("Missing user information for unblocking user");
            return;
          }

          // Send unblock request to server
          // chatService.send("user:unblock", {
          //   from: fromUserId,
          //   unblocked: userData.id
          // });

          chatService.unblockUser(userData.id);

          // Update UI immediately
          const unblockButton = container.querySelector("#unblock-user");
          if (unblockButton) {
            unblockButton.textContent = t("profile.block");
            unblockButton.classList.remove("bg-gray-500", "hover:bg-gray-600");
            unblockButton.classList.add("bg-red-500", "hover:bg-red-600");

            // Change the button ID back to block-user
            unblockButton.id = "block-user";

            // Remove the old event listener and add a new one for blocking
            unblockButton.removeEventListener("click", unblockUserHandler);
            unblockButton.addEventListener("click", blockUserHandler);
          }

          Toast.show(`You have unblocked ${userData.nickname}`, "success");
        }

        // Now, let's update the initial event listeners to use these handler functions
        // Replace the existing block button event listener with:
        blockUserButton?.addEventListener("click", blockUserHandler);

        // blockUserButton?.addEventListener("click", () => {
        //   const fromUserId = store.userId;
        //   const toUsername = props.uName;

        //   if (!fromUserId || !toUsername) {
        //     console.error("Missing user information for blocking user");
        //     return;
        //   }

        //   // Send block request to server
        //   chatService.send("user:block", {
        //     from: fromUserId,
        //     blocked: userData.id
        //   });

        //   // Update UI immediately
        //   blockUserButton.textContent = t("profile.unblock");
        //   blockUserButton.classList.remove("bg-red-500", "hover:bg-red-600");
        //   blockUserButton.classList.add("bg-gray-500", "hover:bg-gray-600");

        //   // Change the button ID to indicate it's now an unblock button
        //   blockUserButton.id = "unblock-user";

        //   // Remove the old event listener and add a new one for unblocking
        //   blockUserButton.removeEventListener("click", blockUserHandler);
        //   blockUserButton.addEventListener("click", unblockUserHandler);

        //   Toast.show(`You have blocked ${userData.nickname}`, "success");
        // });



        messageUserButton?.addEventListener("click", () => {
          const fromUserId = store.userId;

          if (!fromUserId || !userData) {
            console.error("Missing user information for messaging");
            return;
          }
          // Store the user information in localStorage temporarily, so the chat page can access it
          localStorage.setItem('openChatWithUser', JSON.stringify({
            username: userData.nickname,
            userId: userData.id,
            fullname: userData.full_name || userData.nickname,
            avatar_url: userData.avatar_url,
            timestamp: Date.now() // Add timestamp to ensure this is a new request
          }));

          // Close the profile modal
          container.remove();

          // Navigate to the chat page
          navigate("/chat");
        });

      })
      .catch((error) => {
        console.error("Error fetching user data:", error.response.data.message);
      });

  }


  // A wrapper for our popup + overlay
  // The actual modal container
  const container = document.createElement("div");
  // Insert modal HTML
  container.innerHTML = `
    <!-- Overlay -->
    <div class="overlay fixed top-0 left-0 w-full h-full z-[80] bg-black/50"></div>
    <div class="user-container fixed top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] z-[90] w-full md:w-[70%] 2xl:w-3/6 h-[100dvh] md:h-full max-h-[90dvh] p-4 bg-white border rounded-lg border-gray-300 shadow-md flex flex-col gap-2">
      <!-- Close Button (X) -->
      <div class="flex justify-start">
          <i class="fas fa-times text-2xl cursor-pointer hover:text-red-600" id="close-button"></i>
      </div>

      <!-- Header (Nickname, Online, Avatar, Rank) -->
      
      <div class="flex items-center justify-end gap-4 sm:gap-8">
        ${(props && store.nickname !== props.uName) ? `
            <div class="flex gap-2 flex-1 justify-end" id="friend-buttons-container">
              <!-- Loading state -->
              <div id="friendship-loading" class="text-gray-500">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
              
              <!-- Buttons (initially hidden) -->
              <div id="friendship-buttons" class="flex gap-2 w-full">
                <button id="message-user" class="max-sm:flex-1 bg-pongcyan text-white text-nowrap max-sm:text-sm px-2 sm:px-4 py-1 rounded hover:bg-blue-700 transition-colors">
                  <i class="fas fa-envelope min-[401px]:mr-1"></i>
                  <span class="max-[402px]:hidden">${t("profile.message")}</span>
                </button>
                <button id="add-friend" class="max-sm:flex-1 bg-green-500 text-white max-sm:text-sm px-2 sm:px-4 py-1 rounded hover:bg-green-600 transition-colors">
                  <i class="fas fa-user-plus min-[401px]:mr-1"></i>
                  <span class="max-[402px]:hidden">${t("profile.add")}</span>
                </button>
                <button id="block-user" class="max-sm:flex-1 bg-red-500 text-white max-sm:text-sm px-2 sm:px-4 py-1 rounded hover:bg-red-600 transition-colors">
                  <i class="fas fa-ban min-[401px]:mr-1"></i>
                  <span class="max-[402px]:hidden">${t("profile.block")}</span>
                </button>
              </div>
            </div>
        ` : ""}  
        
        <div class="flex">
          <div>
              <p id="name" class="font-bold text-lg">${props.uName}</p>
              <div class="flex items-center gap-1">
                  <p>${t('profile.rank')}</p>
                  <img src="${goldRank}" class="w-6">
              </div>
          </div>
          <div class="relative">
            <img 
                alt="profile picture" 
                id="profile-picture"
                referrerpolicy="no-referrer"
                class="size-14 sm:size-20 object-cover rounded-full border-2 border-pongcyan"
            >
            <span class="absolute bottom-0 left-0 size-4 rounded-full
              bg-green-500 border border-white"></span>
            ${props.uName === store.nickname ? `
              <button id="upload-photo" class="absolute top-0 right-0 size-5 rounded-full hover:opacity-90 cursor-pointer bg-pongcyan grid place-content-center">
                <i class="fa-solid fa-pen text-white text-xs"></i>
              </button>
            ` : ''}
            </div>
        </div>
      </div>
      <!-- Tabs (Statistics, History, Info) -->
        <div id="profile-tabs" class="flex space-x-4 border-b border-gray-300">
          <button 
              id="info-tab" 
              class="flex-1 py-2 text-white text-center transition-all  focus:outline-none bg-pongcyan"
            >
            ${t("profile.infoTab.title")}
          </button>
          <button 
            id="statistics-tab" 
            class="flex-1 py-2 text-center transition-all focus:outline-none"
          >
          ${t("profile.statisticsTab.title")}
          </button>
          <button 
            id="history-tab" 
            class="flex-1 py-2 text-center transition-all focus:outline-none"
          >
          ${t("profile.historyTab.title")}
          </button>
          ${props.uName === store.nickname ? 
          `<button 
            id="friends-tab" 
            class="flex-1 py-2 text-center transition-all focus:outline-none"
          >
            Friends
          </button>` : ""}

        </div>

        <!-- Content Container -->
        <div id="content-container" class="text-gray-700 h-fit overflow-auto">
        
        </div>
    </div>
  `;

  function updateUIWithUserData(userData: any, container: HTMLDivElement) {
    // Update nickname
    const nicknameElement = container.querySelector("#name");
    if (nicknameElement) {
      nicknameElement.textContent = userData.nickname || store.nickname;
    }

    const avatarElement = container.querySelector("#profile-picture") as HTMLImageElement;
    avatarElement.src = userData.avatar_url || store.avatarUrl || logoUrl;
    // Update other elements as needed
    // For example, rank, avatar image, etc.

    // You could also pass this data to your sub-components
    // For example, when creating UserInfo, UserStatistics, etc.
  }

  // Query elements
  const closeButton = container.querySelector("#close-button")!;
  const statisticsTab = container.querySelector("#statistics-tab")!;
  const historyTab = container.querySelector("#history-tab")!;
  const infoTab = container.querySelector("#info-tab")!;
  const contentContainer = container.querySelector("#content-container")!;
  const overlay = container.querySelector(".overlay")!;
  const addFriendButton = container.querySelector("#add-friend")! as HTMLButtonElement;
  const blockUserButton = container.querySelector("#block-user")! as HTMLButtonElement;
  const messageUserButton = container.querySelector("#message-user") as HTMLButtonElement;
  const profileTabs = container.querySelector("#profile-tabs")!
  const friendsTab = container.querySelector("#friends-tab")!
  const uploadImage = container.querySelector('#upload-photo')

  uploadImage?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.className = 'hidden';
    input.type = 'file';
    input.accept = 'image/png, image/jpeg';

    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;

      const fileName = file.name.toLowerCase();
      if (!(fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg'))) {
        alert('Please upload a PNG or JPG image.');
        return;
      }

      // console.log('Selected file:', file);
      // here we will send the file to the server then update the profile picture
      // console.log(store.accessToken);
      const formData = new FormData();
      formData.append('avatar', file);
      console.log(`Bearer ${store.accessToken}`);

      await axios.post(`http://localhost:8001/auth/uploads/${store.userId}`, formData, {
        headers: {
          authorization: `Bearer ${store.accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      }).then((response) => {
        console.log(response.data);
        const imageUrl = `${response.data.url}`;
        const profileImage = container.querySelector('#profile-picture') as HTMLImageElement;
        if (profileImage) {
          profileImage.src = imageUrl;
        }
        store.update('avatarUrl', imageUrl)
      }).catch((error) => {
        console.error("gggg uploading image:", error);
      })
    });
    input.click();
  })

  overlay.addEventListener("click", () => {
    container.remove();
  });

  // Close the modal on X click
  closeButton?.addEventListener("click", () => {
    container.remove();
  });

  // Helper function to clear active background from all tabs
  function clearActiveTabs() {
    profileTabs?.childNodes.forEach((tab) => {
      if (tab instanceof HTMLElement) {
        tab.classList.remove("bg-pongcyan");
        tab.classList.remove("text-white");
      }
    })
  }

  // User Profile by default
  contentContainer?.appendChild(
    UserInfo({
      uName: props.uName,
    })
  );

  statisticsTab?.addEventListener("click", () => {
    if (!contentContainer) return;
    clearActiveTabs();
    statisticsTab.classList.add("bg-pongcyan", "text-white");

    // Set up the content with three canvases
    contentContainer.innerHTML = "";
    contentContainer?.appendChild(UserStatistics());

    // Initialize the Elo Rating Line Chart
    const statsCtx = document.getElementById(
      "statsChart"
    ) as HTMLCanvasElement | null;
    if (statsCtx) {
      const lineData = {
        labels: ["January", "February", "March", "April", "May", "June"],
        datasets: [
          {
            label: "Elo Rating",
            data: [1500, 1520, 1510, 1530, 1540, 1550],
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      };
      const lineConfig = {
        type: "line" as const,
        data: lineData,
        options: {},
      };
      new Chart(statsCtx, lineConfig);
    }

    // Initialize the Wins/Losses Bar Chart
    const barCtx = document.getElementById(
      "barChart"
    ) as HTMLCanvasElement | null;
    if (barCtx) {
      const barData = {
        labels: ["January", "February", "March", "April", "May", "June"],
        datasets: [
          {
            label: "Wins",
            data: [5, 7, 8, 6, 9, 10],
            backgroundColor: "rgb(75, 192, 192)",
          },
          {
            label: "Losses",
            data: [2, 3, 1, 4, 3, 2],
            backgroundColor: "rgb(255, 99, 132)",
          },
        ],
      };
      const barConfig = {
        type: "bar" as const,
        data: barData,
        options: {},
      };
      new Chart(barCtx, barConfig);
    }

    // Initialize the Win Rate Pie Chart
    const pieCtx = document.getElementById(
      "pieChart"
    ) as HTMLCanvasElement | null;
    if (pieCtx) {
      const pieData = {
        labels: ["Wins", "Losses"],
        datasets: [
          {
            label: "Win Rate",
            data: [70, 30], // For example: 70% wins, 30% losses
            backgroundColor: ["rgb(75, 192, 192)", "rgb(255, 99, 132)"],
            hoverOffset: 4,
          },
        ],
      };
      const pieConfig = {
        type: "pie" as const,
        data: pieData,
        options: {
          responsive: false,
          maintainAspectRatio: false,
        },
      };
      new Chart(pieCtx, pieConfig);
    }
  });

  historyTab?.addEventListener("click", () => {
    if (!contentContainer) return;
    clearActiveTabs();
    historyTab.classList.add("bg-pongcyan", "text-white");
    contentContainer.innerHTML = "";
    contentContainer?.appendChild(GamesHistory());
  });

  infoTab?.addEventListener("click", () => {
    if (!contentContainer) return;
    clearActiveTabs();
    infoTab.classList.add("bg-pongcyan", "text-white");
    contentContainer.innerHTML = "";
    console.log(props.uName);
    contentContainer?.appendChild(
      UserInfo({
        uName: props.uName,
      })
    );

    const toggle = contentContainer.querySelector(
      "#twoFactorToggle"
    ) as HTMLInputElement | null;
    if (toggle) {
      toggle.addEventListener("change", (event) => {
        const isChecked = (event.target as HTMLInputElement).checked;
        console.log("2FA Toggle is now:", isChecked ? "Enabled" : "Disabled");
        // Here you can call an API or handle logic to enable/disable 2FA
      });
    }
  });


  friendsTab?.addEventListener("click", () => {
    if (!contentContainer) return;
    clearActiveTabs();
    friendsTab.classList.add("bg-pongcyan", "text-white");
    contentContainer.innerHTML = "";
    contentContainer?.appendChild(UserFriends());
  });




  // Add an event listener for friendship status
  chatService.on('friendship:status', (data) => {
    const { status, relationship, initiator, direction } = data.status;

    // Store current status for use in click handlers
    currentFriendshipStatus = status;
    currentInitiator = initiator;
    currentDirection = direction;

    // Get loading and buttons containers
    const loadingElement = container.querySelector("#friendship-loading");
    const buttonsContainer = container.querySelector("#friendship-buttons");
    const addFriendButton: HTMLButtonElement | null = container.querySelector("#add-friend");

    console.log("Received Status:", status);

    // Style the button according to status
    switch (status) {
      case 'friends':
        console.log("✅ User is a friend");
        if (addFriendButton) {
          addFriendButton.textContent = t("✖️Remove friend");
          addFriendButton.disabled = false; // Enable button for removing friend
          addFriendButton.classList.remove("bg-green-500", "hover:bg-green-600", "bg-gray-400", "bg-yellow-500", "hover:bg-yellow-600");
          addFriendButton.classList.add("bg-red-500", "hover:bg-red-600");
        }
        break;

      case 'pending':
        console.log("⏳ Friend request pending");
        if (initiator === 'current_user' && direction === 'outgoing' && addFriendButton) {
          addFriendButton.textContent = t("profile.requestSent");
          addFriendButton.disabled = true; // Can't cancel request yet (add this feature later if needed)
          addFriendButton.classList.remove("bg-green-500", "hover:bg-green-600", "bg-red-500", "hover:bg-red-600", "bg-yellow-500", "hover:bg-yellow-600");
          addFriendButton.classList.add("bg-gray-400");
        } else if (initiator === 'other_user' && direction === 'incoming' && addFriendButton) {
          addFriendButton.innerHTML = `<i class="fa-solid fa-circle-check min-[401px]:mr-1"></i> <span class="max-[402px]:hidden">accept</span>`;
          addFriendButton.disabled = false; // Enable to accept request
          addFriendButton.classList.remove("bg-green-500", "hover:bg-green-600", "bg-red-500", "hover:bg-red-600", "bg-gray-400");
          addFriendButton.classList.add("bg-yellow-500", "hover:bg-yellow-600");
        }
        break;

      case 'none':
        console.log("➕ User can send a friend request");
        // Default state - allow sending friend request
        if (addFriendButton) {
          addFriendButton.textContent = t("profile.add");
          addFriendButton.disabled = false;
          addFriendButton.classList.remove("bg-gray-400", "bg-red-500", "hover:bg-red-600", "bg-yellow-500", "hover:bg-yellow-600");
          addFriendButton.classList.add("bg-green-500", "hover:bg-green-600");
        }
        break;

      default:
        console.error("🚨 Unhandled status:", status);
    }

    // Hide loading element and show buttons after we've styled them
    if (loadingElement) loadingElement.classList.add('hidden');
    if (buttonsContainer) buttonsContainer.classList.remove('hidden');
  });

  return container;
});
