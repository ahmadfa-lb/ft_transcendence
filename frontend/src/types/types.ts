export interface Page {
	render: (container: HTMLElement, params?: { [key: string]: string }, state?: any) => void;
}

export type AIDifficulty = "easy" | "medium" | "hard";

export interface NotificationData {
	id: number;
	sender_id: number;
	recipient_id: number;
	type: "USER_MESSAGE" | "TOURNAMENT_ALERT" | "FRIEND_REQUEST" | "FRIEND_ACCEPTED" | "GAME_CHALLENGE";
	content?: string;
	created_at: Date;
	is_read: boolean;
}

export type GameType = "AI" | "Local" | "online";