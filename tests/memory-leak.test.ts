/**
 * Memory-leak regression suite (fleet standard).
 *
 * List every model/view object that links Properties, adds listeners, or owns child
 * nodes, with a factory that builds a fresh instance. The shared harness in
 * tests/helpers/memoryLeak.ts (template-owned) checks that each one is garbage
 * collected after dispose() and leaves no survivors across repeated cycles
 * (idempotentDispose: true also checks a second dispose()). Add sim-specific leak
 * tests below using forceGC().
 */

import { BuildModel } from "../src/build/model/BuildModel.js";
import { RiemannSumBuilderModel } from "../src/common/model/RiemannSumBuilderModel.js";
import { ConvergenceModel } from "../src/convergence/model/ConvergenceModel.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

describeDisposalLeaks([
  { name: "RiemannSumBuilderModel", create: () => new RiemannSumBuilderModel("build") },
  { name: "BuildModel", create: () => new BuildModel() },
  { name: "ConvergenceModel", create: () => new ConvergenceModel() },
]);
