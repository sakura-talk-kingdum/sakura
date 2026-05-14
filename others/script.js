document.addEventListener("DOMContentLoaded", async () => {
    let finalCode = "sakuraza-tan-wang-guo-sakura-talk-kingdom-1208962938388484107"; // デフォルト
    const allowedGuildId = "1208962938388484107";
    const buttons = document.querySelectorAll(".join_button");
    const menuToggle = document.querySelector(".menu-toggle");
    const globalNav = document.getElementById("global-nav");

    function setMenuOpen(isOpen) {
        if (!menuToggle || !globalNav) return;

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        globalNav.classList.toggle("is-open", isOpen);
        document.body.classList.toggle("menu-open", isOpen);
    }

    if (menuToggle && globalNav) {
        menuToggle.addEventListener("click", () => {
            const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
            setMenuOpen(!isOpen);
        });

        globalNav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => setMenuOpen(false));
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") setMenuOpen(false);
        });

        document.addEventListener("click", event => {
            const target = event.target;
            if (!(target instanceof Node)) return;
            if (!globalNav.classList.contains("is-open")) return;
            if (menuToggle.contains(target) || globalNav.contains(target)) return;

            setMenuOpen(false);
        });
    }

    async function initInvite() {
        const params = new URLSearchParams(window.location.search);
        const rawCode = params.get("invite");

        if (!rawCode || !/^[A-Za-z0-9-]+$/.test(rawCode)) {
            console.log("招待コードなし、または不正な形式のため検証スキップ。");
            return null;
        }

        try {
            const res = await fetch(`https://bot.sakurahp.f5.si/api/invites/${rawCode}`);

            if (!res.ok) {
                console.error("APIからHTTPエラー応答:", res.status, res.statusText);
                return null;
            }

            const data = await res.json();
            if (data.match === true && data.invite.guild?.id === allowedGuildId) {
                console.log("招待コード検証OK: 有効なコードを確認しました。");
                return rawCode;
            }

            console.log("招待コードは無効か、許可されていないサーバーのものでした。データ:", data);
            return null;
        } catch (err) {
            console.error("招待コード検証でネットワーク/ブロックエラー:", err);
            return null;
        }
    }

    const verifiedCode = await initInvite();
    if (verifiedCode) {
        finalCode = verifiedCode;
    }

    // --- ボタン処理 ---
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            console.log("ボタン押された。利用コード:", finalCode);
            window.open(`https://discord.gg/${finalCode}`, "_blank", "noopener");
        });
    });

    // --- お知らせ取得 ---
    try {
        const box = document.getElementById("news_box");
        if (box) {
            box.textContent = "";
            box.setAttribute("aria-busy", "true");
        }

        const res = await fetch("https://api.kotoca.net/get?ch=announce");
        if (!res.ok) throw new Error("Fetch失敗: " + res.status);

        const data = await res.json();
        console.log("お知らせデータ取得:", data);

        if (box) {
            data.forEach((entry, index) => {
                const date = new Date(entry.createdAt).toLocaleString();
                const lines = entry.content.split("\n");
                let titleLineIndex = lines.findIndex(line => line.startsWith("# "));
                if (titleLineIndex === -1) titleLineIndex = 0;

                const title = lines[titleLineIndex].replace(/^#\s*/, "");
                const bodyLines = lines.slice(titleLineIndex + 1);
                const body = bodyLines.join("\n");
                const bodyId = `news-body-${index}`;

                const article = document.createElement("article");
                article.className = "news-item";

                const pDate = document.createElement("p");
                pDate.textContent = date;

                const heading = document.createElement("h3");
                const toggle = document.createElement("button");
                toggle.type = "button";
                toggle.className = "news-toggle";
                toggle.textContent = title;
                toggle.setAttribute("aria-expanded", "false");
                toggle.setAttribute("aria-controls", bodyId);

                const divBody = document.createElement("div");
                divBody.id = bodyId;
                divBody.className = "news-body";
                divBody.hidden = true;

                const html = marked.parse(body);
                divBody.innerHTML = DOMPurify.sanitize(html);

                toggle.addEventListener("click", () => {
                    const isOpen = toggle.getAttribute("aria-expanded") === "true";
                    toggle.setAttribute("aria-expanded", String(!isOpen));
                    divBody.hidden = isOpen;
                });

                heading.appendChild(toggle);
                article.appendChild(pDate);
                article.appendChild(heading);
                article.appendChild(divBody);
                box.appendChild(article);

                if (index !== data.length - 1) {
                    const hr = document.createElement("hr");
                    box.appendChild(hr);
                }
            });
            box.setAttribute("aria-busy", "false");
        }
    } catch (err) {
        console.error("お知らせ読み込みでエラー:", err);
        const box = document.getElementById("news_box");
        if (box) {
            box.textContent = "お知らせの読み込み中にエラーが発生しました。";
            box.setAttribute("aria-busy", "false");
        }
    }

    // --- サーバー情報取得 ---
    const domElements = {
        member: document.getElementById("member-count"),
        online: document.getElementById("online-count"),
        vc: document.getElementById("vc-count"),
        timestamp: document.getElementById("server_info_timestamp")
    };
    const errorText = "エラー";

    try {
        const res = await fetch("https://bot.sakurahp.f5.si/api");
        if (!res.ok) throw new Error("Fetch失敗: " + res.status);

        const data = await res.json();
        console.log("サーバー情報取得:", data);

        if (domElements.member) domElements.member.textContent = data.guild?.member ?? "取得不可";
        if (domElements.online) domElements.online.textContent = data.guild?.online ?? "取得不可";
        if (domElements.vc) domElements.vc.textContent = data.guild?.voice ?? "取得不可";
        if (domElements.timestamp) domElements.timestamp.textContent = data.timestamp ?? "エラーにより取得できませんでした";
    } catch (err) {
        console.error("サーバー情報読み込みでエラー:", err);

        if (domElements.member) domElements.member.textContent = errorText;
        if (domElements.online) domElements.online.textContent = errorText;
        if (domElements.vc) domElements.vc.textContent = errorText;
        if (domElements.timestamp) domElements.timestamp.textContent = errorText;
    }

    async function loadEvents() {
        const container = document.getElementById("events-api");
        if (!container) return;

        try {
            const res = await fetch("https://bot.sakurahp.f5.si/api/events");
            if (!res.ok) throw new Error("Fetch失敗: " + res.status);

            const data = await res.json();

            if (!data.events || data.events.length === 0) {
                container.textContent = "イベントなし";
                return;
            }

            container.textContent = "";

            data.events.forEach(event => {
                const div = document.createElement("article");
                div.className = "event";

                const start = new Date(event.scheduled_start).toLocaleString();
                const end = new Date(event.scheduled_end).toLocaleString();

                const title = document.createElement("h3");
                title.textContent = event.name || "イベント名未設定";

                const description = document.createElement("p");
                description.textContent = event.description || "説明はありません。";

                const startText = document.createElement("p");
                startText.textContent = `開始: ${start}`;

                const endText = document.createElement("p");
                endText.textContent = `終了: ${end}`;

                const userCount = document.createElement("p");
                userCount.textContent = `参加者: ${event.user_count ?? "不明"}`;

                div.append(title, description, startText, endText, userCount);
                container.appendChild(div);
            });
        } catch (err) {
            container.textContent = "取得エラー";
            console.error(err);
        }
    }

    loadEvents();

    // --- bot一覧取得 ---
    try {
        const res = await fetch("https://api.kotoca.net/get?ch=bots");
        if (!res.ok) throw new Error("Fetch失敗: " + res.status);

        const data = await res.json();
        console.log("Bot一覧データ取得:", data);

        const ul = document.getElementById("bots_ul");
        const othersLi = document.getElementById("bots_others");
        if (othersLi) othersLi.remove();

        if (ul) {
            data.forEach(entry => {
                const lines = entry.content.split("\n");
                const botName = lines[0] || "名前不明";
                const description = lines.slice(1).join("\n") || "";

                const li = document.createElement("li");
                const topDiv = document.createElement("div");
                topDiv.className = "bot-card-header";

                if (entry.attach && entry.attach.length > 0) {
                    const img = document.createElement("img");
                    img.src = entry.attach[0];
                    img.alt = `${botName}のアイコン`;
                    topDiv.appendChild(img);
                }

                const h3 = document.createElement("h3");
                h3.textContent = botName;
                topDiv.appendChild(h3);

                const p = document.createElement("p");
                p.textContent = description;

                li.appendChild(topDiv);
                li.appendChild(p);
                ul.appendChild(li);
            });
        }
    } catch (err) {
        console.error("Bot一覧取得エラー:", err);
        const ul = document.getElementById("bots_ul");
        if (ul) ul.innerHTML = `<li>Bot一覧の読み込み中にエラーが発生しました。</li>`;
    }
});
