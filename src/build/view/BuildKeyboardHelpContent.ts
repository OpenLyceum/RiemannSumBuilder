import {
  BasicActionsKeyboardHelpSection,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class BuildKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    // The custom curve's points are moved with the arrow keys.
    super(
      [new MoveDraggableItemsKeyboardHelpSection(), new SliderControlsKeyboardHelpSection()],
      [new BasicActionsKeyboardHelpSection()],
    );
  }
}
