export interface IndividualModelResource {
  readonly id: string;
  readonly name: string;
  readonly modelName: string;
}

function makeResource(id: string, name: string, modelName?: string): IndividualModelResource {
  return { id, name, modelName: modelName ?? name };
}

export const BipedResource = Object.freeze({
  ALIEN: makeResource("ALIEN", "Alien"),
  BUNNY: makeResource("BUNNY", "Bunny"),
  CHEF: makeResource("CHEF", "Chef"),
  CHILD: makeResource("CHILD", "Child"),
  DRAGON_BABY: makeResource("DRAGON_BABY", "Dragon Baby", "DragonBaby"),
  ELF: makeResource("ELF", "Elf"),
  FAIRY: makeResource("FAIRY", "Fairy"),
  GHOST: makeResource("GHOST", "Ghost"),
  KNIGHT: makeResource("KNIGHT", "Knight"),
  LION_BIPED: makeResource("LION_BIPED", "Lion Biped", "LionBiped"),
  MADHATTER: makeResource("MADHATTER", "Mad Hatter", "MadHatter"),
  MUMMY: makeResource("MUMMY", "Mummy"),
  OGRE: makeResource("OGRE", "Ogre"),
  PENGUIN: makeResource("PENGUIN", "Penguin"),
  PIRATE: makeResource("PIRATE", "Pirate"),
  PRINCESS: makeResource("PRINCESS", "Princess"),
  QUEEN_OF_HEARTS: makeResource("QUEEN_OF_HEARTS", "Queen of Hearts", "QueenOfHearts"),
  ROBOT: makeResource("ROBOT", "Robot"),
  SKELETON: makeResource("SKELETON", "Skeleton"),
  TROLL: makeResource("TROLL", "Troll"),
  WITCH: makeResource("WITCH", "Witch"),
  WIZARD: makeResource("WIZARD", "Wizard"),
  YETI: makeResource("YETI", "Yeti"),
  ZOMBIE: makeResource("ZOMBIE", "Zombie"),
} as const);

export const FlyerResource = Object.freeze({
  BAT: makeResource("BAT", "Bat"),
  BLUEJAY: makeResource("BLUEJAY", "Bluejay"),
  CHICKEN: makeResource("CHICKEN", "Chicken"),
  CRANE: makeResource("CRANE", "Crane"),
  CROW: makeResource("CROW", "Crow"),
  EAGLE: makeResource("EAGLE", "Eagle"),
  FALCON: makeResource("FALCON", "Falcon"),
  FLAMINGO: makeResource("FLAMINGO", "Flamingo"),
  HAWK: makeResource("HAWK", "Hawk"),
  HUMMINGBIRD: makeResource("HUMMINGBIRD", "Hummingbird"),
  OWL: makeResource("OWL", "Owl"),
  PARROT: makeResource("PARROT", "Parrot"),
  PEACOCK: makeResource("PEACOCK", "Peacock"),
  PELICAN: makeResource("PELICAN", "Pelican"),
  PHOENIX: makeResource("PHOENIX", "Phoenix"),
  PIGEON: makeResource("PIGEON", "Pigeon"),
  PTERODACTYL: makeResource("PTERODACTYL", "Pterodactyl"),
  SEAGULL: makeResource("SEAGULL", "Seagull"),
  SPARROW: makeResource("SPARROW", "Sparrow"),
  TOUCAN: makeResource("TOUCAN", "Toucan"),
  VULTURE: makeResource("VULTURE", "Vulture"),
} as const);

export const QuadrupedResource = Object.freeze({
  BEAR: makeResource("BEAR", "Bear"),
  CAMEL: makeResource("CAMEL", "Camel"),
  CAT: makeResource("CAT", "Cat"),
  CHESHIRE_CAT: makeResource("CHESHIRE_CAT", "Cheshire Cat", "CheshireCat"),
  COW: makeResource("COW", "Cow"),
  DALMATIAN: makeResource("DALMATIAN", "Dalmatian"),
  DEER: makeResource("DEER", "Deer"),
  DINOSAUR: makeResource("DINOSAUR", "Dinosaur"),
  DOG: makeResource("DOG", "Dog"),
  DRAGON: makeResource("DRAGON", "Dragon"),
  ELEPHANT: makeResource("ELEPHANT", "Elephant"),
  FOX: makeResource("FOX", "Fox"),
  GIRAFFE: makeResource("GIRAFFE", "Giraffe"),
  GOAT: makeResource("GOAT", "Goat"),
  GORILLA: makeResource("GORILLA", "Gorilla"),
  HIPPO: makeResource("HIPPO", "Hippo"),
  HORSE: makeResource("HORSE", "Horse"),
  LEOPARD: makeResource("LEOPARD", "Leopard"),
  LION: makeResource("LION", "Lion"),
  MOOSE: makeResource("MOOSE", "Moose"),
  MOUSE: makeResource("MOUSE", "Mouse"),
  PIG: makeResource("PIG", "Pig"),
  POODLE: makeResource("POODLE", "Poodle"),
  RABBIT: makeResource("RABBIT", "Rabbit"),
  RACCOON: makeResource("RACCOON", "Raccoon"),
  RHINO: makeResource("RHINO", "Rhino"),
  SCOTTISH_FOLD: makeResource("SCOTTISH_FOLD", "Scottish Fold", "ScottishFold"),
  SHEEP: makeResource("SHEEP", "Sheep"),
  TIGER: makeResource("TIGER", "Tiger"),
  UNICORN: makeResource("UNICORN", "Unicorn"),
  WOLF: makeResource("WOLF", "Wolf"),
  ZEBRA: makeResource("ZEBRA", "Zebra"),
} as const);

