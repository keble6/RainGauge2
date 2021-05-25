function doTare () {
    serial.writeLine("Doing tare")
    logEvent("Doing tare")
    tareActive = 1
    HX711.power_up()
    HX711.tare(10)
    HX711.power_down()
    tareActive = 0
}
function showWeight () {
    rawWeight = HX711.get_units(20)
    rawWeightx10 = rawWeight * 10
    weight = Math.round(rawWeightx10) / 10
    serial.writeLine("" + dateTimeString() + weight + "g")
    dateTimeReadings.push(dateTimeString())
    weightReadings.push("" + weight + "g")
}
function deleteReadings () {
    readingsLength = dateTimeReadings.length
    for (let index = 0; index < readingsLength; index++) {
        dateTimeReadings.pop()
        weightReadings.pop()
    }
}
function leadingZero (num: number) {
    if (num < 10) {
        return "0" + num
    } else {
        return convertToText(num)
    }
}
// Upload readings to BT
bluetooth.onBluetoothConnected(function () {
    connected = 1
    basic.showIcon(IconNames.Square)
    upload()
})
bluetooth.onBluetoothDisconnected(function () {
    connected = 0
    basic.showIcon(IconNames.SmallSquare)
})
input.onButtonPressed(Button.A, function () {
    serial.writeLine("Valve ON for 1 minute")
    valveControl(1)
    basic.pause(60000)
    valveControl(0)
    doTare()
})
// Store an event (text)
function logEvent (text: string) {
    dateTimeReadings.push(dateTimeString())
    weightReadings.push(text)
}
function dateTimeString () {
    return "" + leadingZero(DS3231.date()) + "/" + leadingZero(DS3231.month()) + "/" + DS3231.year() + " " + leadingZero(DS3231.hour()) + ":" + leadingZero(DS3231.minute()) + " "
}
function upload () {
    basic.showLeds(`
        . . # . .
        . # # # .
        # . # . #
        . . # . .
        . . # . .
        `)
    readingsLength = dateTimeReadings.length
    if (readingsLength != 0) {
        for (let index2 = 0; index2 <= readingsLength - 1; index2++) {
            if (connected == 1) {
                bluetooth.uartWriteString(dateTimeReadings[index2])
                basic.pause(10)
                bluetooth.uartWriteLine(weightReadings[index2])
                basic.pause(10)
            }
        }
        basic.showIcon(IconNames.Yes)
    } else {
        bluetooth.uartWriteLine("No stored readings!")
    }
}
input.onButtonPressed(Button.AB, function () {
    DS3231.dateTime(
    2021,
    3,
    25,
    4,
    19,
    8,
    0
    )
})
// Button B => Delete readings
input.onButtonPressed(Button.B, function () {
    deleteReadings()
})
function valveControl (valveState: number) {
    pins.digitalWritePin(DigitalPin.P8, valveState)
}
let connected = 0
let readingsLength = 0
let weight = 0
let rawWeightx10 = 0
let rawWeight = 0
let tareActive = 0
let weightReadings: string[] = []
let dateTimeReadings: string[] = []
let valveState = 0
let readingsMax = 600
// storage
dateTimeReadings = []
weightReadings = []
// time between readings (ms)
let readingPeriod = 60000
let weightLimit = 300
tareActive = 0
// 5 minutes valve on
let valveTime = 300000
basic.showIcon(IconNames.SmallSquare)
bluetooth.startUartService()
valveControl(0)
HX711.SetPIN_DOUT(DigitalPin.P1)
HX711.SetPIN_SCK(DigitalPin.P2)
HX711.begin()
HX711.set_offset(8481274)
HX711.set_scale(413)
serial.writeLine("B=reset store A+B=set time")
serial.writeLine("")
logEvent("start up")
doTare()
basic.forever(function () {
    // Display continuously unless tare is operating
    if (tareActive == 0) {
        HX711.power_up()
        showWeight()
        HX711.power_down()
        if (weight > weightLimit) {
            serial.writeLine("Valve ON")
            logEvent("Valve ON")
            valveControl(1)
            // Delay of ~1-2s is important
            basic.pause(valveTime)
            valveControl(0)
            serial.writeLine("Valve OFF")
            logEvent("Valve OFF")
            basic.pause(10000)
            doTare()
            serial.writeLine("Resume weighing")
            logEvent("Resume weighing")
        }
    }
    // Delay of ~1-2s is important
    basic.pause(readingPeriod)
})
