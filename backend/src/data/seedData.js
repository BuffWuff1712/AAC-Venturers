export const scenarioSeed = {
  id: 1,
  key: "western-stall-school-canteen",
  name: "Western Stall at school canteen",
  description:
    "Child practises ordering from a western food stall owner during school recess.",
  objective:
    "Order at least one menu item clearly and complete the purchase interaction.",
  memoryEnabled: 1,
  personality: "personable_familiar",
};

export const menuSeed = [
  {
    id: 1,
    name: "Chicken Chop",
    price: 5.5,
    description: "Crispy chicken cutlet with fries and coleslaw.",
    customizations: ["no coleslaw", "chilli on the side", "extra fries"],
  },
  {
    id: 2,
    name: "Fish and Chips",
    price: 5.8,
    description: "Breaded fish fillet with fries and tartar sauce.",
    customizations: ["no coleslaw", "chilli on the side", "extra fries"],
  },
  {
    id: 3,
    name: "Spaghetti",
    price: 4.8,
    description: "Tomato spaghetti with chicken sausage slices.",
    customizations: ["no coleslaw", "chilli on the side", "extra fries"],
  },
];

export const childMemorySeed = {
  childName: "Ari",
  favouriteOrder: "Chicken Chop, no coleslaw, chilli on the side",
};

export const caregiverSeed = {
  email: "caregiver@aac-venturers.demo",
  password: "demo123",
  name: "Caregiver Demo",
};
