/**
 * Wrapper function that takes a route handler and returns a new route handler that catches asynchronous errors.
 */
function wrapCallback(fn) {
  return function (req, res, next) {
    // Call the original route handler
    let result = fn(req, res, next);
    if (result && result.catch) {
      // If the result is a promise, catch any errors
      result.catch((error) => {
        console.error(error);
        next(error.message);
      });
    }
    return result
  };
}

/**
 * Wraps route handlers for an HTTP method with a function that handles asynchronous errors.
 * @param {Express} app The Express app
 * @param {string} method The HTTP method to wrap
 */
function wrapMethod(app, method) {
  // Save the original method
  app[`old${method}`] = app[method];
  // Replace the method with a new one with error handling
  app[method] = (route, ...callbacks) => {
    app[`old${method}`](route, ...callbacks.map((cb) => {
      if (typeof cb === 'function') {
        // If the callback is a function, wrap it
        return wrapCallback(cb);
      } else if (Array.isArray(cb)) {
        // If the callback is an array, wrap each function in the array
        return cb.map((cb) => {
          if (typeof cb === 'function') {
            return wrapCallback(cb);
          }
          return cb;
        });
      }
    }));
  };
}

/**
 * Wraps all route handlers for the methods get, post, put, and delete with a function that handles asynchronous errors.
 * This function must be called before any routes are defined.
 * @param {Express} app The Express app
 */
function addErrorHandling(app) {
  wrapMethod(app, 'get');
  wrapMethod(app, 'post');
  wrapMethod(app, 'put');
  wrapMethod(app, 'delete');
}

export default addErrorHandling;
