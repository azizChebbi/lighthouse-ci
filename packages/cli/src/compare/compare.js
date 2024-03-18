const {loadSavedLHRs} = require('@lhci/utils/src/saved-reports');
const {getUrlForLhciTarget} = require('../upload/upload');
const ApiClient = require('@lhci/utils/src/api-client');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    urlReplacementPatterns: {
      type: 'array',
      description:
        '[lhci only] sed-like replacement patterns to mask non-deterministic URL substrings.',
      default: [
        's#:[0-9]{3,5}/#:PORT/#', // replace ports
        's/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/UUID/ig', // replace UUIDs
      ],
    },
    serverBaseUrl: {
      description: '[lhci only] The base URL of the LHCI server where results will be saved.',
      default: 'http://localhost:9001/',
    },
    token: {
      type: 'string',
      description: '[lhci only] The Lighthouse CI server token for the project.',
    },
    'basicAuth.username': {
      type: 'string',
      description:
        '[lhci only] The username to use on a server protected with HTTP Basic Authentication.',
    },
    'basicAuth.password': {
      type: 'string',
      description:
        '[lhci only] The password to use on a server protected with HTTP Basic Authentication.',
    },
  });
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  // get the runs from lighthouseci folder
  const api = new ApiClient({fetch, ...options, rootURL: options.serverBaseUrl});
  api.setBuildToken(options.token);
  const project = await api.findProjectByToken(options.token);
  if (!project) {
    throw new Error('Could not find active project with provided token');
  }
  process.stdout.write(`Project: ${JSON.stringify(project)} \n`);

  const lhrs = loadSavedLHRs();
  for (const lhr of lhrs) {
    const parsedLHR = JSON.parse(lhr);
    const url = getUrlForLhciTarget(parsedLHR.finalDisplayedUrl, options);
    const run = {
      url,
      lhr: parsedLHR,
    };
    // display the run:
    process.stdout.write(`Run: ${run.url} \n`);
  }

  // get the runs from the server
  // compare the runs
  process.stdout.write('Compare command working!\n');
}

module.exports = {buildCommand, runCommand};
