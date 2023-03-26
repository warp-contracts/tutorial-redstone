import brain from "brain.js";
import * as redstone from "redstone-protocol";

export class RedStonePlugin  {
  process(input) {
    input.redstone = redstone;
  }

  type() {
    return 'smartweave-extension-redstone';
  }
}

export class BrainJsPlugin {
  constructor() {
  }

  process(input) {
    input.LSTMTimeStep = brain.recurrent.LSTMTimeStep;
  }

  type() {
    return 'smartweave-extension-brain';
  }
}