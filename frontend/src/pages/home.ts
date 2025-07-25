import { navigate } from "../router.js";
import { t } from "../languages/LanguageController.js";
import { PongAnimation } from "../components/partials/PingPongAnimation.js";
import { Header } from "../components/header_footer/header.js";
import { Footer } from "../components/header_footer/footer.js";
import chatService from "../utils/chatUtils/chatWebSocketService.js";
import store from "../../store/store.js";
import { account } from '../appwriteConfig.js';
import axios from "axios";
import Toast from "../toast/Toast.js";
import { jwtDecode } from "jwt-decode";
import { PongLoading } from "../components/partials/PongLoading.js";
import { initializeApp } from "../main.js";

export default {
  render: async (container: HTMLElement) => {
    container.className = 'flex flex-col h-dvh'
    container.innerHTML = `
    <div class="profile"></div>
    <div class="header bg-black w-full h-fit"></div>
    <div class="w-full overflow-x-none bg-black flex-1 flex items-center justify-center">
      <div class="container mx-auto grid place-content-center px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-center justify-center gap-5">
          <div class="xl:w-1/2 w-full max-w-screen-sm hidden md:flex items-center justify-center">
            <div class="relative w-full">
              <canvas id="pongCanvas" class="w-full h-[40vh] lg:h-[50vh] border-4 border-pongcyan rounded-2xl shadow-[0_0_50px_rgba(0,247,255,0.5)] transform transition-transform animate-flip-up animate-duration-[3s]"></canvas>
              <div class="absolute inset-0 bg-pongcyan -z-50 opacity-10 rounded-2xl animate-flip-down animate-duration-[3s]"></div>
            </div>
          </div>
          <div class="flex flex-col gap-3 justify-center w-full md:w-auto">
            <div class="bg-[rgba(0,0,0,0.7)] border-2 border-pongpink rounded-xl p-4 sm:p-6 transform transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,0,228,0.4)] z-40">
              <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl text-pongpink text-center md:text-start font-bold md:font-normal drop-shadow-[0_0_10px_#ff00e4] animate-fade-right animate-once animate-duration-700 animate-ease-linear">
                ${t("home.title")}
              </h1>
              <p class="text-pongcyan text-xl sm:text-2xl md:text-3xl lg:text-4xl mt-4 text-center md:text-start drop-shadow-[0_0_5px_#00f7ff] animate-fade-left sm:animate-fade-right animate-once animate-duration-700 animate-delay-700 animate-ease-linear">
                ${t("home.tagline")}
              </p>
            </div>
            <div class="flex flex-wrap justify-center md:justify-start items-center gap-3 sm:gap-4">
              ${store.userId ? `
              <button id="chat-friends-btn" class="group relative text-base sm:text-lg rounded-lg text-white flex justify-center items-center bg-black border-2 border-pongcyan px-4 sm:px-6 py-2 sm:py-3 
                transition-all duration-300 ease-in-out
                hover:text-pongcyan hover:shadow-[0_0_15px_rgba(0,247,255,0.7)]
                focus:outline-none
                animate-fade-up animate-duration-700 animate-delay-1000 animate-ease-linear">
                <span class="relative z-10 drop-shadow-[0_0_5px_#00f7ff]">${t("home.chatWithFriends")}</span>
              </button>
              <button id="play-online-btn" class="group relative text-base sm:text-lg rounded-lg text-white flex justify-center items-center bg-black border-2 border-pongpink px-4 sm:px-6 py-2 sm:py-3 
                transition-all duration-300 ease-in-out
                hover:text-pongpink hover:shadow-[0_0_15px_rgba(255,0,228,0.7)]
                focus:outline-none
                animate-fade-up animate-duration-700 animate-delay-[1200ms] animate-ease-linear">
                <span class="relative z-10 drop-shadow-[0_0_5px_#ff00e4]">${t("home.playOnline")}</span>
              </button>
              <button id="start-tournament-btn" class="group relative text-base sm:text-lg rounded-lg text-white flex justify-center items-center bg-black border-2 border-pongcyan px-4 sm:px-6 py-2 sm:py-3 
                transition-all duration-300 ease-in-out
                hover:text-pongcyan hover:shadow-[0_0_15px_rgba(0,247,255,0.7)]
                focus:outline-none
                animate-fade-up animate-duration-700 animate-delay-[1400ms] animate-ease-linear">
                <span class="relative z-10 drop-shadow-[0_0_5px_#00f7ff]">${t("home.startTournament")}</span>
              </button>
              ` : `
              <button id="register-btn" class="group relative text-base sm:text-lg rounded-lg text-white flex justify-center items-center bg-black border-2 border-pongcyan px-4 sm:px-6 py-2 sm:py-3 
                transition-all duration-300 ease-in-out
                hover:text-pongcyan hover:shadow-[0_0_15px_rgba(0,247,255,0.7)]
                focus:outline-none
                animate-fade-up animate-duration-700 animate-delay-1000 animate-ease-linear">
                <span class="relative z-10 drop-shadow-[0_0_5px_#00f7ff]">${t("home.register")}</span>
              </button>
              <button id="ai-btn" class="group relative text-base sm:text-lg rounded-lg text-white flex justify-center items-center bg-black border-2 border-pongpink px-4 sm:px-6 py-2 sm:py-3 
                transition-all duration-300 ease-in-out
                hover:text-pongpink hover:shadow-[0_0_15px_rgba(255,0,228,0.7)]
                focus:outline-none
                animate-fade-up animate-duration-700 animate-delay-[1200ms] animate-ease-linear">
                <span class="relative z-10 drop-shadow-[0_0_5px_#ff00e4]">${t("home.playAI")}</span>
              </button>
              <button id="local-btn" class="group relative text-base sm:text-lg rounded-lg text-white flex justify-center items-center bg-black border-2 border-pongcyan px-4 sm:px-6 py-2 sm:py-3 
                transition-all duration-300 ease-in-out
                hover:text-pongcyan hover:shadow-[0_0_15px_rgba(0,247,255,0.7)]
                focus:outline-none
                animate-fade-up animate-duration-700 animate-delay-[1400ms] animate-ease-linear">
                <span class="relative z-10 drop-shadow-[0_0_5px_#00f7ff]">${t("home.playLocaly")}</span>
              </button>
              `}
            </div>
          </div>
        </div>
      </div>
    </div> 

    `;

    if(window.location.href.endsWith('/#') && localStorage.getItem("googleAuthClicked")) {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black opacity-40 z-50';
      container.appendChild(overlay);
      container.classList.add('overflow-hidden', 'pointer-events-none', 'items-center', 'justify-center');  
      const loadingContainer = document.createElement('div');
      loadingContainer.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60] bg-black border-2 border-pongcyan rounded-lg shadow-[0_0_15px_rgba(0,247,255,0.6)] p-4 z-60';
      loadingContainer.appendChild(PongLoading({text: "Signing you in..."}));
      container.appendChild(loadingContainer);
    }

    const headerNav = container.querySelector(".header");
    const header = Header();
    headerNav?.appendChild(header);

    const footerComp = Footer()
    container.appendChild(footerComp)

    container.querySelector("#register-btn")?.addEventListener("click", () => {
      navigate("/register");
    });

    container.querySelector('#local-btn')?.addEventListener('click', () => {
      navigate('/play/local-multi')
    })

    container.querySelector('#ai-btn')?.addEventListener('click', () => {
      navigate('/play/local-ai')
    })

    container.querySelector("#play-online-btn")?.addEventListener("click", () => {
      navigate("/play/online-game");
    })

    container.querySelector("#chat-friends-btn")?.addEventListener("click", () => {
      navigate("/chat");
    })

    container.querySelector("#start-tournament-btn")?.addEventListener("click", () => {
      navigate("/play/tournaments");
    })

    const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
    if (canvas) {
      new PongAnimation(canvas);
    }

    const getGoogleProfilePhoto = async (): Promise<string | null> => {
      try {
        const session = await account.getSession('current');
        const accessToken = session.providerAccessToken;
        
        
        if (!accessToken) {
          throw new Error('No Google access token available');
        }
    
        const response = await fetch(
          'https://people.googleapis.com/v1/people/me?personFields=photos',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
    
        const data = await response.json();
        const [profilePhoto] = data.photos || [];
        return profilePhoto?.url || null;
      } catch (error) {
        console.error('Error fetching Google profile photo:', error);
        return null;
      }
    };

    const checkUserAfterAuth = async (): Promise<void> => {
      try {
        const appwiteUser = await account.get();
        console.log(appwiteUser.$id);
        let photoUrl = await getGoogleProfilePhoto();
        console.log(photoUrl);
        const session = await account.getSession('current');
        try {
          const data = await axios.post("/authentication/auth/google/signIn", { email: appwiteUser.email, name: appwiteUser.name, country: session.countryName, image_url: photoUrl});
          if (!data.data.require2FA) {
            if (data.data.accessToken) {
              const decodedToken: any = jwtDecode(data.data.accessToken);
              photoUrl = decodedToken.avatarUrl || photoUrl;
              store.update("accessToken", data.data.accessToken);
              store.update("sessionUUID", data.data.sessUUID);
              store.update("userId", decodedToken.userId);
              store.update("email", decodedToken.email);
              store.update("nickname", decodedToken.nickname);
              store.update("fullName", decodedToken.fullName);
              store.update("age", decodedToken.age);
              store.update("country", decodedToken.country);
              store.update("createdAt", decodedToken.createdAt);
              store.update("avatarUrl", decodedToken.avatarUrl);
              store.update("is2faEnabled", decodedToken.is2fa);
              store.update("isLoggedIn", true);
              navigate("/");
              Toast.show(`Login successful, Welcome ${decodedToken.fullName}!`, "success");
            }
          } else {
            store.update("sessionUUID", data.data.sessUUID);
            navigate("/register/twofactor");
            Toast.show("First step is complete! Now moving to the 2fa code validation", "success");
          }
          try {
            await axios.post(`/authentication/auth/google_upload/${store.sessionUUID}?photo=${photoUrl as string}`, undefined, {
              headers:{
                Authorization: `Bearer ${store.accessToken}`,
              }
            })
            if (!store.avatarUrl)
              store.update("avatarUrl", photoUrl as string);
          } catch(err) {
            console.log(err);
          }
          localStorage.removeItem("googleAuthClicked");
          await initializeApp();
        } catch (err: any) {
          localStorage.removeItem("googleAuthClicked");
          if (err.response) {
            if (err.response.status === 404 || err.response.status === 403)
              Toast.show(`Error: ${err.response.data.message}`, "error");
            else if (err.response.status === 500)
              Toast.show(`Server error: ${err.response.data.error}`, "error");
            else
              Toast.show(`Unexpected error: ${err.response.data}`, "error");
          } else if (err.request)
            Toast.show(`No response from server: ${err.request}`, "error");
          else
            Toast.show(`Error setting up the request: ${err.message}`, "error");
          console.log(err);
        }
      } catch (err: any) {
        localStorage.removeItem("googleAuthClicked");
        Toast.show(`Error! cannot fetch user data! ${err.message}`, "error");
      }
    }

    if (localStorage.getItem("googleAuthClicked") === "true")
      await checkUserAfterAuth();
  },
};
