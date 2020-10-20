import { Machine, interpret } from "xstate";
import "./styles.css";

document.getElementById("app").innerHTML = `
<h1>XState Example</h1>
<div>
  Open the <strong>Console</strong> to view the machine output.
</div>
`;

const createStorage = () => {
  const storage = {};

  return {
    get: (key, valueIfMissing) => {
      return storage[key] || valueIfMissing;
    },
    set: (key, value) => {
      storage[key] = value;
    }
  };
};

const context = {
  storage: createStorage()
};

const actions = {
  entry: (context, event, meta) => {
    const value = context.storage.get("my_key", 0);
    context.storage.set("my_key", value + 1);

    console.log(`entry() - ${JSON.stringify(meta.state.value)}`);
  },
  exit: (context, event, meta) => {
    console.log(`exit() - ${JSON.stringify(meta.state.history.value)}`);
    console.log(`${context.storage.get("my_key")}`);
  }
};

export const deeperSubStates = {
  initial: "substateA221",
  states: {
    substateA221: {
      entry: "entry",
      on: {
        TOGGLE: "substateA222"
      },
      exit: "exit"
    },
    substateA222: {
      entry: "entry",
      on: {
        TOGGLE: "substateA221"
      },
      exit: "exit"
    }
  }
};

export const deepSubStates = {
  initial: "substateA21",
  states: {
    substateA21: {
      entry: "entry",
      on: {
        TOGGLE: "substateA21"
      },
      exit: "exit",
    },
    substateA22: {
      entry: "entry",
      on: {
        TOGGLE: "substateA22"
      },
      exit: "exit",
      ...deeperSubStates
    }
  }
};

export const subStates = {
  initial: "substateA1",
  states: {
    substateA1: {
      entry: "entry",
      on: {
        TOGGLE: "substateA2"
      },
      exit: "exit"
    },
    substateA2: {
      entry: "entry",
      on: {
        TOGGLE: "substateA1"
      },
      exit: "exit",
      ...deepSubStates,
    }
  }
};

const states = {
  id: "machine",
  initial: "inactive",
  states: {
    inactive: {
      entry: "entry",
      on: {
        TOGGLE: "active",
        NEXT: "substateA"
      },
      exit: "exit"
    },
    active: {
      entry: "entry",
      on: {
        TOGGLE: "inactive",
        NEXT: "substateA"
      },
      exit: "exit"
    },
    substateA: {
      entry: "entry",
      on: {
        TOGGLE: "active",
        NEXT: "inactive"
      },
      ...subStates,
      exit: "exit"
    }
  }
};

function defaultMachine() {
  return Machine(
      {
        ...states,
        context
      },
      {
        actions
      }
  );
}

function setupInitialState(states, stateAsString) {
  return {
    ...states,
    initial: stateAsString,
  };
}

function buildStatesWithInitialState(states, subState, initialState) {
  return {
    ...states,
    [subState]: {
      ...states[subState],
      initial: initialState,
    }
  }
}

function buildStateWithInitialStatesRecursively(states, subState, deeperStates) {
  if(deeperStates && deeperStates.length > 1) {
    const initialState = deeperStates[0];

    return {
      ...states,
      [subState]: {
        ...states[subState],
        initial: initialState,
        states: buildStateWithInitialStatesRecursively(states[subState].states, initialState, deeperStates.slice(1, deeperStates.length)),
      }
    }
  } else {
    const initialState = deeperStates[0];
    return buildStatesWithInitialState(states, subState, initialState);
  }
}

function buildStatesWithDeepInitialState(splitStates) {
  const parentState = splitStates[0];
  const rootStates = buildStateWithInitialStatesRecursively(states.states, parentState, splitStates.slice(1, splitStates.length));

  return {
    ...states,
    initial: parentState,
    states: rootStates,
  };
}

function createStateConfigFromState(stateAsString) {
  const splitStates = stateAsString.split('.');

  if (splitStates.length > 1) {
    return buildStatesWithDeepInitialState(splitStates);
  }

  return setupInitialState(states, stateAsString);
}

function machineStartingFromState(stateAsString) {
  if(stateAsString) {
    const createdStates = createStateConfigFromState(stateAsString);

    const config = {
      ...createdStates,
      context
    };

    return Machine(
        config,
        {
          actions
        }
    );
  }

  return defaultMachine();
}

const service = interpret(machineStartingFromState('substateA.substateA2.substateA22.substateA222')).onTransition(
    (state, event) => {
  console.log(`onTransition() - ${JSON.stringify(event)} -> ${JSON.stringify(state.value)}`);
});

console.log('=== START ===');
service.start();

console.log('=== NEXT ===');
service.send("NEXT");

console.log('=== TOGGLE ===');
service.send("TOGGLE");

console.log('=== NEXT ===');
service.send("NEXT");

console.log('=== END ===');
