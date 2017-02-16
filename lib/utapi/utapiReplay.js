const UtapiReplay = require('utapi').UtapiReplay;
const _config = require('../Config').default;

// start utapi server
export default function main() {
    const config = {};
    if (_config.utapi) {
        Object.assign(config, _config.utapi);
    }
    const replay = new UtapiReplay(config);
    replay.start();
}
