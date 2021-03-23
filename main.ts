function doTare () {
    serial.writeLine("Doing tare")
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
    serial.writeLine("" + weight + "g")
}
function pumpControl (pumpState: number) {
    pins.digitalWritePin(DigitalPin.P8, pumpState)
}
// Button A => Pump toggle
input.onButtonPressed(Button.A, function () {
    if (pumpState == 0) {
        pumpState = 1
    } else {
        pumpState = 0
    }
    pumpControl(pumpState)
})
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
pumpControl(0)
doTare()
HX711.SetPIN_DOUT(DigitalPin.P1)
HX711.SetPIN_SCK(DigitalPin.P2)
HX711.begin()
HX711.set_offset(8481274)
HX711.set_scale(413)
serial.writeLine("Press A to toggle Pump, B to tare")
serial.writeLine("")
basic.forever(function () {
    // Display continuously unless tare is operating
    if (tareActive == 0) {
        HX711.power_up()
        showWeight()
        HX711.power_down()
        if (weight > weightLimit) {
            serial.writeLine("Pump ON")
            pumpControl(1)
            // Delay of ~1-2s is important
            basic.pause(pumpTime)
            pumpControl(0)
            serial.writeLine("Pump OFF")
            basic.pause(10000)
            serial.writeLine("Tare active")
            doTare()
            serial.writeLine("Resume weighing")
        }
    }
    // Delay of ~1-2s is important
    basic.pause(2000)
})
