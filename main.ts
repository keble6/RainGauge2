function doTare () {
    serial.writeLine("Doing tare")
    bluetooth.uartWriteLine("Doing Tare")
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
    bluetooth.uartWriteString(dateTimeString())
    bluetooth.uartWriteLine("" + weight + "g")
}
function pumpControl (pumpState: number) {
    pins.digitalWritePin(DigitalPin.P8, pumpState)
}
function leadingZero (num: number) {
    if (num < 10) {
        return "0" + num
    } else {
        return convertToText(num)
    }
}
bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.Square)
})
bluetooth.onBluetoothDisconnected(function () {
    basic.showIcon(IconNames.SmallSquare)
})
// Button A => Pump toggle
input.onButtonPressed(Button.A, function () {
    if (pumpState == 0) {
        pumpState = 1
    } else {
        pumpState = 0
    }
    pumpControl(pumpState)
})
function dateTimeString () {
    return "" + leadingZero(DS3231.date()) + "/" + leadingZero(DS3231.month()) + "/" + DS3231.year() + " " + leadingZero(DS3231.hour()) + ":" + leadingZero(DS3231.minute()) + " "
}
// Button B => Tare
input.onButtonPressed(Button.B, function () {
    doTare()
})
let pumpState = 0
let weight = 0
let rawWeightx10 = 0
let rawWeight = 0
let tareActive = 0
let weightLimit = 350
tareActive = 0
let pumpTime = 10000
basic.showIcon(IconNames.SmallSquare)
bluetooth.startUartService()
pumpControl(0)
doTare()
HX711.SetPIN_DOUT(DigitalPin.P1)
HX711.SetPIN_SCK(DigitalPin.P2)
HX711.begin()
HX711.set_offset(8481274)
HX711.set_scale(413)
serial.writeLine("Press A to toggle Pump, B to tare")
serial.writeLine("")
bluetooth.uartWriteLine("A=Pump ON/OFF, B=tare")
basic.forever(function () {
    // Display continuously unless tare is operating
    if (tareActive == 0) {
        HX711.power_up()
        showWeight()
        HX711.power_down()
        if (weight > weightLimit) {
            serial.writeLine("Pump ON")
            bluetooth.uartWriteString("Pump ON")
            pumpControl(1)
            // Delay of ~1-2s is important
            basic.pause(pumpTime)
            pumpControl(0)
            serial.writeLine("Pump OFF")
            bluetooth.uartWriteString("Pump OFF")
            basic.pause(10000)
            doTare()
            serial.writeLine("Resume weighing")
            bluetooth.uartWriteLine("Resume weighing")
        }
    }
    // Delay of ~1-2s is important
    basic.pause(2000)
})
