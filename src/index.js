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
      exit: "exit"
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

const machine = Machine(
  {
    ...states,
    context
  },
  {
    actions
  }
);

const service = interpret(machine).onTransition(
    (state, event) => {
  console.log(`onTransition() - ${JSON.stringify(event)} -> ${JSON.stringify(state.value)}`);
});


console.log('=== START ===');
service.start({
  substateA: "substateA2"
});

console.log('=== NEXT ===');
service.send("NEXT");

console.log('=== TOGGLE ===');
service.send("TOGGLE");

console.log('=== NEXT ===');
service.send("NEXT");

console.log('=== END ===');
