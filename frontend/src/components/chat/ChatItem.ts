/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ChatItem.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: afarachi <afarachi@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/06/22 15:14:01 by afarachi          #+#    #+#             */
/*   Updated: 2025/06/22 15:14:01 by afarachi         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import store from "../../../store/store.js";
import { createComponent } from "../../utils/StateManager.js";
import chatService from "../../utils/chatUtils/chatWebSocketService.js";

interface ChatItemProps {
    username: string,
    userId: number,
    fullname: string,
    status: string,
    avatar_url: string;
    unreadCount: number,
    onChatSelect?: (user: { nickname: string, id: number, full_name: string, avatar_url: string }) => void
}

export const ChatItem = createComponent((props: ChatItemProps) => {
    const chatItem = document.createElement('div');
    chatItem.className = 'user-item flex items-center p-3 rounded-lg transition-all duration-300 hover:bg-ponghover hover:cursor-pointer border-b border-b-gray-800 mx-1 my-1';
    chatItem.dataset.username = props.username;

    chatItem.setAttribute('data-username', props.username);

    if (props.status) {
        chatItem.classList.add('border-l-4', 'border-l-green-500');
        chatItem.classList.add('shadow-[0_0_5px_rgba(0,247,255,0.3)]');
    } else {
        chatItem.classList.add('border-l-4', 'border-l-red-500');
        chatItem.classList.add('shadow-[0_0_5px_rgba(255,0,228,0.3)]');
    }

    const render = () => {
        chatItem.innerHTML = `
            <div class="flex items-center gap-3 flex-1">
                <div class="avatar-container relative">
                    <div class="avatar h-12 w-12 rounded-full bg-black border-2 ${props.status ? 'border-pongcyan' : 'border-pongpink'} flex items-center justify-center text-xl font-semibold ${props.status ? 'text-pongcyan' : 'text-pongpink'} transition-all duration-300 ${props.status ? 'shadow-[0_0_10px_rgba(0,247,255,0.4)]' : 'shadow-[0_0_10px_rgba(255,0,228,0.4)]'}">
                        ${props.avatar_url ? `<img src="${props.avatar_url}" class="h-11 w-11 rounded-full"/>` : props.fullname.charAt(0).toUpperCase() }
                    </div>
                    ${props.unreadCount > 0 ? `
                    <div class="absolute top-0 right-0 bg-red-600 text-white rounded-full 
                        text-xs min-w-[20px] h-5 flex items-center justify-center px-1 shadow-[0_0_10px_rgba(255,0,228,0.6)] animate-pulse">
                        ${props.unreadCount > 9 ? '9+' : props.unreadCount}
                    </div>
                    ` : ''}
                </div>
                
                <div class="user-info flex flex-col">
                    <span class="font-medium text-white">${props.fullname}</span>
                    <span class="text-sm ${props.status ? 'text-pongcyan' : 'text-pongpink'} opacity-80">@${props.username}</span>
                </div>
            </div>
        `;
    
        attachEventListeners();
    };

    const attachEventListeners = () => {
        const addFriend = chatItem.querySelector('.add-friend');
        if (addFriend) {
            addFriend.addEventListener('click', (e) => {
                e.stopPropagation();

                if (addFriend.firstChild instanceof Element &&
                    addFriend.firstChild.classList.contains('fa-user-clock')) {
                    return;
                }

                console.log('Add Friend Clicked');

                if (chatService.isConnected()) {
                    chatService.sendFriendRequest(props.username);

                    addFriend.firstChild?.remove();
                    addFriend.innerHTML = `<i class="fas fa-user-clock text-pongcyan"></i>`;
                    addFriend.classList.add('bg-black');
                    addFriend.classList.add('border-pongcyan');
                    addFriend.classList.add('animate-pulse');
                    addFriend.classList.add('shadow-[0_0_10px_rgba(0,247,255,0.5)]');
                }
            });
        }

        chatItem.addEventListener('click', () => {
            if (props.unreadCount > 0) {
                const currentUserId = store.userId;
                const roomId = [currentUserId, props.userId].sort().join("-");                
                chatService.markMessagesAsRead(roomId);                
                props.unreadCount = 0;
                render();
            }
            
            document.querySelectorAll('.user-item').forEach(item => {
                item.classList.remove('bg-ponghover', 'shadow-[0_0_15px_rgba(255,0,228,0.5)]', 'border-pongpink');
            });
            
            chatItem.classList.add('bg-ponghover');
            chatItem.classList.add('shadow-[0_0_15px_rgba(255,0,228,0.5)]');
            chatItem.classList.add('border-pongpink');
        
            if (props.onChatSelect) {
                props.onChatSelect({
                    nickname: props.username,
                    id: props.userId,
                    full_name: props.fullname,
                    avatar_url: props.avatar_url,
                });
            }
        
            if (window.innerWidth < 640) {
                const chatContainer = document.querySelector('.chat');
                if (chatContainer) {
                    chatContainer.classList.remove('hidden');
                    chatContainer.classList.add('fixed', 'bottom-0', 'left-0', 'w-full', 'h-[100dvh]', 'animate-slideUp', 'z-90');
                    chatContainer.classList.remove('animate-slideDown');
                }
            }
        });
    };

    render();
    return chatItem;
});