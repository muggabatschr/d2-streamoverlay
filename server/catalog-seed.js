// Katalog-Seed: Stammdaten (Items/Targets/Zonen) mit Übersetzungen (en/de/fr/es/zh)
// als Code-Modul — die EINZIGE Quelle, aus der die SQLite-DB befüllt wird.
//
// Warum als Code und nicht als DB/JSON-Datei: Eine frische (leere) SQLite-DB muss
// beim ersten Start irgendwoher befüllt werden; diese Quelle kann nicht in der DB
// selbst liegen. Zur Laufzeit liest die App ausschließlich aus SQLite (siehe db.js).
// Übersetzungen hier editieren und dann CATALOG_SEED_VERSION in db.js erhöhen ->
// der Katalog wird beim nächsten Start neu eingespielt.
//
// type-Regel (items): String = verbatim (rune 'Rune' / runeword Rune-Sequenz, nicht
// übersetzt); Objekt = übersetztes Slot-Label (unique/set). name ist immer ein Objekt.

const baseItems = [
  {
    "id": "u-shako",
    "quality": "unique",
    "name": {
      "en": "Harlequin Crest (Shako)",
      "de": "Harlekinskrone (Shako)",
      "fr": "Crête d'Arlequin (Shako)",
      "es": "Cresta de Arlequín (Shako)",
      "zh": "丑角之冠 (Shako)"
    },
    "type": {
      "en": "Helm",
      "de": "Helm",
      "fr": "Heaume",
      "es": "Yelmo",
      "zh": "头盔"
    },
    "icon": "shako.png"
  },
  {
    "id": "u-soj",
    "quality": "unique",
    "name": {
      "en": "Stone of Jordan (SoJ)",
      "de": "Der Stein von Jordan (SoJ)",
      "fr": "Pierre de Jordan (SoJ)",
      "es": "Piedra de Jordania (SoJ)",
      "zh": "佐丹之石 (SoJ)"
    },
    "type": {
      "en": "Ring",
      "de": "Ring",
      "fr": "Anneau",
      "es": "Anillo",
      "zh": "戒指"
    },
    "icon": "soj.png"
  },
  {
    "id": "u-windforce",
    "quality": "unique",
    "name": {
      "en": "Windforce",
      "de": "Windmacht",
      "fr": "Force du vent",
      "es": "Fuerza del viento",
      "zh": "风之力"
    },
    "type": {
      "en": "Bow",
      "de": "Bogen",
      "fr": "Arc",
      "es": "Arco",
      "zh": "弓"
    },
    "icon": "windforce.png"
  },
  {
    "id": "u-griffons",
    "quality": "unique",
    "name": {
      "en": "Griffon's Eye",
      "de": "Greifenauge",
      "fr": "Œil de griffon",
      "es": "Ojo de grifo",
      "zh": "狮鹫之眼"
    },
    "type": {
      "en": "Diadem",
      "de": "Diadem",
      "fr": "Diadème",
      "es": "Diadema",
      "zh": "头冠"
    },
    "icon": "griffons.png"
  },
  {
    "id": "u-occy",
    "quality": "unique",
    "name": {
      "en": "The Oculus",
      "de": "Das Auge",
      "fr": "L'Oculus",
      "es": "El Óculo",
      "zh": "魔眼法球"
    },
    "type": {
      "en": "Orb",
      "de": "Sphäre",
      "fr": "Orbe",
      "es": "Orbe",
      "zh": "法球"
    },
    "icon": "oculus.png"
  },
  {
    "id": "u-herald",
    "quality": "unique",
    "name": {
      "en": "Herald of Zakarum",
      "de": "Herold von Zakarum",
      "fr": "Héraut de Zakarum",
      "es": "Heraldo de Zakarum",
      "zh": "撒卡兰姆使者"
    },
    "type": {
      "en": "Shield",
      "de": "Schild",
      "fr": "Bouclier",
      "es": "Escudo",
      "zh": "盾牌"
    },
    "icon": "herald.png"
  },
  {
    "id": "u-arachnid",
    "quality": "unique",
    "name": {
      "en": "Arachnid Mesh",
      "de": "Spinnenmonsternetz",
      "fr": "Maille de l'arachnide",
      "es": "Malla de arácnido",
      "zh": "蛛网腰带"
    },
    "type": {
      "en": "Belt",
      "de": "Gürtel",
      "fr": "Ceinture",
      "es": "Cinturón",
      "zh": "腰带"
    },
    "icon": "arachnid.png"
  },
  {
    "id": "u-maras",
    "quality": "unique",
    "name": {
      "en": "Mara's Kaleidoscope",
      "de": "Maras Kaleidoskop",
      "fr": "Kaléidoscope de Mara",
      "es": "Caleidoscopio de Mara",
      "zh": "玛拉的万花筒"
    },
    "type": {
      "en": "Amulet",
      "de": "Amulett",
      "fr": "Amulette",
      "es": "Amuleto",
      "zh": "护身符"
    },
    "icon": "maras.png"
  },
  {
    "id": "u-highlords",
    "quality": "unique",
    "name": {
      "en": "Highlord's Wrath",
      "de": "Zorn des Hohen Fürsten",
      "fr": "Courroux du seigneur",
      "es": "Ira del gran señor",
      "zh": "至尊之怒"
    },
    "type": {
      "en": "Amulet",
      "de": "Amulett",
      "fr": "Amulette",
      "es": "Amuleto",
      "zh": "护身符"
    },
    "icon": "highlords.png"
  },
  {
    "id": "u-bk",
    "quality": "unique",
    "name": {
      "en": "Bul-Kathos' Wedding Band",
      "de": "Bul Kathos' Hochzeitsring",
      "fr": "Anneau nuptial de Bul-Kathos",
      "es": "Anillo nupcial de Bul-Kathos",
      "zh": "布卡索的婚戒"
    },
    "type": {
      "en": "Ring",
      "de": "Ring",
      "fr": "Anneau",
      "es": "Anillo",
      "zh": "戒指"
    },
    "icon": "bul-kathos.png"
  },
  {
    "id": "u-grandfather",
    "quality": "unique",
    "name": {
      "en": "The Grandfather",
      "de": "Der Großvater",
      "fr": "Le Grand-père",
      "es": "El Abuelo",
      "zh": "祖传宝刀"
    },
    "type": {
      "en": "Sword",
      "de": "Schwert",
      "fr": "Épée",
      "es": "Espada",
      "zh": "剑"
    },
    "icon": "grandfather.png"
  },
  {
    "id": "u-tomb-reaver",
    "quality": "unique",
    "name": {
      "en": "Tomb Reaver",
      "de": "Grabräuber",
      "fr": "Pilleur de tombes",
      "es": "Saqueador de tumbas",
      "zh": "盗墓者"
    },
    "type": {
      "en": "Polearm",
      "de": "Stangenwaffe",
      "fr": "Arme d'hast",
      "es": "Arma de asta",
      "zh": "长柄武器"
    },
    "icon": "tomb-reaver.png"
  },
  {
    "id": "u-death-web",
    "quality": "unique",
    "name": {
      "en": "Death's Web",
      "de": "Todesnetz",
      "fr": "Toile de la mort",
      "es": "Telaraña de la muerte",
      "zh": "死亡之网"
    },
    "type": {
      "en": "Wand",
      "de": "Zauberstab",
      "fr": "Baguette",
      "es": "Varita",
      "zh": "魔杖"
    },
    "icon": "deaths-web.png"
  },
  {
    "id": "u-gface",
    "quality": "unique",
    "name": {
      "en": "Gheed's Fortune",
      "de": "Gheeds Glück",
      "fr": "Fortune de Gheed",
      "es": "Fortuna de Gheed",
      "zh": "基德的财富"
    },
    "type": {
      "en": "Charm",
      "de": "Talisman",
      "fr": "Charme",
      "es": "Talismán",
      "zh": "护符"
    },
    "icon": "gheeds.png"
  },
  {
    "id": "u-anni",
    "quality": "unique",
    "name": {
      "en": "Annihilus",
      "de": "Vernichtikus",
      "fr": "Annihilus",
      "es": "Annihilus",
      "zh": "湮灭小符"
    },
    "type": {
      "en": "Charm",
      "de": "Talisman",
      "fr": "Charme",
      "es": "Talismán",
      "zh": "护符"
    },
    "icon": "annihilus.png"
  },
  {
    "id": "u-torch",
    "quality": "unique",
    "name": {
      "en": "Hellfire Torch",
      "de": "Höllenfeuerfackel",
      "fr": "Torche du feu de l'enfer",
      "es": "Antorcha del fuego infernal",
      "zh": "地狱火炬"
    },
    "type": {
      "en": "Charm",
      "de": "Talisman",
      "fr": "Charme",
      "es": "Talismán",
      "zh": "护符"
    },
    "icon": "torch.png"
  },
  {
    "id": "u-gore-rider",
    "quality": "unique",
    "name": {
      "en": "Gore Rider",
      "de": "Blutreiter",
      "fr": "Chevaucheur sanglant",
      "es": "Jinete sangriento",
      "zh": "噬魂者战靴"
    },
    "type": {
      "en": "Boots",
      "de": "Schuhe",
      "fr": "Bottes",
      "es": "Botas",
      "zh": "鞋子"
    },
    "icon": "gore-rider.png"
  },
  {
    "id": "u-war-travs",
    "quality": "unique",
    "name": {
      "en": "War Traveler",
      "de": "Kriegsreisender",
      "fr": "Voyageur de guerre",
      "es": "Viajero de guerra",
      "zh": "战争旅者"
    },
    "type": {
      "en": "Boots",
      "de": "Schuhe",
      "fr": "Bottes",
      "es": "Botas",
      "zh": "鞋子"
    },
    "icon": "war-traveler.png"
  },
  {
    "id": "u-magefist",
    "quality": "unique",
    "name": {
      "en": "Magefist",
      "de": "Magierfaust",
      "fr": "Poing de mage",
      "es": "Puño de mago",
      "zh": "法师之拳"
    },
    "type": {
      "en": "Gloves",
      "de": "Handschuhe",
      "fr": "Gants",
      "es": "Guantes",
      "zh": "手套"
    },
    "icon": "magefist.png"
  },
  {
    "id": "u-stormshield",
    "quality": "unique",
    "name": {
      "en": "Stormshield",
      "de": "Sturmschild",
      "fr": "Bouclier de tempête",
      "es": "Escudo de tormenta",
      "zh": "风暴之盾"
    },
    "type": {
      "en": "Shield",
      "de": "Schild",
      "fr": "Bouclier",
      "es": "Escudo",
      "zh": "盾牌"
    },
    "icon": "stormshield.png"
  },
  {
    "id": "s-tals-armor",
    "quality": "set",
    "name": {
      "en": "Tal Rasha's Guardianship",
      "de": "Tal Rashas Obhut",
      "fr": "Protection de Tal Rasha",
      "es": "Tutela de Tal Rasha",
      "zh": "塔拉夏的守护"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "tals-armor.png"
  },
  {
    "id": "s-tals-amu",
    "quality": "set",
    "name": {
      "en": "Tal Rasha's Adjudication",
      "de": "Tal Rashas Urteil",
      "fr": "Jugement de Tal Rasha",
      "es": "Sentencia de Tal Rasha",
      "zh": "塔拉夏的裁决"
    },
    "type": {
      "en": "Amulet",
      "de": "Amulett",
      "fr": "Amulette",
      "es": "Amuleto",
      "zh": "护身符"
    },
    "icon": "tals-amu.png"
  },
  {
    "id": "s-tals-helm",
    "quality": "set",
    "name": {
      "en": "Tal Rasha's Horadric Crest",
      "de": "Tal Rashas Horadrimwappen",
      "fr": "Crête horadrique de Tal Rasha",
      "es": "Cresta horádrica de Tal Rasha",
      "zh": "塔拉夏的赫拉迪头盔"
    },
    "type": {
      "en": "Helm",
      "de": "Helm",
      "fr": "Heaume",
      "es": "Yelmo",
      "zh": "头盔"
    },
    "icon": "tals-helm.png"
  },
  {
    "id": "s-tals-orb",
    "quality": "set",
    "name": {
      "en": "Tal Rasha's Lidless Eye",
      "de": "Tal Rashas lidloses Auge",
      "fr": "Œil sans paupière de Tal Rasha",
      "es": "Ojo sin párpado de Tal Rasha",
      "zh": "塔拉夏的无睑之眼"
    },
    "type": {
      "en": "Orb",
      "de": "Sphäre",
      "fr": "Orbe",
      "es": "Orbe",
      "zh": "法球"
    },
    "icon": "tals-orb.png"
  },
  {
    "id": "s-tals-belt",
    "quality": "set",
    "name": {
      "en": "Tal Rasha's Fine-Spun Cloth",
      "de": "Tal Rashas feine Kleidung",
      "fr": "Étoffe fine de Tal Rasha",
      "es": "Tela fina de Tal Rasha",
      "zh": "塔拉夏的精纺布带"
    },
    "type": {
      "en": "Belt",
      "de": "Gürtel",
      "fr": "Ceinture",
      "es": "Cinturón",
      "zh": "腰带"
    },
    "icon": "tals-belt.png"
  },
  {
    "id": "s-igle-belt",
    "quality": "set",
    "name": {
      "en": "Set Piece (generic)",
      "de": "Set-Teil (generisch)",
      "fr": "Pièce d'ensemble (générique)",
      "es": "Pieza de conjunto (genérica)",
      "zh": "套装部件（通用）"
    },
    "type": {
      "en": "Set Item",
      "de": "Set-Gegenstand",
      "fr": "Objet d'ensemble",
      "es": "Objeto de conjunto",
      "zh": "套装物品"
    },
    "icon": "set-piece.png"
  },
  {
    "id": "s-trang-gloves",
    "quality": "set",
    "name": {
      "en": "Trang-Oul's Claws",
      "de": "Trang-Ouls Krallen",
      "fr": "Griffes de Trang-Oul",
      "es": "Garras de Trang-Oul",
      "zh": "创-欧的利爪"
    },
    "type": {
      "en": "Gloves",
      "de": "Handschuhe",
      "fr": "Gants",
      "es": "Guantes",
      "zh": "手套"
    },
    "icon": "trang-gloves.png"
  },
  {
    "id": "r-el",
    "quality": "rune",
    "name": {
      "en": "El",
      "de": "El",
      "fr": "El",
      "es": "El",
      "zh": "El"
    },
    "type": "Rune",
    "icon": "rune-el.png",
    "rune": "El"
  },
  {
    "id": "r-eld",
    "quality": "rune",
    "name": {
      "en": "Eld",
      "de": "Eld",
      "fr": "Eld",
      "es": "Eld",
      "zh": "Eld"
    },
    "type": "Rune",
    "icon": "rune-eld.png",
    "rune": "Eld"
  },
  {
    "id": "r-tir",
    "quality": "rune",
    "name": {
      "en": "Tir",
      "de": "Tir",
      "fr": "Tir",
      "es": "Tir",
      "zh": "Tir"
    },
    "type": "Rune",
    "icon": "rune-tir.png",
    "rune": "Tir"
  },
  {
    "id": "r-nef",
    "quality": "rune",
    "name": {
      "en": "Nef",
      "de": "Nef",
      "fr": "Nef",
      "es": "Nef",
      "zh": "Nef"
    },
    "type": "Rune",
    "icon": "rune-nef.png",
    "rune": "Nef"
  },
  {
    "id": "r-eth",
    "quality": "rune",
    "name": {
      "en": "Eth",
      "de": "Eth",
      "fr": "Eth",
      "es": "Eth",
      "zh": "Eth"
    },
    "type": "Rune",
    "icon": "rune-eth.png",
    "rune": "Eth"
  },
  {
    "id": "r-ith",
    "quality": "rune",
    "name": {
      "en": "Ith",
      "de": "Ith",
      "fr": "Ith",
      "es": "Ith",
      "zh": "Ith"
    },
    "type": "Rune",
    "icon": "rune-ith.png",
    "rune": "Ith"
  },
  {
    "id": "r-tal",
    "quality": "rune",
    "name": {
      "en": "Tal",
      "de": "Tal",
      "fr": "Tal",
      "es": "Tal",
      "zh": "Tal"
    },
    "type": "Rune",
    "icon": "rune-tal.png",
    "rune": "Tal"
  },
  {
    "id": "r-ral",
    "quality": "rune",
    "name": {
      "en": "Ral",
      "de": "Ral",
      "fr": "Ral",
      "es": "Ral",
      "zh": "Ral"
    },
    "type": "Rune",
    "icon": "rune-ral.png",
    "rune": "Ral"
  },
  {
    "id": "r-ort",
    "quality": "rune",
    "name": {
      "en": "Ort",
      "de": "Ort",
      "fr": "Ort",
      "es": "Ort",
      "zh": "Ort"
    },
    "type": "Rune",
    "icon": "rune-ort.png",
    "rune": "Ort"
  },
  {
    "id": "r-thul",
    "quality": "rune",
    "name": {
      "en": "Thul",
      "de": "Thul",
      "fr": "Thul",
      "es": "Thul",
      "zh": "Thul"
    },
    "type": "Rune",
    "icon": "rune-thul.png",
    "rune": "Thul"
  },
  {
    "id": "r-amn",
    "quality": "rune",
    "name": {
      "en": "Amn",
      "de": "Amn",
      "fr": "Amn",
      "es": "Amn",
      "zh": "Amn"
    },
    "type": "Rune",
    "icon": "rune-amn.png",
    "rune": "Amn"
  },
  {
    "id": "r-sol",
    "quality": "rune",
    "name": {
      "en": "Sol",
      "de": "Sol",
      "fr": "Sol",
      "es": "Sol",
      "zh": "Sol"
    },
    "type": "Rune",
    "icon": "rune-sol.png",
    "rune": "Sol"
  },
  {
    "id": "r-shael",
    "quality": "rune",
    "name": {
      "en": "Shael",
      "de": "Shael",
      "fr": "Shael",
      "es": "Shael",
      "zh": "Shael"
    },
    "type": "Rune",
    "icon": "rune-shael.png",
    "rune": "Shael"
  },
  {
    "id": "r-dol",
    "quality": "rune",
    "name": {
      "en": "Dol",
      "de": "Dol",
      "fr": "Dol",
      "es": "Dol",
      "zh": "Dol"
    },
    "type": "Rune",
    "icon": "rune-dol.png",
    "rune": "Dol"
  },
  {
    "id": "r-hel",
    "quality": "rune",
    "name": {
      "en": "Hel",
      "de": "Hel",
      "fr": "Hel",
      "es": "Hel",
      "zh": "Hel"
    },
    "type": "Rune",
    "icon": "rune-hel.png",
    "rune": "Hel"
  },
  {
    "id": "r-io",
    "quality": "rune",
    "name": {
      "en": "Io",
      "de": "Io",
      "fr": "Io",
      "es": "Io",
      "zh": "Io"
    },
    "type": "Rune",
    "icon": "rune-io.png",
    "rune": "Io"
  },
  {
    "id": "r-lum",
    "quality": "rune",
    "name": {
      "en": "Lum",
      "de": "Lum",
      "fr": "Lum",
      "es": "Lum",
      "zh": "Lum"
    },
    "type": "Rune",
    "icon": "rune-lum.png",
    "rune": "Lum"
  },
  {
    "id": "r-ko",
    "quality": "rune",
    "name": {
      "en": "Ko",
      "de": "Ko",
      "fr": "Ko",
      "es": "Ko",
      "zh": "Ko"
    },
    "type": "Rune",
    "icon": "rune-ko.png",
    "rune": "Ko"
  },
  {
    "id": "r-fal",
    "quality": "rune",
    "name": {
      "en": "Fal",
      "de": "Fal",
      "fr": "Fal",
      "es": "Fal",
      "zh": "Fal"
    },
    "type": "Rune",
    "icon": "rune-fal.png",
    "rune": "Fal"
  },
  {
    "id": "r-lem",
    "quality": "rune",
    "name": {
      "en": "Lem",
      "de": "Lem",
      "fr": "Lem",
      "es": "Lem",
      "zh": "Lem"
    },
    "type": "Rune",
    "icon": "rune-lem.png",
    "rune": "Lem"
  },
  {
    "id": "r-pul",
    "quality": "rune",
    "name": {
      "en": "Pul",
      "de": "Pul",
      "fr": "Pul",
      "es": "Pul",
      "zh": "Pul"
    },
    "type": "Rune",
    "icon": "rune-pul.png",
    "rune": "Pul"
  },
  {
    "id": "r-um",
    "quality": "rune",
    "name": {
      "en": "Um",
      "de": "Um",
      "fr": "Um",
      "es": "Um",
      "zh": "Um"
    },
    "type": "Rune",
    "icon": "rune-um.png",
    "rune": "Um"
  },
  {
    "id": "r-mal",
    "quality": "rune",
    "name": {
      "en": "Mal",
      "de": "Mal",
      "fr": "Mal",
      "es": "Mal",
      "zh": "Mal"
    },
    "type": "Rune",
    "icon": "rune-mal.png",
    "rune": "Mal"
  },
  {
    "id": "r-ist",
    "quality": "rune",
    "name": {
      "en": "Ist",
      "de": "Ist",
      "fr": "Ist",
      "es": "Ist",
      "zh": "Ist"
    },
    "type": "Rune",
    "icon": "rune-ist.png",
    "rune": "Ist"
  },
  {
    "id": "r-gul",
    "quality": "rune",
    "name": {
      "en": "Gul",
      "de": "Gul",
      "fr": "Gul",
      "es": "Gul",
      "zh": "Gul"
    },
    "type": "Rune",
    "icon": "rune-gul.png",
    "rune": "Gul"
  },
  {
    "id": "r-vex",
    "quality": "rune",
    "name": {
      "en": "Vex",
      "de": "Vex",
      "fr": "Vex",
      "es": "Vex",
      "zh": "Vex"
    },
    "type": "Rune",
    "icon": "rune-vex.png",
    "rune": "Vex"
  },
  {
    "id": "r-ohm",
    "quality": "rune",
    "name": {
      "en": "Ohm",
      "de": "Ohm",
      "fr": "Ohm",
      "es": "Ohm",
      "zh": "Ohm"
    },
    "type": "Rune",
    "icon": "rune-ohm.png",
    "rune": "Ohm"
  },
  {
    "id": "r-lo",
    "quality": "rune",
    "name": {
      "en": "Lo",
      "de": "Lo",
      "fr": "Lo",
      "es": "Lo",
      "zh": "Lo"
    },
    "type": "Rune",
    "icon": "rune-lo.png",
    "rune": "Lo"
  },
  {
    "id": "r-sur",
    "quality": "rune",
    "name": {
      "en": "Sur",
      "de": "Sur",
      "fr": "Sur",
      "es": "Sur",
      "zh": "Sur"
    },
    "type": "Rune",
    "icon": "rune-sur.png",
    "rune": "Sur"
  },
  {
    "id": "r-ber",
    "quality": "rune",
    "name": {
      "en": "Ber",
      "de": "Ber",
      "fr": "Ber",
      "es": "Ber",
      "zh": "Ber"
    },
    "type": "Rune",
    "icon": "rune-ber.png",
    "rune": "Ber"
  },
  {
    "id": "r-jah",
    "quality": "rune",
    "name": {
      "en": "Jah",
      "de": "Jah",
      "fr": "Jah",
      "es": "Jah",
      "zh": "Jah"
    },
    "type": "Rune",
    "icon": "rune-jah.png",
    "rune": "Jah"
  },
  {
    "id": "r-cham",
    "quality": "rune",
    "name": {
      "en": "Cham",
      "de": "Cham",
      "fr": "Cham",
      "es": "Cham",
      "zh": "Cham"
    },
    "type": "Rune",
    "icon": "rune-cham.png",
    "rune": "Cham"
  },
  {
    "id": "r-zod",
    "quality": "rune",
    "name": {
      "en": "Zod",
      "de": "Zod",
      "fr": "Zod",
      "es": "Zod",
      "zh": "Zod"
    },
    "type": "Rune",
    "icon": "rune-zod.png",
    "rune": "Zod"
  },
  {
    "id": "rw-ancients-pledge",
    "quality": "runeword",
    "name": {
      "en": "Ancient's Pledge",
      "de": "Ancient's Pledge",
      "fr": "Ancient's Pledge",
      "es": "Ancient's Pledge",
      "zh": "Ancient's Pledge"
    },
    "type": "Ral Ort Tal"
  },
  {
    "id": "rw-beast",
    "quality": "runeword",
    "name": {
      "en": "Beast",
      "de": "Beast",
      "fr": "Beast",
      "es": "Beast",
      "zh": "Beast"
    },
    "type": "Ber Tir Um Mal Lum"
  },
  {
    "id": "rw-black",
    "quality": "runeword",
    "name": {
      "en": "Black",
      "de": "Black",
      "fr": "Black",
      "es": "Black",
      "zh": "Black"
    },
    "type": "Thul Io Nef"
  },
  {
    "id": "rw-bone",
    "quality": "runeword",
    "name": {
      "en": "Bone",
      "de": "Bone",
      "fr": "Bone",
      "es": "Bone",
      "zh": "Bone"
    },
    "type": "Sol Um Um"
  },
  {
    "id": "rw-bramble",
    "quality": "runeword",
    "name": {
      "en": "Bramble",
      "de": "Bramble",
      "fr": "Bramble",
      "es": "Bramble",
      "zh": "Bramble"
    },
    "type": "Ral Ohm Sur Eth"
  },
  {
    "id": "rw-brand",
    "quality": "runeword",
    "name": {
      "en": "Brand",
      "de": "Brand",
      "fr": "Brand",
      "es": "Brand",
      "zh": "Brand"
    },
    "type": "Jah Lo Mal Gul"
  },
  {
    "id": "rw-breath-of-the-dying",
    "quality": "runeword",
    "name": {
      "en": "Breath of the Dying",
      "de": "Breath of the Dying",
      "fr": "Breath of the Dying",
      "es": "Breath of the Dying",
      "zh": "Breath of the Dying"
    },
    "type": "Vex Hel El Eld Zod Eth"
  },
  {
    "id": "rw-call-to-arms",
    "quality": "runeword",
    "name": {
      "en": "Call to Arms",
      "de": "Call to Arms",
      "fr": "Call to Arms",
      "es": "Call to Arms",
      "zh": "Call to Arms"
    },
    "type": "Amn Ral Mal Ist Ohm"
  },
  {
    "id": "rw-chains-of-honor",
    "quality": "runeword",
    "name": {
      "en": "Chains of Honor",
      "de": "Chains of Honor",
      "fr": "Chains of Honor",
      "es": "Chains of Honor",
      "zh": "Chains of Honor"
    },
    "type": "Dol Um Ber Ist"
  },
  {
    "id": "rw-chaos",
    "quality": "runeword",
    "name": {
      "en": "Chaos",
      "de": "Chaos",
      "fr": "Chaos",
      "es": "Chaos",
      "zh": "Chaos"
    },
    "type": "Fal Ohm Um"
  },
  {
    "id": "rw-crescent-moon",
    "quality": "runeword",
    "name": {
      "en": "Crescent Moon",
      "de": "Crescent Moon",
      "fr": "Crescent Moon",
      "es": "Crescent Moon",
      "zh": "Crescent Moon"
    },
    "type": "Shael Um Tir"
  },
  {
    "id": "rw-death",
    "quality": "runeword",
    "name": {
      "en": "Death",
      "de": "Death",
      "fr": "Death",
      "es": "Death",
      "zh": "Death"
    },
    "type": "Hel El Vex Ort Gul"
  },
  {
    "id": "rw-delirium",
    "quality": "runeword",
    "name": {
      "en": "Delirium",
      "de": "Delirium",
      "fr": "Delirium",
      "es": "Delirium",
      "zh": "Delirium"
    },
    "type": "Lem Ist Io"
  },
  {
    "id": "rw-doom",
    "quality": "runeword",
    "name": {
      "en": "Doom",
      "de": "Doom",
      "fr": "Doom",
      "es": "Doom",
      "zh": "Doom"
    },
    "type": "Hel Ohm Um Lo Cham"
  },
  {
    "id": "rw-dragon",
    "quality": "runeword",
    "name": {
      "en": "Dragon",
      "de": "Dragon",
      "fr": "Dragon",
      "es": "Dragon",
      "zh": "Dragon"
    },
    "type": "Sur Lo Sol"
  },
  {
    "id": "rw-dream",
    "quality": "runeword",
    "name": {
      "en": "Dream",
      "de": "Dream",
      "fr": "Dream",
      "es": "Dream",
      "zh": "Dream"
    },
    "type": "Io Jah Pul"
  },
  {
    "id": "rw-duress",
    "quality": "runeword",
    "name": {
      "en": "Duress",
      "de": "Duress",
      "fr": "Duress",
      "es": "Duress",
      "zh": "Duress"
    },
    "type": "Shael Um Thul"
  },
  {
    "id": "rw-edge",
    "quality": "runeword",
    "name": {
      "en": "Edge",
      "de": "Edge",
      "fr": "Edge",
      "es": "Edge",
      "zh": "Edge"
    },
    "type": "Tir Tal Amn"
  },
  {
    "id": "rw-enigma",
    "quality": "runeword",
    "name": {
      "en": "Enigma",
      "de": "Enigma",
      "fr": "Enigma",
      "es": "Enigma",
      "zh": "Enigma"
    },
    "type": "Jah Ith Ber"
  },
  {
    "id": "rw-enlightenment",
    "quality": "runeword",
    "name": {
      "en": "Enlightenment",
      "de": "Enlightenment",
      "fr": "Enlightenment",
      "es": "Enlightenment",
      "zh": "Enlightenment"
    },
    "type": "Pul Ral Sol"
  },
  {
    "id": "rw-eternity",
    "quality": "runeword",
    "name": {
      "en": "Eternity",
      "de": "Eternity",
      "fr": "Eternity",
      "es": "Eternity",
      "zh": "Eternity"
    },
    "type": "Amn Ber Ist Sol Sur"
  },
  {
    "id": "rw-exile",
    "quality": "runeword",
    "name": {
      "en": "Exile",
      "de": "Exile",
      "fr": "Exile",
      "es": "Exile",
      "zh": "Exile"
    },
    "type": "Vex Ohm Ist Dol"
  },
  {
    "id": "rw-faith",
    "quality": "runeword",
    "name": {
      "en": "Faith",
      "de": "Faith",
      "fr": "Faith",
      "es": "Faith",
      "zh": "Faith"
    },
    "type": "Ohm Jah Lem Eld"
  },
  {
    "id": "rw-famine",
    "quality": "runeword",
    "name": {
      "en": "Famine",
      "de": "Famine",
      "fr": "Famine",
      "es": "Famine",
      "zh": "Famine"
    },
    "type": "Fal Ohm Ort Jah"
  },
  {
    "id": "rw-flickering-flame",
    "quality": "runeword",
    "name": {
      "en": "Flickering Flame",
      "de": "Flickering Flame",
      "fr": "Flickering Flame",
      "es": "Flickering Flame",
      "zh": "Flickering Flame"
    },
    "type": "Nef Pul Vex"
  },
  {
    "id": "rw-fortitude",
    "quality": "runeword",
    "name": {
      "en": "Fortitude",
      "de": "Fortitude",
      "fr": "Fortitude",
      "es": "Fortitude",
      "zh": "Fortitude"
    },
    "type": "El Sol Dol Lo"
  },
  {
    "id": "rw-fury",
    "quality": "runeword",
    "name": {
      "en": "Fury",
      "de": "Fury",
      "fr": "Fury",
      "es": "Fury",
      "zh": "Fury"
    },
    "type": "Jah Gul Eth"
  },
  {
    "id": "rw-gloom",
    "quality": "runeword",
    "name": {
      "en": "Gloom",
      "de": "Gloom",
      "fr": "Gloom",
      "es": "Gloom",
      "zh": "Gloom"
    },
    "type": "Fal Um Pul"
  },
  {
    "id": "rw-grief",
    "quality": "runeword",
    "name": {
      "en": "Grief",
      "de": "Grief",
      "fr": "Grief",
      "es": "Grief",
      "zh": "Grief"
    },
    "type": "Eth Tir Lo Mal Ral"
  },
  {
    "id": "rw-hand-of-justice",
    "quality": "runeword",
    "name": {
      "en": "Hand of Justice",
      "de": "Hand of Justice",
      "fr": "Hand of Justice",
      "es": "Hand of Justice",
      "zh": "Hand of Justice"
    },
    "type": "Sur Cham Amn Lo"
  },
  {
    "id": "rw-harmony",
    "quality": "runeword",
    "name": {
      "en": "Harmony",
      "de": "Harmony",
      "fr": "Harmony",
      "es": "Harmony",
      "zh": "Harmony"
    },
    "type": "Tir Ith Sol Ko"
  },
  {
    "id": "rw-heart-of-the-oak",
    "quality": "runeword",
    "name": {
      "en": "Heart of the Oak",
      "de": "Heart of the Oak",
      "fr": "Heart of the Oak",
      "es": "Heart of the Oak",
      "zh": "Heart of the Oak"
    },
    "type": "Ko Vex Pul Thul"
  },
  {
    "id": "rw-holy-thunder",
    "quality": "runeword",
    "name": {
      "en": "Holy Thunder",
      "de": "Holy Thunder",
      "fr": "Holy Thunder",
      "es": "Holy Thunder",
      "zh": "Holy Thunder"
    },
    "type": "Eth Ral Ort Tal"
  },
  {
    "id": "rw-honor",
    "quality": "runeword",
    "name": {
      "en": "Honor",
      "de": "Honor",
      "fr": "Honor",
      "es": "Honor",
      "zh": "Honor"
    },
    "type": "Amn Ral Ith Sol"
  },
  {
    "id": "rw-hustle",
    "quality": "runeword",
    "name": {
      "en": "Hustle",
      "de": "Hustle",
      "fr": "Hustle",
      "es": "Hustle",
      "zh": "Hustle"
    },
    "type": "Shael Ko Eld"
  },
  {
    "id": "rw-ice",
    "quality": "runeword",
    "name": {
      "en": "Ice",
      "de": "Ice",
      "fr": "Ice",
      "es": "Ice",
      "zh": "Ice"
    },
    "type": "Amn Shael Jah Lo"
  },
  {
    "id": "rw-infinity",
    "quality": "runeword",
    "name": {
      "en": "Infinity",
      "de": "Infinity",
      "fr": "Infinity",
      "es": "Infinity",
      "zh": "Infinity"
    },
    "type": "Ber Mal Ber Ist"
  },
  {
    "id": "rw-insight",
    "quality": "runeword",
    "name": {
      "en": "Insight",
      "de": "Insight",
      "fr": "Insight",
      "es": "Insight",
      "zh": "Insight"
    },
    "type": "Ral Tir Tal Sol"
  },
  {
    "id": "rw-kings-grace",
    "quality": "runeword",
    "name": {
      "en": "King's Grace",
      "de": "King's Grace",
      "fr": "King's Grace",
      "es": "King's Grace",
      "zh": "King's Grace"
    },
    "type": "Amn Ral Thul"
  },
  {
    "id": "rw-kingslayer",
    "quality": "runeword",
    "name": {
      "en": "Kingslayer",
      "de": "Kingslayer",
      "fr": "Kingslayer",
      "es": "Kingslayer",
      "zh": "Kingslayer"
    },
    "type": "Mal Um Gul Fal"
  },
  {
    "id": "rw-last-wish",
    "quality": "runeword",
    "name": {
      "en": "Last Wish",
      "de": "Last Wish",
      "fr": "Last Wish",
      "es": "Last Wish",
      "zh": "Last Wish"
    },
    "type": "Jah Mal Jah Sur Jah Ber"
  },
  {
    "id": "rw-lawbringer",
    "quality": "runeword",
    "name": {
      "en": "Lawbringer",
      "de": "Lawbringer",
      "fr": "Lawbringer",
      "es": "Lawbringer",
      "zh": "Lawbringer"
    },
    "type": "Amn Lem Ko"
  },
  {
    "id": "rw-leaf",
    "quality": "runeword",
    "name": {
      "en": "Leaf",
      "de": "Leaf",
      "fr": "Leaf",
      "es": "Leaf",
      "zh": "Leaf"
    },
    "type": "Tir Ral"
  },
  {
    "id": "rw-lionheart",
    "quality": "runeword",
    "name": {
      "en": "Lionheart",
      "de": "Lionheart",
      "fr": "Lionheart",
      "es": "Lionheart",
      "zh": "Lionheart"
    },
    "type": "Hel Lum Fal"
  },
  {
    "id": "rw-lore",
    "quality": "runeword",
    "name": {
      "en": "Lore",
      "de": "Lore",
      "fr": "Lore",
      "es": "Lore",
      "zh": "Lore"
    },
    "type": "Ort Sol"
  },
  {
    "id": "rw-malice",
    "quality": "runeword",
    "name": {
      "en": "Malice",
      "de": "Malice",
      "fr": "Malice",
      "es": "Malice",
      "zh": "Malice"
    },
    "type": "Ith El Eth"
  },
  {
    "id": "rw-melody",
    "quality": "runeword",
    "name": {
      "en": "Melody",
      "de": "Melody",
      "fr": "Melody",
      "es": "Melody",
      "zh": "Melody"
    },
    "type": "Shael Ko Nef"
  },
  {
    "id": "rw-memory",
    "quality": "runeword",
    "name": {
      "en": "Memory",
      "de": "Memory",
      "fr": "Memory",
      "es": "Memory",
      "zh": "Memory"
    },
    "type": "Lum Io Sol Eth"
  },
  {
    "id": "rw-mist",
    "quality": "runeword",
    "name": {
      "en": "Mist",
      "de": "Mist",
      "fr": "Mist",
      "es": "Mist",
      "zh": "Mist"
    },
    "type": "Cham Shael Gul Thul Ith"
  },
  {
    "id": "rw-mosaic",
    "quality": "runeword",
    "name": {
      "en": "Mosaic",
      "de": "Mosaic",
      "fr": "Mosaic",
      "es": "Mosaic",
      "zh": "Mosaic"
    },
    "type": "Mal Gul Amn"
  },
  {
    "id": "rw-myth",
    "quality": "runeword",
    "name": {
      "en": "Myth",
      "de": "Myth",
      "fr": "Myth",
      "es": "Myth",
      "zh": "Myth"
    },
    "type": "Hel Amn Nef"
  },
  {
    "id": "rw-nadir",
    "quality": "runeword",
    "name": {
      "en": "Nadir",
      "de": "Nadir",
      "fr": "Nadir",
      "es": "Nadir",
      "zh": "Nadir"
    },
    "type": "Nef Tir"
  },
  {
    "id": "rw-oath",
    "quality": "runeword",
    "name": {
      "en": "Oath",
      "de": "Oath",
      "fr": "Oath",
      "es": "Oath",
      "zh": "Oath"
    },
    "type": "Shael Pul Mal Lum"
  },
  {
    "id": "rw-obedience",
    "quality": "runeword",
    "name": {
      "en": "Obedience",
      "de": "Obedience",
      "fr": "Obedience",
      "es": "Obedience",
      "zh": "Obedience"
    },
    "type": "Hel Ko Thul Eth Fal"
  },
  {
    "id": "rw-obsession",
    "quality": "runeword",
    "name": {
      "en": "Obsession",
      "de": "Obsession",
      "fr": "Obsession",
      "es": "Obsession",
      "zh": "Obsession"
    },
    "type": "Zod Ist Lem Lum Io Nef"
  },
  {
    "id": "rw-passion",
    "quality": "runeword",
    "name": {
      "en": "Passion",
      "de": "Passion",
      "fr": "Passion",
      "es": "Passion",
      "zh": "Passion"
    },
    "type": "Dol Ort Eld Lem"
  },
  {
    "id": "rw-peace",
    "quality": "runeword",
    "name": {
      "en": "Peace",
      "de": "Peace",
      "fr": "Peace",
      "es": "Peace",
      "zh": "Peace"
    },
    "type": "Shael Thul Amn"
  },
  {
    "id": "rw-phoenix",
    "quality": "runeword",
    "name": {
      "en": "Phoenix",
      "de": "Phoenix",
      "fr": "Phoenix",
      "es": "Phoenix",
      "zh": "Phoenix"
    },
    "type": "Vex Vex Lo Jah"
  },
  {
    "id": "rw-plague",
    "quality": "runeword",
    "name": {
      "en": "Plague",
      "de": "Plague",
      "fr": "Plague",
      "es": "Plague",
      "zh": "Plague"
    },
    "type": "Cham Shael Um"
  },
  {
    "id": "rw-pride",
    "quality": "runeword",
    "name": {
      "en": "Pride",
      "de": "Pride",
      "fr": "Pride",
      "es": "Pride",
      "zh": "Pride"
    },
    "type": "Cham Sur Io Lo"
  },
  {
    "id": "rw-principle",
    "quality": "runeword",
    "name": {
      "en": "Principle",
      "de": "Principle",
      "fr": "Principle",
      "es": "Principle",
      "zh": "Principle"
    },
    "type": "Ral Gul Eld"
  },
  {
    "id": "rw-prudence",
    "quality": "runeword",
    "name": {
      "en": "Prudence",
      "de": "Prudence",
      "fr": "Prudence",
      "es": "Prudence",
      "zh": "Prudence"
    },
    "type": "Mal Tir"
  },
  {
    "id": "rw-radiance",
    "quality": "runeword",
    "name": {
      "en": "Radiance",
      "de": "Radiance",
      "fr": "Radiance",
      "es": "Radiance",
      "zh": "Radiance"
    },
    "type": "Nef Sol Ith"
  },
  {
    "id": "rw-rain",
    "quality": "runeword",
    "name": {
      "en": "Rain",
      "de": "Rain",
      "fr": "Rain",
      "es": "Rain",
      "zh": "Rain"
    },
    "type": "Ort Mal Ith"
  },
  {
    "id": "rw-rhyme",
    "quality": "runeword",
    "name": {
      "en": "Rhyme",
      "de": "Rhyme",
      "fr": "Rhyme",
      "es": "Rhyme",
      "zh": "Rhyme"
    },
    "type": "Shael Eth"
  },
  {
    "id": "rw-rift",
    "quality": "runeword",
    "name": {
      "en": "Rift",
      "de": "Rift",
      "fr": "Rift",
      "es": "Rift",
      "zh": "Rift"
    },
    "type": "Hel Ko Lem Gul"
  },
  {
    "id": "rw-sanctuary",
    "quality": "runeword",
    "name": {
      "en": "Sanctuary",
      "de": "Sanctuary",
      "fr": "Sanctuary",
      "es": "Sanctuary",
      "zh": "Sanctuary"
    },
    "type": "Ko Ko Mal"
  },
  {
    "id": "rw-silence",
    "quality": "runeword",
    "name": {
      "en": "Silence",
      "de": "Silence",
      "fr": "Silence",
      "es": "Silence",
      "zh": "Silence"
    },
    "type": "Dol Eld Hel Ist Tir Vex"
  },
  {
    "id": "rw-smoke",
    "quality": "runeword",
    "name": {
      "en": "Smoke",
      "de": "Smoke",
      "fr": "Smoke",
      "es": "Smoke",
      "zh": "Smoke"
    },
    "type": "Nef Lum"
  },
  {
    "id": "rw-spirit",
    "quality": "runeword",
    "name": {
      "en": "Spirit",
      "de": "Spirit",
      "fr": "Spirit",
      "es": "Spirit",
      "zh": "Spirit"
    },
    "type": "Tal Thul Ort Amn"
  },
  {
    "id": "rw-splendor",
    "quality": "runeword",
    "name": {
      "en": "Splendor",
      "de": "Splendor",
      "fr": "Splendor",
      "es": "Splendor",
      "zh": "Splendor"
    },
    "type": "Eth Lum"
  },
  {
    "id": "rw-steel",
    "quality": "runeword",
    "name": {
      "en": "Steel",
      "de": "Steel",
      "fr": "Steel",
      "es": "Steel",
      "zh": "Steel"
    },
    "type": "Tir El"
  },
  {
    "id": "rw-stealth",
    "quality": "runeword",
    "name": {
      "en": "Stealth",
      "de": "Stealth",
      "fr": "Stealth",
      "es": "Stealth",
      "zh": "Stealth"
    },
    "type": "Tal Eth"
  },
  {
    "id": "rw-stone",
    "quality": "runeword",
    "name": {
      "en": "Stone",
      "de": "Stone",
      "fr": "Stone",
      "es": "Stone",
      "zh": "Stone"
    },
    "type": "Shael Um Pul Lum"
  },
  {
    "id": "rw-strength",
    "quality": "runeword",
    "name": {
      "en": "Strength",
      "de": "Strength",
      "fr": "Strength",
      "es": "Strength",
      "zh": "Strength"
    },
    "type": "Amn Tir"
  },
  {
    "id": "rw-treachery",
    "quality": "runeword",
    "name": {
      "en": "Treachery",
      "de": "Treachery",
      "fr": "Treachery",
      "es": "Treachery",
      "zh": "Treachery"
    },
    "type": "Shael Thul Lem"
  },
  {
    "id": "rw-unbending-will",
    "quality": "runeword",
    "name": {
      "en": "Unbending Will",
      "de": "Unbending Will",
      "fr": "Unbending Will",
      "es": "Unbending Will",
      "zh": "Unbending Will"
    },
    "type": "Fal Io Ith Eld El Hel"
  },
  {
    "id": "rw-venom",
    "quality": "runeword",
    "name": {
      "en": "Venom",
      "de": "Venom",
      "fr": "Venom",
      "es": "Venom",
      "zh": "Venom"
    },
    "type": "Tal Dol Mal"
  },
  {
    "id": "rw-voice-of-reason",
    "quality": "runeword",
    "name": {
      "en": "Voice of Reason",
      "de": "Voice of Reason",
      "fr": "Voice of Reason",
      "es": "Voice of Reason",
      "zh": "Voice of Reason"
    },
    "type": "Lem Ko El Eld"
  },
  {
    "id": "rw-wealth",
    "quality": "runeword",
    "name": {
      "en": "Wealth",
      "de": "Wealth",
      "fr": "Wealth",
      "es": "Wealth",
      "zh": "Wealth"
    },
    "type": "Lem Ko Tir"
  },
  {
    "id": "rw-white",
    "quality": "runeword",
    "name": {
      "en": "White",
      "de": "White",
      "fr": "White",
      "es": "White",
      "zh": "White"
    },
    "type": "Dol Io"
  },
  {
    "id": "rw-wind",
    "quality": "runeword",
    "name": {
      "en": "Wind",
      "de": "Wind",
      "fr": "Wind",
      "es": "Wind",
      "zh": "Wind"
    },
    "type": "Sur El"
  },
  {
    "id": "rw-wisdom",
    "quality": "runeword",
    "name": {
      "en": "Wisdom",
      "de": "Wisdom",
      "fr": "Wisdom",
      "es": "Wisdom",
      "zh": "Wisdom"
    },
    "type": "Pul Ith Eld"
  },
  {
    "id": "rw-wrath",
    "quality": "runeword",
    "name": {
      "en": "Wrath",
      "de": "Wrath",
      "fr": "Wrath",
      "es": "Wrath",
      "zh": "Wrath"
    },
    "type": "Pul Lum Ber Mal"
  },
  {
    "id": "rw-zephyr",
    "quality": "runeword",
    "name": {
      "en": "Zephyr",
      "de": "Zephyr",
      "fr": "Zephyr",
      "es": "Zephyr",
      "zh": "Zephyr"
    },
    "type": "Ort Eth"
  },
  {
    "id": "u-skin-of-the-vipermagi",
    "quality": "unique",
    "name": {
      "en": "Skin of the Vipermagi",
      "de": "Haut des Vipernmagiers",
      "fr": "Peau du vipèremage",
      "es": "Piel del víboramago",
      "zh": "蛇魔之皮"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "skin-of-the-vipermagi.png"
  },
  {
    "id": "u-shaftstop",
    "quality": "unique",
    "name": {
      "en": "Shaftstop",
      "de": "Schaftstopper",
      "fr": "Shaftstop",
      "es": "Shaftstop",
      "zh": "Shaftstop"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "shaftstop.png"
  },
  {
    "id": "u-leviathan",
    "quality": "unique",
    "name": {
      "en": "Leviathan",
      "de": "Leviathan",
      "fr": "Léviathan",
      "es": "Leviatán",
      "zh": "利维坦"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "leviathan.png"
  },
  {
    "id": "u-goldwrap",
    "quality": "unique",
    "name": {
      "en": "Goldwrap",
      "de": "Goldträger",
      "fr": "Ceinture d'or",
      "es": "Faja dorada",
      "zh": "黄金腰带"
    },
    "type": {
      "en": "Belt",
      "de": "Gürtel",
      "fr": "Ceinture",
      "es": "Cinturón",
      "zh": "腰带"
    },
    "icon": "goldwrap.png"
  },
  {
    "id": "u-skullders-ire",
    "quality": "unique",
    "name": {
      "en": "Skullder's Ire",
      "de": "Skullders Zorn",
      "fr": "Courroux de Skullder",
      "es": "Ira de Skullder",
      "zh": "斯库德之怒"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "skullders-ire.png"
  },
  {
    "id": "u-guardian-angel",
    "quality": "unique",
    "name": {
      "en": "Guardian Angel",
      "de": "Schutzengel",
      "fr": "Ange gardien",
      "es": "Ángel guardián",
      "zh": "守护天使"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "guardian-angel.png"
  },
  {
    "id": "u-que-hegans-wisdom",
    "quality": "unique",
    "name": {
      "en": "Que-Hegan's Wisdom",
      "de": "Que-Hegans Weisheit",
      "fr": "Sagesse de Que-Hegan",
      "es": "Sabiduría de Que-Hegan",
      "zh": "奎-海根的智慧"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "que-hegans-wisdom.png"
  },
  {
    "id": "u-arkaines-valor",
    "quality": "unique",
    "name": {
      "en": "Arkaine's Valor",
      "de": "Arkaines Heldenmut",
      "fr": "Bravoure d’Arkaine",
      "es": "Valor de Arkaine",
      "zh": "阿凯尼之勇"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "arkaines-valor.png"
  },
  {
    "id": "u-crown-of-ages",
    "quality": "unique",
    "name": {
      "en": "Crown of Ages",
      "de": "Krone der Äonen",
      "fr": "Couronne des âges",
      "es": "Corona de las eras",
      "zh": "万古之冠"
    },
    "type": {
      "en": "Helm",
      "de": "Helm",
      "fr": "Heaume",
      "es": "Yelmo",
      "zh": "头盔"
    },
    "icon": "crown-of-ages.png"
  },
  {
    "id": "u-andariels-visage",
    "quality": "unique",
    "name": {
      "en": "Andariel's Visage",
      "de": "Andariels Antlitz",
      "fr": "Visage d’Andariel",
      "es": "Rostro de Andariel",
      "zh": "安达利尔的面容"
    },
    "type": {
      "en": "Helm",
      "de": "Helm",
      "fr": "Heaume",
      "es": "Yelmo",
      "zh": "头盔"
    },
    "icon": "andariels-visage.png"
  },
  {
    "id": "u-veil-of-steel",
    "quality": "unique",
    "name": {
      "en": "Veil of Steel",
      "de": "Schleier aus Stahl",
      "fr": "Voile d’acier",
      "es": "Velo de acero",
      "zh": "钢铁面纱"
    },
    "type": {
      "en": "Helm",
      "de": "Helm",
      "fr": "Heaume",
      "es": "Yelmo",
      "zh": "头盔"
    },
    "icon": "veil-of-steel.png"
  },
  {
    "id": "u-vampire-gaze",
    "quality": "unique",
    "name": {
      "en": "Vampire Gaze",
      "de": "Vampirblick",
      "fr": "Regard du vampire",
      "es": "Mirada del vampiro",
      "zh": "吸血鬼凝视"
    },
    "type": {
      "en": "Helm",
      "de": "Helm",
      "fr": "Heaume",
      "es": "Yelmo",
      "zh": "头盔"
    },
    "icon": "vampire-gaze.png"
  },
  {
    "id": "u-nightwings-veil",
    "quality": "unique",
    "name": {
      "en": "Nightwing's Veil",
      "de": "Nachtschwinges Schleier",
      "fr": "Voile d’aile-de-nuit",
      "es": "Velo de ala nocturna",
      "zh": "夜翼面纱"
    },
    "type": {
      "en": "Helm",
      "de": "Helm",
      "fr": "Heaume",
      "es": "Yelmo",
      "zh": "头盔"
    },
    "icon": "nightwings-veil.png"
  },
  {
    "id": "u-sandstorm-trek",
    "quality": "unique",
    "name": {
      "en": "Sandstorm Trek",
      "de": "Sandsturmtreck",
      "fr": "Marche de la tempête de sable",
      "es": "Marcha de tormenta de arena",
      "zh": "沙暴跋涉"
    },
    "type": {
      "en": "Boots",
      "de": "Schuhe",
      "fr": "Bottes",
      "es": "Botas",
      "zh": "鞋子"
    },
    "icon": "sandstorm-trek.png"
  },
  {
    "id": "u-marrowwalk",
    "quality": "unique",
    "name": {
      "en": "Marrowwalk",
      "de": "Knochensteig",
      "fr": "Marrowwalk",
      "es": "Marrowwalk",
      "zh": "Marrowwalk"
    },
    "type": {
      "en": "Boots",
      "de": "Schuhe",
      "fr": "Bottes",
      "es": "Botas",
      "zh": "鞋子"
    },
    "icon": "marrowwalk.png"
  },
  {
    "id": "u-giant-skull",
    "quality": "unique",
    "name": {
      "en": "Giant Skull",
      "de": "Riesenschädel",
      "fr": "Crâne de géant",
      "es": "Cráneo de gigante",
      "zh": "巨人之颅"
    },
    "type": {
      "en": "Helm",
      "de": "Helm",
      "fr": "Heaume",
      "es": "Yelmo",
      "zh": "头盔"
    },
    "icon": "giant-skull.png"
  },
  {
    "id": "u-waterwalk",
    "quality": "unique",
    "name": {
      "en": "Waterwalk",
      "de": "Wasserwanderung",
      "fr": "Marche sur l’eau",
      "es": "Camina-agua",
      "zh": "水行靴"
    },
    "type": {
      "en": "Boots",
      "de": "Schuhe",
      "fr": "Bottes",
      "es": "Botas",
      "zh": "鞋子"
    },
    "icon": "waterwalk.png"
  },
  {
    "id": "u-steelrend",
    "quality": "unique",
    "name": {
      "en": "Steelrend",
      "de": "Stahlhäcksler",
      "fr": "Steelrend",
      "es": "Steelrend",
      "zh": "Steelrend"
    },
    "type": {
      "en": "Gloves",
      "de": "Handschuhe",
      "fr": "Gants",
      "es": "Guantes",
      "zh": "手套"
    },
    "icon": "steelrend.png"
  },
  {
    "id": "u-verdungos-hearty-cord",
    "quality": "unique",
    "name": {
      "en": "Verdungo's Hearty Cord",
      "de": "Verdungos Herzensband",
      "fr": "Cordon robuste de Verdungo",
      "es": "Cordón robusto de Verdungo",
      "zh": "维杜戈的坚韧腰带"
    },
    "type": {
      "en": "Belt",
      "de": "Gürtel",
      "fr": "Ceinture",
      "es": "Cinturón",
      "zh": "腰带"
    },
    "icon": "verdungos-hearty-cord.png"
  },
  {
    "id": "u-draculs-grasp",
    "quality": "unique",
    "name": {
      "en": "Dracul's Grasp",
      "de": "Draculs Griff",
      "fr": "Poigne de Dracul",
      "es": "Garra de Dracul",
      "zh": "德古拉之握"
    },
    "type": {
      "en": "Gloves",
      "de": "Handschuhe",
      "fr": "Gants",
      "es": "Guantes",
      "zh": "手套"
    },
    "icon": "draculs-grasp.png"
  },
  {
    "id": "u-nosferatus-coil",
    "quality": "unique",
    "name": {
      "en": "Nosferatu's Coil",
      "de": "Nosferatus Rolle",
      "fr": "Anneau de Nosferatu",
      "es": "Espiral de Nosferatu",
      "zh": "吸血鬼之缚"
    },
    "type": {
      "en": "Belt",
      "de": "Gürtel",
      "fr": "Ceinture",
      "es": "Cinturón",
      "zh": "腰带"
    },
    "icon": "nosferatus-coil.png"
  },
  {
    "id": "u-thundergods-vigor",
    "quality": "unique",
    "name": {
      "en": "Thundergod's Vigor",
      "de": "Donnergotts Gedeihen",
      "fr": "Vigueur du dieu du tonnerre",
      "es": "Vigor del dios del trueno",
      "zh": "雷神之力"
    },
    "type": {
      "en": "Belt",
      "de": "Gürtel",
      "fr": "Ceinture",
      "es": "Cinturón",
      "zh": "腰带"
    },
    "icon": "thundergods-vigor.png"
  },
  {
    "id": "u-razortail",
    "quality": "unique",
    "name": {
      "en": "Razortail",
      "de": "Klingenschweif",
      "fr": "Queue-rasoir",
      "es": "Cola navaja",
      "zh": "利刃之尾"
    },
    "type": {
      "en": "Belt",
      "de": "Gürtel",
      "fr": "Ceinture",
      "es": "Cinturón",
      "zh": "腰带"
    },
    "icon": "razortail.png"
  },
  {
    "id": "u-raven-frost",
    "quality": "unique",
    "name": {
      "en": "Raven Frost",
      "de": "Rabenfrost",
      "fr": "Givre du corbeau",
      "es": "Escarcha de cuervo",
      "zh": "渡鸦冰霜"
    },
    "type": {
      "en": "Ring",
      "de": "Ring",
      "fr": "Anneau",
      "es": "Anillo",
      "zh": "戒指"
    },
    "icon": "raven-frost.png"
  },
  {
    "id": "u-string-of-ears",
    "quality": "unique",
    "name": {
      "en": "String of Ears",
      "de": "Ohrenkette",
      "fr": "Collier d’oreilles",
      "es": "Ristra de orejas",
      "zh": "耳坠腰带"
    },
    "type": {
      "en": "Belt",
      "de": "Gürtel",
      "fr": "Ceinture",
      "es": "Cinturón",
      "zh": "腰带"
    },
    "icon": "string-of-ears.png"
  },
  {
    "id": "u-dwarf-star",
    "quality": "unique",
    "name": {
      "en": "Dwarf Star",
      "de": "Zwergenstern",
      "fr": "Étoile naine",
      "es": "Estrella enana",
      "zh": "矮人之星"
    },
    "type": {
      "en": "Ring",
      "de": "Ring",
      "fr": "Anneau",
      "es": "Anillo",
      "zh": "戒指"
    },
    "icon": "dwarf-star.png"
  },
  {
    "id": "u-natures-peace",
    "quality": "unique",
    "name": {
      "en": "Nature's Peace",
      "de": "Friede der Natur",
      "fr": "Paix de la nature",
      "es": "Paz de la naturaleza",
      "zh": "自然之安宁"
    },
    "type": {
      "en": "Ring",
      "de": "Ring",
      "fr": "Anneau",
      "es": "Anillo",
      "zh": "戒指"
    },
    "icon": "natures-peace.png"
  },
  {
    "id": "u-wisp-projector",
    "quality": "unique",
    "name": {
      "en": "Wisp Projector",
      "de": "Irrlichtprojektor",
      "fr": "Projecteur de feu follet",
      "es": "Proyector de fuego fatuo",
      "zh": "鬼火投射器"
    },
    "type": {
      "en": "Ring",
      "de": "Ring",
      "fr": "Anneau",
      "es": "Anillo",
      "zh": "戒指"
    },
    "icon": "wisp-projector.png"
  },
  {
    "id": "u-the-cats-eye",
    "quality": "unique",
    "name": {
      "en": "The Cat's Eye",
      "de": "Das Katzenauge",
      "fr": "L'œil-de-chat",
      "es": "El ojo de gato",
      "zh": "猫眼石"
    },
    "type": {
      "en": "Amulet",
      "de": "Amulett",
      "fr": "Amulette",
      "es": "Amuleto",
      "zh": "护身符"
    },
    "icon": "the-cats-eye.png"
  },
  {
    "id": "u-atmas-scarab",
    "quality": "unique",
    "name": {
      "en": "Atma's Scarab",
      "de": "Atmas Skarabäus",
      "fr": "Scarabée d’Atma",
      "es": "Escarabajo de Atma",
      "zh": "阿特玛的圣甲虫"
    },
    "type": {
      "en": "Amulet",
      "de": "Amulett",
      "fr": "Amulette",
      "es": "Amuleto",
      "zh": "护身符"
    },
    "icon": "atmas-scarab.png"
  },
  {
    "id": "u-the-rising-sun",
    "quality": "unique",
    "name": {
      "en": "The Rising Sun",
      "de": "Die aufgehende Sonne",
      "fr": "Le soleil levant",
      "es": "El sol naciente",
      "zh": "旭日护符"
    },
    "type": {
      "en": "Amulet",
      "de": "Amulett",
      "fr": "Amulette",
      "es": "Amuleto",
      "zh": "护身符"
    },
    "icon": "the-rising-sun.png"
  },
  {
    "id": "u-metalgrid",
    "quality": "unique",
    "name": {
      "en": "Metalgrid",
      "de": "Metallgitter",
      "fr": "Grille de métal",
      "es": "Rejilla de metal",
      "zh": "金属护栅"
    },
    "type": {
      "en": "Amulet",
      "de": "Amulett",
      "fr": "Amulette",
      "es": "Amuleto",
      "zh": "护身符"
    },
    "icon": "metalgrid.png"
  },
  {
    "id": "u-the-reapers-toll",
    "quality": "unique",
    "name": {
      "en": "The Reaper's Toll",
      "de": "Schnitters Tribut",
      "fr": "Le tribut du faucheur",
      "es": "El tributo del segador",
      "zh": "死神的诅咒"
    },
    "type": {
      "en": "Polearm",
      "de": "Stangenwaffe",
      "fr": "Arme d'hast",
      "es": "Arma de asta",
      "zh": "长柄武器"
    },
    "icon": "the-reapers-toll.png"
  },
  {
    "id": "u-wizardspike",
    "quality": "unique",
    "name": {
      "en": "Wizardspike",
      "de": "Zauberdorn",
      "fr": "Pointe du sorcier",
      "es": "Pico del hechicero",
      "zh": "法师之刺"
    },
    "type": {
      "en": "Dagger",
      "de": "Dolch",
      "fr": "Dague",
      "es": "Daga",
      "zh": "匕首"
    },
    "icon": "wizardspike.png"
  },
  {
    "id": "u-schaefers-hammer",
    "quality": "unique",
    "name": {
      "en": "Schaefer's Hammer",
      "de": "Schaefers Hammer",
      "fr": "Marteau de Schaefer",
      "es": "Martillo de Schaefer",
      "zh": "舍弗之锤"
    },
    "type": {
      "en": "Hammer",
      "de": "Hammer",
      "fr": "Marteau",
      "es": "Martillo",
      "zh": "锤"
    },
    "icon": "schaefers-hammer.png"
  },
  {
    "id": "u-eaglehorn",
    "quality": "unique",
    "name": {
      "en": "Eaglehorn",
      "de": "Adlerhorn",
      "fr": "Corne d'aigle",
      "es": "Cuerno de águila",
      "zh": "鹰角弓"
    },
    "type": {
      "en": "Bow",
      "de": "Bogen",
      "fr": "Arc",
      "es": "Arco",
      "zh": "弓"
    },
    "icon": "eaglehorn.png"
  },
  {
    "id": "u-titans-revenge",
    "quality": "unique",
    "name": {
      "en": "Titan's Revenge",
      "de": "Titans Rache",
      "fr": "Vengeance du titan",
      "es": "Venganza del titán",
      "zh": "泰坦的复仇"
    },
    "type": {
      "en": "Javelin",
      "de": "Wurfspeer",
      "fr": "Javeline",
      "es": "Jabalina",
      "zh": "标枪"
    },
    "icon": "titans-revenge.png"
  },
  {
    "id": "u-azurewrath",
    "quality": "unique",
    "name": {
      "en": "Azurewrath",
      "de": "Blauzorn",
      "fr": "Courroux d’azur",
      "es": "Ira de azur",
      "zh": "天蓝之怒"
    },
    "type": {
      "en": "Sword",
      "de": "Schwert",
      "fr": "Épée",
      "es": "Espada",
      "zh": "剑"
    },
    "icon": "azurewrath.png"
  },
  {
    "id": "u-thunderstroke",
    "quality": "unique",
    "name": {
      "en": "Thunderstroke",
      "de": "Donnerschlag",
      "fr": "Coup de tonnerre",
      "es": "Golpe de trueno",
      "zh": "雷击标枪"
    },
    "type": {
      "en": "Javelin",
      "de": "Wurfspeer",
      "fr": "Javeline",
      "es": "Jabalina",
      "zh": "标枪"
    },
    "icon": "thunderstroke.png"
  },
  {
    "id": "u-doombringer",
    "quality": "unique",
    "name": {
      "en": "Doombringer",
      "de": "Todbringer",
      "fr": "Porteur de malheur",
      "es": "Portador de fatalidad",
      "zh": "末日使者"
    },
    "type": {
      "en": "Sword",
      "de": "Schwert",
      "fr": "Épée",
      "es": "Espada",
      "zh": "剑"
    },
    "icon": "doombringer.png"
  },
  {
    "id": "u-lightsabre",
    "quality": "unique",
    "name": {
      "en": "Lightsabre",
      "de": "Lichtsäbel",
      "fr": "Sabre de lumière",
      "es": "Sable de luz",
      "zh": "光明军刀"
    },
    "type": {
      "en": "Sword",
      "de": "Schwert",
      "fr": "Épée",
      "es": "Espada",
      "zh": "剑"
    },
    "icon": "lightsabre.png"
  },
  {
    "id": "u-deaths-fathom",
    "quality": "unique",
    "name": {
      "en": "Death's Fathom",
      "de": "Klafter des Todes",
      "fr": "Sonde de la mort",
      "es": "Sonda de la muerte",
      "zh": "死亡之深渊"
    },
    "type": {
      "en": "Orb",
      "de": "Sphäre",
      "fr": "Orbe",
      "es": "Orbe",
      "zh": "法球"
    },
    "icon": "deaths-fathom.png"
  },
  {
    "id": "u-eschutas-temper",
    "quality": "unique",
    "name": {
      "en": "Eschuta's Temper",
      "de": "Eschutas Temperament",
      "fr": "Tempérament d’Eschuta",
      "es": "Temple de Eschuta",
      "zh": "艾舒塔之怒"
    },
    "type": {
      "en": "Orb",
      "de": "Sphäre",
      "fr": "Orbe",
      "es": "Orbe",
      "zh": "法球"
    },
    "icon": "eschutas-temper.png"
  },
  {
    "id": "u-arm-of-king-leoric",
    "quality": "unique",
    "name": {
      "en": "Arm of King Leoric",
      "de": "Arm von König Leoric",
      "fr": "Bras du roi Leoric",
      "es": "Brazo del rey Leoric",
      "zh": "李奥瑞克国王之臂"
    },
    "type": {
      "en": "Wand",
      "de": "Zauberstab",
      "fr": "Baguette",
      "es": "Varita",
      "zh": "魔杖"
    },
    "icon": "arm-of-king-leoric.png"
  },
  {
    "id": "u-demon-limb",
    "quality": "unique",
    "name": {
      "en": "Demon Limb",
      "de": "Dämonenglied",
      "fr": "Membre de démon",
      "es": "Miembro de demonio",
      "zh": "恶魔之肢"
    },
    "type": {
      "en": "Mace",
      "de": "Streitkolben",
      "fr": "Masse",
      "es": "Maza",
      "zh": "钉头锤"
    },
    "icon": "demon-limb.png"
  },
  {
    "id": "u-homunculus",
    "quality": "unique",
    "name": {
      "en": "Homunculus",
      "de": "Homunkulus",
      "fr": "Homoncule",
      "es": "Homúnculo",
      "zh": "何蒙库鲁兹"
    },
    "type": {
      "en": "Shield",
      "de": "Schild",
      "fr": "Bouclier",
      "es": "Escudo",
      "zh": "盾牌"
    },
    "icon": "homunculus.png"
  },
  {
    "id": "s-aldurs-advance",
    "quality": "set",
    "name": {
      "en": "Aldur's Advance",
      "de": "Aldurs Vormarsch",
      "fr": "Avancée d’Aldur",
      "es": "Avance de Aldur",
      "zh": "奥杜的前进"
    },
    "type": {
      "en": "Boots",
      "de": "Schuhe",
      "fr": "Bottes",
      "es": "Botas",
      "zh": "鞋子"
    },
    "icon": "aldurs-advance.png"
  },
  {
    "id": "s-aldurs-deception",
    "quality": "set",
    "name": {
      "en": "Aldur's Deception",
      "de": "Aldurs Täuschung",
      "fr": "Tromperie d’Aldur",
      "es": "Engaño de Aldur",
      "zh": "奥杜的欺诈"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "aldurs-deception.png"
  },
  {
    "id": "s-aldurs-rhythm",
    "quality": "set",
    "name": {
      "en": "Aldur's Rhythm",
      "de": "Aldurs Rhythmus",
      "fr": "Rythme d’Aldur",
      "es": "Ritmo de Aldur",
      "zh": "奥杜的韵律"
    },
    "type": {
      "en": "Mace",
      "de": "Streitkolben",
      "fr": "Masse",
      "es": "Maza",
      "zh": "钉头锤"
    },
    "icon": "aldurs-rhythm.png"
  },
  {
    "id": "s-aldurs-stony-gaze",
    "quality": "set",
    "name": {
      "en": "Aldur's Stony Gaze",
      "de": "Aldurs Steinblick",
      "fr": "Regard de pierre d’Aldur",
      "es": "Mirada pétrea de Aldur",
      "zh": "奥杜的石化凝视"
    },
    "type": {
      "en": "Helm",
      "de": "Helm",
      "fr": "Heaume",
      "es": "Yelmo",
      "zh": "头盔"
    },
    "icon": "aldurs-stony-gaze.png"
  },
  {
    "id": "s-immortal-kings-stone-crusher",
    "quality": "set",
    "name": {
      "en": "Immortal King's Stone Crusher",
      "de": "Steintrümmerer des unsterblichen Königs",
      "fr": "Broyeur de pierre du Roi immortel",
      "es": "Triturador del Rey inmortal",
      "zh": "不朽之王的碎石者"
    },
    "type": {
      "en": "Mace",
      "de": "Streitkolben",
      "fr": "Masse",
      "es": "Maza",
      "zh": "钉头锤"
    },
    "icon": "immortal-kings-stone-crusher.png"
  },
  {
    "id": "s-immortal-kings-soul-cage",
    "quality": "set",
    "name": {
      "en": "Immortal King's Soul Cage",
      "de": "Seelenkäfig des unsterblichen Königs",
      "fr": "Cage d’âme du Roi immortel",
      "es": "Jaula del alma del Rey inmortal",
      "zh": "不朽之王的灵魂之笼"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "immortal-kings-soul-cage.png"
  },
  {
    "id": "s-immortal-kings-detail",
    "quality": "set",
    "name": {
      "en": "Immortal King's Detail",
      "de": "Trupp des unsterblichen Königs",
      "fr": "Ceinture du Roi immortel",
      "es": "Detalle del Rey inmortal",
      "zh": "不朽之王的腰带"
    },
    "type": {
      "en": "Belt",
      "de": "Gürtel",
      "fr": "Ceinture",
      "es": "Cinturón",
      "zh": "腰带"
    },
    "icon": "immortal-kings-detail.png"
  },
  {
    "id": "s-immortal-kings-pillar",
    "quality": "set",
    "name": {
      "en": "Immortal King's Pillar",
      "de": "Säule des unsterblichen Königs",
      "fr": "Pilier du Roi immortel",
      "es": "Pilar del Rey inmortal",
      "zh": "不朽之王的支柱"
    },
    "type": {
      "en": "Boots",
      "de": "Schuhe",
      "fr": "Bottes",
      "es": "Botas",
      "zh": "鞋子"
    },
    "icon": "immortal-kings-pillar.png"
  },
  {
    "id": "s-immortal-kings-will",
    "quality": "set",
    "name": {
      "en": "Immortal King's Will",
      "de": "Wille des unsterblichen Königs",
      "fr": "Volonté du Roi immortel",
      "es": "Voluntad del Rey inmortal",
      "zh": "不朽之王的意志"
    },
    "type": {
      "en": "Helm",
      "de": "Helm",
      "fr": "Heaume",
      "es": "Yelmo",
      "zh": "头盔"
    },
    "icon": "immortal-kings-will.png"
  },
  {
    "id": "s-immortal-kings-forge",
    "quality": "set",
    "name": {
      "en": "Immortal King's Forge",
      "de": "Schmiede des unsterblichen Königs",
      "fr": "Forge du Roi immortel",
      "es": "Forja del Rey inmortal",
      "zh": "不朽之王的熔炉"
    },
    "type": {
      "en": "Gloves",
      "de": "Handschuhe",
      "fr": "Gants",
      "es": "Guantes",
      "zh": "手套"
    },
    "icon": "immortal-kings-forge.png"
  },
  {
    "id": "u-tyraels-might",
    "quality": "unique",
    "name": {
      "en": "Tyrael's Might",
      "de": "Tyraels Macht",
      "fr": "Puissance de Tyrael",
      "es": "Poder de Tyrael",
      "zh": "泰瑞尔的威能"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "tyraels-might.png"
  },
  {
    "id": "u-templars-might",
    "quality": "unique",
    "name": {
      "en": "Templar's Might",
      "de": "Templers Macht",
      "fr": "Puissance du templier",
      "es": "Poder del templario",
      "zh": "圣堂武士之力"
    },
    "type": {
      "en": "Armor",
      "de": "Rüstung",
      "fr": "Armure",
      "es": "Armadura",
      "zh": "盔甲"
    },
    "icon": "templars-might.png"
  },
  {
    "id": "u-mang-songs-lesson",
    "quality": "unique",
    "name": {
      "en": "Mang Song's Lesson",
      "de": "Mang Songs Lektion",
      "fr": "Leçon de Mang Song",
      "es": "Lección de Mang Song",
      "zh": "芒颂的教诲"
    },
    "type": {
      "en": "Staff",
      "de": "Stab",
      "fr": "Bâton",
      "es": "Bastón",
      "zh": "法杖"
    },
    "icon": "mang-songs-lesson.png"
  },
  {
    "id": "u-the-cranium-basher",
    "quality": "unique",
    "name": {
      "en": "The Cranium Basher",
      "de": "Der Schädelhauer",
      "fr": "Le broyeur de crâne",
      "es": "El machacacráneos",
      "zh": "碎颅者"
    },
    "type": {
      "en": "Mace",
      "de": "Streitkolben",
      "fr": "Masse",
      "es": "Maza",
      "zh": "钉头锤"
    },
    "icon": "the-cranium-basher.png"
  },
  {
    "id": "u-earth-shifter",
    "quality": "unique",
    "name": {
      "en": "Earth Shifter",
      "de": "Erdschieber",
      "fr": "Bouleverseur de terre",
      "es": "Removedor de tierra",
      "zh": "撼地者"
    },
    "type": {
      "en": "Mace",
      "de": "Streitkolben",
      "fr": "Masse",
      "es": "Maza",
      "zh": "钉头锤"
    },
    "icon": "earth-shifter.png"
  },
  {
    "id": "u-shadow-dancer",
    "quality": "unique",
    "name": {
      "en": "Shadow Dancer",
      "de": "Schattentänzer",
      "fr": "Danseur de l’ombre",
      "es": "Bailarín de las sombras",
      "zh": "暗影舞者"
    },
    "type": {
      "en": "Boots",
      "de": "Schuhe",
      "fr": "Bottes",
      "es": "Botas",
      "zh": "鞋子"
    },
    "icon": "shadow-dancer.png"
  },
  {
    "id": "u-stormlash",
    "quality": "unique",
    "name": {
      "en": "Stormlash",
      "de": "Sturmgeißel",
      "fr": "Fouet de tempête",
      "es": "Látigo de tormenta",
      "zh": "风暴之鞭"
    },
    "type": {
      "en": "Mace",
      "de": "Streitkolben",
      "fr": "Masse",
      "es": "Maza",
      "zh": "钉头锤"
    },
    "icon": "stormlash.png"
  },
  {
    "id": "u-stormspire",
    "quality": "unique",
    "name": {
      "en": "Stormspire",
      "de": "Sturmspitze",
      "fr": "Aiguille de tempête",
      "es": "Aguja de tormenta",
      "zh": "风暴之尖"
    },
    "type": {
      "en": "Polearm",
      "de": "Stangenwaffe",
      "fr": "Arme d'hast",
      "es": "Arma de asta",
      "zh": "长柄武器"
    },
    "icon": "stormspire.png"
  }
];

// --- Skill-Grand-Charms („Skiller", +1 zu einem Skill-Baum) ---------------
// 7 Klassen × 3 Skill-Bäume = 21 Stück, Magic-Qualität (blau). Gemeinsames Icon
// 'grand-charm.png' (Platzhalter, bis ein Bild hinterlegt wird). Namen werden aus
// Baum + Klasse zusammengesetzt, damit jede Sprache konsistent bleibt.
const GC_LANGS = ['en', 'de', 'fr', 'es', 'zh'];
const GC_TYPE = { en: 'Grand Charm', de: 'Großer Talisman', fr: 'Grand charme', es: 'Gran amuleto', zh: '大型护身符' };
const GC_CLASS = {
  ama: { en: 'Amazon', de: 'Amazone', fr: 'Amazone', es: 'Amazona', zh: '亚马逊' },
  assa: { en: 'Assassin', de: 'Assassine', fr: 'Assassin', es: 'Asesina', zh: '刺客' },
  barb: { en: 'Barbarian', de: 'Barbar', fr: 'Barbare', es: 'Bárbaro', zh: '野蛮人' },
  druid: { en: 'Druid', de: 'Druide', fr: 'Druide', es: 'Druida', zh: '德鲁伊' },
  necro: { en: 'Necromancer', de: 'Totenbeschwörer', fr: 'Nécromant', es: 'Nigromante', zh: '死灵法师' },
  pal: { en: 'Paladin', de: 'Paladin', fr: 'Paladin', es: 'Paladín', zh: '圣骑士' },
  sorc: { en: 'Sorceress', de: 'Zauberin', fr: 'Sorcière', es: 'Hechicera', zh: '女法师' },
};
const GC_TABS = [
  ['gc-ama-jav', 'ama', { en: 'Javelin & Spear', de: 'Wurfspeer & Speer', fr: 'Javeline & lance', es: 'Jabalina y lanza', zh: '标枪与长矛' }],
  ['gc-ama-passive', 'ama', { en: 'Passive & Magic', de: 'Passiv & Magie', fr: 'Passif & magie', es: 'Pasivas y mágicas', zh: '被动与魔法' }],
  ['gc-ama-bow', 'ama', { en: 'Bow & Crossbow', de: 'Bogen & Armbrust', fr: 'Arc & arbalète', es: 'Arco y ballesta', zh: '弓与弩' }],
  ['gc-assa-martial', 'assa', { en: 'Martial Arts', de: 'Kampfkunst', fr: 'Arts martiaux', es: 'Artes marciales', zh: '武术' }],
  ['gc-assa-shadow', 'assa', { en: 'Shadow Disciplines', de: 'Schattendisziplinen', fr: "Disciplines de l'ombre", es: 'Disciplinas de las sombras', zh: '暗影修炼' }],
  ['gc-assa-traps', 'assa', { en: 'Traps', de: 'Fallen', fr: 'Pièges', es: 'Trampas', zh: '陷阱' }],
  ['gc-barb-combat', 'barb', { en: 'Combat Skills', de: 'Kampffertigkeiten', fr: 'Compétences de combat', es: 'Habilidades de combate', zh: '战斗技能' }],
  ['gc-barb-masteries', 'barb', { en: 'Combat Masteries', de: 'Beherrschungen', fr: 'Maîtrises de combat', es: 'Maestrías de combate', zh: '战斗精通' }],
  ['gc-barb-warcries', 'barb', { en: 'Warcries', de: 'Kampfschreie', fr: 'Cris de guerre', es: 'Gritos de guerra', zh: '战吼' }],
  ['gc-druid-elemental', 'druid', { en: 'Elemental', de: 'Elementar', fr: 'Élémentaire', es: 'Elemental', zh: '元素' }],
  ['gc-druid-shape', 'druid', { en: 'Shape Shifting', de: 'Gestaltwandlung', fr: 'Métamorphose', es: 'Metamorfosis', zh: '变形' }],
  ['gc-druid-summon', 'druid', { en: 'Summoning', de: 'Beschwörung', fr: 'Invocation', es: 'Invocación', zh: '召唤' }],
  ['gc-necro-curses', 'necro', { en: 'Curses', de: 'Flüche', fr: 'Malédictions', es: 'Maldiciones', zh: '诅咒' }],
  ['gc-necro-pnb', 'necro', { en: 'Poison & Bone', de: 'Gift & Knochen', fr: 'Poison & os', es: 'Veneno y hueso', zh: '毒与骨' }],
  ['gc-necro-summon', 'necro', { en: 'Summoning', de: 'Beschwörung', fr: 'Invocation', es: 'Invocación', zh: '召唤' }],
  ['gc-pal-combat', 'pal', { en: 'Combat Skills', de: 'Kampffertigkeiten', fr: 'Compétences de combat', es: 'Habilidades de combate', zh: '战斗技能' }],
  ['gc-pal-offensive', 'pal', { en: 'Offensive Auras', de: 'Offensiv-Auren', fr: 'Auras offensives', es: 'Auras ofensivas', zh: '攻击光环' }],
  ['gc-pal-defensive', 'pal', { en: 'Defensive Auras', de: 'Defensiv-Auren', fr: 'Auras défensives', es: 'Auras defensivas', zh: '防御光环' }],
  ['gc-sorc-cold', 'sorc', { en: 'Cold', de: 'Kälte', fr: 'Froid', es: 'Frío', zh: '冰冷' }],
  ['gc-sorc-fire', 'sorc', { en: 'Fire', de: 'Feuer', fr: 'Feu', es: 'Fuego', zh: '火焰' }],
  ['gc-sorc-light', 'sorc', { en: 'Lightning', de: 'Blitz', fr: 'Foudre', es: 'Rayo', zh: '闪电' }],
];
const skillers = GC_TABS.map(([id, cls, tab]) => ({
  id,
  quality: 'magic',
  icon: 'grand-charm.svg',
  name: Object.fromEntries(GC_LANGS.map((l) => [l, `${tab[l]} (${GC_CLASS[cls][l]})`])),
  type: GC_TYPE,
}));

// --- Rainbow Facets (unique Juwelen) --------------------------------------
// 4 Elemente × 2 Auslöser (Level-Up / Tod) = 8 Varianten. Icon = Juwel in der
// jeweiligen Elementfarbe. Werte werden beim Loggen als „variant" erfasst.
const FACET_ELEM = {
  fire: { icon: 'facet-fire.png', name: { en: 'Fire', de: 'Feuer', fr: 'Feu', es: 'Fuego', zh: '火焰' } },
  cold: { icon: 'facet-cold.png', name: { en: 'Cold', de: 'Kälte', fr: 'Froid', es: 'Frío', zh: '冰冷' } },
  light: { icon: 'facet-light.png', name: { en: 'Lightning', de: 'Blitz', fr: 'Foudre', es: 'Rayo', zh: '闪电' } },
  pois: { icon: 'facet-pois.png', name: { en: 'Poison', de: 'Gift', fr: 'Poison', es: 'Veneno', zh: '毒' } },
};
const FACET_TRIGGER = {
  up: { en: 'Level-Up', de: 'Level-Up', fr: 'Niveau', es: 'Subir nivel', zh: '升级' },
  die: { en: 'Death', de: 'Tod', fr: 'Mort', es: 'Muerte', zh: '死亡' },
};
const FACET_JEWEL = { en: 'Jewel', de: 'Juwel', fr: 'Joyau', es: 'Joya', zh: '珠宝' };
const facets = [];
for (const [ek, e] of Object.entries(FACET_ELEM)) {
  for (const [tk, tr] of Object.entries(FACET_TRIGGER)) {
    facets.push({
      id: `facet-${ek}-${tk}`,
      quality: 'unique',
      icon: e.icon,
      name: Object.fromEntries(GC_LANGS.map((l) => [l, `Rainbow Facet: ${e.name[l]} (${tr[l]})`])),
      type: FACET_JEWEL,
    });
  }
}

// --- Colossal Ancients Jewels (Reign of the Warlock) -----------------------
// 6 neue Unique-Juwelen, Drop der Colossal-Ancients-Pinnacle-Begegnung (lvl 75).
// Strikt stärkere Pendants zu den Rainbow Facets, je 1 pro Charakter. Echte
// Spiel-Grafiken: 3 Motive nach Präfix (Defender/Protector/Guardian), je 2 Juwelen
// teilen sich ein Bild — exakt wie in der Quelle (diablo2.io). Offizielle de/fr/es/zh-
// Namen sind noch nicht final – die Übersetzungen unten sind Best-Effort.
const warlockJewels = [
  {
    id: 'jewel-defenders-fire',
    quality: 'unique',
    icon: 'jewel-defenders.png',
    name: { en: "Defender's Fire", de: 'Feuer des Verteidigers', fr: 'Feu du Défenseur', es: 'Fuego del Defensor', zh: '守卫者之火' },
    type: FACET_JEWEL,
  },
  {
    id: 'jewel-protectors-frost',
    quality: 'unique',
    icon: 'jewel-protectors.png',
    name: { en: "Protector's Frost", de: 'Frost des Beschützers', fr: 'Givre du Protecteur', es: 'Escarcha del Protector', zh: '保护者之霜' },
    type: FACET_JEWEL,
  },
  {
    id: 'jewel-guardians-thunder',
    quality: 'unique',
    icon: 'jewel-guardians.png',
    name: { en: "Guardian's Thunder", de: 'Donner des Wächters', fr: 'Foudre du Gardien', es: 'Trueno del Guardián', zh: '看守者之雷' },
    type: FACET_JEWEL,
  },
  {
    id: 'jewel-defenders-bile',
    quality: 'unique',
    icon: 'jewel-defenders.png',
    name: { en: "Defender's Bile", de: 'Galle des Verteidigers', fr: 'Bile du Défenseur', es: 'Bilis del Defensor', zh: '守卫者之毒' },
    type: FACET_JEWEL,
  },
  {
    id: 'jewel-protectors-stone',
    quality: 'unique',
    icon: 'jewel-protectors.png',
    name: { en: "Protector's Stone", de: 'Stein des Beschützers', fr: 'Pierre du Protecteur', es: 'Piedra del Protector', zh: '保护者之石' },
    type: FACET_JEWEL,
  },
  {
    id: 'jewel-guardians-light',
    quality: 'unique',
    icon: 'jewel-guardians.png',
    name: { en: "Guardian's Light", de: 'Licht des Wächters', fr: 'Lumière du Gardien', es: 'Luz del Guardián', zh: '看守者之光' },
    type: FACET_JEWEL,
  },
];

export const items = baseItems.concat(skillers, facets, warlockJewels);

export const targets = [
  {
    "id": "a1-blood-raven",
    "act": 1,
    "name": {
      "en": "Blood Raven",
      "de": "Blutrabe",
      "fr": "Corbeau de sang",
      "es": "Cuervo de Sangre",
      "zh": "血鸦"
    }
  },
  {
    "id": "a1-countess",
    "act": 1,
    "name": {
      "en": "The Countess",
      "de": "Die Gräfin",
      "fr": "La Comtesse",
      "es": "La Condesa",
      "zh": "伯爵夫人"
    }
  },
  {
    "id": "a1-pit",
    "act": 1,
    "name": {
      "en": "The Pit",
      "de": "Die Grube",
      "fr": "La Fosse",
      "es": "El Foso",
      "zh": "深渊洞窟"
    }
  },
  {
    "id": "a1-andariel",
    "act": 1,
    "name": {
      "en": "Andariel",
      "de": "Andariel",
      "fr": "Andariel",
      "es": "Andariel",
      "zh": "安达利尔"
    }
  },
  {
    "id": "a2-radament",
    "act": 2,
    "name": {
      "en": "Radament",
      "de": "Radament",
      "fr": "Radament",
      "es": "Radament",
      "zh": "拉达门特"
    }
  },
  {
    "id": "a2-summoner",
    "act": 2,
    "name": {
      "en": "The Summoner",
      "de": "Der Beschwörer",
      "fr": "L'Invocateur",
      "es": "El Invocador",
      "zh": "召唤者"
    }
  },
  {
    "id": "a2-ancient-tunnels",
    "act": 2,
    "name": {
      "en": "Ancient Tunnels",
      "de": "Antike Tunnel",
      "fr": "Tunnels anciens",
      "es": "Túneles Antiguos",
      "zh": "远古洞穴"
    }
  },
  {
    "id": "a2-duriel",
    "act": 2,
    "name": {
      "en": "Duriel",
      "de": "Duriel",
      "fr": "Duriel",
      "es": "Duriel",
      "zh": "督瑞尔"
    }
  },
  {
    "id": "a3-mephisto",
    "act": 3,
    "name": {
      "en": "Mephisto",
      "de": "Mephisto",
      "fr": "Méphisto",
      "es": "Mefisto",
      "zh": "墨菲斯托"
    }
  },
  {
    "id": "a3-travincal",
    "act": 3,
    "name": {
      "en": "Travincal / Council",
      "de": "Travincal / Rat",
      "fr": "Travincal / Conseil",
      "es": "Travincal / Consejo",
      "zh": "崔凡克 / 议会"
    }
  },
  {
    "id": "a4-chaos-sanctuary",
    "act": 4,
    "name": {
      "en": "Chaos Sanctuary",
      "de": "Chaos-Heiligtum",
      "fr": "Sanctuaire du Chaos",
      "es": "Santuario del Caos",
      "zh": "混沌庇护所"
    }
  },
  {
    "id": "a4-diablo",
    "act": 4,
    "name": {
      "en": "Diablo",
      "de": "Diablo",
      "fr": "Diablo",
      "es": "Diablo",
      "zh": "迪亚波罗"
    }
  },
  {
    "id": "a5-pindleskin",
    "act": 5,
    "name": {
      "en": "Pindleskin",
      "de": "Pindleskin",
      "fr": "Pindleskin",
      "es": "Pindleskin",
      "zh": "平德"
    }
  },
  {
    "id": "a5-eldritch",
    "act": 5,
    "name": {
      "en": "Eldritch",
      "de": "Eldritch",
      "fr": "Eldritch",
      "es": "Eldritch",
      "zh": "埃尔德里奇"
    }
  },
  {
    "id": "a5-shenk",
    "act": 5,
    "name": {
      "en": "Shenk",
      "de": "Shenk",
      "fr": "Shenk",
      "es": "Shenk",
      "zh": "辛克"
    }
  },
  {
    "id": "a5-nihlathak",
    "act": 5,
    "name": {
      "en": "Nihlathak",
      "de": "Nihlathak",
      "fr": "Nihlathak",
      "es": "Nihlathak",
      "zh": "尼拉塞克"
    }
  },
  {
    "id": "a5-baal",
    "act": 5,
    "name": {
      "en": "Baal (Throne)",
      "de": "Baal (Thron)",
      "fr": "Baal (Trône)",
      "es": "Baal (Trono)",
      "zh": "巴尔（王座）"
    }
  },
  {
    "id": "a5-cows",
    "act": 5,
    "name": {
      "en": "Cow Level",
      "de": "Kuhlevel",
      "fr": "Niveau des vaches",
      "es": "Nivel de las vacas",
      "zh": "母牛关"
    }
  }
];

export const zones = [
  {
    "id": 2,
    "name": {
      "en": "Blood Moor/Den of Evil",
      "de": "Blutmoor/Höhle des Bösen",
      "fr": "Lande de sang/Antre du mal",
      "es": "Páramo de sangre/Guarida del mal",
      "zh": "血腥旷野/邪恶巢穴"
    }
  },
  {
    "id": 3,
    "name": {
      "en": "Cold Plains/Cave",
      "de": "Kalte Ebenen/Höhle",
      "fr": "Plaines froides/Grotte",
      "es": "Llanuras frías/Cueva",
      "zh": "寒冷平原/洞穴"
    }
  },
  {
    "id": 4,
    "name": {
      "en": "Stony Field",
      "de": "Steiniges Feld",
      "fr": "Champ de pierres",
      "es": "Campo pedregoso",
      "zh": "乱石旷野"
    }
  },
  {
    "id": 5,
    "name": {
      "en": "Darkwood/Underground Passage",
      "de": "Dunkelwald/Unterirdischer Gang",
      "fr": "Bois sombre/Passage souterrain",
      "es": "Bosque oscuro/Pasaje subterráneo",
      "zh": "黑暗森林/地下通道"
    }
  },
  {
    "id": 6,
    "name": {
      "en": "Black Marsh/The Hole",
      "de": "Schwarzes Moor/Das Loch",
      "fr": "Marais noir/Le Trou",
      "es": "Pantano negro/El Agujero",
      "zh": "黑色沼泽/地洞"
    }
  },
  {
    "id": 12,
    "name": {
      "en": "The Pit",
      "de": "Die Grube",
      "fr": "La Fosse",
      "es": "El Foso",
      "zh": "深渊洞窟"
    }
  },
  {
    "id": 17,
    "name": {
      "en": "Burial Grounds/Crypt/Mausoleum",
      "de": "Begräbnisstätte/Gruft/Mausoleum",
      "fr": "Cimetière/Crypte/Mausolée",
      "es": "Cementerio/Cripta/Mausoleo",
      "zh": "墓地/地穴/陵墓"
    }
  },
  {
    "id": 20,
    "name": {
      "en": "Forgotten Tower",
      "de": "Vergessener Turm",
      "fr": "Tour oubliée",
      "es": "Torre olvidada",
      "zh": "被遗忘之塔"
    }
  },
  {
    "id": 28,
    "name": {
      "en": "Jail/Barracks",
      "de": "Kerker/Kaserne",
      "fr": "Geôle/Caserne",
      "es": "Cárcel/Cuartel",
      "zh": "监狱/兵营"
    }
  },
  {
    "id": 33,
    "name": {
      "en": "Cathedral/Catacombs",
      "de": "Kathedrale/Katakomben",
      "fr": "Cathédrale/Catacombes",
      "es": "Catedral/Catacumbas",
      "zh": "大教堂/地下墓穴"
    }
  },
  {
    "id": 38,
    "name": {
      "en": "Tristram",
      "de": "Tristram",
      "fr": "Tristram",
      "es": "Tristram",
      "zh": "崔斯特瑞姆"
    }
  },
  {
    "id": 39,
    "name": {
      "en": "The Secret Cow Level",
      "de": "Das geheime Kuhlevel",
      "fr": "Le niveau secret des vaches",
      "es": "El nivel secreto de las vacas",
      "zh": "秘密母牛关"
    }
  },
  {
    "id": 41,
    "name": {
      "en": "Stony Tomb/Rocky Waste",
      "de": "Steinernes Grab/Felsenödland",
      "fr": "Tombe de pierre/Désert rocheux",
      "es": "Tumba pétrea/Yermo rocoso",
      "zh": "石墓/岩石荒野"
    }
  },
  {
    "id": 42,
    "name": {
      "en": "Dry Hills/Halls of the Dead",
      "de": "Trockene Hügel/Hallen der Toten",
      "fr": "Collines arides/Halls des morts",
      "es": "Colinas secas/Salas de los muertos",
      "zh": "干旱丘陵/亡者大厅"
    }
  },
  {
    "id": 43,
    "name": {
      "en": "Far Oasis",
      "de": "Ferne Oase",
      "fr": "Oasis lointaine",
      "es": "Oasis lejano",
      "zh": "远方绿洲"
    }
  },
  {
    "id": 44,
    "name": {
      "en": "Lost City/Valley of Snakes/Claw Viper Temple",
      "de": "Verlorene Stadt/Tal der Schlangen/Klauenviper-Tempel",
      "fr": "Cité perdue/Vallée des serpents/Temple de la vipère",
      "es": "Ciudad perdida/Valle de las serpientes/Templo de la víbora",
      "zh": "失落之城/蛇之谷/毒蛇神殿"
    }
  },
  {
    "id": 47,
    "name": {
      "en": "Lut Gholein Sewers",
      "de": "Kanalisation von Lut Gholein",
      "fr": "Égouts de Lut Gholein",
      "es": "Cloacas de Lut Gholein",
      "zh": "路高因下水道"
    }
  },
  {
    "id": 65,
    "name": {
      "en": "Ancient Tunnels",
      "de": "Antike Tunnel",
      "fr": "Tunnels anciens",
      "es": "Túneles Antiguos",
      "zh": "远古洞穴"
    }
  },
  {
    "id": 66,
    "name": {
      "en": "Tal Rasha's Tombs",
      "de": "Tal Rashas Gräber",
      "fr": "Tombes de Tal Rasha",
      "es": "Tumbas de Tal Rasha",
      "zh": "塔拉夏之墓"
    }
  },
  {
    "id": 74,
    "name": {
      "en": "Arcane Sanctuary",
      "de": "Arkanes Heiligtum",
      "fr": "Sanctuaire arcanique",
      "es": "Santuario arcano",
      "zh": "秘术圣堂"
    }
  },
  {
    "id": 76,
    "name": {
      "en": "Spider Forest/Spider Cavern",
      "de": "Spinnenwald/Spinnenhöhle",
      "fr": "Forêt aux araignées/Caverne des araignées",
      "es": "Bosque de arañas/Caverna de arañas",
      "zh": "蜘蛛森林/蜘蛛洞窟"
    }
  },
  {
    "id": 77,
    "name": {
      "en": "Great Marsh",
      "de": "Großes Moor",
      "fr": "Grand marais",
      "es": "Gran pantano",
      "zh": "大沼泽"
    }
  },
  {
    "id": 78,
    "name": {
      "en": "Flayer Jungle and Dungeon",
      "de": "Schinder-Dschungel und Verlies",
      "fr": "Jungle des écorcheurs et donjon",
      "es": "Jungla de los desolladores y mazmorra",
      "zh": "剥皮者丛林与地牢"
    }
  },
  {
    "id": 80,
    "name": {
      "en": "Kurast Bazaar/Temples",
      "de": "Basar von Kurast/Tempel",
      "fr": "Bazar de Kurast/Temples",
      "es": "Bazar de Kurast/Templos",
      "zh": "库拉斯特集市/神殿"
    }
  },
  {
    "id": 83,
    "name": {
      "en": "Travincal",
      "de": "Travincal",
      "fr": "Travincal",
      "es": "Travincal",
      "zh": "崔凡克"
    }
  },
  {
    "id": 100,
    "name": {
      "en": "Durance of Hate",
      "de": "Kerker des Hasses",
      "fr": "Oubliettes de la haine",
      "es": "Mazmorra del odio",
      "zh": "憎恨之牢"
    }
  },
  {
    "id": 104,
    "name": {
      "en": "Outer Steppes/Plains of Despair",
      "de": "Äußere Steppen/Ebenen der Verzweiflung",
      "fr": "Steppes externes/Plaines du désespoir",
      "es": "Estepas exteriores/Llanuras de la desesperación",
      "zh": "外缘草原/绝望平原"
    }
  },
  {
    "id": 106,
    "name": {
      "en": "City of the Damned/River of Flame",
      "de": "Stadt der Verdammten/Fluss der Flammen",
      "fr": "Cité des damnés/Rivière de flammes",
      "es": "Ciudad de los condenados/Río de llamas",
      "zh": "诅咒之城/烈焰之河"
    }
  },
  {
    "id": 108,
    "name": {
      "en": "Chaos Sanctuary",
      "de": "Chaos-Heiligtum",
      "fr": "Sanctuaire du Chaos",
      "es": "Santuario del Caos",
      "zh": "混沌庇护所"
    }
  },
  {
    "id": 110,
    "name": {
      "en": "Bloody Foothills/Frigid Highlands/Abbadon",
      "de": "Blutige Vorberge/Frostiges Hochland/Abbadon",
      "fr": "Contreforts sanglants/Hautes terres glaciales/Abbadon",
      "es": "Estribaciones sangrientas/Tierras altas heladas/Abbadon",
      "zh": "血腥丘陵/严寒高地/阿巴顿"
    }
  },
  {
    "id": 112,
    "name": {
      "en": "Arreat Plateau/Pit of Acheron",
      "de": "Arreat-Plateau/Grube von Acheron",
      "fr": "Plateau d’Arreat/Fosse d’Achéron",
      "es": "Meseta de Arreat/Foso de Aqueronte",
      "zh": "亚瑞特高原/冥河深坑"
    }
  },
  {
    "id": 113,
    "name": {
      "en": "Crystalline Passage/Frozen River",
      "de": "Kristallpassage/Gefrorener Fluss",
      "fr": "Passage de cristal/Rivière gelée",
      "es": "Pasaje cristalino/Río helado",
      "zh": "水晶通道/冰封之河"
    }
  },
  {
    "id": 115,
    "name": {
      "en": "Glacial Trail/Drifter Cavern",
      "de": "Gletscherpfad/Wanderhöhle",
      "fr": "Sentier glaciaire/Caverne du vagabond",
      "es": "Sendero glacial/Caverna del errante",
      "zh": "冰川小径/漂流洞窟"
    }
  },
  {
    "id": 118,
    "name": {
      "en": "Ancient's Way/Icy Cellar",
      "de": "Pfad der Alten/Eisiger Keller",
      "fr": "Voie des anciens/Cave glacée",
      "es": "Senda de los ancianos/Sótano helado",
      "zh": "远古之路/寒冰地窖"
    }
  },
  {
    "id": 121,
    "name": {
      "en": "Nihlathak's Temple and Halls",
      "de": "Nihlathaks Tempel und Hallen",
      "fr": "Temple et halls de Nihlathak",
      "es": "Templo y salas de Nihlathak",
      "zh": "尼拉塞克的神殿与大厅"
    }
  },
  {
    "id": 128,
    "name": {
      "en": "Worldstone Keep/Throne of Destruction/Worldstone Chamber",
      "de": "Weltsteinburg/Thron der Zerstörung/Weltsteinkammer",
      "fr": "Donjon de la Pierre du monde/Trône de la destruction/Chambre de la Pierre du monde",
      "es": "Fortaleza de la Piedra del mundo/Trono de la destrucción/Cámara de la Piedra del mundo",
      "zh": "世界之石要塞/毁灭王座/世界之石密室"
    }
  }
];
