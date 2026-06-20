// Tải ảnh món từ Drive (folder public-link) → public/menu/<id>.png, patch data/menu.json.
const fs = require("fs");
const { execSync } = require("child_process");

// id món -> Drive fileId (map từ tên file trong folder) — đủ 42 món
const MAP = {
  // bases
  "base-sushi-rice": "1MPiF5ktRk8v-FszHSCp9SJWbLYER7Vp4",
  "base-brown-rice": "1XSRlsAJreKf8UJ5YDy_AdAfgS4_4cUVJ",
  "base-salad": "1jAJLnpQwdgSlsYGU6k_JqTCo2YOUhmC3",
  "base-mix-sushi-salad": "1JPFXYr_2q5O3jo5uiMdExFfN1kY_JQuS",
  "base-mix-brown-salad": "1GjkHlditRPmv4i0rjS6zhky0BEem85x2",
  // proteins
  "poke-salmon": "1t6nQw0-jlDkcUkVpsgmoJz9Of2_GPpfQ",
  "poke-tuna": "1v9mNRoDgTuLJPvRDwzn1_V_9eGaSysgG",
  "poke-spicy-salmon": "1IpM8ri2OF88O7cR0bhRzG6i3ESF0OuQA",
  "poke-spicy-tuna": "1OafaG2GucOS8Zg5FFR8Sx29-36xqGe0V",
  "poke-octopus": "1PuNzBrqashT9baHJ3wvBMxPUMwxTvRyt",
  "poke-shrimp": "1OjSNWqKNaFkToxhE5ixkj-kg5GjbfW_y",
  "poke-vegan": "1dPnfAWISMrUM55RHAtKNcAv2hQ6oVaR5",
  // mixins
  "mixin-cucumber": "1gJgaT4nBZPfYHG4xtsKtoURmKsosLnVm",
  "mixin-pickled-onion": "19cl5eaVr7X42Arl4MyvhMpG-2TloZ8Ff",
  // sauces
  "sauce-shoyu": "1TFNrSx0G5LDZyzVTQ92_doAhX8cNb3uM",
  "sauce-gomae": "1qhxGiqF9nIJOGCN88Uz8H6kWC9qDXQGj",
  "sauce-wasabi-mayo": "12INbT4vJ0HK4SCV8grfc17UkxPPTDOul",
  "sauce-spicy-mayo": "1f2dJjYqYSBvNM11f_REfrTYcFY65eQHe",
  "sauce-shiso-miso": "1r04nzbPjjNr44ymW8b-4oUjnP-A1w0-J",
  // toppings
  "top-tobiko": "1MZEiZ4XxxjlIGZHEK4PSEd_HJxma5mtO",
  "top-guacamole": "1DF3nQ1iaC__7r05iLpVNnJ6t4PSa7z2p",
  "top-wakame": "1P9CvFQJtlVfgXB8EhuuhBnxDOeqBvfPT",
  "top-crab-salad": "17G3U906NdGAfxHRTt4gSuBiGET8rpMr9",
  "top-edamame": "17zHObufy1MToeasdHe_eqIp7TtqV4kId",
  "top-mushroom": "1tPQlynHQeyFmfJfLH-lcHVY9iWngUjrO",
  "top-radish": "1QCf7MLkO18aklGVp35Y6GVbolzsy3YMd",
  "top-tomato": "18vDuA8C4qVsEvz8dnMWNgdJ3sedfYPAN",
  "top-pineapple": "1bigCt2WUCDC7AGUet3yWxsBuoFs9Z_1K",
  "top-eggplant": "1FQ9pzZF-bpso2ak2QBzv8md2BqnTMdYQ",
  "top-jalapeno": "1Iln75mp2ar6-pzqBhx8rjUikg9wP81mM",
  "top-sauerkraut": "1yUL4ANO1IOBu4petOLprCmENFhE8t67z",
  "top-quail-egg": "1IRceP7ee56KQ9mCxMu41EliPtUqJoqyt",
  "top-mango": "1E45IcviTsIXoeh4W_tF9IFhIYofQYvpz",
  "top-ginger": "1Zr-wczPZO6OxVUF0xxsINJ_nUeY4YOWS",
  "top-miso-corn": "1TE728F9Pb4gn1W1P60YdF68LmN4FW8Xj",
  "top-spring-onion": "1bftv8tsGPk2j8WIAi5SoKxjztQdSNwg-",
  "top-coriander": "159pwzX9OI09Y7GR-zgTQ7cJc8jx4gb63",
  // crisps
  "crisp-fried-shallot": "1yneiIGC4KXPui1u92csIKFe8XlFJGMAd",
  "crisp-sesame": "11izHRDJ3b4UkDWetMqFD8NgIMxty4B7M",
  "crisp-nori": "1FaczEauN67Ovb4dOG7O6m69hKcdRl0SB",
  "crisp-furikake": "1qHupuSD6Mci5m3sfxGukAFyJNc8RxDMj",
  "crisp-togarashi": "16PuEPC0tOGjNLMosUR50QCmQxXu6FXaT",
};

fs.mkdirSync("public/menu", { recursive: true });
const ok = [];
const fail = [];

for (const [id, fileId] of Object.entries(MAP)) {
  const out = `public/menu/${id}.png`;
  try {
    execSync(
      `curl -sL "https://drive.google.com/uc?export=download&id=${fileId}" -o "${out}"`,
      { stdio: "ignore" },
    );
    const buf = fs.readFileSync(out);
    // verify PNG magic bytes 89 50 4E 47
    if (buf.length > 1000 && buf[0] === 0x89 && buf[1] === 0x50) {
      ok.push(id);
    } else {
      fail.push(id);
      fs.unlinkSync(out);
    }
  } catch {
    fail.push(id);
  }
}

// patch menu.json cho các ảnh tải thành công
if (ok.length) {
  const menu = JSON.parse(fs.readFileSync("data/menu.json", "utf8"));
  for (const g of Object.values(menu.groups)) {
    for (const item of g) {
      if (ok.includes(item.id)) item.image = `/menu/${item.id}.png`;
    }
  }
  fs.writeFileSync("data/menu.json", JSON.stringify(menu, null, 2) + "\n", "utf8");
}

console.log(`✅ Tải OK: ${ok.length}/${Object.keys(MAP).length}`);
if (fail.length) console.log(`❌ Lỗi: ${fail.join(", ")}`);
