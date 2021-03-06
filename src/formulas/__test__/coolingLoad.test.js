import { createStore } from 'redux';
import rootReducer from '../../reducers/root.js';
import initState from '../../initialState';
import enrichData from '../enrichData.js';
import { getTempEntradaSerpentin, getcoolingLoad } from '../coolingLoad.js';

const store = createStore(rootReducer, initState);

enrichData(store.dispatch);

test('Check getTempEntradaSerpentin', () => {
  const netSensibleCFM = 10680;
  const CFMventilacion = 420;
  const exterior = { bulbo_seco: 90 };
  const room = { bulbo_seco: 78 };

  expect(getTempEntradaSerpentin(netSensibleCFM, CFMventilacion, exterior, room)).toBeCloseTo(
    78.47
  );
});

test('Calculate the final getcoolingLoad', () => {
  const result = getcoolingLoad(store.getState());
  const expectedRasult = {
    QS_QL: 4957.659721751376,
    coolingLoad: 4685.0470557462295,
    netSensibleCFM: 155.3203207157377
  };
  expect(expectedRasult).toMatchObject(result);
});
