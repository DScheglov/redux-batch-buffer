const START_BUFFER = 'RDX-ACTNS-BFFR::START';
const FLUSH_BUFFER = 'RDX-ACTNS-BFFR::FLUSH';
const DESTROY_BUFFER = 'RDX-ACTNS-BFFR::DESTROY';
const PROCESS_BATCH = 'RDX-ACTNS-BFFR::BATCH';

export const startBuffering = { type: START_BUFFER };
export const flushBuffer = { type: FLUSH_BUFFER };
export const destroyBuffer = { type: DESTROY_BUFFER };
export const batch = actions => ({ type: PROCESS_BATCH, actions });


export const enableBatching = reducer => (state, action) => (
  action.type === PROCESS_BATCH
    ? action.actions.reduce(reducer, state)
    : reducer(state, action)
);

const bufferDestroy = bufferContainer => res => (
  (bufferContainer.buffer = null),
  res
);

const bufferFlush = bufferContainer => next => (
  bufferContainer.buffer != null &&
  bufferContainer.buffer.length > 0 &&
  bufferDestroy(bufferContainer)(
    next(batch(bufferContainer.buffer))
  )
);

const createBuffer = bufferContainer => next => (
  bufferFlush(bufferContainer)(next),
  bufferContainer.buffer = []
);

const processAction = bufferContainer => (next, action) => (
  bufferContainer.buffer ? bufferContainer.buffer.push(action) :
  Array.isArray(action) ? next(batch(action)) :
  next(action)
);

const bufferManager = bufferContainer => ({
  create: createBuffer(bufferContainer),
  flush: bufferFlush(bufferContainer),
  destroy: bufferDestroy(bufferContainer),
  process: processAction(bufferContainer),
});

export const actionsBuffer = store => {
  const buffer = bufferManager({});
  return next => action => (
    action.type === START_BUFFER ? buffer.create(next) :
    action.type === FLUSH_BUFFER ? buffer.flush(next) :
    action.type === DESTROY_BUFFER ? buffer.destroy(true) :
    buffer.process(next, action)
  );
}