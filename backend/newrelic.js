'use strict'
/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the New Relic Node.js agent distribution for a
 * complete description of all of the configuration variables.
 *
 * For documentation of configuration variables, see:
 * https://docs.newrelic.com/docs/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration
 *
 * Default log level is 'info'. Valid log levels include: 'fatal', 'error', 'warn',
 * 'info', 'debug', and 'trace'. Please use log level 'debug' or 'trace' when
 * you want to see verbose logging output.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: [process.env.NEW_RELIC_APP_NAME || 'ride-hailing-api'],
  /**
   * Your New Relic license key. This is required.
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  /**
   * Logging config
   */
  logging: {
    /**
     * Level at which to log. 'debug' is very chatty; following the default 'info'
     * level is recommended.
     */
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
    filepath: process.env.NEW_RELIC_LOG || 'stdout',
  },
  /**
   * When true, all request headers except those listed in attributes.exclude
   * will be captured for all traces.
   */
  allow_all_headers: true,
  attributes: {
    /**
     * Prefix of attributes to exclude from all destinations. Allows * as wildcard
     * at the end.
     */
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.setCookie*',
    ],
  },
  /**
   * Distributed tracing
   */
  distributed_tracing: {
    enabled: true,
  },
  /**
   * Transaction tracer configuration
   */
  transaction_tracer: {
    /**
     * Capture attributes from the first argument of pool.query callbacks.
     * Only the query string is captured by default.
     * Enable this to capture query parameters.
     */
    capture_attributes: true,
    enabled: true,
    /**
     * Limit on number of samples stored at any time.
     */
    max_samples: 500,
  },
  /**
   * Error collector
   */
  error_collector: {
    /**
     * Use this setting to exclude specific errors from being reported.
     */
    enabled: true,
  },
};
