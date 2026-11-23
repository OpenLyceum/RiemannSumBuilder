import { RiemannSumBuilderView } from "../../common/RiemannSumBuilderView.js";
import type { ConvergenceModel } from "../model/ConvergenceModel.js";

export class ConvergenceScreenView extends RiemannSumBuilderView {
  public constructor(model: ConvergenceModel) {
    super(model);
  }
}
