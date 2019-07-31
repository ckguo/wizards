import {createStore, applyMiddleware} from 'redux';
import {persistStore, persistReducer} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import thunk from 'redux-thunk';
import authReducer from './reducers/authReducers';

const persistConfig = {
  key: 'root',
  storage: storage,
  stateReconciler: autoMergeLevel2,
  blacklist: ['errorMessage']
}

const pReducer = persistReducer(persistConfig, authReducer);

export const store = createStore(
  pReducer,
  applyMiddleware(thunk)
);

export const persistor = persistStore(store);
