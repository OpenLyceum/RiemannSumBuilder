import { RiemannSumBuilderView } from "../../common/RiemannSumBuilderView.js";
import type { BuildModel } from "../model/BuildModel.js";

export class BuildScreenView extends RiemannSumBuilderView {
  public constructor(model: BuildModel) {
    super(model);
  }
}
