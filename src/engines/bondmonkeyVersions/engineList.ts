import type { Bondmonkey } from "./type.ts";
import { BondmonkeyV1 } from "./v1.ts";
import { BondmonkeyV2 } from "./v2.ts";
import { BondmonkeyV3 } from "./v3.ts";
import { BondmonkeyV4 } from "./v4.ts";
import { BondmonkeyV5 } from "./v5.ts";
import { BondmonkeyV6 } from "./v6.ts";
import { BondmonkeyV7 } from "./v7.ts";

export const engineNames: string[] = [
  BondmonkeyV1.name,
  BondmonkeyV2.name,
  BondmonkeyV3.name,
  BondmonkeyV4.name,
  BondmonkeyV5.name,
  BondmonkeyV6.name,
  BondmonkeyV7.name,
] as const;

export const getEngineByName = (
  name: string,
  depth: number = 1,
): Bondmonkey => {
  switch (name) {
    case BondmonkeyV1.name:
      return new BondmonkeyV1();
    case BondmonkeyV2.name:
      return new BondmonkeyV2();
    case BondmonkeyV3.name:
      return new BondmonkeyV3(depth);
    case BondmonkeyV4.name:
      return new BondmonkeyV4(depth);
    case BondmonkeyV5.name:
      return new BondmonkeyV5(depth);
    case BondmonkeyV6.name:
      return new BondmonkeyV6(depth);
    case BondmonkeyV7.name:
      return new BondmonkeyV7(depth);
    default:
      throw new Error("Invalid Engine Name");
  }
};

export const getEngineDescription = (name: string): string => {
  switch (name) {
    case BondmonkeyV1.name:
      return BondmonkeyV1.description;
    case BondmonkeyV2.name:
      return BondmonkeyV2.description;
    case BondmonkeyV3.name:
      return BondmonkeyV3.description;
    case BondmonkeyV4.name:
      return BondmonkeyV4.description;
    case BondmonkeyV5.name:
      return BondmonkeyV5.description;
    case BondmonkeyV6.name:
      return BondmonkeyV6.description;
    case BondmonkeyV7.name:
      return BondmonkeyV7.description;
    default:
      throw new Error("Invalid Engine Name");
  }
};
