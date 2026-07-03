import { ROUTES } from "../constants/routes";

type CategorySearchContext = {
  name: string;
  slug: string;
  aliases: string[];
};

const CATEGORY_SEARCH_CONTEXTS: CategorySearchContext[] = [
  { name: "Vehicles", slug: "vehicles", aliases: ["vehicle", "vehicles", "car", "cars"] },
  { name: "Phones & Tablets", slug: "phones-tablets", aliases: ["phone", "phones", "tablet", "tablets", "phones & tablets"] },
  { name: "Agriculture & Food", slug: "agriculture", aliases: ["agriculture", "agric", "agriculture & food", "food"] },
  { name: "Sports & Leisure", slug: "sports-leisure", aliases: ["sport", "sports", "sports & leisure", "leisure"] },
  { name: "Art", slug: "art", aliases: ["art", "arts"] },
  { name: "Electronics", slug: "electronics", aliases: ["electronic", "electronics", "laptop", "laptops", "computer", "computers"] },
  { name: "Properties", slug: "properties", aliases: ["home", "property", "properties"] },
  { name: "Furniture", slug: "furniture-appliances", aliases: ["furniture", "furnitures", "furniture & appliances"] },
  { name: "Fashion", slug: "fashion", aliases: ["fashion"] },
  { name: "Beauty", slug: "beauty", aliases: ["beauty"] },
  { name: "Jobs", slug: "jobs", aliases: ["job", "jobs"] },
];

const SEARCH_PATHS = [ROUTES.SEARCH, ROUTES.SEARCH_RESULTS, ROUTES.SEARCH_RESULTS_LIST];
export const ALL_NIGERIA_LOCATION = "All Nigeria";

export const NIGERIAN_LOCATIONS = [
  ALL_NIGERIA_LOCATION,
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

export const NIGERIAN_AREAS: Record<string, string[]> = {
  Abia: ["Aba", "Umuahia", "Ohafia", "Arochukwu", "Bende"],
  Adamawa: ["Yola", "Mubi", "Numan", "Jimeta", "Ganye"],
  "Akwa Ibom": ["Uyo", "Eket", "Ikot Ekpene", "Oron", "Abak"],
  Anambra: ["Awka", "Onitsha", "Nnewi", "Ekwulobia", "Ihiala"],
  Bauchi: ["Bauchi", "Azare", "Misau", "Jama'are", "Ningi"],
  Bayelsa: ["Yenagoa", "Brass", "Nembe", "Sagbama", "Ogbia"],
  Benue: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala", "Vandeikya"],
  Borno: ["Maiduguri", "Biu", "Bama", "Konduga", "Monguno"],
  "Cross River": ["Calabar", "Ikom", "Ogoja", "Ugep", "Obudu"],
  Delta: ["Asaba", "Warri", "Sapele", "Agbor", "Ughelli"],
  Ebonyi: ["Abakaliki", "Afikpo", "Onueke", "Ezza", "Ikwo"],
  Edo: ["Benin City", "Auchi", "Ekpoma", "Uromi", "Igueben"],
  Ekiti: ["Ado Ekiti", "Ikere", "Oye", "Ise", "Ikole"],
  Enugu: ["Enugu", "Nsukka", "Oji River", "Awgu", "Udi"],
  "FCT Abuja": [
    "AMAC",
    "Apo",
    "Asokoro",
    "Central Business District",
    "Garki",
    "Gwagwalada",
    "Gwarinpa",
    "Jabi",
    "Kubwa",
    "Lifecamp",
    "Maitama",
    "Nyanya",
    "Utako",
    "Wuse",
    "Wuse 2",
  ],
  Gombe: ["Gombe", "Kaltungo", "Bajoga", "Dukku", "Billiri"],
  Imo: ["Owerri", "Orlu", "Okigwe", "Mbaise", "Oguta"],
  Jigawa: ["Dutse", "Hadejia", "Kazaure", "Gumel", "Ringim"],
  Kaduna: ["Kaduna", "Zaria", "Kafanchan", "Samaru", "Sabon Tasha"],
  Kano: ["Kano", "Wudil", "Bichi", "Gaya", "Rano"],
  Katsina: ["Katsina", "Daura", "Funtua", "Malumfashi", "Dutsin-Ma"],
  Kebbi: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru", "Jega"],
  Kogi: ["Lokoja", "Okene", "Kabba", "Anyigba", "Idah"],
  Kwara: ["Ilorin", "Offa", "Omu-Aran", "Jebba", "Kaiama"],
  Lagos: [
    "Agege",
    "Ajah",
    "Alimosho",
    "Badagry",
    "Epe",
    "Festac",
    "Ikorodu",
    "Ikeja",
    "Ikoyi",
    "Lekki",
    "Mushin",
    "Oshodi",
    "Surulere",
    "Victoria Island",
    "Yaba",
  ],
  Nasarawa: ["Lafia", "Keffi", "Akwanga", "Karu", "Nasarawa"],
  Niger: ["Minna", "Suleja", "Bida", "Kontagora", "Lapai"],
  Ogun: ["Abeokuta", "Ijebu Ode", "Sagamu", "Ota", "Ilaro"],
  Ondo: ["Akure", "Ondo", "Owo", "Ikare", "Okitipupa"],
  Osun: ["Osogbo", "Ile-Ife", "Ilesa", "Ede", "Ikirun"],
  Oyo: ["Ibadan", "Ogbomoso", "Oyo", "Iseyin", "Saki"],
  Plateau: ["Jos", "Bukuru", "Pankshin", "Shendam", "Langtang"],
  Rivers: ["Port Harcourt", "Obio-Akpor", "Bonny", "Eleme", "Omoku"],
  Sokoto: ["Sokoto", "Tambuwal", "Wurno", "Illela", "Gwadabawa"],
  Taraba: ["Jalingo", "Wukari", "Bali", "Takum", "Serti"],
  Yobe: ["Damaturu", "Potiskum", "Gashua", "Nguru", "Geidam"],
  Zamfara: ["Gusau", "Kaura Namoda", "Talata Mafara", "Anka", "Maru"],
};

export function isSearchResultsPath(pathname: string) {
  return SEARCH_PATHS.includes(pathname);
}

export function getCategorySearchContext(search: string) {
  const params = new URLSearchParams(search);
  const category = params.get("category")?.trim().toLowerCase();
  const query = params.get("q")?.trim().toLowerCase();

  return CATEGORY_SEARCH_CONTEXTS.find(
    (context) =>
      context.slug === category ||
      context.aliases.includes(category || "") ||
      (!category && context.aliases.includes(query || "")),
  ) ?? null;
}

export function isCategoryMarkerQuery(query?: string) {
  if (!query?.trim()) return false;
  return Boolean(getCategorySearchContext(`?q=${encodeURIComponent(query.trim())}`));
}

export function getLocationSearchParam(search: string) {
  const location = new URLSearchParams(search).get("location")?.trim();
  return location && location !== ALL_NIGERIA_LOCATION ? location : "";
}
