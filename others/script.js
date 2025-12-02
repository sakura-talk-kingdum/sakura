document.addEventListener("DOMContentLoaded", async () => {
    let finalCode = "z7AmmNHvKR"; // デフォルト
    const allowedGuildId = "1208962938388484107";
    const overlay = document.getElementById("overlay");
    const buttons = document.querySelectorAll(".join_button");

    // --- ページロード時に invite 検証 ---
    
// ... initInvite 関数の定義を以下のように修正 ...

    async function initInvite() {
        const params = new URLSearchParams(window.location.search);
        const rawCode = params.get("invite");

        if (!rawCode || !/^[A-Za-z0-9-]+$/.test(rawCode)) {
            console.log("招待コードなし、または不正な形式のため検証スキップ。");
            return null;
        }

        try {
            console.log(`[検証開始] Code: ${rawCode} をAPIで確認中...`); // ★追加ログ: 開始確認★
            const res = await fetch(`https://bot.sakurahp.f5.si/api/invites/${rawCode}`);
            
            console.log(`[API応答] Status: ${res.status}`); // ★追加ログ: HTTPステータス確認★

            if (!res.ok) {
                // Firefoxでこのログが出た場合、CORSまたは外部ブロックの可能性が高い
                console.error("⚠️ APIからHTTPエラー応答:", res.status, res.statusText);
                return null;
            }

            const data = await res.json();
            if (data.match === true && data.invite.guild?.id === allowedGuildId) {
                console.log("✅ 招待コード検証OK: 有効なコードを確認しました。");
                return rawCode;
            } else {
                console.log("⚠️ 招待コードは無効か、許可されていないサーバーのものでした。データ:", data);
                return null;
            }
        } catch (err) {
            // Firefoxでここで止まる場合、セキュリティ機能によるブロックの可能性が濃厚
            console.error("❌ 招待コード検証でネットワーク/ブロックエラー:", err); // ★エラー詳細を確認★
            return null;
        }
    }
    
    const verifiedCode = await initInvite(); // 検証を実行
    if (verifiedCode) {
        finalCode = verifiedCode; // 有効なコードで更新
    }
    // 検証失敗時は finalCode はデフォルト値 "z7AmmNHvKR" のまま保持されます。

    // --- ボタン処理 ---
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            console.log("ボタン押された。利用コード:", finalCode);
            overlay.style.display = "flex";

            // 改善案: window.openは非同期ではないため、setTimeoutは短縮または削除を検討。
            window.open(`https://discord.gg/${finalCode}`, "_blank");
            // ユーザー体験を考慮し、すぐに非表示に戻します。
            setTimeout(() => overlay.style.display = "none", 300); 
        });
    });

    // --- お知らせ取得 ---
    try {
        const box = document.getElementById("news_box");
        // 取得前に既存コンテンツをクリア
        if (box) box.textContent = ""; 

        const res = await fetch("https://api.kotoca.net/get?ch=announce");
        if (!res.ok) throw new Error("Fetch失敗: " + res.status);

        const data = await res.json();
        console.log("お知らせデータ取得:", data);
        
        if (box) {
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
        }
    } catch (err) {
        console.error("お知らせ読み込みでエラー:", err);
        // エラー時のユーザーへのフィードバック（任意）
        const box = document.getElementById("news_box");
        if(box) box.textContent = "お知らせの読み込み中にエラーが発生しました。";
    }

    // --- サーバー情報取得 ---
    // 改善案: DOM要素の取得を一度にまとめて、エラー時の処理を共通化
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

        // データが存在すれば更新、なければ「取得不可」
        if (domElements.member) domElements.member.textContent = data.guild?.member ?? "取得不可";
        if (domElements.online) domElements.online.textContent = data.guild?.online ?? "取得不可";
        if (domElements.vc) domElements.vc.textContent = data.guild?.voice ?? "取得不可";
        if (domElements.timestamp) domElements.timestamp.textContent = data.timestamp ?? "エラーにより取得できませんでした";

    } catch (err) {
        console.error("サーバー情報読み込みでエラー:", err);

        // エラー発生時は全て「エラー」表示
        if (domElements.member) domElements.member.textContent = errorText;
        if (domElements.online) domElements.online.textContent = errorText;
        if (domElements.vc) domElements.vc.textContent = errorText;
        if (domElements.timestamp) domElements.timestamp.textContent = errorText;
    }

    // --- bot一覧取得 ---
    try {
        const res = await fetch("https://api.kotoca.net/get?ch=bots");
        if (!res.ok) throw new Error("Fetch失敗: " + res.status);

        const data = await res.json();
        console.log("Bot一覧データ取得:", data);

        const ul = document.getElementById("bots_ul");
        const othersLi = document.getElementById("bots_others");
        if (othersLi) othersLi.remove(); // 既存のプレースホルダーを削除

        if (ul) {
            data.forEach(entry => {
                const lines = entry.content.split('\n');
                const botName = lines[0] || "名前不明";
                const description = lines.slice(1).join('\n') || "";

                const li = document.createElement("li");

                // h3 と img をまとめる div
                const topDiv = document.createElement("div");
                topDiv.style.display = "grid";
                topDiv.style.gridTemplateColumns = "50px 1fr";
                topDiv.style.gridTemplateRows = "1fr";

                // 添付画像がある場合のみ
                if (entry.attach && entry.attach.length > 0) {
                    const img = document.createElement("img");
                    img.src = entry.attach[0];
                    img.alt = botName;
                    img.style.width = "50px";
                    img.style.border = "solid #e099ae 4px";
                    topDiv.appendChild(img);
                }

                const h3 = document.createElement("h3");
                h3.textContent = botName;
                h3.style.margin = "auto 0 auto 20px";
                h3.style.display = "inline";
                topDiv.appendChild(h3);

                li.appendChild(topDiv);

                const p = document.createElement("p");
                p.textContent = description;
                li.appendChild(p);

                ul.appendChild(li);
            });
        }

    } catch (err) {
        console.error("Bot一覧取得エラー:", err);
        // エラー時のユーザーへのフィードバック（任意）
        const ul = document.getElementById("bots_ul");
        if(ul) ul.innerHTML = `<li>Bot一覧の読み込み中にエラーが発生しました。</li>`;
    }
});
