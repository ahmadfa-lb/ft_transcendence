import { createComponent } from "../../utils/StateManager.js";
import { Lang, t, setLanguage } from "../../languages/LanguageController.js";
import { navigate, refreshRouter } from "../../router.js";
import { DropDown } from "./DropDown.js";
import store from "../../../store/store.js";
import { displayResults } from "./searchFieldResults.js";
import axios from "axios";
import { Notification } from "../Notifications/Notification.js";
import { NotificationData } from "../../types/types.js";
import defaultImage from "../../assets/guests.png";
import chatService from "../../utils/chatUtils/chatWebSocketService.js";
import audioManager from "../../utils/audioUtils.js";
import { formatTimestamp } from "../../utils/formatTime.js";
import { formatInTimeZone } from "date-fns-tz";

export const Header = createComponent(() => {
    const container = document.createElement("header");
    container.className = "w-full mx-auto relative p-2 z-[999] flex items-center bg-black justify-between text-white max-sm:gap-2 border-b-2 border-pongcyan shadow-[0_5px_15px_rgba(0,247,255,0.5)]";
    container.innerHTML = `
        <div class="flex items-center justify-start w-1/2 gap-2 sm:gap-8">
            <div class="logo hidden sm:flex flex-col items-center text-center font-bold text-white text-xl transition-all duration-300 hover:animate-pulse">
                <span class="home-btn cursor-pointer text-pongcyan drop-shadow-[0_0_10px_#00f7ff] transition-all duration-300 hover:drop-shadow-[0_0_20px_#00f7ff] hover:text-white">
                    ft_transcendence
                </span>
                <span class="text-pongpink text-xs transition-all duration-300 hover:text-white drop-shadow-[0_0_5px_#ff00e4]">
                    Neon Pong
                </span>
            </div>
            <nav class="navbar items-center gap-4 hidden text-nowrap sm:flex">
                ${store.userId ? `
                <div class="nav-child playPage group flex flex-col justify-center items-center transition-all hover:cursor-pointer" onClick="${() => navigate('/play')}">
                    <i class="fa-solid fa-play text-lg sm:text-xl text-pongcyan drop-shadow-[0_0_5px_#00f7ff] group-hover:rotate-12 group-hover:text-white group-hover:drop-shadow-[0_0_10px_#00f7ff]"></i>
                    <span class="text-pongcyan group-hover:text-pongpink transition-all duration-300">${t('home.header.play')}</span>
                </div>
                <div class="nav-child flex flex-col group leaderBoard-page justify-center items-center transition-all hover:cursor-pointer">
                    <i class="fa-solid fa-ranking-star text-lg sm:text-xl text-pongcyan drop-shadow-[0_0_5px_#00f7ff] group-hover:rotate-12 group-hover:text-white group-hover:drop-shadow-[0_0_10px_#00f7ff]"></i>
                    <span class="text-pongcyan group-hover:text-pongpink transition-all duration-300">${t('home.header.leaderBoard')}</span>
                </div>
                <div class="nav-child nav-chat flex flex-col group justify-center items-center transition-all hover:cursor-pointer" onClick="${() => navigate('/chat')}">
                    <i class="fa-solid fa-comments text-lg sm:text-xl text-pongcyan drop-shadow-[0_0_5px_#00f7ff] group-hover:rotate-12 group-hover:text-white group-hover:drop-shadow-[0_0_10px_#00f7ff]"></i>
                    <span class="text-pongcyan group-hover:text-pongpink transition-all duration-300">${t('home.header.chat')}</span>
                </div>
            ` : ``}
            </nav>
            <nav class="nav-btn sm:hidden hover:cursor-pointer hover:opacity-80">
                <i class="fa-solid fa-bars text-2xl text-pongcyan drop-shadow-[0_0_5px_#00f7ff]"></i>
            </nav>
        </div>
        <div class="flex items-center justify-end gap-3 sm:gap-4 w-1/2">
            <div class="md:flex-1">
                ${store.userId ? `
                <form action="" id="search-bar-container" class="search-bar-container flex justify-center items-center gap-2 rounded-md md:p-2 md:bg-black md:border-2 md:border-pongcyan z-50">
                    <input type="text" name="search-bar" id="search-bar" autocomplete="off" placeholder="${t('home.header.search')}" class="w-full hidden md:block text-lg text-white bg-transparent rounded-md placeholder-pongcyan/50 focus:outline-none">
                    <label for="search-bar" class="fas fa-search text-pongcyan text-xl drop-shadow-[0_0_5px_#00f7ff] max-md:text-white hover:text-white hover:drop-shadow-[0_0_10px_#00f7ff] transition-all duration-300"></label>
                </form>                
                ` : ``}
            </div>
            ${store.userId ? `
            <div class="notification-bell relative group">
                <i class="fa-solid fa-bell text-pongpink text-2xl drop-shadow-[0_0_5px_#ff00e4] group-hover:scale-110 group-hover:rotate-12 transition-all hover:cursor-pointer hover:text-white hover:drop-shadow-[0_0_10px_#ff00e4]"></i>
                <span class="notification-count absolute -top-2 -right-2 rounded-full group-hover:animate-jump-in text-white bg-gray-500 hover:cursor-pointer w-5 h-5 flex items-center justify-center text-sm shadow-[0_0_5px_rgba(255,0,228,0.5)]">0</span>
            </div>
            <div class="notification hidden absolute scrollbar-thin shadow-[0_0_15px_rgba(0,247,255,0.5)] overflow-y-auto top-full ${localStorage.getItem('selectedLanguage') === 'ar' ? 'left-0' : 'right-0'} z-50 bg-black border-2 border-pongcyan w-[300px] py-2 pl-2 max-sm:pr-2 max-h-[300px] animate-fade-down animate-once animate-duration-300">

            </div>
            ` : ``}
            <select id="languages" name="languages_options" title="Select your language" class="text-xl bg-black border-2 border-pongpink rounded-full px-1 text-white text-[2.5rem] focus:outline-none hover:shadow-[0_0_10px_rgba(255,0,228,0.7)] cursor-pointer transition-all duration-300">
                <option value="en" class="text-center">en</option>
                <option value="fr" class="text-center">fr</option>
                <option value="ar" class="text-center">ع</option>
            </select>
            <div class="account relative flex gap-3 text-white">
                <div id="profile-head" class="flex gap-3 hover:cursor-pointer hover:text-pongcyan hover:drop-shadow-[0_0_5px_#00f7ff] transition-all duration-300">
                    <div class="profile-section group flex items-center justify-center gap-2">
                        <div class="flex items-center justify-center text-lg font-bold">
                        <p>${store.nickname || 'Guest'}</p>

                        </div>
                        <div class="w-10 h-10 group-hover:rotate-12 group-hover:scale-110 transition-all bg-slate-400 rounded-full bg-cover border-2 border-pongcyan shadow-[0_0_10px_rgba(0,247,255,0.5)]">
                            <img src="${store.avatarUrl || defaultImage}" class="size-full rounded-full"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ${store.userId ? `
        <div id="search-result-container" class="hidden absolute left-0 ${localStorage.getItem('selectedLanguage') === 'ar' ? 'md:left-48' : 'md:left-1/2'} top-[calc(100%+44px)] md:top-full z-[9999] w-fit h-fit max-md:w-full bg-black border-2 border-pongcyan rounded-md shadow-[0_0_15px_rgba(0,247,255,0.5)]"></div>
        ` : ``}
    `;

    const account = container.querySelector(".account")!;
    const dropdown = DropDown({ isLoggedIn: true });
    const profileHead = container.querySelector("#profile-head")!;
    profileHead.appendChild(dropdown);
    const account_list = container.querySelector(".account-list")!;
    const notificationContainer = container.querySelector('.notification')
    const notificationBell = container.querySelector('.notification-bell')!
    const notificationCount = container.querySelector('.notification-count')!
    const searchBar = container.querySelector('#search-bar') as HTMLInputElement
    const searchBarContainer = container.querySelector('#search-bar-container') as HTMLFormElement
    const searchIcon = container.querySelector('.fa-search')
    const navbar = container.querySelector('.navbar')!
    const navBtn = container.querySelector('.nav-btn')!
    const navChildren = container.querySelectorAll('.nav-child')!
    const navChat = container.querySelector('.nav-chat')
    const playPage = container.querySelector('.playPage')
    const leaderBoardPage = container.querySelector('.leaderBoard-page')
    const searchResult = container.querySelector('#search-result-container')!

    container.querySelector(".home-btn")?.addEventListener("click", () => {
        navigate("/");
    });

    navChat?.addEventListener('click', () => {
        navigate('/chat');
    });

    playPage?.addEventListener('click', () => {
        navigate('/play');
    });

    leaderBoardPage?.addEventListener('click', () => {
        navigate('/leader-board');
    });

    searchBar?.addEventListener('input', async () => {
        const searchQuery = searchBar.value.toLowerCase();
        await axios
            .get(`/authentication/auth/users`, {
                withCredentials: true,
            })
            .then((response) => {
                const allUsers = response.data;
                const filteredUsers = allUsers.filter((user: { nickname: string; }) =>
                    user.nickname.toLowerCase().includes(searchQuery)
                );

                if (searchQuery.length > 0) {
                    searchResult.classList.remove('hidden');
                    displayResults(filteredUsers, searchResult as HTMLElement);
                } else {
                    searchResult.classList.add('hidden');
                }
            })
            .catch((error) => {
                if (error.response && error.response.data) {
                    console.error("Error fetching user data:", error.response.data.message);
                } else {
                    console.error("Error fetching user data:", error.message);
                }
            });
    })

    searchBarContainer?.addEventListener('submit', (e: Event) => {
        e.preventDefault();
    });

    const languageSelect = container.querySelector("#languages") as HTMLSelectElement;
    const savedLanguage = localStorage.getItem("selectedLanguage");

    if (savedLanguage) {
        languageSelect.value = savedLanguage;
        setLanguage(languageSelect.value as Lang);
    }

    languageSelect.addEventListener("change", async function () {
        const selectedLanguage = this.value as Lang;
        await setLanguage(selectedLanguage, store.isLoggedIn);
        refreshRouter();
    });

    if (store.isLoggedIn) {
        languageSelect.value = store.language;
        setLanguage(store.language as Lang);
    } else {
        const savedLanguage = localStorage.getItem("selectedLanguage") || 'en';
        languageSelect.value = savedLanguage;
        setLanguage(savedLanguage as Lang);
    }

    async function fetchUserNotifications(userId: string | null): Promise<NotificationData[] | null> {
        try {
            const response = await axios.get(`/notifications/api/notifications/user/${userId}`);
            console.log(`data : ${response.data}`);
            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error('Axios error fetching notifications:', error.message);
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                } else if (error.request) {
                    console.error('Request made but no response received:', error.request);
                }
            } else {
                console.error('Unexpected error:', error);
            }
            return null;
        }
    }

    const userId = store.userId;
    async function markAllNotificationsAsRead() {
        try {
            await axios.patch(`/notifications/api/notifications/read/all/${userId}`, undefined);
            updateNotificationCount(0);
        } catch (err) {
            console.error('Failed to mark notifications as read:', err);
        }
    }

    function updateNotificationCount(count: number) {
        notificationCount.textContent = `${count}`;
        if (count === 0) {
            notificationCount.classList.remove('bg-red-600');
            notificationCount.classList.add('bg-gray-600');
        } else {
            notificationCount.classList.remove('bg-gray-600');
            notificationCount.classList.add('bg-red-600');
        }
    }

    function renderNotifications(notifications: NotificationData[]) {
        if (notificationContainer) {
            notificationContainer.innerHTML = '';
            if (notifications.length === 0) {
                const msg = document.createElement('p')
                msg.innerHTML = `<p class="text-slate-500 text-center">${t('home.header.noNotif')}</p>`
                notificationContainer.appendChild(msg)
                return
            }
            let unreadCount = 0;


            notifications.forEach(notification => {
                const createdAt = notification.created_at
                    ? formatInTimeZone(new Date(notification.created_at.toString().concat(' UTC')), 'Asia/Beirut', 'yyyy-MM-dd HH:mm:ss')
                    : null;
                const body = {
                    senderId: notification.sender_id,
                    recipientId: notification.recipient_id,
                    type: notification.type,
                    content: notification.content,
                    is_read: notification.is_read,
                    created_at: createdAt
                };

                if (!notification.is_read) unreadCount++;
                notificationContainer.appendChild(Notification(body));
            });
            updateNotificationCount(unreadCount);
        }
    }

    fetchUserNotifications(userId).then(data => {
        if (data) {
            renderNotifications(data);
        }
    });

    notificationBell?.addEventListener('click', () => {
        notificationContainer?.classList.toggle('hidden');
        markAllNotificationsAsRead();
    });

    document.addEventListener('click', (event: any) => {
        const isClickInside = navBtn.contains(event.target) || navbar.contains(event.target);

        if (!isClickInside) {
            navbar.classList.add('hidden');
            navBtn.innerHTML = '<i class="fa-solid fa-bars text-xl text-pongcyan drop-shadow-[0_0_5px_#00f7ff]"></i>';
        }
    });

    navBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const navStyles = `max-sm:animate-fade-down max-sm:animate-once max-sm:animate-duration-[600ms] max-sm:flex max-sm:z-50 max-sm:flex-col max-sm:absolute max-sm:top-full ${localStorage.getItem('selectedLanguage') === 'ar' ? 'max-sm:right-0' : 'max-sm:left-0'} max-sm:w-fit max-sm:gap-0`
        navStyles.split(' ').forEach(style => navbar.classList.toggle(style))
        if (!navBtn.innerHTML.includes('fa-bars-staggered')) {
            navBtn.innerHTML = '<i class="fa-solid fa-bars-staggered text-xl text-pongpink drop-shadow-[0_0_5px_#ff00e4]"></i>';
        } else {
            navBtn.innerHTML = '<i class="fa-solid fa-bars text-xl text-pongcyan drop-shadow-[0_0_5px_#00f7ff]"></i>';
        }
        navbar.classList.toggle('hidden')
        const childrenStyles = 'max-sm:flex-row max-sm:w-full max-sm:max-w-full max-sm:justify-start max-sm:gap-2 max-sm:bg-black max-sm:border-y max-sm:border-pongcyan max-sm:py-3 max-sm:px-5 max-sm:transition-all max-sm:hover:pl-7 max-sm:hover:pr-3'
        navChildren.forEach(nav =>
            childrenStyles.split(' ').forEach(style => nav.classList.toggle(style))
        );
    })

    searchIcon?.addEventListener('click', () => {
        const styles = 'max-md:block max-md:absolute max-md:top-full max-md:left-0 max-md:p-2 max-md:h-fit max-md:bg-black max-md:border-2 max-md:border-pongcyan max-md:shadow-[0_0_10px_rgba(0,247,255,0.5)]'
        styles.split(' ').forEach(style => searchBar.classList.toggle(style))
        if (searchBar.classList.contains('hidden'))
            searchBar.value = "";
        searchBar.classList.toggle('hidden')
    })

    account.addEventListener("click", () => {
        account_list.classList.toggle("hidden");
        account_list.classList.toggle("flex");
    });

    document.addEventListener('click', (event: Event) => {
        const path = event.composedPath();
        if (notificationContainer
            && !path.includes(notificationContainer)
            && !path.includes(notificationBell)) {
            notificationContainer.classList.add('hidden');
        }

        if (account_list
            && !path.includes(account_list)
            && !path.includes(account)) {
            account_list.classList.add("hidden");
            account_list.classList.remove("flex");
        }

        if (navbar
            && !path.includes(navbar)
            && !path.includes(navBtn)) {
            navbar.classList.add('hidden')
            const navStyles = 'max-sm:animate-fade-down max-sm:animate-once max-sm:animate-duration-[600ms] max-sm:flex max-sm:flex-col max-sm:absolute max-sm:top-full max-sm:left-0 max-sm:w-fit max-sm:gap-0'
            navStyles.split(' ').forEach(style => navbar.classList.remove(style))
            const childrenStyles = 'max-sm:flex-row max-sm:w-full max-sm:max-w-full max-sm:justify-start max-sm:gap-2 max-sm:bg-black max-sm:border-y max-sm:border-pongcyan max-sm:py-3 max-sm:px-5 max-sm:transition-all max-sm:hover:pl-7 max-sm:hover:pr-3'
            navChildren.forEach(nav =>
                childrenStyles.split(' ').forEach(style => nav.classList.remove(style))
            )
        }

        if (searchBar
            && !path.includes(searchBar)
            && searchIcon && !path.includes(searchIcon)) {
            const styles = 'max-md:block max-md:absolute max-md:top-full max-md:left-0 max-md:p-2 max-md:h-fit max-md:bg-black max-md:border-2 max-md:border-pongcyan max-md:shadow-[0_0_10px_rgba(0,247,255,0.5)]'
            styles.split(' ').forEach(style => searchBar.classList.remove(style))
            searchBar.classList.add('hidden')
        }

        if (searchResult
            && !path.includes(searchResult)) {
            setTimeout(() => {
                searchResult.classList.add('hidden');
            }, 100);
        }
    });

    function setupRealTimeNotifications() {
        chatService.on("error", (data) => {
            console.error(`Error!, ${data.message}`);
        })
        chatService.on('notification:new', (data) => {

            audioManager.playNotificationSound();

            addNewNotificationToUI(data);

            const currentCount = parseInt(notificationCount.textContent || '0');
            updateNotificationCount(currentCount + 1);

            notificationBell.classList.add('animate-bounce');
            setTimeout(() => notificationBell.classList.remove('animate-bounce'), 1000);
        });

        chatService.on('notifications:marked_read', () => {
            updateNotificationCount(0);
        });
    }

    function addNewNotificationToUI(notificationData: any) {
        if (notificationContainer) {
            const newNotification = Notification({
                senderId: notificationData.senderId,
                recipientId: notificationData.recipientId,
                type: notificationData.type,
                content: notificationData.content,
                is_read: false,
                created_at: new Date().toISOString()
            });

            notificationContainer.insertBefore(newNotification, notificationContainer.firstChild);
        }
    }

    setupRealTimeNotifications();

    return container;
});