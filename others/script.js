const btn = document.querySelector(".join_button");
const defaultCode = "z7AmmNHvKR";
const allowedGuildId = "1208962938388484107";

let finalCode = defaultCode; // デフォルト

// invite 検証用の async 関数
async function validateInvite() {
    const params = new URLSearchParams(window.location.search);
    const rawCode = params.has("invite") && /^[A-Za-z0-9-]+$/.test(params.get("invite"))
        ? params.get("invite")
        : null;

    if (!rawCode) return defaultCode;

    try {
        const res = await fetch(`https://bot.sakurahp.f5.si/api/invites/${rawCode}`);
        if (!res.ok) return defaultCode;

        const data = await res.json();
        if (data.match === true && data.invite.guild?.id === allowedGuildId) {
            return rawCode;
        }
    } catch (err) {
        console.error("招待コード検証エラー:", err);
    }
    return defaultCode;
}

// ボタンクリック時に検証してから開く
btn.addEventListener("click", async () => {
    const code = await validateInvite(); // 検証が完了するまで待つ
    window.open(`https://discord.gg/${code}`, "_blank");
});

// 元の DOMContentLoaded 内のお知らせ・サーバー情報取得はそのまま
document.addEventListener("DOMContentLoaded", async () => {
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
