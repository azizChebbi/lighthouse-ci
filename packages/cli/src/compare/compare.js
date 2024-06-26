const {loadSavedLHRs} = require('@lhci/utils/src/saved-reports');
const ApiClient = require('@expensya-lh/utils/src/api-client');
const chalk = require('chalk');

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
    onlyCategories: {
      type: 'array',
      description: '[lhci only] Only run Lighthouse for these categories.',
    },
  });
}

/**
 * @param {LH.Result} localLHR
 * @param {LH.Result} compareLHR
 * @return {boolean}
 */
function checkForRegressions(localLHR, compareLHR) {
  let hasRegression = false;
  Object.keys(localLHR.categories).forEach(category => {
    const localScore = Math.floor(localLHR.categories[category].score * 100);
    const compareScore = Math.floor(compareLHR.categories[category].score * 100);
    if (localScore < compareScore) {
      hasRegression = true;
      console.log(
        `${'❌'} regression for ${chalk.bold.underline.blue(
          localLHR.requestedUrl
        )} in category ${chalk.bold.underline(category)} by ${chalk.red(
          compareScore - localScore
        )} (${compareScore} -> ${localScore})`
      );
    }
  });
  return hasRegression;
}

/**
 * @param {LHCI.CompareCommand.Options} options
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

  /**
   * @type {Array<any>}
   */
  const compareRuns = await api.findCompareRuns(project.id);

  let hasRegression = false;
  if (compareRuns) {
    /** @type {Array<LH.Result>} */
    const compareLHRs = compareRuns.map(run => JSON.parse(run.lhr));
    /** @type {Array<LH.Result>} */
    const localLHRs = loadSavedLHRs().map(JSON.parse);

    for (const localLHR of localLHRs) {
      for (const compareLHR of compareLHRs) {
        if (localLHR.requestedUrl === compareLHR.requestedUrl) {
          if (checkForRegressions(localLHR, compareLHR)) {
            hasRegression = true;
          }
        }
      }
    }
  }

  process.stdout.write(
    `${hasRegression ? 'Comparison done.' : 'Comparison done, no regression found.'}\n`
  );
}

module.exports = {buildCommand, runCommand};
