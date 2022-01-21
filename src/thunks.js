import { actions } from "./redux-store";

const API_BASE = "http://localhost:27606";

function fetchWithRetry(url, dispatch, retries = 4) {
  return fetch(url)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else if (response.status >= 500 && retries > 0) {
        setTimeout(() => {
          return fetchWithRetry(url, dispatch, retries--);
        }, 10000);
      } else {
        dispatch({
          type: actions.FETCH_USERS_ERROR,
        });
      }
    })
    .then(
      (data) => {
        return dispatch({
          type: actions.FETCH_USERS_SUCCESS,
          payload: data,
        });
      },
      (err) => {
        dispatch({
          type: actions.FETCH_USERS_ERROR,
        });
        if (retries > 0) {
          setTimeout(() => {
            return fetchWithRetry(url, dispatch, retries--);
          }, 10000);
        } else {
          throw err;
        }
      }
    );
}

const fetchUserIds = () => (dispatch) => {
  return fetchWithRetry(`${API_BASE}/user_ids`, dispatch, 4);
};

const fetchAddresses = (userId) => (dispatch) => {
  return fetch(`${API_BASE}/users/${userId}/addresses`)
    .then(
      (response) => {
        if (!response.ok) {
          return dispatch({
            type: actions.FETCH_ADDRESS_ERROR,
          });
        }

        return response.json();
      },
      (err) => {
        throw err;
      }
    )
    .then(
      (data) => {
        return dispatch({
          type: actions.FETCH_ADDRESS_SUCCESS,
          payload: data,
        });
      },
      (err) => {
        return dispatch({
          type: actions.FETCH_ADDRESS_ERROR,
        });
      }
    );
};

const fetchEvents = (addressId) => (dispatch) => {
  return fetch(`${API_BASE}/addresses/${addressId}/events`)
    .then(
      (response) => {
        if (!response.ok) {
          return dispatch({
            type: actions.FETCH_EVENTS_ERROR,
          });
        }

        return response.json();
      },
      (err) => {
        throw err;
      }
    )
    .then(
      (data) => {
        return dispatch({
          type: actions.FETCH_EVENTS_SUCCESS,
          payload: data,
        });
      },
      (err) => {
        return dispatch({
          type: actions.FETCH_EVENTS_ERROR,
        });
      }
    );
};

const fetchSelectedEventDetails = () => (dispatch, getState) => {
  const { selectedEvents, events } = getState();
  return Promise.all(
    events
      .filter((event) => {
        return !!selectedEvents[event.created_at + "-" + event.id];
      })
      .map((event) => {
        return fetch(API_BASE + event.url).then(
          (response) => {
            if (!response.ok) {
              throw new Error("Failed request");
            }
            return response.json();
          },
          (err) => {
            throw err;
          }
        );
      })
  )
    .then((values) => {
      return dispatch({
        type: actions.EVENT_DETAILS_SUCCESS,
        payload: values,
      });
    })
    .catch((err) => {
      return dispatch({
        type: actions.EVENT_DETAILS_ERROR,
        payload: err,
      });
    });
};

export { fetchUserIds, fetchAddresses, fetchEvents, fetchSelectedEventDetails };
