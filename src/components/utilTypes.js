export const ModalTypes = Object.freeze({
  HISTORY: "history",
  BATTLE: "battle",
  NEW: "new",
  NONE: null,
});

export const EngineTypes = Object.freeze({
  BMV1: "BMV1",
  BMV2: "BMV2",
  BMV3: "BMV3",
  BMV4: "BMV4",
  BMV5: "BMV5",
});

export const engineStrings = [
  "BondMonkeyV1",
  "BondMonkeyV2",
  "BondMonkeyV3",
  "BondMonkeyV4",
  "BondMonkeyV5",
];

export const nameToType = {
  BondMonkeyV1: EngineTypes.BMV1,
  BondMonkeyV2: EngineTypes.BMV2,
  BondMonkeyV3: EngineTypes.BMV3,
  BondMonkeyV4: EngineTypes.BMV4,
  BondMonkeyV5: EngineTypes.BMV5,
};

export const BattleModalStates = {
  SETTING: "setting",
  LOADING: "loading",
  FINISHED: "finished",
}