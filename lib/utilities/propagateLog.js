const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const events = require('events');
const path = require('path');
const { config } = require('../Config');
const logger = require('./logger');

var op_ack = {};
var op_sent = {};
var op_emitters = {};
var sequenceIDs = {};

const emitLogOps = {};
emitLogOps.emit = function(update, arg1, arg2, cb) {
  timestamp = Date.now()
    var record = {
        type: 'StreamRecordType',
        payload: {
            object_id: update.objectKey,
            bucket: update.bucketName,
        },
        timestamp: timestamp
    };
    if (update.new_state) {
        record.payload.new_state = update.new_state
        record.payload.new_state.lastModified = timestamp
    }
    if (update.old_state) {
        record.payload.old_state = update.old_state
    }
    if (isEmpty(op_emitters)) {
        return cb(arg1, arg2);
    } else {
        for (var id in op_emitters) {
            record.sequence_id = sequenceIDs[id];
            sequenceIDs[id]++;
            op_emitters[id].emit('new_op', record, arg1, arg2, cb);
        }
        return continueExec(record.timestamp, arg1, arg2, cb)
    }
}

function continueExec(timestamp, arg1, arg2, cb) {
    if (op_sent.hasOwnProperty(timestamp) && op_sent[timestamp] < Object.keys(op_emitters).length) {
        setTimeout(function () {
            continueExec(timestamp, arg1, arg2, cb);
        }, 1000);
        return;
    } else {
        delete op_sent[timestamp]
    }
    if (op_ack.hasOwnProperty(timestamp)) {
        setTimeout(function () {
            continueExec(timestamp, arg1, arg2, cb);
        }, 1000);
        return;
    }
    return cb(arg1, arg2);
}

function new_op(sync, op, arg1, arg2, cb) {
  if (op_sent.hasOwnProperty(op.timestamp)) {
    op_sent[op.timestamp]++
  } else {
    op_sent[op.timestamp] = 1
  }
  if (sync) {
    if (op_ack.hasOwnProperty(op.timestamp)) {
      op_ack[op.timestamp]++
    } else {
      op_ack[op.timestamp] = 1
    }
  }
  return
}

function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

function subscribeNotifications(call) {
  var sync = false
  var requestID = 0
  call.on('data', function (data) {
    if (data.val == 'request') {
      sync = data.request.sync
      requestID = data.request.timestamp
      op_emitter = new events.EventEmitter();
      op_emitters[requestID] = op_emitter
      sequenceIDs[requestID] = 0
      op_emitters[requestID].on('new_op', function (op, arg1, arg2, cb) {
        call.write(op);
        new_op(sync, op, arg1, arg2, cb);
      });
    } else {
      if (sync) {
        op_ack[data.ack.timestamp]--
        if (op_ack[data.ack.timestamp] == 0) {
          delete op_ack[data.ack.timestamp];
        }
      }
    }
  });
  call.on('end', function () {
    logger.info('subscribeNotifications: end');
    op_emitters[requestID].removeAllListeners()
    delete op_emitters[requestID]
    delete sequenceIDs[requestID]
    if (isEmpty(op_emitters)) {
      op_ack = {}
    }
    call.end();
  });
  call.on('error', (err) => {
    logger.info('subscribeNotifications: error:', err);
    call.end();
  });
  call.on('cancelled', () => {
    logger.info('subscribeNotifications: cancelled');
    call.end();
  });
}

const packageDefinition = protoLoader.loadSync(path.join(__dirname, './protos/updateNofications.proto'),
{
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const proto = grpc.loadPackageDefinition(packageDefinition);
const server = new grpc.Server();
server.addService(proto.notificationpubsub.NotificationService.service, {
    subscribeNotifications: subscribeNotifications
});
server.bind(config.logPropd.host+':'+config.logPropd.port.toString(), grpc.ServerCredentials.createInsecure());
server.start();

module.exports = emitLogOps;
