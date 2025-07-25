import { createComponent } from "../../utils/StateManager.js";
import { t } from "../../languages/LanguageController.js";
import axios from "axios";
import store from "../../../store/store.js";
import { navigate } from "../../router.js";
import Toast from "../../toast/Toast.js";
import { jwtDecode } from "jwt-decode";

export const TwoFactorSend = createComponent(() => {
	const form = document.createElement('div');
	form.className = `w-[93vw] sm:w-96 xl:w-[30vw] bg-white rounded-lg p-4 sm:p-8`;
	form.innerHTML = `
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-2">
				<h1 class="text-2xl sm:text-3xl font-bold text-center text-pongcyan">${t("register.twoFactor.title")}</h1>
				<p class="text-center">${t("register.twoFactor.info")}</p>
			</div>
			<form class="flex flex-col gap-4">
				<div id="auth-code" class="flex gap-4 justify-center">
					<input type="text" class="size-8 sm:size-10 border-2 border-ponghover text-center rounded-lg text-pongdark text-2xl" maxlength="1" autocomplete="off" inputmode="numeric"/>
					<input type="text" class="size-8 sm:size-10 border-2 border-ponghover text-center rounded-lg text-pongdark text-2xl" maxlength="1" autocomplete="off" inputmode="numeric"/>
					<input type="text" class="size-8 sm:size-10 border-2 border-ponghover text-center rounded-lg text-pongdark text-2xl" maxlength="1" autocomplete="off" inputmode="numeric"/>
					<input type="text" class="size-8 sm:size-10 border-2 border-ponghover text-center rounded-lg text-pongdark text-2xl" maxlength="1" autocomplete="off" inputmode="numeric"/>
					<input type="text" class="size-8 sm:size-10 border-2 border-ponghover text-center rounded-lg text-pongdark text-2xl" maxlength="1" autocomplete="off" inputmode="numeric"/>
					<input type="text" class="size-8 sm:size-10 border-2 border-ponghover text-center rounded-lg text-pongdark text-2xl" maxlength="1" autocomplete="off" inputmode="numeric"/>
				</div>
				<a id="back-signIn" class="text-center text-pongcyan hover:underline cursor-pointer text-sm sm:text-base">
					${t("register.twoFactor.back")}
				</a>
			</form>
		</div>
	`;

	const formElement: HTMLFormElement = form.querySelector('form')!;
	const inputs: NodeListOf<HTMLInputElement> = form.querySelectorAll("#auth-code input");
	const customAnchor = form.querySelector<HTMLAnchorElement>("#back-signIn");
	if (customAnchor) {
		customAnchor.addEventListener("click", async(e) => {
			e.preventDefault();
			try {
				await axios.delete(`/authentication/auth/sessions/${store.sessionUUID}`);
				store.update("sessionUUID", null);
				if (localStorage.getItem("googleAuth") === "true")
					localStorage.removeItem("googleAuth");
				if (localStorage.getItem("avatarUrl") != null)
					localStorage.removeItem("avatarUrl");
				navigate("/register");
			}
			catch(error: any) {
				if (error.response) {
					if (error.response.status === 404)
						Toast.show(`Error: ${error.response.data.message}`, "error");
					else if (error.response.status === 500)
						Toast.show(`Server error: ${error.response.data.error}`, "error");
					else
						Toast.show(`Unexpected error: ${error.response.data}`, "error");
				} else if (error.request)
					Toast.show(`No response from server: ${error.request}`, "error");
				else
					Toast.show(`Error setting up the request: ${error.message}`, "error");
			}
		});
	}

	if (inputs.length) {
		requestAnimationFrame(() => {
			inputs[0].focus();
			inputs[0].select();
		});
	}

	inputs.forEach((input, index) => {
		input.addEventListener("input", (e: Event) => {
			const target = e.target as HTMLInputElement;
			const value = target.value;

			if (!/^\d$/.test(value)) {
				target.value = "";
				return;
			}

			if (value.length >= 1 && index < inputs.length - 1) {
				inputs[index + 1].focus();
			}

			const allFilled = Array.from(inputs).every(input => input.value.length === 1);
			if (allFilled)
				formElement.requestSubmit();
		});

		input.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Backspace" && input.value === "" && index > 0)
				inputs[index - 1].focus();
		});
	});

	form.addEventListener("submit", async (e: Event) => {
		e.preventDefault();
		let code: String = Array.from(inputs).map(input => input.value).join('');
		console.log("Entered code:", code);
		inputs.forEach(input => { input.value = "" });
		requestAnimationFrame(() => { inputs[0].focus() });
		const body = {
			code: code,
		};
		try {
			const userData = await axios.post(`/authentication/auth/twoFactor/login/${store.sessionUUID}`, body);
			const decodedToken: any = jwtDecode(userData.data.accessToken);
			store.update("accessToken", userData.data.accessToken);
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
			navigate("/play");
			Toast.show(`Login successful, Welcome ${decodedToken.fullName}!`, "success");
		} catch (err: any) {
			if (err.response) {
				if (err.response.status === 400 || err.response.status === 403 || err.response.status === 404)
					Toast.show(`Error: ${err.response.data.message}`, "error");
				else if (err.response.status === 500)
					Toast.show(`Server error: ${err.response.data.error}`, "error");
				else
					Toast.show(`Unexpected error: ${err.response.data}`, "error");
			}
			else if (err.request)
				Toast.show(`No response from server: ${err.request}`, "error");
			else
				Toast.show(`Error setting up request: ${err.message}`, "error");
		}
	});

	return form;
})