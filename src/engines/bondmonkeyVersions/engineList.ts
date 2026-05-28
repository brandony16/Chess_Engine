import type { Bondmonkey } from "./type.ts";
import { BondmonkeyV1 } from "./v1.ts";
import { BondmonkeyV10 } from "./v10.ts";
import { BondmonkeyV11 } from "./v11.ts";
import { BondmonkeyV11_2 } from "./v11_2.ts";
import { BondmonkeyV12 } from "./v12.ts";
import { BondmonkeyV13 } from "./v13.ts";
import { BondmonkeyV14 } from "./v14.ts";
import { BondmonkeyV15 } from "./v15.ts";
import { BondmonkeyV16 } from "./v16.ts";
import { BondmonkeyV2 } from "./v2.ts";
import { BondmonkeyV3 } from "./v3.ts";
import { BondmonkeyV4 } from "./v4.ts";
import { BondmonkeyV5 } from "./v5.ts";
import { BondmonkeyV6 } from "./v6.ts";
import { BondmonkeyV7 } from "./v7.ts";
import { BondmonkeyV8 } from "./v8.ts";
import { BondmonkeyV9 } from "./v9.ts";

export const engineNames = [
  BondmonkeyV16.name,
  BondmonkeyV15.name,
  BondmonkeyV14.name,
  BondmonkeyV13.name,
  BondmonkeyV12.name,
  BondmonkeyV11_2.name,
  BondmonkeyV11.name,
  BondmonkeyV10.name,
  BondmonkeyV9.name,
  BondmonkeyV8.name,
  BondmonkeyV7.name,
  BondmonkeyV6.name,
  BondmonkeyV5.name,
  BondmonkeyV4.name,
  BondmonkeyV3.name,
  BondmonkeyV2.name,
  BondmonkeyV1.name,
] as const;

export type EngineName = (typeof engineNames)[number];

export function isEngineName(value: string): value is EngineName {
  return engineNames.includes(value as EngineName);
}

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
    case BondmonkeyV8.name:
      return new BondmonkeyV8(depth);
    case BondmonkeyV9.name:
      return new BondmonkeyV9(depth);
    case BondmonkeyV10.name:
      return new BondmonkeyV10(depth);
    case BondmonkeyV11.name:
      return new BondmonkeyV11(depth);
    case BondmonkeyV11_2.name:
      return new BondmonkeyV11_2(depth);
    case BondmonkeyV12.name:
      return new BondmonkeyV12(depth);
    case BondmonkeyV13.name:
      return new BondmonkeyV13(depth);
    case BondmonkeyV14.name:
      return new BondmonkeyV14(depth);
    case BondmonkeyV15.name:
      return new BondmonkeyV15(depth);
    case BondmonkeyV16.name:
      return new BondmonkeyV16(depth);
    default:
      throw new Error(`Invalid Engine Name: ${name}`);
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
    case BondmonkeyV8.name:
      return BondmonkeyV8.description;
    case BondmonkeyV9.name:
      return BondmonkeyV9.description;
    case BondmonkeyV10.name:
      return BondmonkeyV10.description;
    case BondmonkeyV11.name:
      return BondmonkeyV11.description;
    case BondmonkeyV11_2.name:
      return BondmonkeyV11_2.description;
    case BondmonkeyV12.name:
      return BondmonkeyV12.description;
    case BondmonkeyV13.name:
      return BondmonkeyV13.description;
    case BondmonkeyV14.name:
      return BondmonkeyV14.description;
    case BondmonkeyV15.name:
      return BondmonkeyV15.description;
    case BondmonkeyV16.name:
      return BondmonkeyV16.description;
    default:
      throw new Error("Invalid Engine Name");
  }
};
