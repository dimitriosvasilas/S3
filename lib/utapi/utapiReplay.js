const UtapiReplay = require('utapi').UtapiReplay;
const _config = require('../Config').default;

// start utapi server
export default function main() {
    let config;
    if (_config.utapi) {
        config = Object.assign({}, _config.utapi);
    }
    const replay = new UtapiReplay(config);
    replay.start();
}
