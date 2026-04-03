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
    description: "Grilled chicken chop served with fries and coleslaw.",
    customizations: [
      "no customisations",
      "no coleslaw",
      "chilli on the side",
      "extra fries",
      "less sauce",
      "extra sauce",
    ],
  },
  {
    id: 2,
    name: "Fish and Chips",
    price: 5.8,
    description: "Breaded fish fillet served with fries and coleslaw.",
    customizations: [
      "no customisations",
      "no coleslaw",
      "chilli on the side",
      "extra fries",
      "less sauce",
      "extra sauce",
    ],
  },
  {
    id: 3,
    name: "Spaghetti",
    price: 4.8,
    description: "Tomato spaghetti with sausage slices.",
    customizations: [
      "no customisations",
      "add cheese",
      "extra cheese",
      "less sauce",
    ],
  },
  {
    id: 4,
    name: "Chicken Cutlet",
    price: 5.2,
    description: "Crispy chicken cutlet served with fries.",
    customizations: [
      "no customisations",
      "no fries",
      "extra fries",
      "chilli on the side",
      "no sauce",
    ],
  },
  {
    id: 5,
    name: "Burger",
    price: 4.9,
    description: "Chicken or beef burger served with fries.",
    customizations: [
      "no customisations",
      "add cheese",
      "extra cheese",
      "no sauce",
      "extra fries",
    ],
  },
  {
    id: 6,
    name: "Fries",
    price: 2.5,
    description: "Crispy french fries.",
    customizations: [
      "no customisations",
      "extra sauce",
      "less sauce",
      "chilli on the side",
    ],
  },
  {
    id: 7,
    name: "Nuggets",
    price: 3.8,
    description: "Chicken nuggets served with dipping sauce.",
    customizations: [
      "no customisations",
      "extra sauce",
      "less sauce",
      "chilli on the side",
    ],
  },
  {
    id: 8,
    name: "Sausage Set",
    price: 4.6,
    description: "Chicken sausage served with fries.",
    customizations: [
      "no customisations",
      "no fries",
      "extra fries",
      "chilli on the side",
    ],
  },
  {
    id: 9,
    name: "Steak",
    price: 7.5,
    description: "Beef steak served with fries and coleslaw.",
    customizations: [
      "no customisations",
      "no coleslaw",
      "extra fries",
      "less sauce",
      "well done",
    ],
  },
  {
    id: 10,
    name: "Mixed Grill",
    price: 8.2,
    description: "Mixed grill platter with chicken, sausage, and fries.",
    customizations: [
      "no customisations",
      "no coleslaw",
      "extra fries",
      "less sauce",
      "chilli on the side",
    ],
  },
  {
    id: 11,
    name: "Mac & Cheese",
    price: 4.7,
    description: "Creamy macaroni and cheese.",
    customizations: [
      "no customisations",
      "add cheese",
      "extra cheese",
      "less sauce",
    ],
  },
  {
    id: 12,
    name: "Baked Rice",
    price: 5.4,
    description: "Chicken baked rice with tomato sauce and cheese.",
    customizations: [
      "no customisations",
      "add cheese",
      "extra cheese",
      "less sauce",
      "well done",
    ],
  },
  {
    id: 13,
    name: "Mashed Potato",
    price: 2.8,
    description: "Creamy mashed potato side.",
    customizations: [
      "no customisations",
      "extra sauce",
      "less sauce",
    ],
  },
  {
    id: 14,
    name: "Coleslaw",
    price: 1.8,
    description: "Fresh coleslaw side.",
    customizations: [
      "no customisations",
      "no sauce",
    ],
  },
  {
    id: 15,
    name: "Water",
    price: 1.0,
    description: "Bottled water.",
    customizations: ["no customisations"],
  },
  {
    id: 16,
    name: "Drink",
    price: 1.5,
    description: "Soft drink choice.",
    customizations: ["no customisations"],
  },
  {
    id: 17,
    name: "Coke",
    price: 1.8,
    description: "Can of Coke.",
    customizations: ["no customisations"],
  },
  {
    id: 18,
    name: "Juice",
    price: 1.6,
    description: "Fruit juice box.",
    customizations: ["no customisations"],
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
