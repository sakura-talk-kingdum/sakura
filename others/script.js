//?invite=【招待リンク】で　招待リンクをその人のものにする。
function invite(){
    const params = new URLSearchParams(window.location.search);
    const code = params.has("invite") && /^[A-Za-z0-9-]+$/.test(params.get("invite"))
        ? params.get("invite")
        : 'z7AmmNHvKR';

    window.open('https://discord.gg/' + code, '_blank');
}

//データ取得テスト
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("https://bot.kotoca.net/get?ch=announce");
    if (!res.ok) throw new Error("Fetch失敗: " + res.status);

    const data = await res.json();
    console.log("取得データ:", data);
    const result = data.map(item => {
    const [date, ...bodyParts] = item.split('\n');
      return {
        date,
        body: bodyParts.join('\n')
      };
    });
    console.log(result);
    const box = document.getElementById("news_box");
    box.textContent = ""; // 初期化

    result.forEach((entry, index) => {
    const p = document.createElement("p");
    p.textContent = entry.date;

    const h3 = document.createElement("h3");
    h3.textContent = entry.body;

    box.appendChild(p);
    box.appendChild(h3);

    // ★最後の要素以外だけ水平線を入れる
    if (index !== result.length - 1) {
      const hr = document.createElement("hr");
      box.appendChild(hr);
    }
  });
  
  } catch (err) {
    console.error("お知らせ読み込みでエラー:", err);
  }
  try {
    const res = await fetch("https://bot.sakurahp.f5.si/api");
    if (!res.ok) throw new Error("Fetch失敗: " + res.status);

    const data = await res.json();
    console.log("取得データ:", data);
  
  } catch (err) {
    console.error("サーバー情報読み込みでエラー:", err);
  }
});