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
    config = {};

    var keys = _.keys(data.tiapp.properties).filter(function(e) { return e.match("^installr\.");});

    keys.forEach(function(k) {
        config[k.replace(/^installr\./,'')] = data.tiapp.properties[k].value;
    });

    config.releaseNotes = data.cli.argv['installr-release-notes'];

    if (!config.api_token) {
        logger.error("installr.api_token is missing.");
        return;
    }

    if (!config.releaseNotes || !config.notify) {
        doPrompt(finished);
    } else {
        finished();
    }
}

function doPrompt(finished) {
    var f = {};

    if (config.releaseNotes === undefined) {
        f.releaseNotes = fields.text({
            title: "Release Notes",
            desc: "Enter release notes.",
            validate: function (value, callback) {
                callback(!value.length, value);
            }
        })
    }
    if (config.notify === undefined) {
        f.notify = fields.select({
            title: "Notify",
            desc: "Notify testers on upload.",
            promptLabel:"(y,n)",
            options: ['__y__es','__n__o']
        });
    }

    var prompt = fields.set(f);

    prompt.prompt(function (err, result) {
        _.each(_.keys(result), function(key){
            config[key] = result[key];
        });
        finished();
    });
}
function upload2Installr(data, finished) {
    validate(data);

    logger.info('Uploading app to installr');

    var r = request.post({
        url: 'https://www.installrapp.com/apps.json',
        headers: {'X-InstallrAppToken': config.api_token}
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            logger.error(err);
            finished();
        } else {
            logger.info("App uploaded successfully.");
            // check if we want to invite testers
            if (config.default_testers) {
                logger.info('Adding tester(s) '+config.default_testers+' to latest build');
                var resp = JSON.parse(body);
                var r = request.post({
                    url: 'https://www.installrapp.com/apps/'+resp.appData.id+'/builds/'+resp.appData.latestBuild.id+'/team.json',
                    headers: {'X-InstallrAppToken': config.api_token}
                }, function optionalCallback(err, httpResponse, body) {
                    if (err) {
                        logger.error(err);
                    } else {
                        logger.info("Tester(s) invited successfully.");

                    }
                    finished();
                }); 
                var form = r.form();
                form.append('emails', config.default_testers);             
            } else {
                finished();
            }            
        }
    });

    var build_file = afs.resolvePath(path.join(data.buildManifest.outputDir, data.buildManifest.name + "." + (data.cli.argv.platform === "android" ? "apk" : "ipa")));

    var form = r.form();
    form.append('qqfile', fs.createReadStream(build_file));
    form.append('releaseNotes', config.releaseNotes);
    form.append('notify', config.notify.toString());
}

function validate(data) {
    platform = data.cli.argv.platform;

    if (data.buildManifest.outputDir === undefined && data.iosBuildDir === undefined) {
        logger.error("Output directory must be defined to use --installr flag");
        return;
    }
    if (['android', 'ios'].indexOf(platform) === -1) {
        logger.error("Only android and ios support with --installr flag");
        return;
    }
}