export const SwimmerResource = Object.freeze({
  CLOWNFISH: makeResource("CLOWNFISH", "Clownfish"),
  GOLDFISH: makeResource("GOLDFISH", "Goldfish"),
  PUFFERFISH: makeResource("PUFFERFISH", "Pufferfish"),
  SHARK: makeResource("SHARK", "Shark"),
  SWORDFISH: makeResource("SWORDFISH", "Swordfish"),
  WHALE: makeResource("WHALE", "Whale"),
} as const);

export const FishResource = Object.freeze({
  BASS: makeResource("BASS", "Bass"),
  BLUEGILL: makeResource("BLUEGILL", "Bluegill"),
  CATFISH: makeResource("CATFISH", "Catfish"),
  KOI: makeResource("KOI", "Koi"),
  PIRANHA: makeResource("PIRANHA", "Piranha"),
  SALMON: makeResource("SALMON", "Salmon"),
  TROUT: makeResource("TROUT", "Trout"),
} as const);

export const MarineMammalResource = Object.freeze({
  DOLPHIN: makeResource("DOLPHIN", "Dolphin"),
  MANATEE: makeResource("MANATEE", "Manatee"),
  ORCA: makeResource("ORCA", "Orca"),
  SEALION: makeResource("SEALION", "Sea Lion", "SeaLion"),
  WALRUS: makeResource("WALRUS", "Walrus"),
} as const);

export const SlithererResource = Object.freeze({
  COBRA: makeResource("COBRA", "Cobra"),
  GARDEN_SNAKE: makeResource("GARDEN_SNAKE", "Garden Snake", "GardenSnake"),
  PYTHON: makeResource("PYTHON", "Python"),
  RATTLESNAKE: makeResource("RATTLESNAKE", "Rattlesnake"),
  WORM: makeResource("WORM", "Worm"),
} as const);

export const PropResource = Object.freeze({
  BOULDER: makeResource("BOULDER", "Boulder"),
  BOOKCASE: makeResource("BOOKCASE", "Bookcase"),
  CASTLE_TOWER: makeResource("CASTLE_TOWER", "Castle Tower", "CastleTower"),
  CHAIR: makeResource("CHAIR", "Chair"),
  COUCH: makeResource("COUCH", "Couch"),
  DESK: makeResource("DESK", "Desk"),
  FENCE: makeResource("FENCE", "Fence"),
  FIRE_HYDRANT: makeResource("FIRE_HYDRANT", "Fire Hydrant", "FireHydrant"),
  LAMP: makeResource("LAMP", "Lamp"),
  LOVESEAT: makeResource("LOVESEAT", "Loveseat"),
  MUSHROOM: makeResource("MUSHROOM", "Mushroom"),
  PIANO: makeResource("PIANO", "Piano"),
  SOFA: makeResource("SOFA", "Sofa"),
  TABLE: makeResource("TABLE", "Table"),
  TELEVISION: makeResource("TELEVISION", "Television"),
  TREE: makeResource("TREE", "Tree"),
  WELL: makeResource("WELL", "Well"),
} as const);

export const AutomobileResource = Object.freeze({
  COMPACT_CAR: makeResource("COMPACT_CAR", "Compact Car", "CompactCar"),
  CONVERTIBLE: makeResource("CONVERTIBLE", "Convertible"),
  PICKUP_TRUCK: makeResource("PICKUP_TRUCK", "Pickup Truck", "PickupTruck"),
  POLICE_CAR: makeResource("POLICE_CAR", "Police Car", "PoliceCar"),
  SEDAN: makeResource("SEDAN", "Sedan"),
  SUV: makeResource("SUV", "SUV"),
  TAXI: makeResource("TAXI", "Taxi"),
  VAN: makeResource("VAN", "Van"),
} as const);

export const AircraftResource = Object.freeze({
  BIPLANE: makeResource("BIPLANE", "Biplane"),
  HELICOPTER: makeResource("HELICOPTER", "Helicopter"),
  HOT_AIR_BALLOON: makeResource("HOT_AIR_BALLOON", "Hot Air Balloon", "HotAirBalloon"),
  JET: makeResource("JET", "Jet"),
  PROPELLER_PLANE: makeResource("PROPELLER_PLANE", "Propeller Plane", "PropellerPlane"),
  UFO: makeResource("UFO", "UFO"),
} as const);

export const WatercraftResource = Object.freeze({
  CANOE: makeResource("CANOE", "Canoe"),
  PIRATE_SHIP: makeResource("PIRATE_SHIP", "Pirate Ship", "PirateShip"),
  ROWBOAT: makeResource("ROWBOAT", "Rowboat"),
  SAILBOAT: makeResource("SAILBOAT", "Sailboat"),
  SPEEDBOAT: makeResource("SPEEDBOAT", "Speedboat"),
  SUBMARINE: makeResource("SUBMARINE", "Submarine"),
  YACHT: makeResource("YACHT", "Yacht"),
} as const);

export const TrainResource = Object.freeze({
  CABOOSE: makeResource("CABOOSE", "Caboose"),
  COAL_CAR: makeResource("COAL_CAR", "Coal Car", "CoalCar"),
  FREIGHT_CAR: makeResource("FREIGHT_CAR", "Freight Car", "FreightCar"),
  LOCOMOTIVE: makeResource("LOCOMOTIVE", "Locomotive"),
  PASSENGER_CAR: makeResource("PASSENGER_CAR", "Passenger Car", "PassengerCar"),
  TANK_CAR: makeResource("TANK_CAR", "Tank Car", "TankCar"),
} as const);

/** Aggregate vehicle resource combining all vehicle sub-categories. */
export const VehicleResource = Object.freeze({
  ...AutomobileResource,
  ...AircraftResource,
  ...WatercraftResource,
  ...TrainResource,
} as const);
