import { t } from "../../languages/LanguageController.js";
import { navigate } from "../../router.js";
import { createComponent } from "../../utils/StateManager.js";

export const Footer = createComponent(() => {
    const container = document.createElement("footer");
    container.className = "w-full h-[68px] flex items-center justify-center px-2 text-lg font-normal text-white bg-pongblue";
    container.innerHTML = `
        <p class="text-center">
            © ${new Date().getFullYear()} ${t("home.footer.developed")}
            <button id="about-us" class="text-pongdark font-medium hover:opacity-70 transition-all">Afarachi, Moabbas, Jfatfat</button>.
            <span class="max-[380px]:hidden"> ${t("home.footer.rights")}</span>
        </p>
    `;
    container.querySelector("#about-us")?.addEventListener("click", () => {
        navigate("/about-us");
    })
    return container;
});
