export interface ProvinceImageItem {
  province: string;
  slug: string;
  imageUrl: string;
  keywords: string[];
}

const PROVINCE_NAMES: string[] = [
  "Ha Noi",
  "TP Ho Chi Minh",
  "Hai Phong",
  "Da Nang",
  "Can Tho",
  "An Giang",
  "Ba Ria - Vung Tau",
  "Bac Giang",
  "Bac Kan",
  "Bac Lieu",
  "Bac Ninh",
  "Ben Tre",
  "Binh Dinh",
  "Binh Duong",
  "Binh Phuoc",
  "Binh Thuan",
  "Ca Mau",
  "Cao Bang",
  "Dak Lak",
  "Dak Nong",
  "Dien Bien",
  "Dong Nai",
  "Dong Thap",
  "Gia Lai",
  "Ha Giang",
  "Ha Nam",
  "Ha Tinh",
  "Hai Duong",
  "Hau Giang",
  "Hoa Binh",
  "Hung Yen",
  "Khanh Hoa",
  "Kien Giang",
  "Kon Tum",
  "Lai Chau",
  "Lam Dong",
  "Lang Son",
  "Lao Cai",
  "Long An",
  "Nam Dinh",
  "Nghe An",
  "Ninh Binh",
  "Ninh Thuan",
  "Phu Tho",
  "Phu Yen",
  "Quang Binh",
  "Quang Nam",
  "Quang Ngai",
  "Quang Ninh",
  "Quang Tri",
  "Soc Trang",
  "Son La",
  "Tay Ninh",
  "Thai Binh",
  "Thai Nguyen",
  "Thanh Hoa",
  "Hue",
  "Tien Giang",
  "Tra Vinh",
  "Tuyen Quang",
  "Vinh Long",
  "Vinh Phuc",
  "Yen Bai"
];

const PROVINCE_ALIASES: Record<string, string[]> = {
  "TP Ho Chi Minh": ["ho chi minh", "tp hcm", "hcm", "sai gon"],
  "Ha Noi": ["ha noi", "hoan kiem", "ba dinh", "ho tay"],
  "Da Nang": ["da nang", "ban dao son tra", "ba na", "my khe"],
  "Lam Dong": ["lam dong", "da lat", "dalat", "bao loc", "langbiang"],
  "Khanh Hoa": ["khanh hoa", "nha trang", "cam ranh", "vinh hy"],
  "Quang Ninh": ["quang ninh", "ha long", "halong", "bai chay", "co to"],
  "Lao Cai": ["lao cai", "sa pa", "sapa", "bac ha", "y ty"],
  "Ninh Binh": ["ninh binh", "trang an", "tam coc", "bai dinh"],
  "Quang Binh": ["quang binh", "phong nha", "ke bang", "dong hoi"],
  "Quang Nam": ["quang nam", "hoi an", "cu lao cham", "my son"],
  "Kien Giang": ["kien giang", "phu quoc", "ha tien", "nam du"],
  "Binh Thuan": ["binh thuan", "phan thiet", "mui ne", "dao phu quy"],
  "Ba Ria - Vung Tau": ["ba ria vung tau", "vung tau", "ba ria", "ho tram", "con dao"],
  "Can Tho": ["can tho", "cantho", "ben ninh kieu", "cho noi cai rang"],
  "Hue": ["hue", "thua thien hue", "lang co", "pha tam giang"],
  "Phu Yen": ["phu yen", "ghenh da dia", "tuy hoa", "bai xep"],
  "Binh Dinh": ["binh dinh", "quy nhon", "eo gio", "ky co"],
  "Ha Giang": ["ha giang", "dong van", "meo vac", "lung cu"],
  "Son La": ["son la", "moc chau", "ta xua"],
  "Dien Bien": ["dien bien", "dien bien phu", "muong phang"],
  "An Giang": ["an giang", "chau doc", "nui cam", "rung tram tra su"],
  "Ca Mau": ["ca mau", "mui ca mau", "dat mui"],
  "Tay Ninh": ["tay ninh", "nui ba den", "ho dau tieng"],
  "Ninh Thuan": ["ninh thuan", "vinh hy", "ninh chu", "hang rai"],
  "Dak Lak": ["dak lak", "daklak", "dac lac", "buon ma thuot", "buon don"],
  "Dak Nong": ["dak nong", "daknong", "ta dung"],
  "Gia Lai": ["gia lai", "pleiku", "bien ho"],
  "Kon Tum": ["kon tum", "mang den", "ngoc linh"],
  "Phu Tho": ["phu tho", "den hung"],
  "Thanh Hoa": ["thanh hoa", "sam son", "puluong", "pu luong"],
  "Nghe An": ["nghe an", "cua lo", "que bac"],
  "Quang Tri": ["quang tri", "dao con co", "hien luong"],
  "Thai Nguyen": ["thai nguyen", "ho nui coc"],
  "Hoa Binh": ["hoa binh", "mai chau", "da bac"],
  "Yen Bai": ["yen bai", "mu cang chai", "tu le"],
  "Vinh Phuc": ["vinh phuc", "tam dao", "dai lai"]
};

export const normalizeText = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const toSlug = (value: string): string => normalizeText(value).replace(/\s+/g, "-");

const PROVINCE_IMAGES: ProvinceImageItem[] = PROVINCE_NAMES.map((provinceName) => {
  const slug = toSlug(provinceName);
  const baseKeywords = [normalizeText(provinceName)];
  const aliasKeywords = (PROVINCE_ALIASES[provinceName] || []).map(normalizeText);
  const keywords = Array.from(new Set([...baseKeywords, ...aliasKeywords]));

  return {
    province: provinceName,
    slug,
    imageUrl: `https://picsum.photos/seed/owntrip-${slug}/1200/700`,
    keywords
  };
});

export const getProvinceImages = (): ProvinceImageItem[] => PROVINCE_IMAGES;

export const findProvinceImageByDestination = (destination: string): ProvinceImageItem | null => {
  const input = normalizeText(destination || "");

  if (!input) {
    return null;
  }

  let bestMatch: { item: ProvinceImageItem; score: number } | null = null;

  for (const item of PROVINCE_IMAGES) {
    for (const keyword of item.keywords) {
      if (keyword.length < 3) {
        continue;
      }

      const isExact = input === keyword;
      const isIncluded = input.includes(keyword) || keyword.includes(input);

      if (!isExact && !isIncluded) {
        continue;
      }

      const score = isExact ? keyword.length + 100 : keyword.length;

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { item, score };
      }
    }
  }

  return bestMatch ? bestMatch.item : null;
};
