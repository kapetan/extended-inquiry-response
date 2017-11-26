var uuidByteLength = function (uuid) {
  return Buffer.isBuffer(uuid)
    ? uuid.length
    : uuid.replace(/-/g, '').length / 2
}

var uuidToBuffer = function (uuid) {
  if (Buffer.isBuffer(uuid)) return uuid
  uuid = uuid
    .replace(/-/g, '')
    .match(/.{1,2}/g)
    .reverse()
    .join('')

  return Buffer.from(uuid, 'hex')
}

var assert = function (cond) {
  if (!cond) throw new RangeError('invalid length')
}

var encode = function (obj, buffer, offset) {
  if (!buffer) buffer = Buffer.allocUnsafe(encodingLength(obj))
  if (!offset) offset = 0

  if (obj.flags) {
    var flags = 0
    if (obj.flags.leLimitedDiscoverableMode) flags |= 0x01
    if (obj.flags.leGeneralDiscoverableMode) flags |= 0x02
    if (obj.flags.bredrNotSupported) flags |= 0x04
    if (obj.flags.simultaneousLeAndBredrController) flags |= 0x08
    if (obj.flags.simultaneousLeAndBredrHost) flags |= 0x10

    buffer.writeUInt8(0x02, offset++)
    buffer.writeUInt8(0x01, offset++)
    buffer.writeUInt8(flags, offset++)
  }
  if (obj.service) {
    var uuid16bit = []
    var uuid32bit = []
    var uuid128bit = []

    obj.service.forEach(function (uuid) {
      uuid = uuidToBuffer(uuid)
      var len = uuid.length

      if (len === 2) uuid16bit.push(uuid)
      if (len === 4) uuid32bit.push(uuid)
      if (len === 16) uuid128bit.push(uuid)
    })

    if (uuid16bit.length) {
      buffer.writeUInt8(1 + 2 * uuid16bit.length, offset++)
      buffer.writeUInt8(obj.serviceUuid16bitComplete ? 0x03 : 0x02, offset++)

      uuid16bit.forEach(function (uuid) {
        uuid.copy(buffer, offset)
        offset += 2
      })
    }

    if (uuid32bit.length) {
      buffer.writeUInt8(1 + 4 * uuid32bit.length, offset++)
      buffer.writeUInt8(obj.serviceUuid32bitComplete ? 0x05 : 0x04, offset++)

      uuid32bit.forEach(function (uuid) {
        uuid.copy(buffer, offset)
        offset += 4
      })
    }

    if (uuid128bit.length) {
      buffer.writeUInt8(1 + 16 * uuid128bit.length, offset++)
      buffer.writeUInt8(obj.serviceUuid128bitComplete ? 0x07 : 0x06, offset++)

      uuid128bit.forEach(function (uuid) {
        uuid.copy(buffer, offset)
        offset += 16
      })
    }
  }
  if (obj.localName) {
    var len = Buffer.byteLength(obj.localName, 'utf-8')
    buffer.writeUInt8(len + 1, offset++)
    buffer.writeUInt8(obj.localNameComplete ? 0x09 : 0x08, offset++)
    buffer.write(obj.localName, offset, len, 'utf-8')
    offset += len
  }
  if (obj.txPowerLevel != null) {
    buffer.writeUInt8(0x02, offset++)
    buffer.writeUInt8(0x0a, offset++)
    buffer.writeInt8(obj.txPowerLevel, offset++)
  }
  if (obj.manufacturerSpecificData) {
    buffer.writeUInt8(1 + obj.manufacturerSpecificData.length, offset++)
    buffer.writeUInt8(0xff, offset++)
    obj.manufacturerSpecificData.copy(buffer, offset)
    offset += obj.manufacturerSpecificData.length
  }

  return buffer
}

var decode = function (buffer, start, end) {
  if (!start) start = 0
  if (!end) end = buffer.length

  var obj = {}
  var length = buffer[start++]

  while (start < buffer.length && length && start + length <= end) {
    var type = buffer[start++]
    var data = null

    switch (type) {
      case 0x01:
        assert(length === 2)
        data = buffer[start++]
        obj.flags = {}

        if (data & 0x01) obj.flags.leLimitedDiscoverableMode = true
        if (data & 0x02) obj.flags.leGeneralDiscoverableMode = true
        if (data & 0x04) obj.flags.bredrNotSupported = true
        if (data & 0x08) obj.flags.simultaneousLeAndBredrController = true
        if (data & 0x10) obj.flags.simultaneousLeAndBredrHost = true
        break
      case 0x03:
        obj.serviceUuid16bitComplete = true
      case 0x02: // eslint-disable-line no-fallthrough
        assert(length % 2 === 1)
        if (!obj.service) obj.service = []

        while (length > 1) {
          data = buffer.slice(start, start + 2)
          obj.service.push(data)
          length -= data.length
          start += data.length
        }

        break
      case 0x05:
        obj.serviceUuid32bitComplete = true
      case 0x04: // eslint-disable-line no-fallthrough
        assert(length % 4 === 1)
        if (!obj.service) obj.service = []

        while (length > 1) {
          data = buffer.slice(start, start + 4)
          obj.service.push(data)
          length -= data.length
          start += data.length
        }

        break
      case 0x07:
        obj.serviceUuid128bitComplete = true
      case 0x06: // eslint-disable-line no-fallthrough
        assert(length % 16 === 1)
        if (!obj.service) obj.service = []

        while (length > 1) {
          data = buffer.slice(start, start + 16)
          obj.service.push(data)
          length -= data.length
          start += data.length
        }

        break
      case 0x09:
        obj.localNameComplete = true
      case 0x08: // eslint-disable-line no-fallthrough
        data = buffer.toString('utf-8', start, start + length - 1)
        obj.localName = data
        start += (length - 1)
        break
      case 0x0a:
        assert(length === 2)
        data = buffer.readInt8(start++)
        obj.txPowerLevel = data
        break
      case 0xff:
        data = buffer.slice(start, start + length - 1)
        obj.manufacturerSpecificData = data
        start += (length - 1)
        break
    }

    length = buffer[start++]
  }

  return obj
}

var encodingLength = function (obj) {
  var length = 0

  if (obj.flags) length += 3
  if (obj.service) {
    var uuid16bit = 0
    var uuid32bit = 0
    var uuid128bit = 0

    obj.service.forEach(function (uuid) {
      var len = uuidByteLength(uuid)
      if (len === 2) uuid16bit++
      else if (len === 4) uuid32bit++
      else if (len === 16) uuid128bit++
    })

    length += ((uuid16bit ? 2 : 0) + uuid16bit * 2) +
      ((uuid32bit ? 2 : 0) + uuid32bit * 4) +
      ((uuid128bit ? 2 : 0) + uuid128bit * 16)
  }
  if (obj.localName) length += 2 + Buffer.byteLength(obj.localName, 'utf-8')
  if (obj.txPowerLevel != null) length += 3
  if (obj.manufacturerSpecificData) length += 2 + obj.manufacturerSpecificData.length

  return length
}

exports.encode = encode
exports.decode = decode
exports.encodingLength = encodingLength
