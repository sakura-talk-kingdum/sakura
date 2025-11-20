let finalCode = "z7AmmNHvKR"; // デフォルト
const allowedGuildId = "1208962938388484107";

// invite 検証用関数
async function validateInvite() {
    const params = new URLSearchParams(window.location.search);
    const rawCode = params.has("invite") && /^[A-Za-z0-9-]+$/.test(params.get("invite"))
        ? params.get("invite")
        : null;

    if (!rawCode) return;

    try {
        const res = await fetch(`https://bot.sakurahp.f5.si/api/invites/${rawCode}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.match === true && data.invite.guild?.id === allowedGuildId) {
            finalCode = rawCode; // OKなら書き換え
        }
    } catch (err) {
        console.error("招待コード検証エラー:", err);
    }
}

// ページロード時に即検証（非同期でOK）
validateInvite();

document.addEventListener("DOMContentLoaded", async () => {
    const overlay = document.getElementById("overlay");
    const buttons = document.querySelectorAll(".join_button");

    // 参加ボタン全てにイベント付与
    buttons.forEach(btn => {
        btn.addEventListener("click", async () => {
            overlay.style.display = "flex"; // overlay表示

            // 念のためボタンクリック時に invite 検証
            await validateInvite();

            window.open(`https://discord.gg/${finalCode}`, "_blank");

            // 1秒後に overlay を閉じる
            setTimeout(() => overlay.style.display = "none", 1000);
        });
    });

    // --- お知らせ取得 ---
    try {
        const res = await fetch("https://api.kotoca.net/get?ch=announce");
        if (!res.ok) throw new Error("Fetch失敗: " + res.status);

        const data = await res.json();
        const box = document.getElementById("news_box");
        box.textContent = "";

        data.forEach((entry, index) => {
            const date = new Date(entry.createdAt).toLocaleString();

            const lines = entry.content.split('\n');
            let titleLineIndex = lines.findIndex(line => line.startsWith('# '));
            if (titleLineIndex === -1) titleLineIndex = 0;
            const title = lines[titleLineIndex].replace(/^#\s*/, '');
            const bodyLines = lines.slice(titleLineIndex + 1);
            const body = bodyLines.join('\n');

            const pDate = document.createElement("p");
            pDate.textContent = date;

            const h3 = document.createElement("h3");
            h3.textContent = title;
            h3.style.cursor = "pointer";

            const divBody = document.createElement("div");
            divBody.textContent = body;
            divBody.style.boxShadow = "none";
            divBody.style.border = "none";
            divBody.style.display = "none";
            divBody.style.whiteSpace = "pre-wrap";

            h3.addEventListener("click", () => {
                divBody.style.display = divBody.style.display === "none" ? "block" : "none";
            });

            box.appendChild(pDate);
            box.appendChild(h3);
            box.appendChild(divBody);

            if (index !== data.length - 1) {
                const hr = document.createElement("hr");
                box.appendChild(hr);
            }
        });

    } catch (err) {
        console.error("お知らせ読み込みでエラー:", err);
    }

    // --- サーバー情報取得 ---
    try {
        const res = await fetch("https://bot.sakurahp.f5.si/api");
        if (!res.ok) throw new Error("Fetch失敗: " + res.status);

        const data = await res.json();

        const memberSpan = document.getElementById("member-count");
        const onlineSpan = document.getElementById("online-count");
        const vcSpan = document.getElementById("vc-count");
        const timestampSpan = document.getElementById("server_info_timestamp");

        if (memberSpan) memberSpan.textContent = data.guild.member ?? "取得不可";
        if (onlineSpan) onlineSpan.textContent = data.guild.online ?? "取得不可";
        if (vcSpan) vcSpan.textContent = data.guild.voice ?? "取得不可";
        if (timestampSpan) timestampSpan.textContent = data.timestamp ?? "エラーにより取得できませんでした";

    } catch (err) {
        console.error("サーバー情報読み込みでエラー:", err);

        const memberSpan = document.getElementById("member-count");
        const onlineSpan = document.getElementById("online-count");
        const vcSpan = document.getElementById("vc-count");

        if (memberSpan) memberSpan.textContent = "エラー";
        if (onlineSpan) onlineSpan.textContent = "エラー";
        if (vcSpan) vcSpan.textContent = "エラー";
    }
});
