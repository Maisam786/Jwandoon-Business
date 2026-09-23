// Jwandoon invoice catalog — product number, name and selling price only.
// Source: JWANDOON_MART(2)(1).PDF

const products = [
  {
    "id": 1,
    "name": "BULB HAIR CLIP",
    "price": 350
  },
  {
    "id": 2,
    "name": "STEELO COFFEE MUG",
    "price": 600
  },
  {
    "id": 3,
    "name": "HAMMER VEGETABLE CUTTER",
    "price": 1300
  },
  {
    "id": 4,
    "name": "SCALP HEAD MASSAGER",
    "price": 1800
  },
  {
    "id": 5,
    "name": "MINI SEALER",
    "price": 500
  },
  {
    "id": 6,
    "name": "CRYSTAL EPILIATOR BIG SIZE",
    "price": 200
  },
  {
    "id": 7,
    "name": "G SHAPED LAMP",
    "price": 1300
  },
  {
    "id": 8,
    "name": "SUNSET LAMP WITHOUT REMOTE",
    "price": 700
  },
  {
    "id": 9,
    "name": "MIC",
    "price": 750
  },
  {
    "id": 10,
    "name": "HANDHELD BODY MASSAGER",
    "price": 2500
  },
  {
    "id": 11,
    "name": "QUIFIT COOL LARGE",
    "price": 650
  },
  {
    "id": 12,
    "name": "SPEEDY CHOPPER",
    "price": 500
  },
  {
    "id": 13,
    "name": "B LOGGING KIT",
    "price": 1000
  },
  {
    "id": 14,
    "name": "CHOPPER 2L STEEL",
    "price": 850
  },
  {
    "id": 15,
    "name": "A9 CAMERA",
    "price": 850
  },
  {
    "id": 16,
    "name": "WEIGHT SCALE",
    "price": 850
  },
  {
    "id": 17,
    "name": "16 IN 1 VEGETABLE CUTTER",
    "price": 1200
  },
  {
    "id": 18,
    "name": "FOLDING STOOL CHINA IMPORT",
    "price": 1500
  },
  {
    "id": 19,
    "name": "SWISS MEDICINE BOX",
    "price": 650
  },
  {
    "id": 20,
    "name": "RAF HANDLE CHOPPER 7132",
    "price": 1500
  },
  {
    "id": 21,
    "name": "EVO KITCHEN BOX",
    "price": 400
  },
  {
    "id": 22,
    "name": "ROYAL MASALA BOX 9 PCS",
    "price": 500
  },
  {
    "id": 23,
    "name": "SPARK DUSTBIN SMALL",
    "price": 550
  },
  {
    "id": 24,
    "name": "COMFORT STOOL SMALL",
    "price": 600
  },
  {
    "id": 25,
    "name": "MOBILE STAND OLD",
    "price": 150
  },
  {
    "id": 26,
    "name": "SQUEEZ TOY WITH LIGHT",
    "price": 550
  },
  {
    "id": 27,
    "name": "X SHOE RACK 4 LAYER",
    "price": 900
  },
  {
    "id": 28,
    "name": "360 ORGANIZER IMP*",
    "price": 1500
  },
  {
    "id": 29,
    "name": "CROWN STORAGE JAR",
    "price": 400
  },
  {
    "id": 30,
    "name": "SOLAR LAMP BK888",
    "price": 700
  },
  {
    "id": 31,
    "name": "ONE STEP BRUSH",
    "price": 1400
  },
  {
    "id": 32,
    "name": "1000 ML SHINING AND LEATHER BOTTLE",
    "price": 1200
  },
  {
    "id": 33,
    "name": "800 ML BOTTLE",
    "price": 1000
  },
  {
    "id": 34,
    "name": "PRISM ORGANIZER",
    "price": 450
  },
  {
    "id": 35,
    "name": "SMASH FRIDGE BOTTLE 3 PCS",
    "price": 350
  },
  {
    "id": 36,
    "name": "KIDS TUMBLER PLAN",
    "price": 1200
  },
  {
    "id": 37,
    "name": "SPICE MASALA BOX 4 PCS",
    "price": 450
  },
  {
    "id": 38,
    "name": "WASH AND CHOP",
    "price": 450
  },
  {
    "id": 39,
    "name": "NANO MIST SPRAY",
    "price": 350
  },
  {
    "id": 40,
    "name": "NEW DESIGN MINI HANDY FAN",
    "price": 180
  },
  {
    "id": 41,
    "name": "MANUAL MASSAGER CHINA IMPORT",
    "price": 400
  },
  {
    "id": 42,
    "name": "DOUBLE HEAD ELECTRIC TRIMMER",
    "price": 1200
  },
  {
    "id": 43,
    "name": "PRO STEEL LUNCH BOX",
    "price": 1400
  },
  {
    "id": 44,
    "name": "HYPER COOL SMALL",
    "price": 1000
  },
  {
    "id": 45,
    "name": "FAMOUS MUG",
    "price": 300
  },
  {
    "id": 46,
    "name": "GLITTER MUG",
    "price": 350
  },
  {
    "id": 47,
    "name": "BLAWLESS 2 IN 1",
    "price": 600
  },
  {
    "id": 48,
    "name": "BANTO LUNCH BOX",
    "price": 1300
  },
  {
    "id": 49,
    "name": "RABBIT LAMP IMP*",
    "price": 1000
  },
  {
    "id": 50,
    "name": "CUBE LAMP",
    "price": 1200
  },
  {
    "id": 51,
    "name": "SHINING GOLDEN LAMP",
    "price": 1250
  },
  {
    "id": 52,
    "name": "SOAP PUMP SMALL",
    "price": 400
  },
  {
    "id": 53,
    "name": "SCALP HEAD MASSAGER BLD 661",
    "price": 1500
  },
  {
    "id": 54,
    "name": "SPEAKER WITH DOUBLE MIC",
    "price": 1100
  },
  {
    "id": 55,
    "name": "KM 8220",
    "price": 3200
  },
  {
    "id": 56,
    "name": "KM 8219",
    "price": 3500
  },
  {
    "id": 57,
    "name": "KM 8222",
    "price": 3500
  },
  {
    "id": 58,
    "name": "KM 6331 TRIMMER",
    "price": 2000
  },
  {
    "id": 59,
    "name": "KM 470",
    "price": 1800
  },
  {
    "id": 60,
    "name": "KM 533",
    "price": 2000
  },
  {
    "id": 61,
    "name": "JW 802",
    "price": 1800
  },
  {
    "id": 62,
    "name": "KM 471",
    "price": 2200
  },
  {
    "id": 63,
    "name": "KM 9826",
    "price": 2000
  },
  {
    "id": 64,
    "name": "KM 3024",
    "price": 2000
  },
  {
    "id": 65,
    "name": "KM 2068",
    "price": 2500
  },
  {
    "id": 66,
    "name": "KM 189",
    "price": 2000
  },
  {
    "id": 67,
    "name": "KM 329",
    "price": 1800
  },
  {
    "id": 68,
    "name": "JW 801",
    "price": 1800
  },
  {
    "id": 69,
    "name": "KM 531",
    "price": 2000
  },
  {
    "id": 70,
    "name": "JW 814",
    "price": 1500
  },
  {
    "id": 71,
    "name": "KENDY LUNCH BOX",
    "price": 600
  },
  {
    "id": 72,
    "name": "MUNCH STEEL LUNCH BOX",
    "price": 1000
  },
  {
    "id": 73,
    "name": "FOOD CARIER LUNCH BOX",
    "price": 600
  },
  {
    "id": 74,
    "name": "VANITY LIGHT",
    "price": 1000
  },
  {
    "id": 75,
    "name": "SIMPLE COMB",
    "price": 160
  },
  {
    "id": 76,
    "name": "UNIQUE SPOON HOLDER",
    "price": 350
  },
  {
    "id": 77,
    "name": "FLOWER SPOON HOLDER",
    "price": 350
  },
  {
    "id": 78,
    "name": "NECK ROLLER*",
    "price": 450
  },
  {
    "id": 79,
    "name": "TRAVELING STEEL BOTTLE",
    "price": 500
  },
  {
    "id": 80,
    "name": "SPARKLE STEEL CAP",
    "price": 320
  },
  {
    "id": 81,
    "name": "PLASTIC TUMBLER",
    "price": 500
  },
  {
    "id": 82,
    "name": "BEDSHEET TUKKER",
    "price": 100
  },
  {
    "id": 83,
    "name": "ROTI COVER",
    "price": 150
  },
  {
    "id": 84,
    "name": "WATER MAGIC BOOK",
    "price": 80
  },
  {
    "id": 85,
    "name": "MOBILE SUCTION CHINA IMPORT",
    "price": 60
  },
  {
    "id": 86,
    "name": "SHOE BRUSH",
    "price": 130
  },
  {
    "id": 87,
    "name": "FRUIT ICE TRAY",
    "price": 150
  },
  {
    "id": 88,
    "name": "TAJ METAL HOOKS",
    "price": 280
  },
  {
    "id": 89,
    "name": "SCISSOR",
    "price": 150
  },
  {
    "id": 90,
    "name": "PUSH LIGHTS",
    "price": 150
  },
  {
    "id": 91,
    "name": "STEEL CLIP",
    "price": 250
  },
  {
    "id": 92,
    "name": "MOSQUITO REPELLENT WATCH",
    "price": 100
  },
  {
    "id": 93,
    "name": "GARLIC PRESS",
    "price": 150
  },
  {
    "id": 94,
    "name": "LUNCH BOX MEAL IT",
    "price": 250
  },
  {
    "id": 95,
    "name": "STEEL STONG DOUBLE",
    "price": 180
  },
  {
    "id": 96,
    "name": "GRIP N SIP BEAKER",
    "price": 300
  },
  {
    "id": 97,
    "name": "9 HOLE HANGERS",
    "price": 70
  },
  {
    "id": 98,
    "name": "WASHING MACHINE COVER DOUBLE",
    "price": 0
  },
  {
    "id": 99,
    "name": "CRESTO BEAKER",
    "price": 400
  },
  {
    "id": 100,
    "name": "FEEDER PP",
    "price": 250
  },
  {
    "id": 101,
    "name": "character bottle",
    "price": 300
  },
  {
    "id": 102,
    "name": "BOARD SAFETY SOCKET",
    "price": 80
  },
  {
    "id": 103,
    "name": "DEEP FRYER",
    "price": 900
  },
  {
    "id": 104,
    "name": "COLOUR TRAY",
    "price": 320
  },
  {
    "id": 105,
    "name": "STORAGE VALUE BOX",
    "price": 1000
  },
  {
    "id": 106,
    "name": "SMILEY BASKIT",
    "price": 900
  },
  {
    "id": 107,
    "name": "F8 ROD",
    "price": 550
  },
  {
    "id": 108,
    "name": "MUTIFUNCTIONAL BOWL RACK",
    "price": 3500
  },
  {
    "id": 109,
    "name": "VACCUME SORAGE BAG",
    "price": 800
  },
  {
    "id": 110,
    "name": "HOME ORGANIZER 3 LAYER",
    "price": 900
  },
  {
    "id": 111,
    "name": "TUBE PAPER SOAP",
    "price": 60
  },
  {
    "id": 112,
    "name": "PANDA LAMP IMP*",
    "price": 1000
  },
  {
    "id": 113,
    "name": "FRIDGE LOCK",
    "price": 200
  },
  {
    "id": 114,
    "name": "STAINLESS STEEL SPOON BUCKET",
    "price": 850
  },
  {
    "id": 115,
    "name": "BABY NAIL TRIMMER",
    "price": 750
  },
  {
    "id": 116,
    "name": "WRITING TABLET WITH BOX",
    "price": 500
  },
  {
    "id": 117,
    "name": "PEARL GLASS WITH STRAW",
    "price": 500
  },
  {
    "id": 118,
    "name": "220 ML OIL BOTTLE IMP*",
    "price": 350
  },
  {
    "id": 119,
    "name": "FANCY COFFEE MUG WITH TEMPRATURE",
    "price": 1500
  },
  {
    "id": 120,
    "name": "BAMBOO GLASS IMP",
    "price": 450
  },
  {
    "id": 121,
    "name": "SIPPY CUP WITH HANDLE",
    "price": 600
  },
  {
    "id": 122,
    "name": "STUDY TABLE",
    "price": 600
  },
  {
    "id": 123,
    "name": "CORNER RACK",
    "price": 300
  },
  {
    "id": 124,
    "name": "DRAIN WIRE",
    "price": 160
  },
  {
    "id": 125,
    "name": "3 LAYER SHOE RACK DUSTPROOF",
    "price": 2200
  },
  {
    "id": 126,
    "name": "PLATE DISH RACK",
    "price": 1000
  },
  {
    "id": 127,
    "name": "HAMMER LIGHT",
    "price": 450
  },
  {
    "id": 128,
    "name": "NEBULIZER",
    "price": 0
  },
  {
    "id": 129,
    "name": "DARAZ SET 4 LAYER",
    "price": 1000
  },
  {
    "id": 130,
    "name": "DARAZ SET 5 LAYER",
    "price": 1100
  },
  {
    "id": 131,
    "name": "AQUA RACK",
    "price": 500
  }
];

export default products;
