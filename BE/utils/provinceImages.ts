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
  "Thua Thien Hue",
  "Tien Giang",
  "Tra Vinh",
  "Tuyen Quang",
  "Vinh Long",
  "Vinh Phuc",
  "Yen Bai"
];

const PROVINCE_ALIASES: Record<string, string[]> = {
  "TP Ho Chi Minh": ["ho chi minh", "tp hcm", "hcm", "sai gon"],
  "Ba Ria - Vung Tau": ["ba ria vung tau", "vung tau", "ba ria"],
  "Dak Lak": ["dak lak", "daklak", "dac lac"],
  "Dak Nong": ["dak nong", "daknong"],
  "Thua Thien Hue": ["thua thien hue", "hue"],
  "Can Tho": ["can tho", "cantho"]
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
