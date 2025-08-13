/**
 * Run step 2 checkout on existing browser session
 */

const { step2_checkout } = require('./simple-tablet-bridge.js');

console.log('🚀 Running step 2 checkout on existing session...');

step2_checkout().catch(console.error);