import { combineReducers, configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { all, call, fork, put, takeEvery } from 'redux-saga/effects'
import createSagaMiddleware from 'redux-saga'
import { logger } from 'redux-logger'
const actions = {
  GET_ALL_LINES: 'GET_ALL_LINES',
  GET_ALL_LINES_SUCCESS: 'GET_ALL_LINES_SUCCESS'
}
const initialState = {
  lines: []
}

const lineReducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.GET_ALL_LINES:
      return { ...state, fetching: true }
    case actions.GET_ALL_LINES_SUCCESS:
      return { lines: [...action.lines], fetching: false }
  }
  return state
}
const sageMiddleware = createSagaMiddleware()
const rootReducer = combineReducers({
  lineReducer
})

const store = configureStore({
  reducer: rootReducer,
  middleware: [logger, sageMiddleware]
})

sageMiddleware.run(rootSaga)
const App = () => {
  return (
    <Provider store={store}>
      <Lines />
    </Provider>
  )
}

function Lines () {
  const dispatch = useDispatch()
  const lines = useSelector(state => state.lineReducer.lines)
  const fetching = useSelector(state => state.lineReducer.fetching)
  return (
    <>
      <h1>Get Line Status</h1>
      {/* <pre>Lines : {JSON.stringify(lines, null, 2)}</pre> */}
      {fetching && fetching === true && (
        <p>Getting lines information from server please wait</p>
      )}
      <button
        onClick={e => {
          console.log('getting lines')
          dispatch({ type: actions.GET_ALL_LINES })
        }}
      >
        Get Lines
      </button>
      <ol>
        {lines.map((line, index) => {
          return (
            <li key={index}>
              {line.name} has {line.lineStatuses[0].statusSeverityDescription}
            </li>
          )
        })}
      </ol>
    </>
  )
}

const el = document.getElementById('app')
const root = createRoot(el)
root.render(<App />)

function * getAllLines (action) {
  console.log({ actionInSaga: action })
  try {
    const lines = yield call(Api().getLines, action)
    yield put({ type: actions.GET_ALL_LINES_SUCCESS, lines })
  } catch (e) {
    console.log({ e })
  }
}

function * watchGetAllLines () {
  yield takeEvery(actions.GET_ALL_LINES, getAllLines)
}

function * rootSaga () {
  yield all([fork(watchGetAllLines)])
}

function Api (payload) {
  return {
    getLines: async () => {
      const response = await fetch(
        'https://api.tfl.gov.uk//Line/Mode/tube/Status'
      )
      const data = await response.json()
      return data
    }
  }
}
