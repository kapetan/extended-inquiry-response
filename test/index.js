var test = require('tape')

var eir = require('../')

var buffer = function () {
  var args = Array.prototype.slice.call(arguments)
  return Buffer.from(args)
}

test('empty object', function (t) {
  var obj = {}
  var encoded = eir.encode(obj)
  var decoded = eir.decode(encoded)

  t.equals(eir.encodingLength(obj), 0)
  t.deepEquals(encoded, buffer())
  t.deepEquals(decoded, obj)
  t.end()
})

test('object with flags', function (t) {
  var obj = {
    flags: {
      leLimitedDiscoverableMode: true,
      leGeneralDiscoverableMode: true,
      bredrNotSupported: true,
      simultaneousLeAndBredrController: true,
      simultaneousLeAndBredrHost: true
    }
  }

  var encoded = eir.encode(obj)
  var decoded = eir.decode(encoded)

  t.equals(eir.encodingLength(obj), 3)
  t.deepEquals(encoded, buffer(0x02, 0x01, 0b00011111))
  t.deepEquals(decoded, obj)
  t.end()
})

test('object with incomplete services', function (t) {
  var obj = {
    service: [
      '13333333-3333-3333-3333-333333330001',
      'dead',
      'feed',
      'deadfeed'
    ]
  }

  var encoded = eir.encode(obj)
  var decoded = eir.decode(encoded)

  t.equals(eir.encodingLength(obj), 30)
  t.deepEquals(encoded, buffer(
    0x05, 0x02, 0xad, 0xde, 0xed, 0xfe,
    0x05, 0x04, 0xed, 0xfe, 0xad, 0xde,
    0x11, 0x06, 0x01, 0x00, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x13
  ))
  t.deepEquals(decoded, {
    service: [
      buffer(0xad, 0xde),
      buffer(0xed, 0xfe),
      buffer(0xed, 0xfe, 0xad, 0xde),
      buffer(0x01, 0x00, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x13)
    ]
  })
  t.end()
})

test('object with complete services', function (t) {
  var obj = {
    serviceUuid16bitComplete: true,
    serviceUuid32bitComplete: true,
    serviceUuid128bitComplete: true,
    service: [
      '13333333-3333-3333-3333-333333330001',
      'dead',
      'feed',
      'deadfeed'
    ]
  }

  var encoded = eir.encode(obj)
  var decoded = eir.decode(encoded)

  t.equals(eir.encodingLength(obj), 30)
  t.deepEquals(encoded, buffer(
    0x05, 0x03, 0xad, 0xde, 0xed, 0xfe,
    0x05, 0x05, 0xed, 0xfe, 0xad, 0xde,
    0x11, 0x07, 0x01, 0x00, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x13
  ))
  t.deepEquals(decoded, {
    serviceUuid16bitComplete: true,
    serviceUuid32bitComplete: true,
    serviceUuid128bitComplete: true,
    service: [
      buffer(0xad, 0xde),
      buffer(0xed, 0xfe),
      buffer(0xed, 0xfe, 0xad, 0xde),
      buffer(0x01, 0x00, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x13)
    ]
  })
  t.end()
})

test('object with incomplete local name', function (t) {
  var obj = {
    localName: 'test-name'
  }

  var encoded = eir.encode(obj)
  var decoded = eir.decode(encoded)

  t.equals(eir.encodingLength(obj), 11)
  t.deepEquals(encoded, buffer(0x0a, 0x08, 0x74, 0x65, 0x73, 0x74, 0x2d, 0x6e, 0x61, 0x6d, 0x65))
  t.deepEquals(decoded, obj)
  t.end()
})

test('object with complete local name', function (t) {
  var obj = {
    localNameComplete: true,
    localName: 'test-name'
  }

  var encoded = eir.encode(obj)
  var decoded = eir.decode(encoded)

  t.equals(eir.encodingLength(obj), 11)
  t.deepEquals(encoded, buffer(0x0a, 0x09, 0x74, 0x65, 0x73, 0x74, 0x2d, 0x6e, 0x61, 0x6d, 0x65))
  t.deepEquals(decoded, obj)
  t.end()
})

test('object with power level', function (t) {
  var obj = {
    txPowerLevel: 55
  }

  var encoded = eir.encode(obj)
  var decoded = eir.decode(encoded)

  t.equals(eir.encodingLength(obj), 3)
  t.deepEquals(encoded, buffer(0x02, 0x0a, 0x37))
  t.deepEquals(decoded, obj)
  t.end()
})

test('object with manufacturer data', function (t) {
  var obj = {
    manufacturerSpecificData: buffer(0xde, 0xad, 0xfe, 0xad)
  }

  var encoded = eir.encode(obj)
  var decoded = eir.decode(encoded)

  t.equals(eir.encodingLength(obj), 6)
  t.deepEquals(encoded, buffer(0x05, 0xff, 0xde, 0xad, 0xfe, 0xad))
  t.deepEquals(decoded, obj)
  t.end()
})

test('object with multiple entries', function (t) {
  var obj = {
    flags: {
      leGeneralDiscoverableMode: true,
      bredrNotSupported: true
    },
    service: [
      '13333333-3333-3333-3333-333333330001'
    ],
    localName: 'test-name',
    txPowerLevel: 55,
    manufacturerSpecificData: buffer(0xde, 0xad, 0xfe, 0xad)
  }

  var encoded = eir.encode(obj)
  var decoded = eir.decode(encoded)

  t.equals(eir.encodingLength(obj), 41)
  t.deepEquals(encoded, buffer(
    0x02, 0x01, 0x06,
    0x11, 0x06, 0x01, 0x00, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x13,
    0x0a, 0x08, 0x74, 0x65, 0x73, 0x74, 0x2d, 0x6e, 0x61, 0x6d, 0x65,
    0x02, 0x0a, 0x37,
    0x05, 0xff, 0xde, 0xad, 0xfe, 0xad
  ))
  t.deepEquals(decoded, {
    flags: {
      leGeneralDiscoverableMode: true,
      bredrNotSupported: true
    },
    service: [
      buffer(0x01, 0x00, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x13)
    ],
    localName: 'test-name',
    txPowerLevel: 55,
    manufacturerSpecificData: buffer(0xde, 0xad, 0xfe, 0xad)
  })
  t.end()
})
