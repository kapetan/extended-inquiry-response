var test = require('tape')

var eir = require('../')

var buffer = function () {
  var args = Array.prototype.slice.call(arguments)
  return Buffer.from(args)
}

test('empty object', function (t) {
  var obj = {}
  var result = eir.encode(obj)

  t.equals(eir.encodingLength(obj), 0)
  t.deepEquals(result, buffer())
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

  var result = eir.encode(obj)

  t.equals(eir.encodingLength(obj), 3)
  t.deepEquals(result, buffer(0x02, 0x01, 0b00011111))
  t.end()
})

test('object with services', function (t) {
  var obj = {
    service: [
      '13333333-3333-3333-3333-333333330001',
      'dead',
      'feed',
      'deadfeed'
    ]
  }

  var result = eir.encode(obj)

  t.equals(eir.encodingLength(obj), 30)
  t.deepEquals(result, buffer(
    0x05, 0x02, 0xad, 0xde, 0xed, 0xfe,
    0x05, 0x04, 0xed, 0xfe, 0xad, 0xde,
    0x11, 0x06, 0x01, 0x00, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x13
  ))
  t.end()
})

test('object with local name', function (t) {
  var obj = {
    localName: 'test-name'
  }

  var result = eir.encode(obj)

  t.equals(eir.encodingLength(obj), 11)
  t.deepEquals(result, buffer(0x0a, 0x08, 0x74, 0x65, 0x73, 0x74, 0x2d, 0x6e, 0x61, 0x6d, 0x65))
  t.end()
})

test('object with power level', function (t) {
  var obj = {
    txPowerLevel: 55
  }

  var result = eir.encode(obj)

  t.equals(eir.encodingLength(obj), 3)
  t.deepEquals(result, buffer(0x02, 0x0a, 0x37))
  t.end()
})

test('object with manufacturer data', function (t) {
  var obj = {
    manufacturerSpecificData: buffer(0xde, 0xad, 0xfe, 0xad)
  }

  var result = eir.encode(obj)

  t.equals(eir.encodingLength(obj), 6)
  t.deepEquals(result, buffer(0x05, 0xff, 0xde, 0xad, 0xfe, 0xad))
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

  var result = eir.encode(obj)

  t.equals(eir.encodingLength(obj), 41)
  t.deepEquals(result, buffer(
    0x02, 0x01, 0x06,
    0x11, 0x06, 0x01, 0x00, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x13,
    0x0a, 0x08, 0x74, 0x65, 0x73, 0x74, 0x2d, 0x6e, 0x61, 0x6d, 0x65,
    0x02, 0x0a, 0x37,
    0x05, 0xff, 0xde, 0xad, 0xfe, 0xad
  ))
  t.end()
})
