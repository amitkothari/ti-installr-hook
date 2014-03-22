var _ = require("underscore"),
    fs = require("fs"),
    afs = require("node-appc").fs,
    path = require("path"),
    request = require('request'),
    fields = require("fields");

exports.cliVersion = '>=3.2';

var logger, platform, config;

exports.init = function (_logger, config, cli, appc) {
    if (process.argv.indexOf('--installr') !== -1) {
        cli.addHook('build.pre.compile', configure);
        cli.addHook('build.finalize', upload2Installr);
    }
    logger = _logger;
};

function configure(data, finished) {
    platform = data.cli.argv.platform;

    if (data.buildManifest.outputDir === undefined && data.iosBuildDir === undefined) {
        logger.error("Output directory must be defined to use --installr flag");
        return;
    }
    if (['android', 'ios'].indexOf(platform) === -1) {
        logger.error("Only android and ios support with --installr flag");
        return;
    }

    config = {};
    config.releaseNotes = data.cli.argv['installr-release-notes'];
    config.apiToken = data.tiapp.properties['installr.api_token'];

    if (!config.apiToken) {
        logger.error("installr.apiToken is missing.");
        return;
    }

    if (!config.releaseNotes) {
        doPrompt(finished);
    } else {
        finished();
    }
}

function doPrompt(finished) {
    var f = {
        notes: fields.text({
            title: "Release Notes",
            desc: "Enter release notes. Required.",
            validate: function (value, callback) {
                callback(!value.length, value);
            }
        })
    };

    var prompt = fields.set(f);

    prompt.prompt(function (err, result) {
        config.releaseNotes = result.notes;
        finished();
    });
}
function upload2Installr(data, finished) {
    logger.info('Uploading app to installr');

    var r = request.post({
        url: 'https://www.installrapp.com/apps.json',
        headers: {'X-InstallrAppToken': config.apiToken.value}
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            logger.error(err);
        } else {
            logger.info("App uploaded successfully.")
        }
        finished();
    });

    var build_file = afs.resolvePath(path.join(data.buildManifest.outputDir, data.buildManifest.name + "." + (data.cli.argv.platform === "android" ? "apk" : "ipa")));

    var form = r.form();
    form.append('qqfile', fs.createReadStream(build_file));
    form.append('releaseNotes', config.releaseNotes);
}
