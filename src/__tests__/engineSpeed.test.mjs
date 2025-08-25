import { BMV2 } from "../coreLogic/engines/BMV2/BondMonkeyV2.mjs";
import { BMV3 } from "../coreLogic/engines/BMV3/BondMonkeyV3.mjs";
import { BMV4 } from "../coreLogic/engines/BMV4/BondMonkeyV4.mjs";
import { BMV5 } from "../coreLogic/engines/BMV5/BondMonkeyV5.mjs";
import { BMV6 } from "../coreLogic/engines/BMV6/BondMonkeyV6.mjs";
import { BMV7 } from "../coreLogic/engines/BMV7/BondMonkeyV7.mjs";
import { BMV1 } from "../coreLogic/engines/BondMonkeyV1.mjs";
import { getFENData } from "../coreLogic/helpers/FENandUCIHelpers.mjs";
import { initializePieceAtArray } from "../coreLogic/pieceGetters.mjs";
import { initializePieceIndicies } from "../coreLogic/pieceIndicies.mjs";
import { computeAllAttackMasks } from "../coreLogic/PieceMasks/individualAttackMasks.mjs";

const EngineTypes = Object.freeze({
  BMV1: "BMV1",
  BMV2: "BMV2",
  BMV3: "BMV3",
  BMV4: "BMV4",
  BMV5: "BMV5",
  BMV6: "BMV6",
  BMV7: "BMV7",
});

const engineRegistry = {
  [EngineTypes.BMV1]: BMV1,
  [EngineTypes.BMV2]: BMV2,
  [EngineTypes.BMV3]: BMV3,
  [EngineTypes.BMV4]: BMV4,
  [EngineTypes.BMV5]: BMV5,
  [EngineTypes.BMV6]: BMV6,
  [EngineTypes.BMV7]: BMV7,
};

const runEngineSpeedTest = (fen, depth, engine) => {
  const fenData = getFENData(fen);
  const bitboards = fenData.bitboards;
  const player = fenData.player;
  const castling = fenData.castling;
  const ep = fenData.ep;

  computeAllAttackMasks(bitboards);
  initializePieceAtArray(bitboards);
  initializePieceIndicies(bitboards);

  const engineFn = engineRegistry[engine];

  const start = performance.now();

  const result = engineFn(
    bitboards,
    player,
    castling,
    ep,
    new Map(),
    depth,
    Infinity
  );

  const end = performance.now();

  const nodes = result.searchStats.nodes;

  return {
    time: end - start,
    nodeCount: nodes,
  };
};

const runSpeedSuite = (depth, engine) => {
  const fens = [
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Start pos
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", // Kiwipete
    "8/3k4/3ppn2/1p4p1/3P4/2N1PP2/1P2K3/8 w - - 0 1", // end game
  ];

  const times = [];
  for (const fen of fens) {
    const testResult = runEngineSpeedTest(fen, depth, engine);
    const time = testResult.time;
    const nodes = testResult.nodeCount;

    times.push(time);
    console.log(`Fen: ${fen}, Time: ${time.toFixed(2)}ms, Nodes: ${nodes}`);
  }

  return times;
};

describe("engine speed test", () => {
  it("should run speed test", () => {
    console.log("BMV3 Results: ");
    runSpeedSuite(5, EngineTypes.BMV3);

    expect(4).toBe(4); // So jest doesnt throw an error
  });
});

  //   Fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1, Time: 494.92ms, Nodes: 37085

  //     at runSpeedSuite (src/__tests__/engineSpeed.test.mjs:82:33)

  // console.log
  //   Fen: r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1, Time: 1510.58ms, Nodes: 111979

  //     at runSpeedSuite (src/__tests__/engineSpeed.test.mjs:82:33)

  // console.log
  //   Fen: 8/3k4/3ppn2/1p4p1/3P4/2N1PP2/1P2K3/8 w - - 0 1, Time: 50.75ms, Nodes: 7119

  //     BMV3 Results: HISTORY ONLY

  //     at Object.<anonymous> (src/__tests__/engineSpeed.test.mjs:90:33)

  // console.log
  //   Fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1, Time: 285.02ms, Nodes: 12612

  //     at runSpeedSuite (src/__tests__/engineSpeed.test.mjs:82:33)

  // console.log
  //   Fen: r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1, Time: 910.79ms, Nodes: 57225

  //     at runSpeedSuite (src/__tests__/engineSpeed.test.mjs:82:33)

  // console.log
  //   Fen: 8/3k4/3ppn2/1p4p1/3P4/2N1PP2/1P2K3/8 w - - 0 1, Time: 43.19ms, Nodes: 4379

  //     BMV3 Results: KILLER ONLY

  //     at Object.<anonymous> (src/__tests__/engineSpeed.test.mjs:90:33)

  // console.log
  //   Fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1, Time: 272.44ms, Nodes: 13312

  //     at runSpeedSuite (src/__tests__/engineSpeed.test.mjs:82:33)

  // console.log
  //   Fen: r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1, Time: 880.50ms, Nodes: 57241

  //     at runSpeedSuite (src/__tests__/engineSpeed.test.mjs:82:33)

  // console.log
  //   Fen: 8/3k4/3ppn2/1p4p1/3P4/2N1PP2/1P2K3/8 w - - 0 1, Time: 45.60ms, Nodes: 6040

  //     BMV3 Results: BOTH HISTORY AND KILLER MOVES

  //     at Object.<anonymous> (src/__tests__/engineSpeed.test.mjs:90:33)

  // console.log
  //   Fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1, Time: 260.79ms, Nodes: 13187

  //     at runSpeedSuite (src/__tests__/engineSpeed.test.mjs:82:33)

  // console.log
  //   Fen: r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1, Time: 918.78ms, Nodes: 57166

  //     at runSpeedSuite (src/__tests__/engineSpeed.test.mjs:82:33)

  // console.log
  //   Fen: 8/3k4/3ppn2/1p4p1/3P4/2N1PP2/1P2K3/8 w - - 0 1, Time: 45.95ms, Nodes: 5422